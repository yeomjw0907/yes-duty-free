import React, { useState } from 'react';
import { Product } from '../types';
import { useProduct } from '../lib/hooks/useProducts';
import { useAuth } from '../lib/hooks/useAuth';
import { useWishlist, useWishlistCheck, useToggleWishlist } from '../lib/hooks/useWishlist';
import { useReviews, useMyReview, useCreateReview } from '../lib/hooks/useReviews';
import ProductCard from './ProductCard';
import ConfirmModal from './ConfirmModal';

interface ProductDetailProps {
  product: Product;
  products: Product[];
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, options?: Record<string, string>) => void;
  onImmediatePurchase: (product: Product, quantity: number, options?: Record<string, string>) => void;
  onProductClick?: (product: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, products, onBack, onAddToCart, onImmediatePurchase, onProductClick }) => {
  const [activeTab, setActiveTab] = useState<'상품설명' | '리뷰' | '배송/교환/반품' | '커뮤니티'>('상품설명');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [confirmWishlistRemove, setConfirmWishlistRemove] = useState<Product | null>(null);

  const { user } = useAuth();
  const { product: fullProduct, isLoading: productLoading } = useProduct(product.id);
  const displayProduct = fullProduct ?? product;
  const { isInWishlist } = useWishlistCheck(user?.id, displayProduct.id);
  const { toggle: toggleWishlist, isToggling: wishlistToggling } = useToggleWishlist(user?.id);
  const { wishlist } = useWishlist(user?.id);
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(displayProduct.id);
  const { myReview, loading: myReviewLoading } = useMyReview(displayProduct.id, user?.id ?? null);
  const { submit: submitReview, submitting: reviewSubmitting, error: reviewError } = useCreateReview(
    displayProduct.id,
    user?.id ?? null,
    refetchReviews
  );
  const getWishlistProps = (p: Product) => ({
    isInWishlist: wishlist.some((w) => w.id === p.id),
    onToggle: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (wishlist.some((w) => w.id === p.id)) setConfirmWishlistRemove(p);
      else toggleWishlist(p.id);
    },
    isToggling: wishlistToggling,
  });

  const handleConfirmWishlistRemove = async () => {
    if (!confirmWishlistRemove) return;
    await toggleWishlist(confirmWishlistRemove.id);
    setConfirmWishlistRemove(null);
  };

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  };

  const relatedProducts = products.filter(p => p.category === displayProduct.category && p.id !== displayProduct.id).slice(0, 4);
  const bestProducts = products.slice(0, 4);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-7 space-y-4">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            <img src={displayProduct.imageUrl} className="w-full h-full object-cover" alt={displayProduct.name} />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-lg bg-gray-100 overflow-hidden cursor-pointer hover:ring-2 ring-red-500 transition-all">
                <img src={`https://picsum.photos/seed/${displayProduct.id + i}/200/200`} className="w-full h-full object-cover" alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest">
            <span>{displayProduct.brand}</span>
            <span className="text-gray-200">|</span>
            <span className="text-gray-400">{displayProduct.category}</span>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight flex-1">
              {displayProduct.name}
            </h1>
            {user ? (
              <button
                type="button"
                aria-label={isInWishlist ? '찜 해제' : '찜하기'}
                onClick={() => (isInWishlist ? setConfirmWishlistRemove(displayProduct) : toggleWishlist(displayProduct.id))}
                disabled={wishlistToggling}
                className={`shrink-0 p-2.5 rounded-full border-2 transition-colors ${isInWishlist ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600 hover:bg-red-50'} disabled:opacity-50`}
              >
                {wishlistToggling ? (
                  <span className="w-6 h-6 block rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                ) : (
                  <svg className="w-6 h-6" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-1 py-4 border-y border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-red-600">{displayProduct.discount}%</span>
              <span className="text-3xl font-bold text-gray-900">{displayProduct.price.toLocaleString()}원</span>
              <span className="text-gray-400 line-through text-sm ml-2">{displayProduct.originalPrice.toLocaleString()}원</span>
            </div>
            <p className="text-xs text-blue-500 font-bold mt-1">
               면세 혜택가 적용 완료 (해외배송 전용)
            </p>
          </div>

          {/* Options Selection */}
          {displayProduct.options && displayProduct.options.map((opt) => (
            <div key={opt.name} className="space-y-2">
              <label className="text-sm font-black text-gray-900">{opt.name}</label>
              <div className="grid grid-cols-2 gap-2">
                {opt.values.map(val => (
                  <button
                    key={val}
                    onClick={() => handleOptionChange(opt.name, val)}
                    className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${selectedOptions[opt.name] === val ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">수량 선택</span>
                <div className="flex border border-gray-300 bg-white rounded-lg items-center overflow-hidden">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="px-3 py-1 text-gray-600 font-bold border-r border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-6 py-1 text-base font-extrabold text-gray-900 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="px-3 py-1 text-gray-600 font-bold border-l border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
             </div>
             <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">총 결제 금액</span>
                <span className="text-xl font-bold text-red-600">{(displayProduct.price * quantity).toLocaleString()}원</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onAddToCart(displayProduct, quantity, selectedOptions)}
              className="flex-grow py-4 rounded-xl border-2 border-red-500 text-red-500 font-bold hover:bg-red-50 transition-colors"
            >
              장바구니 담기
            </button>
            <button 
              onClick={() => onImmediatePurchase(displayProduct, quantity, selectedOptions)}
              className="flex-grow py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
            >
              즉시 구매하기
            </button>
          </div>
        </div>
      </div>

      <div className="border-y sticky top-16 bg-white z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-10">
           {[
             { id: '상품설명' as const, label: '상품설명' },
             { id: '리뷰' as const, label: `리뷰 (${reviews.length})` },
             { id: '배송/교환/반품' as const, label: '배송/교환/반품' },
             { id: '커뮤니티' as const, label: '커뮤니티' },
           ].map(({ id, label }) => (
             <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-4 text-sm font-bold border-b-2 transition-all ${activeTab === id ? 'border-red-600 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
             >
               {label}
             </button>
           ))}
        </div>
      </div>

      {activeTab === '상품설명' && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="space-y-12">
            <div className="text-center space-y-6">
               <h2 className="text-3xl font-bold text-gray-900">당신의 피부를 위한 최고의 선택</h2>
               <p className="text-lg text-gray-600 leading-relaxed">
                 전세계 면세점에서 가장 사랑받는 {displayProduct.brand}의 시그니처 아이템입니다.<br/>
                 현지 매장과 동일한 품질을 면세 가격 그대로 만나보세요.
               </p>
               <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl">
                  <img src={`https://picsum.photos/seed/${displayProduct.id}detail/800/1000`} className="w-full h-full object-cover" alt="" />
               </div>
            </div>
            <div className="text-center py-10">
               <button className="w-full py-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">스토리 더보기 ⌵</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === '리뷰' && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="space-y-10">
            {user && !myReview && !myReviewLoading && (
              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">리뷰 작성</h3>
                <div>
                  <span className="text-sm font-bold text-gray-700 block mb-2">평점</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                        className={`p-1 ${reviewForm.rating >= star ? 'text-amber-400' : 'text-gray-300'}`}
                        aria-label={`${star}점`}
                      >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">제목 (선택)</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="한 줄 요약"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2">내용 *</label>
                  <textarea
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="상품 사용 후기를 남겨주세요."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-900 resize-none"
                  />
                </div>
                {reviewError && <p className="text-sm text-red-600">{reviewError.message}</p>}
                <button
                  type="button"
                  disabled={!reviewForm.content.trim() || reviewSubmitting}
                  onClick={() => submitReview({ rating: reviewForm.rating, title: reviewForm.title || undefined, content: reviewForm.content.trim() })}
                  className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {reviewSubmitting ? '등록 중…' : '리뷰 등록'}
                </button>
              </div>
            )}
            {!user && (
              <p className="text-gray-500 py-4">로그인 후 리뷰를 작성할 수 있습니다.</p>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">전체 리뷰</h3>
              {reviewsLoading ? (
                <p className="text-gray-400 py-8">리뷰를 불러오는 중…</p>
              ) : reviews.length === 0 ? (
                <p className="text-gray-400 py-8">아직 리뷰가 없습니다.</p>
              ) : (
                <ul className="space-y-6">
                  {reviews.map((r) => (
                    <li key={r.id} className="border-b border-gray-100 pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <svg key={i} className="w-4 h-4" fill={i <= r.rating ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20"><path strokeWidth={1.5} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </span>
                        <span className="text-sm font-bold text-gray-700">{r.user_name ?? '회원'}</span>
                        {r.is_verified_purchase && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">구매확정</span>}
                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      {r.title && <p className="font-bold text-gray-900 mb-1">{r.title}</p>}
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{r.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {(activeTab === '배송/교환/반품' || activeTab === '커뮤니티') && (
        <div className="max-w-4xl mx-auto px-4 py-16 text-gray-500">
          {activeTab === '배송/교환/반품' && <p>배송·교환·반품 안내가 곧 제공됩니다.</p>}
          {activeTab === '커뮤니티' && <p>커뮤니티는 준비 중입니다.</p>}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-20 border-t border-gray-100 space-y-20">
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">같이 보면 좋은 상품</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.length > 0 ? relatedProducts.map((p, idx) => (
              <div key={`related-${p.id}`} onClick={() => onProductClick?.(p)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onProductClick?.(p)}>
                <ProductCard product={p} wishlist={user ? getWishlistProps(p) : undefined} />
              </div>
            )) : <p className="text-gray-300">추천 상품이 없습니다.</p>}
          </div>
        </section>
      </div>

      <ConfirmModal
        open={!!confirmWishlistRemove}
        title="찜 해제"
        message="정말 삭제하시겠습니까?"
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleConfirmWishlistRemove}
        onCancel={() => setConfirmWishlistRemove(null)}
        loading={wishlistToggling}
      />
    </div>
  );
};

export default ProductDetail;
