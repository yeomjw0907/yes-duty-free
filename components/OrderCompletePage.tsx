import React from 'react';

interface OrderCompletePageProps {
  orderNumber: string | null;
  onNavigateToPage: (page: string) => void;
}

const OrderCompletePage: React.FC<OrderCompletePageProps> = ({ orderNumber, onNavigateToPage }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
      <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center text-4xl">✓</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">주문이 완료되었습니다</h2>
        <p className="text-gray-500 text-sm mb-6">
          주문해 주셔서 감사합니다. 배송이 시작되면 알려드리겠습니다.
        </p>
        {orderNumber && (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-bold text-gray-500 mb-1">주문번호</p>
            <p className="text-lg font-black text-gray-900 tracking-tight">{orderNumber}</p>
          </div>
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
