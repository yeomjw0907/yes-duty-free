import React, { useState, useEffect, useCallback } from 'react';
import type { OrderWithItems } from '../lib/api/orders';
import { getAdminOrders, updateOrderByAdmin, ORDER_STATUSES } from '../lib/api/admin';

const COURIER_OPTIONS = ['', 'CJ대한통운', '한진택배', '롯데택배', 'DHL', 'FedEx', 'UPS', 'EMS'];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const orderStatusesForFilter = ['전체', '결제대기', '상품준비중', '배송대기', '배송중', '현지집하완료', '해외배송중', '통관진행중', '배송완료', '취소접수', '반품접수'];

const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [activeStatusFilter, setActiveStatusFilter] = useState('전체');
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [formByOrderId, setFormByOrderId] = useState<Record<string, { status: string; courier_company: string; tracking_number: string; admin_memo: string }>>({});

  const menuItems = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'orders', label: '주문/해외배송 관리' },
    { id: 'products', label: '면세상품 관리' },
    { id: 'notices', label: '공지/이벤트 관리' },
    { id: 'insights', label: '인사이트 관리' },
    { id: 'coupons', label: '글로벌 쿠폰 관리' },
  ];

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const list = await getAdminOrders(activeStatusFilter === '전체' ? null : activeStatusFilter);
      setOrders(list);
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [activeStatusFilter]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, fetchOrders]);

  const getForm = (order: OrderWithItems) => {
    return formByOrderId[order.id] ?? {
      status: order.status,
      courier_company: order.courier_company ?? '',
      tracking_number: order.tracking_number ?? '',
      admin_memo: order.admin_memo ?? '',
    };
  };

  const setForm = (order: OrderWithItems, patch: Partial<{ status: string; courier_company: string; tracking_number: string; admin_memo: string }>) => {
    setFormByOrderId((prev) => {
      const base = prev[order.id] ?? {
        status: order.status,
        courier_company: order.courier_company ?? '',
        tracking_number: order.tracking_number ?? '',
        admin_memo: order.admin_memo ?? '',
      };
      return { ...prev, [order.id]: { ...base, ...patch } };
    });
  };

  const handleSaveLogistics = async (order: OrderWithItems) => {
    const form = getForm(order);
    setSavingOrderId(order.id);
    try {
      await updateOrderByAdmin(order.id, {
        status: form.status,
        courier_company: form.courier_company || null,
        tracking_number: form.tracking_number.trim() || null,
        admin_memo: form.admin_memo.trim() || null,
      });
      await fetchOrders();
      setFormByOrderId((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingOrderId(null);
    }
  };

  const renderOrders = () => (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {orderStatusesForFilter.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatusFilter(status)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black transition-all ${activeStatusFilter === status ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {status}
              {status === '전체' && <span className="ml-1 opacity-50">({orders.length})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-2">주문/계정 정보</div>
          <div className="col-span-3 text-center">면세 품목 · 수량</div>
          <div className="col-span-2 text-center">물류 · 메모</div>
          <div className="col-span-2 text-center">결제 정보</div>
          <div className="col-span-3 text-center">배송지 · 메모</div>
        </div>

        {ordersLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">주문 목록 불러오는 중…</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">해당 조건의 주문이 없습니다.</div>
        ) : (
          orders.map((order) => {
            const form = getForm(order);
            const items = order.order_items ?? [];
            return (
              <div key={order.id} className="grid grid-cols-12 p-6 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <div className="col-span-2 space-y-2">
                  <span className="font-black text-sm tracking-tighter text-gray-900">{order.order_number}</span>
                  <p className="text-[11px] text-gray-400 font-bold">{formatDate(order.created_at)}</p>
                  <p className="font-black text-xs text-gray-700">{order.recipient_name}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{order.recipient_phone}</p>
                </div>

                <div className="col-span-3 border-x border-gray-100 px-4 space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-2 py-1">
                      {item.product_image_url && (
                        <img src={item.product_image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-gray-800 leading-tight line-clamp-2">{item.product_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{item.product_brand}</p>
                        <p className="text-[11px] text-gray-600">{item.quantity}개 × {item.price.toLocaleString()}원</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="col-span-2 px-4 space-y-2">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">상태</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(order, { status: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:border-red-500 outline-none"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">택배사</label>
                    <select
                      value={form.courier_company}
                      onChange={(e) => setForm(order, { courier_company: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:border-red-500 outline-none"
                    >
                      {COURIER_OPTIONS.map((c) => (
                        <option key={c || 'empty'} value={c}>{c || '-'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">송장번호</label>
                    <input
                      type="text"
                      value={form.tracking_number}
                      onChange={(e) => setForm(order, { tracking_number: e.target.value })}
                      placeholder="Waybill No."
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">관리자 메모</label>
                    <input
                      type="text"
                      value={form.admin_memo}
                      onChange={(e) => setForm(order, { admin_memo: e.target.value })}
                      placeholder="내부 메모"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveLogistics(order)}
                    disabled={savingOrderId === order.id}
                    className="w-full bg-gray-900 text-white py-1.5 rounded-lg text-[10px] font-black hover:bg-red-600 transition-colors uppercase tracking-widest disabled:opacity-50"
                  >
                    {savingOrderId === order.id ? '저장 중…' : '저장'}
                  </button>
                </div>

                <div className="col-span-2 border-x border-gray-100 px-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-red-500 uppercase">총 결제</span>
                    <span className="text-sm font-black text-red-600">{order.total_amount.toLocaleString()}원</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">상품 {order.subtotal.toLocaleString()}원</p>
                  {order.shipping_fee > 0 && <p className="text-[10px] text-gray-500 font-bold">배송비 {order.shipping_fee.toLocaleString()}원</p>}
                  <p className="text-[10px] text-blue-600 font-bold mt-1">{order.payment_method}</p>
                </div>

                <div className="col-span-3 px-4">
                  <p className="font-black text-xs text-gray-900">{order.recipient_name}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed break-words mt-0.5">{order.shipping_address}</p>
                  {order.delivery_memo && (
                    <div className="bg-gray-50 p-2 rounded-lg mt-2 border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">배송 메모</p>
                      <p className="text-[11px] font-bold text-gray-700 leading-tight">{order.delivery_memo}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
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
          {menuItems.map((item) => (
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
            <div className="w-1.5 h-8 bg-red-600 rounded-full" />
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
              {menuItems.find((i) => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-sm font-black text-gray-900 tracking-tight">System Master Agent</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-10 bg-[#fcfcfc]">
          {activeTab === 'orders' ? renderOrders() : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-xl font-black italic tracking-tighter text-gray-400">Under Construction</p>
              <p className="text-sm font-bold mt-2 text-gray-400">이 모듈은 순차 업데이트 중입니다.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
