import React from 'react';
import { TIER_LABELS, TIER_RATES, TIER_THRESHOLDS, SHIPPING_FEE_BASIC } from '../lib/constants/membership';
import type { MembershipTier } from '../lib/constants/membership';

interface TierBenefitsModalProps {
  onClose: () => void;
}

const TIER_BENEFITS: Record<MembershipTier, { desc: string; perks: string[] }> = {
  basic: {
    desc: '월 구매액 기준 미달 시 기본 등급',
    perks: [`적립률 ${TIER_RATES.basic * 100}%`, `배송비 ${SHIPPING_FEE_BASIC.toLocaleString()}원`, '다음 등급: 월 20만원 이상 구매 시 Premium'],
  },
  premium: {
    desc: `월 ${(TIER_THRESHOLDS.premium / 10_000).toFixed(0)}만원 이상 구매 시`,
    perks: [`적립률 ${TIER_RATES.premium * 100}%`, '배송비 무료', '다음 등급: 월 50만원 이상 구매 시 VIP'],
  },
  vip: {
    desc: `월 ${(TIER_THRESHOLDS.vip / 10_000).toFixed(0)}만원 이상 구매 시`,
    perks: [`적립률 ${TIER_RATES.vip * 100}%`, '배송비 무료', '전담 CS 안내'],
  },
};

const TierBenefitsModal: React.FC<TierBenefitsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-black text-gray-900">등급별 혜택</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-6">
          {(['basic', 'premium', 'vip'] as const).map((tier) => {
            const { desc, perks } = TIER_BENEFITS[tier];
            const isVip = tier === 'vip';
            const isPremium = tier === 'premium';
            return (
              <div
                key={tier}
                className={`rounded-xl border-2 p-5 ${
                  isVip ? 'border-amber-200 bg-amber-50/50' : isPremium ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`font-black text-lg ${
                      isVip ? 'text-amber-700' : isPremium ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    {TIER_LABELS[tier]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{desc}</p>
                <ul className="space-y-1.5">
                  {perks.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="p-6 pt-0">
          <p className="text-xs text-gray-500">등급은 당월 구매액 합계 기준으로 매 주문 후 자동 갱신됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default TierBenefitsModal;
