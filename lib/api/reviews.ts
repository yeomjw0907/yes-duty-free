import { getSupabase } from '../supabase';
import type { Review } from '../../types';

interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string;
  image_urls: string[] | null;
  helpful_count: number;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string | null;
  users?: { name: string } | null;
}

function mapRowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    product_id: row.product_id,
    user_id: row.user_id,
    rating: row.rating,
    title: row.title ?? undefined,
    content: row.content,
    image_urls: row.image_urls ?? undefined,
    helpful_count: row.helpful_count ?? 0,
    is_verified_purchase: row.is_verified_purchase ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at ?? undefined,
    user_name: row.users?.name,
  };
}

/**
 * 상품별 리뷰 목록 조회 (최신순)
 */
export async function getReviewsByProductId(productId: string): Promise<Review[]> {
  const { data, error } = await getSupabase()
    .from('reviews')
    .select('id, product_id, user_id, rating, title, content, image_urls, helpful_count, is_verified_purchase, created_at, updated_at, users(name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getReviewsByProductId error:', error);
    throw error;
  }
  return (data ?? []).map((row) => mapRowToReview(row as ReviewRow));
}

/**
 * 리뷰 작성 (한 사용자당 상품당 1건)
 */
export async function createReview(params: {
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  content: string;
  image_urls?: string[];
}): Promise<Review> {
  const isVerified = await checkVerifiedPurchase(params.user_id, params.product_id);

  const { data, error } = await getSupabase()
    .from('reviews')
    .insert({
      product_id: params.product_id,
      user_id: params.user_id,
      rating: params.rating,
      title: params.title ?? null,
      content: params.content,
      image_urls: params.image_urls ?? [],
      is_verified_purchase: isVerified,
    })
    .select()
    .single();

  if (error) {
    console.error('createReview error:', error);
    throw error;
  }
  return mapRowToReview({ ...data, users: null } as ReviewRow);
}

/**
 * 해당 사용자가 이 상품을 구매했는지 여부
 */
async function checkVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['배송완료', '배송중', '배송대기', '상품준비중'])
    .limit(1);

  if (error || !data?.length) return false;

  const orderIds = data.map((o) => o.id);
  const { data: items } = await getSupabase()
    .from('order_items')
    .select('id')
    .in('order_id', orderIds)
    .eq('product_id', productId)
    .limit(1);

  return (items?.length ?? 0) > 0;
}

/**
 * 사용자가 해당 상품에 이미 리뷰를 썼는지
 */
export async function getMyReview(productId: string, userId: string): Promise<Review | null> {
  const { data, error } = await getSupabase()
    .from('reviews')
    .select('id, product_id, user_id, rating, title, content, image_urls, helpful_count, is_verified_purchase, created_at, updated_at, users(name)')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('getMyReview error:', error);
    throw error;
  }
  return data ? mapRowToReview(data as ReviewRow) : null;
}
