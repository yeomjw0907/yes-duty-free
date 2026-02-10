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
  description: string | null;
  detail_html: string | null;
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
  detail_html?: string | null;
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
  detail_html?: string | null;
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
    .select('id, name, brand, price, original_price, image_url, category_id, sub_category, tags, sold_count, stock_quantity, is_active, discount, created_at, description, detail_html, categories(name)')
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
    detail_html: p.detail_html ?? null,
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
  if (p.detail_html !== undefined) row.detail_html = p.detail_html;

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

// --- Admin 회원 관리 ---

export interface AdminMemberRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  membership_tier: string;
  points: number;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminMemberDetail {
  user: AdminMemberRow;
  orders: OrderWithItems[];
}

/**
 * 관리자용: 회원 목록 (이메일·이름·전화번호 검색)
 */
export async function getAdminMembers(search?: string): Promise<AdminMemberRow[]> {
  let query = getSupabase()
    .from('users')
    .select('id, email, name, phone, membership_tier, points, is_active, created_at, last_login_at')
    .order('created_at', { ascending: false });

  if (search?.trim()) {
    const q = search.trim().replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (q) query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getAdminMembers error:', error);
    throw error;
  }
  return (data ?? []) as AdminMemberRow[];
}

/**
 * 관리자용: 특정 회원의 주문 목록 (order_items 포함)
 */
export async function getAdminOrdersByUserId(userId: string): Promise<OrderWithItems[]> {
  const { data: orders, error } = await getSupabase()
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getAdminOrdersByUserId error:', error);
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
 * 관리자용: 회원 상세 (회원 정보 + 주문 목록)
 */
export async function getAdminMemberDetail(userId: string): Promise<AdminMemberDetail | null> {
  const { data: user, error: userError } = await getSupabase()
    .from('users')
    .select('id, email, name, phone, membership_tier, points, is_active, created_at, last_login_at')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    if (userError?.code === 'PGRST116') return null;
    console.error('getAdminMemberDetail user error:', userError);
    throw userError;
  }

  const orders = await getAdminOrdersByUserId(userId);
  return {
    user: user as AdminMemberRow,
    orders,
  };
}

/**
 * 관리자용: 회원 정보 수정 (탈퇴 처리, 등급, 포인트, 이름, 전화번호)
 * 비밀번호는 Supabase Auth에 있어 클라이언트에서 변경 불가 → 대시보드 또는 Edge Function 사용
 */
export async function updateMemberByAdmin(
  userId: string,
  updates: {
    is_active?: boolean;
    membership_tier?: string;
    points?: number;
    name?: string;
    phone?: string | null;
  }
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.is_active !== undefined) row.is_active = updates.is_active;
  if (updates.membership_tier !== undefined) row.membership_tier = updates.membership_tier;
  if (updates.points !== undefined) row.points = updates.points;
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.phone !== undefined) row.phone = updates.phone;

  const { error } = await getSupabase().from('users').update(row).eq('id', userId);
  if (error) {
    console.error('updateMemberByAdmin error:', error);
    throw error;
  }
}

// --- Admin 대시보드 ---

export interface AdminDashboardStats {
  todayOrders: number;
  todayRevenue: number;
  weekOrders: number;
  weekRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  statusCounts: Record<string, number>;
  recentOrders: OrderRecord[];
}

function startOfDay(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

/**
 * 관리자용: 대시보드 통계 (오늘/주간/월간 주문·매출, 상태별 건수, 최근 주문)
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));

  const { data: allOrders, error } = await getSupabase()
    .from('orders')
    .select('id, order_number, status, total_amount, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getAdminDashboardStats error:', error);
    throw error;
  }

  const orders = (allOrders ?? []) as Pick<OrderRecord, 'id' | 'order_number' | 'status' | 'total_amount' | 'created_at'>[];
  const statusCounts: Record<string, number> = {};
  let todayOrders = 0,
    todayRevenue = 0,
    weekOrders = 0,
    weekRevenue = 0,
    monthOrders = 0,
    monthRevenue = 0;

  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
    const created = o.created_at;
    const amount = o.total_amount ?? 0;
    if (created >= todayStart) {
      todayOrders++;
      todayRevenue += amount;
    }
    if (created >= weekStart) {
      weekOrders++;
      weekRevenue += amount;
    }
    if (created >= monthStart) {
      monthOrders++;
      monthRevenue += amount;
    }
  }

  const recentOrders = (orders.slice(0, 10) ?? []) as OrderRecord[];

  return {
    todayOrders,
    todayRevenue,
    weekOrders,
    weekRevenue,
    monthOrders,
    monthRevenue,
    statusCounts,
    recentOrders,
  };
}

// --- Admin 쿠폰 관리 ---

export interface AdminCouponRow {
  id: string;
  code: string;
  title: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminCouponCreate {
  code: string;
  title: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  valid_until: string;
  usage_limit?: number | null;
  is_active?: boolean;
}

export interface AdminCouponUpdate {
  title?: string;
  discount_type?: 'percent' | 'fixed';
  discount_value?: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  valid_until?: string;
  usage_limit?: number | null;
  is_active?: boolean;
}

/**
 * 관리자용: 쿠폰 전체 목록
 */
export async function getAdminCoupons(): Promise<AdminCouponRow[]> {
  const { data, error } = await getSupabase()
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('getAdminCoupons error:', error);
    throw error;
  }
  return (data ?? []) as AdminCouponRow[];
}

/**
 * 관리자용: 쿠폰 생성
 */
export async function createAdminCoupon(p: AdminCouponCreate): Promise<AdminCouponRow> {
  const row = {
    code: p.code.trim().toUpperCase(),
    title: p.title.trim(),
    discount_type: p.discount_type,
    discount_value: p.discount_value,
    min_order_amount: p.min_order_amount ?? 0,
    max_discount_amount: p.max_discount_amount ?? null,
    valid_until: p.valid_until,
    usage_limit: p.usage_limit ?? null,
    is_active: p.is_active ?? true,
  };
  const { data, error } = await getSupabase().from('coupons').insert(row).select().single();
  if (error) {
    console.error('createAdminCoupon error:', error);
    throw error;
  }
  return data as AdminCouponRow;
}

/**
 * 관리자용: 쿠폰 수정
 */
export async function updateAdminCoupon(id: string, p: AdminCouponUpdate): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (p.title !== undefined) row.title = p.title;
  if (p.discount_type !== undefined) row.discount_type = p.discount_type;
  if (p.discount_value !== undefined) row.discount_value = p.discount_value;
  if (p.min_order_amount !== undefined) row.min_order_amount = p.min_order_amount;
  if (p.max_discount_amount !== undefined) row.max_discount_amount = p.max_discount_amount;
  if (p.valid_until !== undefined) row.valid_until = p.valid_until;
  if (p.usage_limit !== undefined) row.usage_limit = p.usage_limit;
  if (p.is_active !== undefined) row.is_active = p.is_active;
  const { error } = await getSupabase().from('coupons').update(row).eq('id', id);
  if (error) {
    console.error('updateAdminCoupon error:', error);
    throw error;
  }
}

// --- Admin 리뷰 관리 ---

export interface AdminReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string;
  is_hidden: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  products?: { name: string } | null;
  users?: { name: string; email: string } | null;
}

/**
 * 관리자용: 리뷰 목록 (상품명·작성자 포함, 필터 옵션)
 */
export async function getAdminReviews(opts?: {
  productId?: string | null;
  rating?: number | null;
  includeHidden?: boolean;
}): Promise<AdminReviewRow[]> {
  let query = getSupabase()
    .from('reviews')
    .select('id, product_id, user_id, rating, title, content, is_hidden, is_verified_purchase, created_at, products(name), users(name, email)')
    .order('created_at', { ascending: false });

  if (opts?.productId) query = query.eq('product_id', opts.productId);
  if (opts?.rating != null) query = query.eq('rating', opts.rating);
  if (opts?.includeHidden === false) query = query.eq('is_hidden', false);
  if (opts?.includeHidden === true) query = query.eq('is_hidden', true);

  const { data, error } = await query;
  if (error) {
    console.error('getAdminReviews error:', error);
    throw error;
  }
  return (data ?? []) as AdminReviewRow[];
}

/**
 * 관리자용: 리뷰 숨김/복구
 */
export async function updateAdminReviewHidden(reviewId: string, isHidden: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from('reviews')
    .update({ is_hidden: isHidden, updated_at: new Date().toISOString() })
    .eq('id', reviewId);
  if (error) {
    console.error('updateAdminReviewHidden error:', error);
    throw error;
  }
}
