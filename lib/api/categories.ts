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

/**
 * 카테고리 목록 조회 (display_order 순)
 */
export async function getCategories(): Promise<CategoryRow[]> {
  const { data, error } = await getSupabase()
    .from('categories')
    .select('id, name, name_en, parent_id, icon, display_order, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('getCategories error:', error);
    throw error;
  }
  return data ?? [];
}
