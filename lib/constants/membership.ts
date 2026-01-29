/** 회원 등급 타입 */
export type MembershipTier = 'basic' | 'premium' | 'vip';

/** 등급별 월 구매액 기준 (원) - 해당 월 합계가 이상이면 해당 등급 */
export const TIER_THRESHOLDS = {
  premium: 200_000,   // 월 20만원 이상 → Premium
  vip: 500_000,      // 월 50만원 이상 → VIP
} as const;

/** 등급별 적립률 (0.01 = 1%) */
export const TIER_RATES: Record<MembershipTier, number> = {
  basic: 0.01,
  premium: 0.02,
  vip: 0.03,
};

/** Basic 등급 배송비 (원). Premium/VIP는 무료 */
export const SHIPPING_FEE_BASIC = 3000;

/** 등급 한글 라벨 */
export const TIER_LABELS: Record<MembershipTier, string> = {
  basic: 'Basic',
  premium: 'Premium',
  vip: 'VIP',
};
