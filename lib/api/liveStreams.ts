import { getSupabase } from '../supabase';
import type { LiveStream, LiveStreamRow } from '../../types';

function rowToLiveStream(row: LiveStreamRow): LiveStream {
  return {
    id: row.id,
    title: row.title,
    thumbnail: row.thumbnail_url || '',
    viewerCount: row.viewer_count ?? 0,
    isLive: row.status === 'live',
    startTime: row.scheduled_at ?? undefined,
    videoEmbedUrl: row.video_embed_url ?? null,
    productId: row.product_id ?? null,
  };
}

/**
 * 사이트용: 노출 중인 라이브 목록 (순서·예정일)
 */
export async function getLiveStreams(): Promise<LiveStream[]> {
  const { data, error } = await getSupabase()
    .from('live_streams')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('scheduled_at', { ascending: false });
  if (error) {
    console.error('getLiveStreams error:', error);
    return [];
  }
  return ((data ?? []) as LiveStreamRow[]).map(rowToLiveStream);
}

/**
 * 단건 조회 (상세·임베드용)
 */
export async function getLiveStreamById(id: string): Promise<LiveStreamRow | null> {
  const { data, error } = await getSupabase()
    .from('live_streams')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as LiveStreamRow;
}

// --- Admin ---

export async function getAdminLiveStreams(): Promise<LiveStreamRow[]> {
  const { data, error } = await getSupabase()
    .from('live_streams')
    .select('*')
    .order('display_order', { ascending: true })
    .order('scheduled_at', { ascending: false });
  if (error) {
    console.error('getAdminLiveStreams error:', error);
    throw error;
  }
  return (data ?? []) as LiveStreamRow[];
}

export interface LiveStreamInsert {
  title: string;
  thumbnail_url?: string | null;
  video_embed_url?: string | null;
  product_id?: string | null;
  scheduled_at?: string | null;
  status?: 'scheduled' | 'live' | 'ended';
  display_order?: number;
  is_active?: boolean;
  viewer_count?: number;
}

export async function createLiveStream(row: LiveStreamInsert): Promise<LiveStreamRow> {
  const body = { ...row, updated_at: new Date().toISOString() };
  const { data, error } = await getSupabase().from('live_streams').insert(body).select().single();
  if (error) {
    console.error('createLiveStream error:', error);
    throw error;
  }
  return data as LiveStreamRow;
}

export async function updateLiveStream(id: string, updates: Partial<LiveStreamInsert>): Promise<void> {
  const body: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  const { error } = await getSupabase().from('live_streams').update(body).eq('id', id);
  if (error) {
    console.error('updateLiveStream error:', error);
    throw error;
  }
}

export async function deleteLiveStream(id: string): Promise<void> {
  const { error } = await getSupabase().from('live_streams').delete().eq('id', id);
  if (error) {
    console.error('deleteLiveStream error:', error);
    throw error;
  }
}
