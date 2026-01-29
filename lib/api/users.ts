import { supabase } from '../supabase';
import { TIER_THRESHOLDS, TIER_RATES, type MembershipTier } from '../constants/membership';

export interface UserProfileInput {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

/** public.users 프로필 (등급·포인트 포함) */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  membership_tier: MembershipTier;
  points: number;
}

/**
 * Supabase Auth 가입/로그인 후 public.users에 프로필 생성 또는 갱신
 */
export async function upsertUserProfile(input: UserProfileInput): Promise<void> {
  const { error } = await supabase.from('users').upsert(
    {
      id: input.id,
      email: input.email,
      name: input.name,
      phone: input.phone ?? null,
      provider: 'email',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('upsertUserProfile error:', error);
    throw error;
  }
}

/**
 * 로그인 시 last_login_at 갱신
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * 프로필 조회 (등급, 포인트 포함)
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, phone, membership_tier, points')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone ?? null,
    membership_tier: (data.membership_tier as MembershipTier) ?? 'basic',
    points: Number(data.points) ?? 0,
  };
}

/** 월 구매액 합산 시 제외할 주문 상태 */
const EXCLUDED_ORDER_STATUSES = ['취소접수', '반품접수'];

/**
 * 월 구매액 기준으로 membership_tier 갱신 (당월 합계)
 */
export async function updateMembershipTier(userId: string): Promise<void> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('total_amount, status')
    .eq('user_id', userId)
    .gte('created_at', monthStart);

  if (ordersError) {
    console.error('updateMembershipTier orders error', ordersError);
    return;
  }

  const totalMonth = (orders ?? [])
    .filter((o) => !EXCLUDED_ORDER_STATUSES.includes(o.status as string))
    .reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);

  let tier: MembershipTier = 'basic';
  if (totalMonth >= TIER_THRESHOLDS.vip) tier = 'vip';
  else if (totalMonth >= TIER_THRESHOLDS.premium) tier = 'premium';

  const { error: updateError } = await supabase
    .from('users')
    .update({ membership_tier: tier, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    console.error('updateMembershipTier update error', updateError);
  }
}

/**
 * 주문 완료 후: 등급 갱신 → 해당 주문 적립금 계산 → orders.earned_points, users.points 반영
 */
export async function addPointsForOrder(
  userId: string,
  orderId: string,
  orderTotalAmount: number
): Promise<void> {
  await updateMembershipTier(userId);
  const profile = await getProfile(userId);
  const tier = profile?.membership_tier ?? 'basic';
  const rate = TIER_RATES[tier];
  const earned = Math.floor(orderTotalAmount * rate);

  if (earned <= 0) return;

  await supabase
    .from('orders')
    .update({ earned_points: earned, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('user_id', userId);

  const { data: userRow } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .single();

  const currentPoints = Number((userRow as { points: number } | null)?.points ?? 0);
  await supabase
    .from('users')
    .update({ points: currentPoints + earned, updated_at: new Date().toISOString() })
    .eq('id', userId);
}
