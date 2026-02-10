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
