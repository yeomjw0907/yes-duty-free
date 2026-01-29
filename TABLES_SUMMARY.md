# 📊 Yes Duty Free - 테이블 요약표

## 핵심 테이블 구조 (20개)

| # | 테이블명 | 한글명 | 주요 컬럼 | 설명 | 우선순위 |
|---|---------|--------|----------|------|---------|
| 1 | **users** | 사용자 | email, name, phone, membership_tier, points | 회원 정보 및 등급, 포인트 관리 | 🔴 필수 |
| 2 | **categories** | 카테고리 | name, parent_id, icon, display_order | 상품 카테고리 (뷰티, 패션, 식품 등) | 🔴 필수 |
| 3 | **products** | 상품 | name, brand, price, original_price, category_id, stock_quantity | 면세 상품 정보 | 🔴 필수 |
| 4 | **product_options** | 상품옵션 | product_id, option_name, option_value, price_difference | 용량/사이즈/컬러 등 옵션 | 🟡 중요 |
| 5 | **shipping_addresses** | 배송지 | user_id, recipient_name, country, address, is_default | 해외 배송지 관리 | 🔴 필수 |
| 6 | **carts** | 장바구니 | user_id | 사용자별 장바구니 | 🔴 필수 |
| 7 | **cart_items** | 장바구니아이템 | cart_id, product_id, quantity, selected_options | 장바구니에 담긴 상품들 | 🔴 필수 |
| 8 | **orders** | 주문 | order_number, user_id, status, total_amount, tracking_number | 주문 정보 및 배송 현황 | 🔴 필수 |
| 9 | **order_items** | 주문아이템 | order_id, product_id, price, quantity, selected_options | 주문 상품 상세 (스냅샷) | 🔴 필수 |
| 10 | **coupons** | 쿠폰 | code, title, discount_type, discount_value, valid_until | 할인 쿠폰 정보 | 🟡 중요 |
| 11 | **user_coupons** | 사용자쿠폰 | user_id, coupon_id, is_used, used_at | 쿠폰 발급/사용 내역 | 🟡 중요 |
| 12 | **live_streams** | 라이브방송 | title, thumbnail_url, status, viewer_count, stream_url | 라이브 쇼핑 방송 | 🟡 중요 |
| 13 | **reviews** | 리뷰 | product_id, user_id, rating, content, image_urls | 상품 리뷰 및 평점 | 🟠 추가 |
| 14 | **wishlists** | 찜목록 | user_id, product_id | 위시리스트/찜하기 | 🟠 추가 |
| 15 | **banners** | 배너 | title, image_url, link_url, position, display_order | 메인/서브 배너 관리 | 🟠 추가 |
| 16 | **notifications** | 알림 | user_id, type, title, message, is_read | 주문/배송 알림 | 🟠 추가 |
| 17 | **events** | 이벤트/공지 | title, content, type, starts_at, ends_at | 이벤트 및 공지사항 | 🟠 추가 |
| 18 | **search_keywords** | 검색키워드 | keyword, search_count | 인기 검색어 추적 | ⚪ 선택 |
| 19 | **exchange_rates** | 환율 | currency_code, rate, valid_from | 해외 배송용 환율 정보 | ⚪ 선택 |
| 20 | **admin_users** | 관리자 | email, password_hash, role, permissions | 관리자 계정 및 권한 | 🟡 중요 |

---

## 주요 관계도

```
users (회원)
├── shipping_addresses (배송지) - 1:N
├── carts (장바구니) - 1:1
├── orders (주문) - 1:N
├── user_coupons (보유 쿠폰) - 1:N
├── reviews (작성 리뷰) - 1:N
├── wishlists (찜 목록) - 1:N
└── notifications (알림) - 1:N

products (상품)
├── product_options (옵션) - 1:N
├── cart_items (장바구니에 담김) - 1:N
├── order_items (주문됨) - 1:N
├── reviews (리뷰) - 1:N
└── wishlists (찜됨) - 1:N

categories (카테고리)
└── products (상품) - 1:N

orders (주문)
├── order_items (주문 상품) - 1:N
└── user_coupons (사용된 쿠폰) - 1:1

coupons (쿠폰)
└── user_coupons (발급된 쿠폰) - 1:N

live_streams (라이브)
└── featured_product_ids (판매 상품) - 배열 참조
```

---

## 현재 코드와 매핑

### ✅ 이미 타입 정의됨 (types.ts)
- `Product` → **products** 테이블
- `CartItem` → **cart_items** 테이블
- `Order` → **orders** 테이블
- `Coupon` → **coupons** 테이블
- `LiveStream` → **live_streams** 테이블
- `Category` → **categories** 테이블

### 🆕 추가 필요한 타입
```typescript
// types.ts에 추가할 타입들

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profile_image_url?: string;
  membership_tier: 'basic' | 'premium' | 'vip';
  points: number;
  created_at: string;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  country: string;
  postal_code?: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  is_default: boolean;
  delivery_memo?: string;
}

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
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  link_url?: string;
  tag_text?: string;
  position: 'main' | 'sub' | 'popup';
  is_active: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'order' | 'shipping' | 'coupon' | 'promotion';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
```

---

## 구현 우선순위

### Phase 1 - MVP (최소 기능 제품) 🔴
1. **users** - 회원가입/로그인
2. **products** - 상품 목록/상세
3. **categories** - 카테고리 필터
4. **carts** + **cart_items** - 장바구니
5. **shipping_addresses** - 배송지 관리
6. **orders** + **order_items** - 주문/결제

### Phase 2 - 핵심 기능 🟡
7. **product_options** - 상품 옵션 선택
8. **coupons** + **user_coupons** - 쿠폰 시스템
9. **live_streams** - 라이브 방송
10. **admin_users** - 관리자 시스템

### Phase 3 - 부가 기능 🟠
11. **reviews** - 리뷰 시스템
12. **wishlists** - 찜하기
13. **banners** - 배너 관리
14. **notifications** - 알림
15. **events** - 이벤트/공지

### Phase 4 - 고급 기능 ⚪
16. **search_keywords** - 검색 분석
17. **exchange_rates** - 환율 관리

---

## 예상 데이터 크기

| 테이블 | 예상 레코드 수 | 성장률 |
|--------|--------------|--------|
| users | 10,000 ~ 100,000 | 중간 |
| products | 1,000 ~ 10,000 | 낮음 |
| orders | 10,000 ~ 500,000 | 높음 |
| order_items | 50,000 ~ 2,000,000 | 높음 |
| reviews | 5,000 ~ 100,000 | 중간 |
| cart_items | 5,000 ~ 50,000 | 중간 |
| notifications | 50,000 ~ 1,000,000 | 매우 높음 |

---

## 성능 최적화 체크리스트

### 인덱스 설정 ✅
- [x] users.email
- [x] products.category_id
- [x] orders.user_id, orders.status
- [x] order_items.order_id
- [x] cart_items.cart_id

### 캐싱 전략
- [ ] 상품 목록 (Redis)
- [ ] 카테고리 (In-memory)
- [ ] 인기 검색어 (Redis)

### 데이터 정리
- [ ] 오래된 장바구니 아이템 삭제 (30일 이상)
- [ ] 읽은 알림 자동 삭제 (90일 이상)
- [ ] 취소된 주문 아카이빙

---

## 다음 작업

1. ✅ **DATABASE_DESIGN.md** - 상세 테이블 설계서 작성 완료
2. ✅ **TABLES_SUMMARY.md** - 요약표 작성 완료
3. ⏭️ Supabase 프로젝트 생성
4. ⏭️ SQL 마이그레이션 파일 작성
5. ⏭️ Supabase Client 설정
6. ⏭️ 환경변수 설정 (.env.local)
7. ⏭️ API 함수 작성 (CRUD)

**준비되셨으면 바로 Supabase 연동을 시작합니다!** 🚀
