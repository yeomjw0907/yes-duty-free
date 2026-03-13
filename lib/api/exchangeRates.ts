import { getSupabase } from '../supabase';

export interface ExchangeRateRow {
  id: string;
  currency_code: string;
  rate: number;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

/**
 * 최신 환율(통화별 1건) 조회
 */
export async function getLatestExchangeRates(currencyCodes?: string[]): Promise<ExchangeRateRow[]> {
  let q = getSupabase()
    .from('exchange_rates')
    .select('id, currency_code, rate, valid_from, valid_until, created_at')
    .order('valid_from', { ascending: false });

  if (currencyCodes && currencyCodes.length > 0) {
    q = q.in('currency_code', currencyCodes);
  }

  const { data, error } = await q;
  if (error) {
    console.error('getLatestExchangeRates error:', error);
    throw error;
  }

  const rows = (data ?? []) as ExchangeRateRow[];

  const seen = new Set<string>();
  const latest: ExchangeRateRow[] = [];
  for (const r of rows) {
    const code = (r.currency_code ?? '').toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    latest.push({ ...r, currency_code: code });
  }
  return latest;
}

