
import React from 'react';
import { Category, Product } from './types';

export const COLORS = {
  primary: '#E52D27', 
  secondary: '#F3F4F6',
  textMain: '#1F2937',
  textSub: '#6B7280'
};

export const LOGO_SVG = (className?: string) => (
  <svg viewBox="0 0 100 100" className={className || "w-10 h-10"}>
    <rect width="100" height="100" rx="20" fill="#E52D27" />
    <text x="50" y="65" fontSize="40" fill="white" fontWeight="bold" textAnchor="middle" fontFamily="cursive">Yes</text>
  </svg>
);

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: '갈색병 어드밴스드 나이트 리페어 50ml',
    brand: '에스티로더',
    price: 125000,
    originalPrice: 155000,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
    category: '뷰티',
    subCategory: '스킨케어',
    tags: ['Best Seller', 'Duty Free Exclusive'],
    discount: 19,
    soldCount: 1250,
    options: [{ name: '용량', values: ['50ml', '75ml (+₩40,000)', '100ml (+₩80,000)'] }]
  },
  {
    id: '2',
    name: '에어팟 프로 2세대 USB-C',
    brand: 'Apple',
    price: 289000,
    originalPrice: 359000,
    imageUrl: 'https://images.unsplash.com/photo-1588423770674-f2855ee476e7?auto=format&fit=crop&q=80&w=600',
    category: '테크·가전',
    subCategory: '생활가전',
    tags: ['Hot', 'Limit 1'],
    discount: 19,
    soldCount: 850
  },
  {
    id: '3',
    name: '정관장 홍삼정 에브리타임 30포',
    brand: '정관장',
    price: 85000,
    originalPrice: 102000,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
    category: '푸드',
    subCategory: '건강식품',
    tags: ['Gift', 'Popular'],
    discount: 16,
    soldCount: 3400
  },
  {
    id: 'f1',
    name: '오버사이즈 울 캐시미어 코트',
    brand: '우영미',
    price: 890000,
    originalPrice: 1200000,
    imageUrl: 'https://images.unsplash.com/photo-1539533318447-63bc97672208?auto=format&fit=crop&q=80&w=600',
    category: '패션',
    subCategory: '의류',
    tags: ['Premium'],
    discount: 25,
    soldCount: 12,
    options: [{ name: '사이즈', values: ['46(S)', '48(M)', '50(L)', '52(XL)'] }]
  },
  {
    id: 'f2',
    name: '모노그램 자카드 셔츠',
    brand: '아미',
    price: 245000,
    originalPrice: 320000,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
    category: '패션',
    subCategory: '의류',
    tags: ['Best'],
    discount: 23,
    soldCount: 450,
    options: [{ name: '사이즈', values: ['XS', 'S', 'M', 'L'] }, { name: '컬러', values: ['화이트', '블랙', '네이비'] }]
  }
];

export const MOCK_LIVES = [
  {
    id: 'l1',
    title: '신라면세점 단독! 설화수 최대 40% 특가 LIVE',
    thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfad450526?auto=format&fit=crop&q=80&w=600',
    viewerCount: 1240,
    isLive: true
  },
  {
    id: 'l2',
    title: '나우 오너라! 면세점 위스키 오픈런 특집',
    thumbnail: 'https://images.unsplash.com/photo-1569158062127-99a7b501f641?auto=format&fit=crop&q=80&w=600',
    viewerCount: 850,
    isLive: true
  }
];
