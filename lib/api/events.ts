import { getSupabase } from '../supabase';
import type { EventRow } from '../../types';

const now = () => new Date().toISOString();
const FALLBACK_LOCALE = 'ko';

interface EventLocaleRow {
  event_id: string;
  locale: string;
  title: string;
  content: string | null;
  content_html: string | null;
  popup_image_url: string | null;
  link_url: string | null;
}

function mergeEventWithLocale(event: Record<string, unknown>, loc: EventLocaleRow): EventRow {
  return {
    ...event,
    id: (event.id as string) || loc.event_id,
    title: loc.title,
    content: loc.content ?? '',
    content_html: loc.content_html ?? null,
    popup_image_url: loc.popup_image_url ?? null,
    link_url: loc.link_url ?? null,
  } as EventRow;
}

/**
 * 메인 팝업용: 노출 중인 공지/이벤트 중 is_popup=true 목록 (display_order, created_at 순)
 */
export async function getPopupEvents(locale?: string): Promise<EventRow[]> {
  const loc = locale || FALLBACK_LOCALE;
  const { data: events, error } = await getSupabase()
    .from('events')
    .select('*')
    .eq('is_popup', true)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now()}`)
    .or(`ends_at.is.null,ends_at.gte.${now()}`)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error || !events?.length) {
    if (error) console.error('getPopupEvents error:', error);
    return [];
  }
  const ids = (events as { id: string }[]).map((e) => e.id);
  const { data: localeRows } = await getSupabase()
    .from('event_locales')
    .select('*')
    .in('event_id', ids)
    .in('locale', [loc, FALLBACK_LOCALE]);
  const byEvent = new Map<string, EventLocaleRow>();
  for (const r of (localeRows ?? []) as (EventLocaleRow & { event_id: string })[]) {
    const cur = byEvent.get(r.event_id);
    if (!cur || (cur.locale !== loc && r.locale === loc)) byEvent.set(r.event_id, r);
    else if (r.locale === loc) byEvent.set(r.event_id, r);
  }
  return (events as Record<string, unknown>[]).map((ev) => {
    const locRow = byEvent.get(ev.id as string);
    if (locRow) return mergeEventWithLocale(ev, locRow);
    return ev as EventRow;
  }) as EventRow[];
}

/**
 * 게시판 목록: 타입별·노출 중인 공지/이벤트
 */
export async function getEvents(options: {
  type?: 'notice' | 'event';
  limit?: number;
  locale?: string;
}): Promise<EventRow[]> {
  const loc = options.locale || FALLBACK_LOCALE;
  let query = getSupabase()
    .from('events')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now()}`)
    .or(`ends_at.is.null,ends_at.gte.${now()}`)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (options.type) query = query.eq('type', options.type);
  if (options.limit) query = query.limit(options.limit);
  const { data: events, error } = await query;
  if (error || !events?.length) {
    if (error) console.error('getEvents error:', error);
    return [];
  }
  const ids = (events as { id: string }[]).map((e) => e.id);
  const { data: localeRows } = await getSupabase()
    .from('event_locales')
    .select('*')
    .in('event_id', ids)
    .in('locale', [loc, FALLBACK_LOCALE]);
  const byEvent = new Map<string, EventLocaleRow>();
  for (const r of (localeRows ?? []) as (EventLocaleRow & { event_id: string })[]) {
    const cur = byEvent.get(r.event_id);
    if (!cur || (cur.locale !== loc && r.locale === loc)) byEvent.set(r.event_id, r);
    else if (r.locale === loc) byEvent.set(r.event_id, r);
  }
  return (events as Record<string, unknown>[]).map((ev) => {
    const locRow = byEvent.get(ev.id as string);
    if (locRow) return mergeEventWithLocale(ev, locRow);
    return ev as EventRow;
  }) as EventRow[];
}

/**
 * 단건 조회 (상세) — 공개 정책으로 기간 내·활성만 조회 가능
 */
export async function getEventById(id: string, locale?: string): Promise<EventRow | null> {
  const loc = locale || FALLBACK_LOCALE;
  const { data: event, error } = await getSupabase()
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !event) {
    if (error) console.error('getEventById error:', error);
    return null;
  }
  const row = event as Record<string, unknown>;
  if (row.is_active !== true) return null;
  const nowStr = new Date().toISOString();
  if (row.starts_at && String(row.starts_at) > nowStr) return null;
  if (row.ends_at && String(row.ends_at) < nowStr) return null;
  const { data: locRows } = await getSupabase()
    .from('event_locales')
    .select('*')
    .eq('event_id', id)
    .in('locale', [loc, FALLBACK_LOCALE])
    .order('locale', { ascending: false });
  const preferred = (locRows ?? []).find((r: { locale: string }) => r.locale === loc);
  const fallback = (locRows ?? []).find((r: { locale: string }) => r.locale === FALLBACK_LOCALE);
  const locRow = (preferred || fallback) as EventLocaleRow | undefined;
  if (locRow) return mergeEventWithLocale(row, locRow);
  return row as EventRow;
}

// --- Admin ---

export async function getAdminEvents(): Promise<EventRow[]> {
  const { data, error } = await getSupabase()
    .from('events')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getAdminEvents error:', error);
    throw error;
  }
  return (data ?? []) as EventRow[];
}

export interface EventInsert {
  title: string;
  content?: string;
  content_html?: string | null;
  type: 'notice' | 'event';
  popup_image_url?: string | null;
  link_url?: string | null;
  is_popup?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export async function createEvent(row: EventInsert): Promise<EventRow> {
  const body = {
    ...row,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await getSupabase().from('events').insert(body).select().single();
  if (error) {
    console.error('createEvent error:', error);
    throw error;
  }
  const created = data as EventRow;
  await getSupabase()
    .from('event_locales')
    .insert({
      event_id: created.id,
      locale: 'ko',
      title: created.title,
      content: created.content ?? '',
      content_html: created.content_html ?? null,
      popup_image_url: created.popup_image_url ?? null,
      link_url: created.link_url ?? null,
    })
    .then(({ error: e }) => {
      if (e) console.error('createEvent event_locales insert error:', e);
    });
  return created;
}

export async function updateEvent(
  id: string,
  updates: Partial<EventInsert>
): Promise<void> {
  const body: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  const { error } = await getSupabase().from('events').update(body).eq('id', id);
  if (error) {
    console.error('updateEvent error:', error);
    throw error;
  }
  const localeFields = ['title', 'content', 'content_html', 'popup_image_url', 'link_url'];
  if (Object.keys(updates).some((k) => localeFields.includes(k))) {
    const { data: existing } = await getSupabase()
      .from('event_locales')
      .select('*')
      .eq('event_id', id)
      .eq('locale', 'ko')
      .maybeSingle();
    const merged = {
      event_id: id,
      locale: 'ko',
      title: updates.title ?? (existing as EventLocaleRow)?.title ?? '',
      content: updates.content !== undefined ? updates.content : (existing as EventLocaleRow)?.content ?? '',
      content_html: updates.content_html !== undefined ? updates.content_html : (existing as EventLocaleRow)?.content_html ?? null,
      popup_image_url: updates.popup_image_url !== undefined ? updates.popup_image_url : (existing as EventLocaleRow)?.popup_image_url ?? null,
      link_url: updates.link_url !== undefined ? updates.link_url : (existing as EventLocaleRow)?.link_url ?? null,
    };
    await getSupabase().from('event_locales').upsert(merged, { onConflict: 'event_id,locale' });
  }
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await getSupabase().from('events').delete().eq('id', id);
  if (error) {
    console.error('deleteEvent error:', error);
    throw error;
  }
}

/** 관리자: 이벤트 그룹별 로케일 목록 조회 */
export async function getEventLocales(eventId: string): Promise<EventLocaleRow[]> {
  const { data, error } = await getSupabase()
    .from('event_locales')
    .select('event_id, locale, title, content, content_html, popup_image_url, link_url')
    .eq('event_id', eventId)
    .order('locale');
  if (error) {
    console.error('getEventLocales error:', error);
    throw error;
  }
  return (data ?? []) as EventLocaleRow[];
}

/** 관리자: 이벤트 로케일 1개 upsert */
export async function upsertEventLocale(
  eventId: string,
  locale: string,
  payload: {
    title: string;
    content?: string;
    content_html?: string | null;
    popup_image_url?: string | null;
    link_url?: string | null;
  }
): Promise<void> {
  const row = {
    event_id: eventId,
    locale,
    title: payload.title,
    content: payload.content ?? '',
    content_html: payload.content_html ?? null,
    popup_image_url: payload.popup_image_url ?? null,
    link_url: payload.link_url ?? null,
  };
  const { error } = await getSupabase().from('event_locales').upsert(row, { onConflict: 'event_id,locale' });
  if (error) {
    console.error('upsertEventLocale error:', error);
    throw error;
  }
}
