import React, { useState } from 'react';
import { Product } from '../types';
import { useProduct } from '../lib/hooks/useProducts';
import { useAuth } from '../lib/hooks/useAuth';
import { useWishlist, useWishlistCheck, useToggleWishlist } from '../lib/hooks/useWishlist';
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
  const [activeTab, setActiveTab] = useState('상품설명');
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [confirmWishlistRemove, setConfirmWishlistRemove] = useState<Product | null>(null);

  const { user } = useAuth();
  const { product: fullProduct, isLoading: productLoading } = useProduct(product.id);
  const displayProduct = fullProduct ?? product;
  const { isInWishlist } = useWishlistCheck(user?.id, displayProduct.id);
  const { toggle: toggleWishlist, isToggling: wishlistToggling } = useToggleWishlist(user?.id);
  const { wishlist } = useWishlist(user?.id);
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
           {['상품설명', '리뷰 (142)', '배송/교환/반품', '커뮤니티'].map(tab => (
             <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-red-600 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

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
