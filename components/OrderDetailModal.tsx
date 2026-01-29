import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { OrderWithItems } from '../lib/api/orders';

interface OrderDetailModalProps {
  order: OrderWithItems | null | undefined;
  isLoading?: boolean;
  onClose: () => void;
  orderId: string | null;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isLoading, onClose, orderId }) => {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!orderId) return null;

  const items = order?.order_items ?? [];

  const content = (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-black text-gray-900">주문 상세</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-4 bg-white">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ) : !order ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 font-bold">주문 정보를 불러올 수 없습니다.</p>
              <button type="button" onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200">
                닫기
              </button>
            </div>
          ) : (
            <>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">주문번호</span>
            <span className="font-bold text-gray-900">{order.order_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">주문일시</span>
            <span className="text-sm font-medium text-gray-700">{formatDate(order.created_at)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">상태</span>
            <span className="text-sm font-bold text-gray-900">{order.status}</span>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-500 mb-2">주문 상품</p>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                  {item.product_image_url && (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-50"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{item.product_brand}</p>
                    <p className="font-medium text-gray-900 text-sm line-clamp-2">{item.product_name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {item.quantity}개 × {item.price.toLocaleString()}원 = {item.subtotal.toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">상품 금액</span>
              <span>{order.subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">배송비</span>
              <span>{order.shipping_fee === 0 ? '무료' : `${order.shipping_fee.toLocaleString()}원`}</span>
            </div>
            {order.earned_points != null && order.earned_points > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>적립</span>
                <span>+{order.earned_points.toLocaleString()}P</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 pt-2">
              <span>총 결제 금액</span>
              <span>{order.total_amount.toLocaleString()}원</span>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-500 mb-1">배송지</p>
            <p className="text-sm text-gray-700">{order.recipient_name} · {order.recipient_phone}</p>
            <p className="text-sm text-gray-600 break-words">{order.shipping_address}</p>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default OrderDetailModal;
