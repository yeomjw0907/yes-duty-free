
import React, { useState } from 'react';
import { Order } from '../types';

const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [activeStatusFilter, setActiveStatusFilter] = useState('전체');

  const menuItems = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'orders', label: '주문/해외배송 관리' },
    { id: 'products', label: '면세상품 관리' },
    { id: 'notices', label: '공지/이벤트 관리' },
    { id: 'insights', label: '인사이트 관리' },
    { id: 'coupons', label: '글로벌 쿠폰 관리' },
  ];

  const orderStatuses = ['전체', '결제대기', '상품준비중', '현지집하완료', '해외배송중', '통관진행중', '배송완료', '취소/반품'];

  const mockOrders: Order[] = [
    {
      id: 'YES-20250612-9981',
      date: '2025-06-12 14:22',
      status: '해외배송중',
      customerName: 'Jungho Lee (회원)',
      customerPhone: '+1 213-445-XXXX',
      address: '1234 Wilshire Blvd, Los Angeles, CA 90017, USA',
      items: [{ id: '1', name: '갈색병 어드밴스드 나이트 리페어 100ml Duo', brand: '에스티로더', price: 215000, quantity: 1, selectedOption: '100ml x 2 세트' } as any],
      totalAmount: 225000,
      paymentMethod: 'VISA (**** 4242)',
      memo: 'Fragile. Gate Code: #1234'
    },
    {
      id: 'YES-20250611-3321',
      date: '2025-06-11 09:15',
      status: '현지집하완료',
      customerName: 'Yuki Tanaka (회원)',
      customerPhone: '+81 90-1234-XXXX',
      address: '2-chrome-1, Shinjuku, Tokyo, Japan',
      items: [{ id: '2', name: '에어팟 프로 2세대 USB-C 글로벌 에디션', brand: 'Apple', price: 289000, quantity: 1, selectedOption: '기본형' } as any],
      totalAmount: 301000,
      paymentMethod: 'PayPal',
      memo: 'Please wrap with extra bubble wrap.'
    }
  ];

  const renderOrders = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {orderStatuses.map(status => (
            <button 
              key={status}
              onClick={() => setActiveStatusFilter(status)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black transition-all ${activeStatusFilter === status ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {status} {status === '전체' && <span className="ml-1 opacity-50">1,240</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
           <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50">
             EMS/DHL 송장 일괄등록
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">
             해외배송 목록 엑셀
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-2">주문/계정 정보</div>
          <div className="col-span-4 text-center">면세 품목 · 수량</div>
          <div className="col-span-2 text-center">글로벌 물류 정보</div>
          <div className="col-span-2 text-center">결제/세관 정보</div>
          <div className="col-span-2 text-center">해외 배송지 · 메모</div>
        </div>

        {mockOrders.map(order => (
          <div key={order.id} className="grid grid-cols-12 p-6 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
            <div className="col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                <span className="font-black text-sm tracking-tighter text-gray-900">{order.id}</span>
              </div>
              <p className="text-[11px] text-gray-400 font-bold">{order.date}</p>
              <div className="mt-4">
                <p className="font-black text-xs text-gray-700">{order.customerName}</p>
                <p className="text-[11px] text-gray-500 font-medium">{order.customerPhone}</p>
              </div>
            </div>

            <div className="col-span-4 border-x border-gray-100 px-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                    <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow space-y-1">
                    <span className="inline-block px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded mb-1">{order.status}</span>
                    <p className="text-xs font-black text-gray-800 leading-tight">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{item.selectedOption}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-xs text-gray-900">{(item.price).toLocaleString()}원</p>
                    <p className="text-[11px] text-gray-400 font-bold">× {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="col-span-2 px-6 space-y-3">
               <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Courier</label>
               <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-black focus:border-red-500 outline-none">
                 <option>DHL Express</option>
                 <option>EMS Premium</option>
                 <option>FedEx Priority</option>
                 <option>UPS Worldwide</option>
               </select>
               <input 
                 type="text" 
                 placeholder="Waybill No." 
                 className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-red-500" 
               />
               <button className="w-full bg-gray-900 text-white py-1.5 rounded-lg text-[10px] font-black hover:bg-red-600 transition-colors uppercase tracking-widest">Update Logistics</button>
            </div>

            <div className="col-span-2 border-x border-gray-100 px-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-red-500 uppercase">Gross Total</span>
                <span className="text-sm font-black text-red-600">{(order.totalAmount).toLocaleString()}원</span>
              </div>
              <div className="space-y-1 text-[10px] text-gray-500 font-bold">
                <div className="flex justify-between"><span>Duty-Free</span><span>{(order.totalAmount - 15000).toLocaleString()}원</span></div>
                <div className="flex justify-between"><span>Intl. Logis.</span><span>15,000원</span></div>
                <div className="flex justify-between text-blue-600"><span>Paid via</span><span>{order.paymentMethod}</span></div>
              </div>
              <div className="mt-4 space-y-2">
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-[10px] font-black hover:bg-blue-700 tracking-wider">관세 서류 확인</button>
                <button className="w-full border border-gray-200 py-2 rounded-lg text-[10px] font-black text-gray-400 hover:bg-gray-50 tracking-wider">INVOICE 발급</button>
              </div>
            </div>

            <div className="col-span-2 px-6">
               <p className="font-black text-xs mb-1 text-gray-900">{order.customerName}</p>
               <p className="text-[10px] text-gray-500 leading-relaxed mb-4 italic font-medium">{order.address}</p>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-wider italic">Special Request</p>
                  <p className="text-[11px] font-bold text-gray-700 leading-tight">{order.memo}</p>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-[#f8f9fa] flex overflow-hidden font-sans">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-8 flex flex-col items-center gap-2 mb-8">
           <div className="w-14 h-14 bg-[#E52D27] rounded-3xl flex items-center justify-center font-black text-white text-2xl shadow-2xl shadow-red-500/30">Y</div>
           <span className="font-black tracking-tighter text-gray-900 text-xl mt-2 uppercase">Yes Duty Admin</span>
        </div>
        <nav className="flex-grow px-4 space-y-1">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] px-4 mb-4">Operations</p>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-4 rounded-2xl text-[13px] font-black transition-all ${
                activeTab === item.id ? 'bg-gray-900 text-white shadow-2xl translate-x-1' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6">
          <button onClick={onClose} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl text-[13px] hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/10">
            LOGOUT SYSTEM
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-8 bg-red-600 rounded-full"></div>
             <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
               {menuItems.find(i => i.id === activeTab)?.label}
             </h2>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex flex-col text-right">
                <span className="text-sm font-black text-gray-900 tracking-tight">System Master Agent</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">admin@onecation.co.kr</span>
             </div>
             <div className="w-12 h-12 rounded-full bg-red-50 border-2 border-white shadow-md p-0.5 overflow-hidden">
                <img src="https://i.pravatar.cc/100?u=yesduty" className="w-full h-full object-cover rounded-full" />
             </div>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-10 bg-[#fcfcfc]">
          {activeTab === 'orders' ? renderOrders() : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 animate-in fade-in zoom-in duration-500">
               <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
               </div>
               <p className="text-xl font-black italic tracking-tighter text-gray-400">Under Construction</p>
               <p className="text-sm font-bold mt-2 text-gray-400">이 모듈은 핵심 기능을 우선으로 순차 업데이트 중입니다.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
