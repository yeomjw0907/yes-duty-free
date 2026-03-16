import { getSupabase } from '../supabase';
import type { BannerRow, BannerSlide } from '../../types';

const now = () => new Date().toISOString();

const FALLBACK_LOCALE = 'ko';

function localeRowToSlide(bannerId: string, row: BannerLocaleRow): BannerSlide {
  return {
    id: bannerId,
    tag: row.tag_text || '',
    title: row.title,
    desc: row.description || row.subtitle || '',
    img: row.image_url,
    linkUrl: row.link_url || null,
  };
}

interface BannerLocaleRow {
  banner_id: string;
  locale: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  tag_text: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
}

/**
 * 사이트용: 노출 중인 배너 목록 (position별, display_order 순). locale 없으면 'ko' 사용.
 */
export async function getBanners(position?: 'main' | 'sub', locale?: string): Promise<BannerSlide[]> {
  const loc = locale || FALLBACK_LOCALE;
  let bannerQuery = getSupabase()
    .from('banners')
    .select('id, display_order')
    .eq('is_active', true)
    .or(`valid_from.is.null,valid_from.lte.${now()}`)
    .or(`valid_until.is.null,valid_until.gte.${now()}`)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (position) bannerQuery = bannerQuery.eq('position', position);
  const { data: banners, error: bannerError } = await bannerQuery;
  if (bannerError || !banners?.length) {
    if (bannerError) console.error('getBanners error:', bannerError);
    return [];
  }
  const ids = (banners as { id: string; display_order: number }[]).map((b) => b.id);
  const orderMap = new Map((banners as { id: string; display_order: number }[]).map((b) => [b.id, b.display_order]));

  const { data: localeRows, error: locError } = await getSupabase()
    .from('banner_locales')
    .select('banner_id, locale, title, subtitle, description, tag_text, image_url, mobile_image_url, link_url')
    .in('banner_id', ids)
    .in('locale', [loc, FALLBACK_LOCALE]);
  if (locError) {
    console.error('getBanners banner_locales error:', locError);
    return [];
  }
  const byBanner = new Map<string, BannerLocaleRow>();
  for (const r of (localeRows ?? []) as (BannerLocaleRow & { banner_id: string })[]) {
    const cur = byBanner.get(r.banner_id);
    if (!cur || (cur.locale !== loc && r.locale === loc)) byBanner.set(r.banner_id, r);
    else if (r.locale === loc && cur.locale === FALLBACK_LOCALE) byBanner.set(r.banner_id, r);
  }
  const sorted = ids
    .filter((id) => byBanner.has(id))
    .sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0));
  return sorted.map((id) => localeRowToSlide(id, byBanner.get(id)!));
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
  const created = data as BannerRow;
  await getSupabase()
    .from('banner_locales')
    .insert({
      banner_id: created.id,
      locale: 'ko',
      title: created.title,
      subtitle: created.subtitle ?? null,
      description: created.description ?? null,
      tag_text: created.tag_text ?? null,
      image_url: created.image_url,
      mobile_image_url: created.mobile_image_url ?? null,
      link_url: created.link_url ?? null,
    })
    .then(({ error: e }) => {
      if (e) console.error('createBanner banner_locales insert error:', e);
    });
  return created;
}

export async function updateBanner(id: string, updates: Partial<BannerInsert>): Promise<void> {
  const body: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  const { error } = await getSupabase().from('banners').update(body).eq('id', id);
  if (error) {
    console.error('updateBanner error:', error);
    throw error;
  }
  const localeFields = ['title', 'subtitle', 'description', 'tag_text', 'image_url', 'mobile_image_url', 'link_url'];
  if (Object.keys(updates).some((k) => localeFields.includes(k))) {
    const { data: existing } = await getSupabase()
      .from('banner_locales')
      .select('*')
      .eq('banner_id', id)
      .eq('locale', 'ko')
      .maybeSingle();
    const merged = {
      banner_id: id,
      locale: 'ko',
      title: updates.title ?? (existing as BannerLocaleRow)?.title ?? '',
      subtitle: updates.subtitle !== undefined ? updates.subtitle : (existing as BannerLocaleRow)?.subtitle ?? null,
      description: updates.description !== undefined ? updates.description : (existing as BannerLocaleRow)?.description ?? null,
      tag_text: updates.tag_text !== undefined ? updates.tag_text : (existing as BannerLocaleRow)?.tag_text ?? null,
      image_url: updates.image_url ?? (existing as BannerLocaleRow)?.image_url ?? '',
      mobile_image_url: updates.mobile_image_url !== undefined ? updates.mobile_image_url : (existing as BannerLocaleRow)?.mobile_image_url ?? null,
      link_url: updates.link_url !== undefined ? updates.link_url : (existing as BannerLocaleRow)?.link_url ?? null,
    };
    await getSupabase().from('banner_locales').upsert(merged, { onConflict: 'banner_id,locale' });
  }
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await getSupabase().from('banners').delete().eq('id', id);
  if (error) {
    console.error('deleteBanner error:', error);
    throw error;
  }
}

/** 관리자: 배너 그룹별 로케일 목록 조회 */
export async function getBannerLocales(bannerId: string): Promise<BannerLocaleRow[]> {
  const { data, error } = await getSupabase()
    .from('banner_locales')
    .select('banner_id, locale, title, subtitle, description, tag_text, image_url, mobile_image_url, link_url')
    .eq('banner_id', bannerId)
    .order('locale');
  if (error) {
    console.error('getBannerLocales error:', error);
    throw error;
  }
  return (data ?? []) as BannerLocaleRow[];
}

/** 관리자: 배너 로케일 1개 upsert (저장 시 banner_locales만) */
export async function upsertBannerLocale(
  bannerId: string,
  locale: string,
  payload: {
    title: string;
    subtitle?: string | null;
    description?: string | null;
    tag_text?: string | null;
    image_url: string;
    mobile_image_url?: string | null;
    link_url?: string | null;
  }
): Promise<void> {
  const row = {
    banner_id: bannerId,
    locale,
    title: payload.title,
    subtitle: payload.subtitle ?? null,
    description: payload.description ?? null,
    tag_text: payload.tag_text ?? null,
    image_url: payload.image_url,
    mobile_image_url: payload.mobile_image_url ?? null,
    link_url: payload.link_url ?? null,
  };
  const { error } = await getSupabase().from('banner_locales').upsert(row, { onConflict: 'banner_id,locale' });
  if (error) {
    console.error('upsertBannerLocale error:', error);
    throw error;
  }
}
