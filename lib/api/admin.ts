import { getSupabase } from '../supabase';
import type { OrderRecord, OrderWithItems, OrderItemRecord } from './orders';

const ORDER_STATUSES = [
  '결제대기',
  '상품준비중',
  '배송대기',
  '배송중',
  '배송완료',
  '취소접수',
  '반품접수',
  '해외배송중',
  '현지집하완료',
  '통관진행중',
] as const;

/**
 * 현재 로그인 사용자가 관리자인지 확인 (admin_users 테이블에 user_id 존재 여부)
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('checkIsAdmin error:', error);
    return false;
  }
  return !!data;
}

/**
 * 관리자용: 전체 주문 목록 (상태 필터 옵션, order_items 포함)
 */
export async function getAdminOrders(statusFilter: string | null): Promise<OrderWithItems[]> {
  let query = getSupabase()
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== '전체') {
    if (statusFilter === '취소/반품') {
      query = query.in('status', ['취소접수', '반품접수']);
    } else {
      query = query.eq('status', statusFilter);
    }
  }

  const { data: orders, error } = await query;
  if (error) {
    console.error('getAdminOrders error:', error);
    throw error;
  }

  const list = (orders ?? []) as OrderRecord[];
  const withItems: OrderWithItems[] = [];

  for (const order of list) {
    const { data: items } = await getSupabase()
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });
    withItems.push({
      ...order,
      order_items: (items ?? []) as OrderItemRecord[],
    });
  }

  return withItems;
}

/**
 * 관리자용: 주문 상태·물류·메모 수정
 */
export async function updateOrderByAdmin(
  orderId: string,
  updates: {
    status?: string;
    courier_company?: string | null;
    tracking_number?: string | null;
    admin_memo?: string | null;
    shipped_at?: string | null;
    delivered_at?: string | null;
  }
): Promise<void> {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) body.status = updates.status;
  if (updates.courier_company !== undefined) body.courier_company = updates.courier_company;
  if (updates.tracking_number !== undefined) body.tracking_number = updates.tracking_number;
  if (updates.admin_memo !== undefined) body.admin_memo = updates.admin_memo;
  if (updates.shipped_at !== undefined) body.shipped_at = updates.shipped_at;
  if (updates.delivered_at !== undefined) body.delivered_at = updates.delivered_at;

  const { error } = await getSupabase().from('orders').update(body).eq('id', orderId);
  if (error) {
    console.error('updateOrderByAdmin error:', error);
    throw error;
  }
}

export { ORDER_STATUSES };

// --- Admin 상품 관리 ---

export interface AdminProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number;
  image_url: string;
  category_id: string | null;
  sub_category: string | null;
  tags: string[] | null;
  sold_count: number;
  stock_quantity: number;
  is_active: boolean;
  discount: number | null;
  created_at: string;
  categories: { name: string } | null;
}

export interface AdminProductCreate {
  name: string;
  brand: string;
  price: number;
  original_price: number;
  image_url: string;
  category_id?: string | null;
  sub_category?: string | null;
  tags?: string[];
  stock_quantity?: number;
  is_active?: boolean;
  description?: string | null;
}

export interface AdminProductUpdate {
  name?: string;
  brand?: string;
  price?: number;
  original_price?: number;
  image_url?: string;
  category_id?: string | null;
  sub_category?: string | null;
  tags?: string[];
  stock_quantity?: number;
  is_active?: boolean;
  description?: string | null;
}

/**
 * 관리자용: 전체 상품 목록 (비노출 포함, 카테고리명 포함)
 */
export async function getAdminProducts(opts?: {
  categoryId?: string | null;
  search?: string;
}): Promise<AdminProductRow[]> {
  let query = getSupabase()
    .from('products')
    .select('id, name, brand, price, original_price, image_url, category_id, sub_category, tags, sold_count, stock_quantity, is_active, discount, created_at, categories(name)')
    .order('created_at', { ascending: false });

  if (opts?.categoryId) {
    query = query.eq('category_id', opts.categoryId);
  }
  if (opts?.search?.trim()) {
    const q = opts.search.trim();
    query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getAdminProducts error:', error);
    throw error;
  }
  return (data ?? []) as AdminProductRow[];
}

/**
 * 관리자용: 상품 등록
 */
export async function createAdminProduct(p: AdminProductCreate): Promise<AdminProductRow> {
  const row: Record<string, unknown> = {
    name: p.name,
    brand: p.brand,
    price: p.price,
    original_price: p.original_price ?? p.price,
    image_url: p.image_url,
    category_id: p.category_id ?? null,
    sub_category: p.sub_category ?? null,
    tags: p.tags ?? [],
    stock_quantity: p.stock_quantity ?? 0,
    is_active: p.is_active ?? true,
    description: p.description ?? null,
  };
  const { data, error } = await getSupabase().from('products').insert(row).select().single();
  if (error) {
    console.error('createAdminProduct error:', error);
    throw error;
  }
  return data as AdminProductRow;
}

/**
 * 관리자용: 상품 수정
 */
export async function updateAdminProduct(id: string, p: AdminProductUpdate): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (p.name !== undefined) row.name = p.name;
  if (p.brand !== undefined) row.brand = p.brand;
  if (p.price !== undefined) row.price = p.price;
  if (p.original_price !== undefined) row.original_price = p.original_price;
  if (p.image_url !== undefined) row.image_url = p.image_url;
  if (p.category_id !== undefined) row.category_id = p.category_id;
  if (p.sub_category !== undefined) row.sub_category = p.sub_category;
  if (p.tags !== undefined) row.tags = p.tags;
  if (p.stock_quantity !== undefined) row.stock_quantity = p.stock_quantity;
  if (p.is_active !== undefined) row.is_active = p.is_active;
  if (p.description !== undefined) row.description = p.description;

  const { error } = await getSupabase().from('products').update(row).eq('id', id);
  if (error) {
    console.error('updateAdminProduct error:', error);
    throw error;
  }
}

/**
 * 관리자용: 상품 재고만 수정
 */
export async function updateAdminProductStock(productId: string, stockQuantity: number): Promise<void> {
  const { error } = await getSupabase()
    .from('products')
    .update({ stock_quantity: stockQuantity, updated_at: new Date().toISOString() })
    .eq('id', productId);
  if (error) {
    console.error('updateAdminProductStock error:', error);
    throw error;
  }
}
