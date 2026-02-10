import React, { useState, useEffect, useCallback } from 'react';
import type { OrderWithItems } from '../lib/api/orders';
import {
  getAdminOrders,
  updateOrderByAdmin,
  ORDER_STATUSES,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  updateAdminProductStock,
  type AdminProductRow,
  type AdminProductCreate,
} from '../lib/api/admin';
import { getCategories } from '../lib/api/categories';
import type { CategoryRow } from '../lib/api/categories';

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

  // 면세상품 관리
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryId, setProductCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [productModal, setProductModal] = useState<'add' | { type: 'edit'; product: AdminProductRow } | null>(null);
  const [productForm, setProductForm] = useState<AdminProductCreate & { id?: string }>({
    name: '',
    brand: '',
    price: 0,
    original_price: 0,
    image_url: '',
    category_id: null,
    stock_quantity: 0,
    is_active: true,
  });
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [stockEdit, setStockEdit] = useState<Record<string, number>>({});

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

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const list = await getAdminProducts({
        categoryId: productCategoryId || undefined,
        search: productSearch.trim() || undefined,
      });
      setProducts(list);
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [productCategoryId, productSearch]);

  const fetchCategories = useCallback(async () => {
    try {
      const list = await getCategories();
      setCategories(list);
    } catch (e) {
      console.error(e);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchCategories();
    }
  }, [activeTab, fetchProducts, fetchCategories]);

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

  const openAddProduct = () => {
    setProductForm({
      name: '',
      brand: '',
      price: 0,
      original_price: 0,
      image_url: '',
      category_id: null,
      stock_quantity: 0,
      is_active: true,
    });
    setProductModal('add');
  };

  const openEditProduct = (product: AdminProductRow) => {
    setProductForm({
      name: product.name,
      brand: product.brand,
      price: product.price,
      original_price: product.original_price,
      image_url: product.image_url,
      category_id: product.category_id ?? null,
      sub_category: product.sub_category ?? null,
      tags: product.tags ?? [],
      stock_quantity: product.stock_quantity,
      is_active: product.is_active,
      id: product.id,
    });
    setProductModal({ type: 'edit', product });
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !productForm.brand.trim() || productForm.price < 0) return;
    const id = productForm.id;
    setSavingProductId(id ?? 'new');
    try {
      if (productModal === 'add') {
        await createAdminProduct({
          name: productForm.name.trim(),
          brand: productForm.brand.trim(),
          price: productForm.price,
          original_price: productForm.original_price ?? productForm.price,
          image_url: productForm.image_url.trim() || 'https://placehold.co/400x400?text=No+Image',
          category_id: productForm.category_id || null,
          sub_category: productForm.sub_category || null,
          tags: productForm.tags,
          stock_quantity: productForm.stock_quantity ?? 0,
          is_active: productForm.is_active ?? true,
        });
      } else if (productModal?.type === 'edit' && id) {
        await updateAdminProduct(id, {
          name: productForm.name.trim(),
          brand: productForm.brand.trim(),
          price: productForm.price,
          original_price: productForm.original_price ?? productForm.price,
          image_url: productForm.image_url.trim() || 'https://placehold.co/400x400?text=No+Image',
          category_id: productForm.category_id || null,
          sub_category: productForm.sub_category || null,
          tags: productForm.tags,
          stock_quantity: productForm.stock_quantity,
          is_active: productForm.is_active,
        });
      }
      setProductModal(null);
      await fetchProducts();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProductId(null);
    }
  };

  const handleSaveStock = async (product: AdminProductRow) => {
    const value = stockEdit[product.id];
    if (value === undefined) return;
    setSavingProductId(product.id);
    try {
      await updateAdminProductStock(product.id, value);
      setStockEdit((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      await fetchProducts();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProductId(null);
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

  const renderProducts = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="상품명·브랜드 검색"
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 w-56"
          />
          <select
            value={productCategoryId}
            onChange={(e) => setProductCategoryId(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">전체 카테고리</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchProducts}
            className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-black hover:bg-red-600 transition-colors"
          >
            검색
          </button>
        </div>
        <button
          type="button"
          onClick={openAddProduct}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-black hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
        >
          + 상품 등록
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-[11px] font-black text-gray-400 p-4 uppercase tracking-wider">
          <div className="col-span-1">이미지</div>
          <div className="col-span-2">상품명 · 브랜드</div>
          <div className="col-span-1 text-center">카테고리</div>
          <div className="col-span-2 text-right">가격 · 할인</div>
          <div className="col-span-1 text-center">재고</div>
          <div className="col-span-1 text-center">판매</div>
          <div className="col-span-1 text-center">노출</div>
          <div className="col-span-3 text-center">관리</div>
        </div>

        {productsLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold">상품 목록 불러오는 중…</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold">등록된 상품이 없거나 검색 결과가 없습니다.</div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="grid grid-cols-12 p-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors items-center">
              <div className="col-span-1">
                <img src={p.image_url || 'https://placehold.co/80x80?text=No'} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100" />
              </div>
              <div className="col-span-2 min-w-0">
                <p className="text-sm font-black text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-500 font-bold">{p.brand}</p>
              </div>
              <div className="col-span-1 text-center text-xs font-bold text-gray-600">{p.categories?.name ?? '-'}</div>
              <div className="col-span-2 text-right">
                <p className="text-sm font-black text-gray-900">{p.price.toLocaleString()}원</p>
                {p.discount != null && p.discount > 0 && (
                  <p className="text-[10px] text-red-500 font-bold">{p.discount}% 할인</p>
                )}
              </div>
              <div className="col-span-1 flex items-center justify-center gap-1 flex-wrap">
                {stockEdit[p.id] !== undefined ? (
                  <>
                    <input
                      type="number"
                      min={0}
                      value={stockEdit[p.id]}
                      onChange={(e) => setStockEdit((prev) => ({ ...prev, [p.id]: parseInt(e.target.value, 10) || 0 }))}
                      className="w-14 bg-white border border-gray-200 rounded px-2 py-1 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveStock(p)}
                      disabled={savingProductId === p.id}
                      className="text-[10px] font-black text-red-600 hover:underline disabled:opacity-50"
                    >
                      {savingProductId === p.id ? '…' : '저장'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockEdit((prev) => { const n = { ...prev }; delete n[p.id]; return n; })}
                      className="text-[10px] font-black text-gray-400 hover:underline"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold text-gray-700">{p.stock_quantity}</span>
                    <button
                      type="button"
                      onClick={() => setStockEdit((prev) => ({ ...prev, [p.id]: p.stock_quantity }))}
                      className="text-[10px] font-black text-gray-400 hover:text-red-600"
                    >
                      수정
                    </button>
                  </>
                )}
              </div>
              <div className="col-span-1 text-center text-sm font-bold text-gray-600">{p.sold_count}</div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-black ${p.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  {p.is_active ? '노출' : '비노출'}
                </span>
              </div>
              <div className="col-span-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditProduct(p)}
                  className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-red-600"
                >
                  수정
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {productModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setProductModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 mb-4">
              {productModal === 'add' ? '상품 등록' : '상품 수정'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">상품명</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">브랜드</label>
                <input
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, brand: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">판매가(원)</label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, price: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">정가(원)</label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.original_price ?? productForm.price ?? ''}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, original_price: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">이미지 URL</label>
                <input
                  type="text"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">카테고리</label>
                <select
                  value={productForm.category_id ?? ''}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, category_id: e.target.value || null }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                >
                  <option value="">선택 안 함</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">재고</label>
                <input
                  type="number"
                  min={0}
                  value={productForm.stock_quantity ?? 0}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, stock_quantity: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="product-is-active"
                  checked={productForm.is_active ?? true}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="product-is-active" className="text-sm font-bold text-gray-700">노출 (사이트에 표시)</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={savingProductId !== null}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-black hover:bg-red-600 disabled:opacity-50"
              >
                {savingProductId ? '저장 중…' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => setProductModal(null)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
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
          {activeTab === 'orders' ? renderOrders() : activeTab === 'products' ? renderProducts() : (
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
