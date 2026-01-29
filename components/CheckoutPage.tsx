import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { CartItemWithProduct } from '../lib/api/cart';
import type { UserProfile } from '../lib/api/users';
import { TIER_RATES, SHIPPING_FEE_BASIC } from '../lib/constants/membership';
import type { ShippingAddress } from '../types';

interface CheckoutPageProps {
  user: User | null;
  profile: UserProfile | null;
  items: CartItemWithProduct[];
  cartId: string | null;
  addresses: ShippingAddress[];
  defaultAddress: ShippingAddress | null;
  onCreateOrder: (shippingAddressId: string, cartItemIds?: string[], usedPoints?: number) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateToPage: (page: string) => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({
  user,
  profile,
  items,
  cartId,
  addresses,
  defaultAddress,
  onCreateOrder,
  onNavigateToLogin,
  onNavigateToPage,
}) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(defaultAddress?.id ?? addresses[0]?.id ?? null);
  const [usedPoints, setUsedPoints] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const displayItems = items;

  const tier = profile?.membership_tier ?? 'basic';
  const shippingFee = tier === 'basic' ? SHIPPING_FEE_BASIC : 0;
  const subtotal = displayItems.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
  const maxUsablePoints = Math.min(profile?.points ?? 0, subtotal + shippingFee);
  const appliedPoints = Math.min(usedPoints, maxUsablePoints);
  const totalAmount = Math.max(0, subtotal + shippingFee - appliedPoints);
  const ratePercent = Math.round((TIER_RATES[tier] ?? 0.01) * 100);
  const estimatedPoints = Math.floor(totalAmount * (TIER_RATES[tier] ?? 0.01));

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 text-sm mb-8">주문하려면 로그인해 주세요.</p>
          <button onClick={onNavigateToLogin} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700">
            로그인하기
          </button>
          <button onClick={() => onNavigateToPage('cart')} className="w-full mt-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50">
            장바구니로
          </button>
        </div>
      </div>
    );
  }

  if (!cartId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-2">주문할 상품이 없습니다</h2>
          <p className="text-gray-500 text-sm mb-8">장바구니에 상품을 담은 후 주문해 주세요.</p>
          <button onClick={() => onNavigateToPage('cart')} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700">
            장바구니로
          </button>
        </div>
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-2">주문할 상품이 없습니다</h2>
          <p className="text-gray-500 text-sm mb-8">장바구니에 상품을 담은 후 주문해 주세요.</p>
          <button onClick={() => onNavigateToPage('cart')} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700">
            장바구니로
          </button>
        </div>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-2">배송지를 등록해 주세요</h2>
          <p className="text-gray-500 text-sm mb-8">주문 전에 배송지를 추가해 주세요.</p>
          <button onClick={() => onNavigateToPage('addresses')} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700">
            배송지 관리
          </button>
          <button onClick={() => onNavigateToPage('cart')} className="w-full mt-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50">
            장바구니로
          </button>
        </div>
      </div>
    );
  }

  const effectiveAddressId = selectedAddressId ?? addresses[0].id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onCreateOrder(effectiveAddressId, buyNowCartItemIds ?? undefined);
      onNavigateToPage('order_complete');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12 bg-[#fcfcfc] min-h-screen">
      <h1 className="text-2xl font-black text-gray-900 mb-8 tracking-tighter">주문/결제</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-black text-gray-900 mb-4">배송지 선택</h2>
          <div className="space-y-3">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  effectiveAddressId === addr.id ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={effectiveAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-1 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{addr.recipient_name}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {[addr.address_line1, addr.address_line2, addr.city, addr.state_province, addr.postal_code, addr.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{addr.phone}</p>
                </div>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigateToPage('addresses')}
            className="mt-4 text-sm font-bold text-red-600 hover:underline"
          >
            + 배송지 추가/변경
          </button>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-black text-gray-900 mb-4">주문 상품</h2>
          <div className="space-y-4">
            {displayItems.map((item) => (
              <div key={item.id} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">{item.product.brand}</p>
                  <p className="font-bold text-gray-900 line-clamp-2">{item.product.name}</p>
                  {Object.keys(item.selectedOptions).length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {item.quantity}개 × {(item.priceSnapshot).toLocaleString()}원
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-red-600">{(item.priceSnapshot * item.quantity).toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-black text-gray-900 mb-4">결제 금액</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>상품 금액</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>배송비 {tier === 'basic' && '(Basic)'}</span>
              <span>{shippingFee === 0 ? '무료 (Premium/VIP)' : `${shippingFee.toLocaleString()}원`}</span>
            </div>
            {maxUsablePoints > 0 && (
              <div className="flex justify-between items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">적립금 사용 (보유 {(profile?.points ?? 0).toLocaleString()}P)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={maxUsablePoints}
                    value={usedPoints || ''}
                    onChange={(e) => setUsedPoints(Math.max(0, Math.min(maxUsablePoints, Number(e.target.value) || 0)))}
                    placeholder="0"
                    className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right"
                  />
                  <span className="text-sm text-gray-500">P</span>
                  <button type="button" onClick={() => setUsedPoints(maxUsablePoints)} className="text-xs font-bold text-red-600 hover:underline">
                    전액
                  </button>
                </div>
              </div>
            )}
            {appliedPoints > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>적립금 사용</span>
                <span>-{appliedPoints.toLocaleString()}P</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>적립 예정 ({ratePercent}%)</span>
              <span>{estimatedPoints.toLocaleString()}P</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <span className="font-black text-gray-900">총 결제 금액</span>
            <span className="text-xl font-black text-red-600">{totalAmount.toLocaleString()}원</span>
          </div>
        </section>

        {error && <p className="text-sm font-bold text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? '처리 중...' : `${totalAmount.toLocaleString()}원 결제하기`}
          </button>
          <button
            type="button"
            onClick={() => onNavigateToPage('cart')}
            className="px-6 py-4 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50"
          >
            장바구니로
          </button>
        </div>
      </form>

      <div className="mt-8">
        <button type="button" onClick={() => onNavigateToPage('cart')} className="text-sm font-bold text-gray-500 hover:text-red-600">
          ← 장바구니로
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;
