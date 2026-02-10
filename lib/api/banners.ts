import { getSupabase } from '../supabase';
import type { BannerRow, BannerSlide } from '../../types';

const now = () => new Date().toISOString();

function rowToSlide(row: BannerRow): BannerSlide {
  return {
    id: row.id,
    tag: row.tag_text || '',
    title: row.title,
    desc: row.description || row.subtitle || '',
    img: row.image_url,
    linkUrl: row.link_url || null,
  };
}

/**
 * 사이트용: 노출 중인 배너 목록 (position별, display_order 순)
 */
export async function getBanners(position?: 'main' | 'sub'): Promise<BannerSlide[]> {
  let query = getSupabase()
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .or(`valid_from.is.null,valid_from.lte.${now()}`)
    .or(`valid_until.is.null,valid_until.gte.${now()}`)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (position) query = query.eq('position', position);
  const { data, error } = await query;
  if (error) {
    console.error('getBanners error:', error);
    return [];
  }
  return ((data ?? []) as BannerRow[]).map(rowToSlide);
}

// --- Admin ---

export async function getAdminBanners(): Promise<BannerRow[]> {
  const { data, error } = await getSupabase()
    .from('banners')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getAdminBanners error:', error);
    throw error;
  }
  return (data ?? []) as BannerRow[];
}

export interface BannerInsert {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  link_url?: string | null;
  position?: 'main' | 'sub';
  display_order?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  tag_text?: string | null;
  is_active?: boolean;
}

export async function createBanner(row: BannerInsert): Promise<BannerRow> {
  const body = { ...row, updated_at: new Date().toISOString() };
  const { data, error } = await getSupabase().from('banners').insert(body).select().single();
  if (error) {
    console.error('createBanner error:', error);
    throw error;
  }
  return data as BannerRow;
}

export async function updateBanner(id: string, updates: Partial<BannerInsert>): Promise<void> {
  const body: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  const { error } = await getSupabase().from('banners').update(body).eq('id', id);
  if (error) {
    console.error('updateBanner error:', error);
    throw error;
  }
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await getSupabase().from('banners').delete().eq('id', id);
  if (error) {
    console.error('deleteBanner error:', error);
    throw error;
  }
}
