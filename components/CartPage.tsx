import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import type { CartItemWithProduct } from '../lib/api/cart';
import type { Product } from '../types';
import { getProductDisplayName } from '../lib/productLocale';
import ConfirmModal from './ConfirmModal';

interface CartPageProps {
  user: User | null;
  items: CartItemWithProduct[];
  isLoading: boolean;
  onUpdateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (cartItemId: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateToPage: (page: string) => void;
  onProductClick: (product: Product) => void;
}

const CartPage: React.FC<CartPageProps> = ({
  user,
  items,
  isLoading,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToLogin,
  onNavigateToPage,
  onProductClick,
}) => {
  const { i18n } = useTranslation();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveItem, setConfirmRemoveItem] = useState<CartItemWithProduct | null>(null);

  const handleUpdateQty = async (cartItemId: string, quantity: number) => {
    setUpdatingId(cartItemId);
    try {
      await onUpdateQuantity(cartItemId, quantity);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    setRemovingId(cartItemId);
    try {
      await onRemoveItem(cartItemId);
      setConfirmRemoveItem(null);
    } finally {
      setRemovingId(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!confirmRemoveItem) return;
    await handleRemove(confirmRemoveItem.id);
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center text-3xl">🛒</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 text-sm mb-8">장바구니를 사용하려면 로그인해 주세요.</p>
          <button
            onClick={onNavigateToLogin}
            className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all"
          >
            로그인하기
          </button>
          <button
            onClick={() => onNavigateToPage('home')}
            className="w-full mt-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all"
          >
            쇼핑 계속하기
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-10" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center text-3xl">🛒</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">장바구니가 비어있습니다</h2>
          <p className="text-gray-500 text-sm mb-8">마음에 드는 상품을 담아보세요.</p>
          <button
            onClick={() => onNavigateToPage('home')}
            className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all"
          >
            쇼핑 계속하기
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  const stockOk = (item: CartItemWithProduct) =>
    item.product.isUnlimitedStock || (item.product.stockQuantity ?? 0) >= item.quantity;
  const anyStockShortage = items.some((item) => !stockOk(item));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:py-16 bg-[#fcfcfc] min-h-screen">
      <h1 className="text-2xl font-black text-gray-900 mb-8 tracking-tighter">장바구니</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 transition-opacity ${removingId === item.id ? 'opacity-50' : ''}`}
          >
            <button
              type="button"
              onClick={() => onProductClick(item.product)}
              className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100"
            >
              <img src={item.product.imageUrl} alt={getProductDisplayName(item.product, i18n.language)} className="w-full h-full object-cover" />
            </button>
            <div className="flex-grow min-w-0">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{item.product.brand}</p>
              <button type="button" onClick={() => onProductClick(item.product)} className="text-left">
                <h3 className="font-bold text-gray-900 line-clamp-2 hover:text-red-600 transition-colors">{getProductDisplayName(item.product, i18n.language)}</h3>
              </button>
              {Object.keys(item.selectedOptions).length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                </p>
              )}
              {!item.product.isUnlimitedStock && (
                <p className="text-xs font-bold mt-0.5">
                  재고 {(item.product.stockQuantity ?? 0)}개
                  {!stockOk(item) && <span className="text-red-600 ml-1">· 재고 부족</span>}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <button
                    type="button"
                    disabled={updatingId === item.id || item.quantity <= 1}
                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                    className="px-3 py-1.5 text-gray-600 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="px-3 py-1.5 text-sm font-bold text-gray-900 min-w-[2rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={
                      updatingId === item.id ||
                      (!item.product.isUnlimitedStock && item.quantity >= (item.product.stockQuantity ?? 0))
                    }
                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                    className="px-3 py-1.5 text-gray-600 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-600 font-black">{(item.priceSnapshot * item.quantity).toLocaleString()}원</span>
                  <button
                    type="button"
                    disabled={removingId === item.id}
                    onClick={() => setConfirmRemoveItem(item)}
                    className="text-gray-400 hover:text-red-600 text-sm font-bold disabled:opacity-50"
                    aria-label="삭제"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-6">
        {anyStockShortage && (
          <p className="text-red-600 text-sm font-bold mb-4">일부 상품 재고가 부족합니다. 수량을 조정하거나 삭제해 주세요.</p>
        )}
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600 font-bold">총 결제 예정 금액</span>
          <span className="text-2xl font-black text-red-600">{totalAmount.toLocaleString()}원</span>
        </div>
        <button
          type="button"
          disabled={anyStockShortage}
          onClick={() => onNavigateToPage('checkout')}
          className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {anyStockShortage ? '재고 부족으로 주문할 수 없습니다' : '주문하기'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">배송비는 주문 단계에서 확인됩니다.</p>
      </div>

      <ConfirmModal
        open={!!confirmRemoveItem}
        title="장바구니에서 삭제"
        message="정말 삭제하시겠습니까?"
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemoveItem(null)}
        loading={removingId !== null}
      />
    </div>
  );
};

export default CartPage;
