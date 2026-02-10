import { getSupabase } from '../supabase';

/**
 * 검색 시 키워드 기록 (상품 검색 API에서 호출. anon 호출 가능)
 */
export async function recordSearchKeyword(keyword: string): Promise<void> {
  const q = keyword?.trim();
  if (!q) return;
  try {
    await getSupabase().rpc('record_search_keyword', { p_keyword: q });
  } catch (e) {
    console.warn('recordSearchKeyword error:', e);
  }
}

export interface SearchKeywordRow {
  id: string;
  keyword: string;
  search_count: number;
  last_searched_at: string;
  created_at: string;
}

/**
 * 관리자용: 인기 검색어 목록 (검색 횟수 순)
 */
export async function getSearchKeywords(limit = 50): Promise<SearchKeywordRow[]> {
  const { data, error } = await getSupabase()
    .from('search_keywords')
    .select('*')
    .order('search_count', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getSearchKeywords error:', error);
    throw error;
  }
  return (data ?? []) as SearchKeywordRow[];
}

export interface DailyTrendRow {
  date: string;
  orders: number;
  revenue: number;
}

/**
 * 관리자용: 기간별 매출 트렌드 (일별 집계)
 */
export async function getSalesTrend(period: '7d' | '30d'): Promise<DailyTrendRow[]> {
  const now = new Date();
  const days = period === '7d' ? 7 : 30;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const { data, error } = await getSupabase()
    .from('orders')
    .select('id, total_amount, created_at')
    .gte('created_at', start.toISOString());

  if (error) {
    console.error('getSalesTrend error:', error);
    throw error;
  }

  const orders = (data ?? []) as { id: string; total_amount: number; created_at: string }[];
  const byDate: Record<string, { orders: number; revenue: number }> = {};

  for (let d = 0; d < days; d++) {
    const dte = new Date(start);
    dte.setDate(dte.getDate() + d);
    const key = dte.toISOString().slice(0, 10);
    byDate[key] = { orders: 0, revenue: 0 };
  }

  for (const o of orders) {
    const key = o.created_at.slice(0, 10);
    if (!byDate[key]) byDate[key] = { orders: 0, revenue: 0 };
    byDate[key].orders += 1;
    byDate[key].revenue += o.total_amount ?? 0;
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { orders: count, revenue }]) => ({ date, orders: count, revenue }));
}
