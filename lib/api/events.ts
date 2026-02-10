import { getSupabase } from '../supabase';
import type { EventRow } from '../../types';

/**
 * 메인 팝업용: 노출 중인 공지/이벤트 중 is_popup=true 목록 (display_order, created_at 순)
 */
const now = () => new Date().toISOString();

export async function getPopupEvents(): Promise<EventRow[]> {
  const { data, error } = await getSupabase()
    .from('events')
    .select('*')
    .eq('is_popup', true)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now()}`)
    .or(`ends_at.is.null,ends_at.gte.${now()}`)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getPopupEvents error:', error);
    return [];
  }
  return (data ?? []) as EventRow[];
}

/**
 * 게시판 목록: 타입별·노출 중인 공지/이벤트
 */
export async function getEvents(options: {
  type?: 'notice' | 'event';
  limit?: number;
}): Promise<EventRow[]> {
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
  const { data, error } = await query;
  if (error) {
    console.error('getEvents error:', error);
    return [];
  }
  return (data ?? []) as EventRow[];
}

/**
 * 단건 조회 (상세) — 공개 정책으로 기간 내·활성만 조회 가능
 */
export async function getEventById(id: string): Promise<EventRow | null> {
  const { data, error } = await getSupabase()
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('getEventById error:', error);
    return null;
  }
  if (!data) return null;
  const row = data as EventRow;
  if (!row.is_active) return null;
  const now = new Date().toISOString();
  if (row.starts_at && row.starts_at > now) return null;
  if (row.ends_at && row.ends_at < now) return null;
  return row;
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
  return data as EventRow;
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
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await getSupabase().from('events').delete().eq('id', id);
  if (error) {
    console.error('deleteEvent error:', error);
    throw error;
  }
}
