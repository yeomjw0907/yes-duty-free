
export enum Category {
  BEAUTY = '뷰티',
  FASHION = '패션',
  FOOD = '식품',
  ELECTRONICS = '전자',
  LUXURY = '럭셔리',
  TECH = '테크·가전',
  LIVING = '홈·리빙',
  SPORTS = '스포츠',
  BOOKS = '도서'
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  category: Category | string;
  subCategory?: string;
  tags: string[];
  discount: number;
  soldCount: number;
  options?: ProductOption[];
}

export interface CartItem extends Product {
  selectedOption?: string;
  quantity: number;
}

export interface Coupon {
  id: string;
  title: string;
  discountValue: number;
  isPercent: boolean;
  minOrderAmount: number;
  expiryDate: string;
  claimed?: boolean;
}

export interface Order {
  id: string;
  date: string;
  // Updated status to include international logistics steps
  status: '결제대기' | '상품준비중' | '배송대기' | '배송중' | '배송완료' | '취소접수' | '반품접수' | '해외배송중' | '현지집하완료' | '통관진행중';
  customerName: string;
  customerPhone: string;
  address: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  trackingNumber?: string;
  memo?: string;
}

export interface LiveStream {
  id: string;
  title: string;
  thumbnail: string;
  viewerCount: number;
  isLive: boolean;
  startTime?: string;
}
