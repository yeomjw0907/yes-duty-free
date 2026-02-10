
import React from 'react';
import { Product } from '../types';

export interface WishlistProps {
  isInWishlist: boolean;
  onToggle: (e: React.MouseEvent) => void;
  isToggling?: boolean;
}

interface ProductCardProps {
  product: Product;
  wishlist?: WishlistProps;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, wishlist }) => {
  return (
    <div className="flex flex-col gap-4 group cursor-pointer bg-white p-2 rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-50">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {!product.isUnlimitedStock && (product.stockQuantity ?? 0) <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-gray-900 text-white text-sm font-black px-4 py-2 rounded-lg">품절</span>
          </div>
        )}
        {product.discount > 20 && (product.stockQuantity ?? 0) > 0 && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-lg shadow-red-500/20">
            HOT DEAL
          </div>
        )}
        {wishlist && (
          <button
            type="button"
            aria-label={wishlist.isInWishlist ? '찜 해제' : '찜하기'}
            onClick={(e) => { e.stopPropagation(); wishlist.onToggle(e); }}
            disabled={wishlist.isToggling}
            className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {wishlist.isToggling ? (
              <span className="w-5 h-5 block rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill={wishlist.isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        )}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-red-600 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5 px-2 pb-2">
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">{product.brand}</p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            <span className="text-[10px] text-gray-500 font-bold">
              {!product.isUnlimitedStock && (product.stockQuantity ?? 0) <= 0
                ? '품절'
                : product.isUnlimitedStock
                  ? `${product.soldCount.toLocaleString()}건+`
                  : `재고 ${(product.stockQuantity ?? 0)}개`}
            </span>
          </div>
        </div>
        <h3 className="text-[15px] font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-red-600 font-black text-xl">{product.discount}%</span>
          <span className="text-gray-900 font-black text-xl">{(product.price).toLocaleString()}원</span>
          <span className="text-gray-300 line-through text-xs font-medium">{(product.originalPrice).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
