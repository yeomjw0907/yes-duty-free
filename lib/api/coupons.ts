import { getSupabase } from '../supabase';
import type { CouponRow, UserCouponWithDetail } from '../../types';

/**
 * 주문 금액 기준 사용 가능한 보유 쿠폰 목록 (미사용, 유효기간 내, 최소주문금액 충족)
 */
export async function getAvailableUserCoupons(
  userId: string,
  orderAmount: number
): Promise<UserCouponWithDetail[]> {
  const now = new Date().toISOString();
  const { data, error } = await getSupabase()
    .from('user_coupons')
    .select(
      `
      id,
      user_id,
      coupon_id,
      is_used,
      used_at,
      created_at,
      coupons (
        id,
        code,
        title,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        valid_until
      )
    `
    )
    .eq('user_id', userId)
    .eq('is_used', false);

  if (error) {
    console.error('getAvailableUserCoupons error:', error);
    throw error;
  }

  const list = (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    coupon_id: row.coupon_id,
    is_used: row.is_used,
    used_at: row.used_at,
    created_at: row.created_at,
    coupon: row.coupons as CouponRow,
  }));

  return list.filter((uc: UserCouponWithDetail) => {
    const c = uc.coupon;
    if (!c || new Date(c.valid_until) < new Date(now)) return false;
    if (c.min_order_amount > orderAmount) return false;
    return true;
  });
}

/**
 * 쿠폰 적용 시 할인 금액 계산 (원)
 */
export function computeCouponDiscount(
  coupon: CouponRow,
  orderAmount: number
): number {
  if (coupon.min_order_amount > orderAmount) return 0;
  const now = new Date().toISOString();
  if (new Date(coupon.valid_until) < new Date(now)) return 0;

  if (coupon.discount_type === 'fixed') {
    return Math.min(coupon.discount_value, orderAmount);
  }
  const percentOff = Math.floor((orderAmount * coupon.discount_value) / 100);
  const cap = coupon.max_discount_amount ?? percentOff;
  return Math.min(percentOff, cap, orderAmount);
}

/**
 * 쿠폰 코드로 쿠폰 받기 (user_coupons 생성)
 */
export async function claimCouponByCode(userId: string, code: string): Promise<UserCouponWithDetail | null> {
  const trimmed = code.trim().toUpperCase();
  const { data: coupon, error: couponError } = await getSupabase()
    .from('coupons')
    .select('id, code, title, discount_type, discount_value, min_order_amount, max_discount_amount, valid_until')
    .eq('code', trimmed)
    .eq('is_active', true)
    .single();

  if (couponError || !coupon) return null;
  const now = new Date().toISOString();
  if (new Date((coupon as CouponRow).valid_until) < new Date(now)) return null;

  const { data: existing } = await getSupabase()
    .from('user_coupons')
    .select('id')
    .eq('user_id', userId)
    .eq('coupon_id', (coupon as CouponRow).id)
    .eq('is_used', false)
    .limit(1);

  if (existing?.length) return null;

  const { data: inserted, error: insertError } = await getSupabase()
    .from('user_coupons')
    .insert({ user_id: userId, coupon_id: (coupon as CouponRow).id })
    .select('id, user_id, coupon_id, is_used, used_at, created_at')
    .single();

  if (insertError || !inserted) return null;
  return {
    ...inserted,
    coupon: coupon as CouponRow,
  };
}

/**
 * user_coupon_id로 사용 처리 (주문 완료 시)
 */
export async function markUserCouponUsed(userCouponId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('user_coupons')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', userCouponId);

  if (error) {
    console.error('markUserCouponUsed error', error);
    throw error;
  }
}
