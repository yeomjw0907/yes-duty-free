# Yes Duty Free - 데이터베이스 설계

## 📊 전체 구조 개요

현재 구현된 기능:
- ✅ 상품 카탈로그 (카테고리별)
- ✅ 상품 상세보기
- ✅ 회원가입/로그인
- ✅ 관리자 주문/배송 관리
- ✅ 라이브 방송
- ⚠️ 장바구니 (UI만, 로직 미구현)
- ⚠️ 주문/결제 (UI만, 로직 미구현)

---

## 🗃️ Supabase 테이블 설계

### 1. **users** - 사용자
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- SNS 로그인 시 NULL 가능
  name TEXT NOT NULL,
  phone TEXT,
  profile_image_url TEXT,
  
  -- 소셜 로그인 정보
  provider TEXT,  -- 'email', 'google', 'kakao', 'naver', 'line', 'facebook'
  provider_id TEXT,
  
  -- 회원 등급
  membership_tier TEXT DEFAULT 'basic',  -- 'basic', 'premium', 'vip'
  
  -- 포인트/적립금
  points INTEGER DEFAULT 0,
  
  -- 마케팅 동의
  marketing_agreed BOOLEAN DEFAULT false,
  
  -- 계정 상태
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- 이메일 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
```

---

### 2. **categories** - 카테고리
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,  -- '뷰티', '패션', '식품', etc.
  name_en TEXT,  -- 영문명
  parent_id UUID REFERENCES categories(id),  -- 하위 카테고리용
  icon TEXT,  -- 아이콘 이모지 또는 URL
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 순서 인덱스
CREATE INDEX idx_categories_order ON categories(display_order);
```

---

### 3. **products** - 상품
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  
  -- 가격 정보
  price INTEGER NOT NULL,  -- 면세가
  original_price INTEGER NOT NULL,  -- 정가
  discount INTEGER GENERATED ALWAYS AS (
    ROUND(((original_price - price)::NUMERIC / original_price * 100)::NUMERIC, 0)
  ) STORED,
  
  -- 이미지
  image_url TEXT NOT NULL,
  image_urls TEXT[],  -- 추가 이미지들
  
  -- 분류
  category_id UUID REFERENCES categories(id),
  sub_category TEXT,
  
  -- 태그
  tags TEXT[],  -- ['Best Seller', 'Hot', 'New', etc.]
  
  -- 판매 정보
  sold_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0.00,  -- 평점 (0.00 ~ 5.00)
  
  -- 재고 (추가 필요)
  stock_quantity INTEGER DEFAULT 0,
  is_unlimited_stock BOOLEAN DEFAULT false,  -- 무제한 재고 여부
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,  -- 추천 상품
  is_new BOOLEAN DEFAULT false,  -- 신상품
  
  -- 설명
  description TEXT,
  detail_html TEXT,  -- 상세 설명 HTML
  
  -- 배송
  shipping_fee INTEGER DEFAULT 0,
  estimated_delivery_days INTEGER DEFAULT 7,  -- 예상 배송일
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_sold_count ON products(sold_count DESC);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
```

---

### 4. **product_options** - 상품 옵션
```sql
CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- 옵션 정보
  option_name TEXT NOT NULL,  -- '용량', '사이즈', '컬러'
  option_value TEXT NOT NULL,  -- '50ml', 'M', '화이트'
  
  -- 가격 차이
  price_difference INTEGER DEFAULT 0,  -- 추가 금액 (+ or -)
  
  -- 재고
  stock_quantity INTEGER DEFAULT 0,
  
  -- 순서
  display_order INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(product_id, option_name, option_value)
);

CREATE INDEX idx_product_options_product ON product_options(product_id);
```

---

### 5. **shipping_addresses** - 배송지
```sql
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 배송지 정보
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- 주소
  country TEXT NOT NULL,  -- 국가
  postal_code TEXT,
  state_province TEXT,  -- 주/도
  city TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  
  -- 기본 배송지
  is_default BOOLEAN DEFAULT false,
  
  -- 특별 요청사항
  delivery_memo TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipping_addresses_user ON shipping_addresses(user_id);
CREATE INDEX idx_shipping_addresses_default ON shipping_addresses(user_id, is_default);
```

---

### 6. **carts** - 장바구니
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

---

### 7. **cart_items** - 장바구니 아이템
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  
  -- 선택된 옵션들 (JSON)
  selected_options JSONB,  -- {"용량": "50ml", "컬러": "화이트"}
  
  -- 가격 스냅샷 (주문 시점 가격 저장)
  price_snapshot INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(cart_id, product_id, selected_options)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
```

---

### 8. **orders** - 주문
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,  -- 'YES-20250612-9981'
  
  user_id UUID REFERENCES users(id),
  
  -- 주문 상태
  status TEXT NOT NULL DEFAULT '결제대기',
  -- '결제대기', '상품준비중', '배송대기', '배송중', '배송완료',
  -- '취소접수', '반품접수', '해외배송중', '현지집하완료', '통관진행중'
  
  -- 금액 정보
  subtotal INTEGER NOT NULL,  -- 상품 금액
  shipping_fee INTEGER NOT NULL DEFAULT 0,  -- 배송비
  discount_amount INTEGER DEFAULT 0,  -- 쿠폰/포인트 할인
  total_amount INTEGER NOT NULL,  -- 최종 결제 금액
  
  -- 배송지 정보 (스냅샷)
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  delivery_memo TEXT,
  
  -- 결제 정보
  payment_method TEXT NOT NULL,  -- 'card', 'paypal', 'visa', etc.
  payment_status TEXT DEFAULT 'pending',  -- 'pending', 'paid', 'failed', 'refunded'
  paid_at TIMESTAMP,
  
  -- 배송 정보
  courier_company TEXT,  -- 'DHL', 'EMS', 'FedEx', 'UPS'
  tracking_number TEXT,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- 쿠폰/포인트
  used_coupon_id UUID,
  used_points INTEGER DEFAULT 0,
  earned_points INTEGER DEFAULT 0,  -- 적립 예정 포인트
  
  -- 취소/반품
  cancelled_at TIMESTAMP,
  cancel_reason TEXT,
  refunded_at TIMESTAMP,
  
  -- 특이사항
  admin_memo TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);
```

---

### 9. **order_items** - 주문 아이템
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  -- 상품 정보 스냅샷 (주문 시점 정보 저장)
  product_name TEXT NOT NULL,
  product_brand TEXT NOT NULL,
  product_image_url TEXT,
  
  -- 가격 정보
  price INTEGER NOT NULL,  -- 단가
  quantity INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,  -- price * quantity
  
  -- 선택 옵션
  selected_options JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

---

### 10. **coupons** - 쿠폰
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 쿠폰 코드
  code TEXT UNIQUE NOT NULL,
  
  -- 쿠폰 정보
  title TEXT NOT NULL,
  description TEXT,
  
  -- 할인 정보
  discount_type TEXT NOT NULL,  -- 'percent', 'fixed_amount'
  discount_value INTEGER NOT NULL,  -- 10 (10%) or 10000 (10,000원)
  
  -- 사용 조건
  min_order_amount INTEGER DEFAULT 0,
  max_discount_amount INTEGER,  -- 최대 할인 금액 (정률일 때)
  
  -- 대상 제한
  applicable_categories TEXT[],  -- 특정 카테고리만
  applicable_products UUID[],  -- 특정 상품만
  
  -- 사용 제한
  max_usage_count INTEGER,  -- 전체 사용 가능 횟수
  max_usage_per_user INTEGER DEFAULT 1,  -- 1인당 사용 가능 횟수
  current_usage_count INTEGER DEFAULT 0,
  
  -- 유효 기간
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_valid ON coupons(valid_from, valid_until);
```

---

### 11. **user_coupons** - 사용자 쿠폰 (발급/사용 내역)
```sql
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  
  -- 발급 정보
  issued_at TIMESTAMP DEFAULT NOW(),
  
  -- 사용 정보
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  order_id UUID REFERENCES orders(id),
  
  -- 만료
  expires_at TIMESTAMP NOT NULL,
  
  UNIQUE(user_id, coupon_id, issued_at)
);

CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_coupon ON user_coupons(coupon_id);
CREATE INDEX idx_user_coupons_used ON user_coupons(user_id, is_used);
```

---

### 12. **live_streams** - 라이브 방송
```sql
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  
  -- 방송 정보
  stream_url TEXT,  -- 실제 스트리밍 URL
  stream_key TEXT,
  
  -- 진행자
  host_name TEXT,
  host_profile_image TEXT,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'scheduled',  -- 'scheduled', 'live', 'ended'
  
  -- 시청자 수
  viewer_count INTEGER DEFAULT 0,
  peak_viewer_count INTEGER DEFAULT 0,
  
  -- 일정
  scheduled_start_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  
  -- 관련 상품 (라이브 중 판매할 상품들)
  featured_product_ids UUID[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_live_streams_status ON live_streams(status);
CREATE INDEX idx_live_streams_scheduled ON live_streams(scheduled_start_at);
```

---

### 13. **reviews** - 리뷰 (🆕 추가 필요)
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  
  -- 평점
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- 내용
  title TEXT,
  content TEXT NOT NULL,
  
  -- 이미지/비디오
  image_urls TEXT[],
  video_url TEXT,
  
  -- 도움됨 카운트
  helpful_count INTEGER DEFAULT 0,
  
  -- 관리자 답변
  admin_reply TEXT,
  admin_replied_at TIMESTAMP,
  
  -- 상태
  is_verified_purchase BOOLEAN DEFAULT false,  -- 구매 확인된 리뷰
  is_visible BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
```

---

### 14. **wishlists** - 찜하기/위시리스트 (🆕 추가 필요)
```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);
```

---

### 15. **banners** - 배너 (🆕 추가 필요)
```sql
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  
  -- 이미지
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  
  -- 링크
  link_url TEXT,
  link_type TEXT,  -- 'product', 'category', 'external', 'live', etc.
  
  -- 표시 위치
  position TEXT NOT NULL DEFAULT 'main',  -- 'main', 'sub', 'popup'
  
  -- 순서
  display_order INTEGER DEFAULT 0,
  
  -- 기간
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  
  -- 태그
  tag_text TEXT,  -- 'D-1 글로벌 쇼핑 위크'
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_banners_position ON banners(position, display_order);
CREATE INDEX idx_banners_active ON banners(is_active, valid_from, valid_until);
```

---

### 16. **notifications** - 알림 (🆕 추가 필요)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 알림 타입
  type TEXT NOT NULL,  -- 'order', 'shipping', 'coupon', 'promotion', 'review', etc.
  
  -- 내용
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- 링크
  link_url TEXT,
  
  -- 관련 데이터
  related_order_id UUID,
  related_product_id UUID,
  
  -- 상태
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

### 17. **events** - 이벤트/공지사항 (🆕 추가 필요)
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 제목/내용
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- 타입
  type TEXT NOT NULL DEFAULT 'event',  -- 'event', 'notice', 'promotion'
  
  -- 이미지
  thumbnail_url TEXT,
  banner_url TEXT,
  
  -- 기간
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  
  -- 표시 우선순위
  is_pinned BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- 조회수
  view_count INTEGER DEFAULT 0,
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_active ON events(is_active, starts_at, ends_at);
CREATE INDEX idx_events_pinned ON events(is_pinned, display_order);
```

---

### 18. **search_keywords** - 검색 키워드 (🆕 추가 필요)
```sql
CREATE TABLE search_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  keyword TEXT NOT NULL,
  search_count INTEGER DEFAULT 1,
  
  last_searched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_keywords_keyword ON search_keywords(keyword);
CREATE INDEX idx_search_keywords_count ON search_keywords(search_count DESC);
```

---

### 19. **exchange_rates** - 환율 정보 (🆕 추가 필요)
```sql
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 통화
  currency_code TEXT NOT NULL,  -- 'USD', 'JPY', 'EUR', etc.
  currency_name TEXT NOT NULL,  -- '미국 달러', '일본 엔', etc.
  
  -- 환율
  rate NUMERIC(10, 4) NOT NULL,  -- 기준통화(KRW) 대비 환율
  
  -- 유효 기간
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(currency_code, valid_from)
);

CREATE INDEX idx_exchange_rates_currency ON exchange_rates(currency_code);
CREATE INDEX idx_exchange_rates_valid ON exchange_rates(valid_from, valid_until);
```

---

### 20. **admin_users** - 관리자 계정 (🆕 추가 필요)
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- 권한
  role TEXT NOT NULL DEFAULT 'staff',  -- 'super_admin', 'admin', 'staff'
  permissions JSONB,  -- 세부 권한 설정
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
```

---

## 🔐 Row Level Security (RLS) 정책

Supabase는 RLS를 통해 데이터 보안을 강화할 수 있습니다.

```sql
-- 예시: users 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회/수정 가능
CREATE POLICY "Users can view own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);
```

---

## 📈 추가로 필요한 기능 분석

### ✅ 현재 구현됨
1. 상품 목록/상세 조회
2. 카테고리별 필터링
3. 회원가입/로그인 UI
4. 관리자 주문 관리 UI
5. 라이브 방송 UI

### 🔧 구현 필요 (우선순위 높음)
1. **장바구니 로직** - 현재 UI만 있고 실제 기능 없음
2. **주문/결제 프로세스** - Checkout 플로우 완성
3. **리뷰 시스템** - ProductDetail에 리뷰(142) 표시되지만 데이터 없음
4. **찜하기/위시리스트** - ProductCard에 하트 아이콘만 있음
5. **검색 기능** - 검색창은 있지만 검색 로직 없음
6. **마이페이지 주문 내역** - 현재 빈 화면

### 🆕 추가 제안 기능
1. **알림 시스템** - 주문 상태 변경 시 실시간 알림
2. **포인트/적립금** - 구매 시 적립, 사용
3. **배송지 관리** - 여러 주소 등록/관리
4. **재고 관리** - 품절 표시, 재입고 알림
5. **환율 정보** - 해외 배송이므로 실시간 환율 표시
6. **추천 시스템** - AI 기반 상품 추천
7. **쿠폰 자동 발급** - 첫 구매, 생일 쿠폰 등
8. **1:1 문의** - 고객센터 채팅
9. **배송 추적** - 실시간 배송 위치 조회
10. **관세 계산기** - 국가별 관세 자동 계산

---

## 🎯 다음 단계

1. ✅ 데이터베이스 테이블 설계 완료
2. ⏭️ Supabase 프로젝트 생성
3. ⏭️ 테이블 생성 SQL 실행
4. ⏭️ RLS 정책 설정
5. ⏭️ Supabase Client 연동
6. ⏭️ 실제 데이터 CRUD 구현

준비되셨으면 Supabase 연동을 시작하겠습니다! 🚀
