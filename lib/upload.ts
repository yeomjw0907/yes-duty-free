import { getSupabase } from './supabase';

const PRODUCT_IMAGES_BUCKET = 'product-images';
const DETAIL_IMAGES_BUCKET = 'product-images'; // 같은 버킷, 폴더로 구분 가능
const EVENTS_BUCKET = 'product-images'; // 같은 버킷, events/ 폴더

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

/**
 * 상품 대표 이미지 또는 상세 이미지를 Storage에 업로드하고 공개 URL 반환
 */
export async function uploadProductImage(file: File): Promise<string> {
  const supabase = getSupabase();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `products/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) {
    console.error('uploadProductImage error:', error);
    throw error;
  }
  const { data: urlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}

/**
 * 상세 페이지용 이미지 업로드 (같은 버킷, detail/ 폴더)
 */
export async function uploadDetailImage(file: File): Promise<string> {
  const supabase = getSupabase();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `detail/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(DETAIL_IMAGES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) {
    console.error('uploadDetailImage error:', error);
    throw error;
  }
  const { data: urlData } = supabase.storage.from(DETAIL_IMAGES_BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}

/**
 * 공지/이벤트 팝업 이미지 업로드 (Storage events/ 폴더)
 */
export async function uploadEventImage(file: File): Promise<string> {
  const supabase = getSupabase();
  const path = `events/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(EVENTS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) {
    console.error('uploadEventImage error:', error);
    throw error;
  }
  const { data: urlData } = supabase.storage.from(EVENTS_BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}

/**
 * 라이브 방송 썸네일 업로드 (Storage live/ 폴더)
 */
export async function uploadLiveThumbnail(file: File): Promise<string> {
  const supabase = getSupabase();
  const path = `live/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(EVENTS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) {
    console.error('uploadLiveThumbnail error:', error);
    throw error;
  }
  const { data: urlData } = supabase.storage.from(EVENTS_BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}

/**
 * 배너 이미지 업로드 (Storage banners/ 폴더)
 */
export async function uploadBannerImage(file: File): Promise<string> {
  const supabase = getSupabase();
  const path = `banners/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(EVENTS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) {
    console.error('uploadBannerImage error:', error);
    throw error;
  }
  const { data: urlData } = supabase.storage.from(EVENTS_BUCKET).getPublicUrl(path);
  return urlData.publicUrl;
}
