import { getSupabase } from '../supabase';

export interface CategoryRow {
  id: string;
  name: string;
  name_en: string | null;
  parent_id: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

const FALLBACK_LOCALE = 'ko';

/**
 * 카테고리 목록 조회 (display_order 순). locale 없으면 'ko'. name은 category_locales에서 반환.
 */
export async function getCategories(locale?: string): Promise<CategoryRow[]> {
  const loc = locale || FALLBACK_LOCALE;
  const { data: cats, error } = await getSupabase()
    .from('categories')
    .select('id, name, name_en, parent_id, icon, display_order, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('getCategories error:', error);
    throw error;
  }
  if (!cats?.length) return [];
  const ids = (cats as { id: string }[]).map((c) => c.id);
  const { data: locData } = await getSupabase()
    .from('category_locales')
    .select('category_id, locale, name')
    .in('category_id', ids)
    .in('locale', [loc, FALLBACK_LOCALE]);
  const byCat = new Map<string, Map<string, string>>();
  for (const r of (locData ?? []) as { category_id: string; locale: string; name: string }[]) {
    let inner = byCat.get(r.category_id);
    if (!inner) {
      inner = new Map();
      byCat.set(r.category_id, inner);
    }
    inner.set(r.locale, r.name);
  }
  return (cats as CategoryRow[]).map((c) => {
    const names = byCat.get(c.id);
    const name = names?.get(loc) ?? names?.get(FALLBACK_LOCALE) ?? c.name;
    return { ...c, name };
  });
}
