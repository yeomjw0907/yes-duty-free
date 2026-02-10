
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

/** 쿠폰 마스터 (DB coupons) */
export interface CouponRow {
  id: string;
  code: string;
  title: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  valid_until: string;
}

/** 사용자 보유 쿠폰 (user_coupons + coupon 정보) */
export interface UserCouponWithDetail {
  id: string;
  user_id: string;
  coupon_id: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  coupon: CouponRow;
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

/** 상품 리뷰 */
export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  content: string;
  image_urls?: string[];
  helpful_count: number;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at?: string;
  user_name?: string;
}

/** 해외 배송지 (Address Line 1 = 거리·건물, Line 2 = 호실·층·Apt - 국내 기본/상세 주소와 유사) */
export interface ShippingAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  country: string;
  postal_code?: string;
  state_province?: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  is_default: boolean;
  delivery_memo?: string;
  created_at?: string;
  updated_at?: string;
}
