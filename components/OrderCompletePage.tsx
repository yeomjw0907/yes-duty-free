import React, { useEffect } from 'react';
import { useOrderByOrderNumber } from '../lib/hooks/useOrders';

interface OrderCompletePageProps {
  orderNumber: string | null;
  userId: string | null;
  onNavigateToPage: (page: string) => void;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(
    d.getHours(),
  ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const OrderCompletePage: React.FC<OrderCompletePageProps> = ({ orderNumber, userId, onNavigateToPage }) => {
  const { order, isLoading, refetch } = useOrderByOrderNumber(orderNumber, userId ?? undefined);

  useEffect(() => {
    if (!orderNumber || !userId) return;
    if (!order) return;
    if (order.payment_status !== 'pending') return;

    const timer = window.setInterval(() => {
      refetch();
    }, 2000);

    return () => window.clearInterval(timer);
  }, [orderNumber, userId, order, refetch]);

  const paymentStatus = order?.payment_status ?? null;
  const title =
    paymentStatus === 'paid'
      ? '결제가 완료되었습니다'
      : paymentStatus === 'failed'
        ? '결제에 실패했습니다'
        : paymentStatus === 'refunded'
          ? '환불이 완료되었습니다'
          : '결제 처리 중입니다';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
      <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
        <div
          className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl ${
            paymentStatus === 'paid'
              ? 'bg-green-100 text-green-700'
              : paymentStatus === 'failed' || paymentStatus === 'refunded'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {paymentStatus === 'paid' ? '✓' : paymentStatus === 'failed' ? '!' : paymentStatus === 'refunded' ? '↺' : '…'}
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm mb-6">
          {paymentStatus === 'paid'
            ? '주문이 확인되었습니다. 배송이 시작되면 알려드리겠습니다.'
            : paymentStatus === 'pending' || !paymentStatus
              ? '결제 완료 처리 중입니다. 잠시 후 주문 상태가 자동으로 갱신됩니다.'
              : paymentStatus === 'failed'
                ? '다시 결제 시도하거나 문의해 주세요.'
                : paymentStatus === 'refunded'
                  ? '환불이 완료되었습니다.'
                  : '잠시만 기다려 주세요.'}
        </p>
        {orderNumber && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-bold text-gray-500 mb-1">주문번호</p>
            <p className="text-lg font-black text-gray-900 tracking-tight">{orderNumber}</p>
          </div>
        )}

        {isLoading && orderNumber && <p className="text-sm font-bold text-gray-400 mb-4">주문 상태를 불러오는 중…</p>}
        {!isLoading && orderNumber && order && (
          <div className="space-y-2 mb-8 text-left">
            <div className="flex justify-between items-center gap-3">
              <span className="text-sm text-gray-500">결제 상태</span>
              <span className="text-sm font-bold text-gray-900">{order.payment_status}</span>
            </div>
            {order.paid_at && (
              <div className="flex justify-between items-center gap-3">
                <span className="text-sm text-gray-500">결제 일시</span>
                <span className="text-sm font-bold text-gray-900">{formatDateTime(order.paid_at)}</span>
              </div>
            )}
          </div>
        )}

        {!isLoading && orderNumber && !order && (
          <p className="text-sm font-bold text-red-600 mb-6">주문 정보를 찾을 수 없습니다.</p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => onNavigateToPage('mypage')}
            className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all"
          >
            주문 내역 보기
          </button>
          <button
            onClick={() => onNavigateToPage('home')}
            className="w-full py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50"
          >
            쇼핑 계속하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCompletePage;
