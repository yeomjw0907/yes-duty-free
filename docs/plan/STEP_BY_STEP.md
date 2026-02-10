# 📋 Yes Duty Free - 단계별 진행 가이드

> 차근차근 따라하는 개발 단계 정리

---

## 📌 전체 단계 개요

| 단계 | 내용 | 예상 시간 | 상태 |
|------|------|----------|------|
| **Step 0** | 환경 준비 | 5분 | ⬜ |
| **Step 1** | Supabase 프로젝트 생성 | 10분 | ⬜ |
| **Step 2** | 데이터베이스 테이블 생성 | 5분 | ⬜ |
| **Step 3** | 시드 데이터 삽입 | 3분 | ⬜ |
| **Step 4** | 로컬 환경 설정 | 5분 | ⬜ |
| **Step 5** | 상품/카테고리 연동 | 1~2시간 | ⬜ |
| **Step 6** | 회원가입·로그인 연동 | 1~2시간 | ⬜ |
| **Step 7** | 장바구니 기능 | 2~3시간 | ⬜ |
| **Step 8** | 배송지 관리 | 1시간 | ⬜ |
| **Step 9** | 주문/결제 프로세스 | 2~3시간 | ⬜ |
| **Step 10** | 회원 등급 시스템 | 1~2시간 | ⬜ |
| **Step 11** | 마이페이지·주문 내역 | 1~2시간 | ⬜ |

---

---

## Step 0. 환경 준비 (5분)

### 할 일
1. **Node.js** 설치 확인 (v18 이상 권장)
   ```bash
   node -v
   npm -v
   ```
2. **프로젝트 폴더**에서 터미널 열기
3. **의존성 설치**
   ```bash
   npm install
   ```

### 완료 체크
- [ ] `node -v` 정상 출력
- [ ] `npm install` 오류 없이 완료
- [ ] `npm run dev` 실행 시 로컬 화면 정상 표시

### 참고
- 문제 시: `README.md`의 "빠른 시작" 참고

---

## Step 1. Supabase 프로젝트 생성 (10분)

### 할 일
1. **Supabase 접속**
   - https://supabase.com
   - "Start your project" → GitHub 로그인
2. **새 프로젝트 생성**
   - "New Project" 클릭
   - **Name**: `yes-duty-free` (원하는 이름 가능)
   - **Database Password**: 안전한 비밀번호 생성 후 **반드시 메모**
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: Free
3. "Create new project" 클릭 후 **2~3분 대기**

### 완료 체크
- [ ] 프로젝트 대시보드 진입 가능
- [ ] 좌측 메뉴에 Table Editor, SQL Editor, Settings 등 보임

### 참고
- DB 비밀번호 분실 시 프로젝트 재생성 필요할 수 있음

---

## Step 2. 데이터베이스 테이블 생성 (5분)

### 할 일
1. Supabase 대시보드에서 **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 파일 내용 **전체 복사** 후 SQL Editor에 붙여넣기
   - 파일: `database/001_initial_schema.sql`
4. **Run** (또는 Ctrl+Enter) 실행
5. 에러 없이 "Success" 확인

### 주의
- `001_initial_schema.sql`에 **TRIGGER** 구문이 있음  
  - PostgreSQL 버전에 따라 `EXECUTE FUNCTION` 오류가 나면, 해당 파일에서 `EXECUTE FUNCTION` → `EXECUTE PROCEDURE`로 바꾼 뒤 다시 실행
- 한 번에 안 되면 **테이블만** 먼저 실행하고, TRIGGER 부분은 나중에 추가해도 됨

### 완료 체크
- [ ] **Table Editor**에서 아래 테이블 9개 확인
  - users, categories, products, product_options  
  - shipping_addresses, carts, cart_items  
  - orders, order_items

### 참고
- 상세 스키마: `DATABASE_DESIGN.md`

---

## Step 3. 시드 데이터 삽입 (3분)

### 할 일
1. **SQL Editor** → **New query**
2. 아래 파일 내용 **전체 복사** 후 붙여넣기
   - 파일: `database/002_seed_data.sql`
3. **Run** 실행
4. 맨 아래 확인 쿼리 결과로 row 수 확인

### 완료 체크
- [9] **Table Editor** → **categories**: 9개 행
- [5] **products**: 5개 행
- [14] **product_options**: 여러 행
- [1] **users**: 1개 (test@example.com)
- [2] **shipping_addresses**: 2개

### 참고
- 나중에 상품/카테고리는 관리자 기능으로 추가 가능

---

## Step 4. 로컬 환경 설정 (5분)

### 할 일
1. **API 키 확인**
   - Supabase 대시보드 → **Settings** → **API**
   - **Project URL** 복사
   - **anon public** 키 복사
2. **`.env.local` 파일 생성**
   - 프로젝트 **루트**에 `.env.local` 생성
   - 아래 내용 넣고, `xxxxx` 부분을 본인 값으로 교체
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...복사한_anon_키
   ```
   - (기존에 쓰던 키 있으면) Gemini 등 다른 키도 그대로 두면 됨
3. **개발 서버 재시작**
   ```bash
   npm run dev
   ```
4. 브라우저에서 앱 열고 **콘솔에 Supabase 관련 에러 없는지** 확인

### 완료 체크
- [ ] `.env.local`이 프로젝트 루트에 있음
- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 값 입력됨
- [ ] `npm run dev` 후 흰 화면/에러 없이 기존 UI 동작
- [ ] `.env.local`은 Git에 커밋하지 않음 (`.gitignore`에 있음)

### 참고
- 예시: `.env.local.example`

---

## Step 5. 상품/카테고리 연동 (1~2시간)

### 목표
- 메인/카테고리/상세에서 **Supabase**의 categories, products 데이터 사용
- 기존 `MOCK_PRODUCTS`, `MOCK_LIVES` 대신 DB 조회

### 할 일
1. **API 함수 작성**
   - `lib/api/categories.ts`: 카테고리 목록 조회
   - `lib/api/products.ts`: 상품 목록·단건 조회 (카테고리 필터 옵션)
2. **React Query 설정** (선택, 권장)
   - `main` 또는 `App`에 `QueryClientProvider` 설정
   - `lib/hooks/useCategories.ts`, `lib/hooks/useProducts.ts` 훅 작성
3. **기존 컴포넌트 수정**
   - `App.tsx`: 상품/카테고리 데이터를 API 훅 또는 API 함수로 교체
   - `Layout.tsx`: 카테고리 메뉴를 API 데이터로
   - `constants.tsx`: MOCK_PRODUCTS 사용처를 API 데이터로 교체
4. **상품 상세**
   - 상품 클릭 시 `products` 테이블의 id로 상세 조회하도록 연결

### 완료 체크
- [ ] 홈에서 상품 5개가 DB 기준으로 표시됨
- [ ] 카테고리 메뉴가 DB 카테고리 9개로 표시됨
- [ ] 카테고리 클릭 시 해당 카테고리 상품만 필터되어 보임
- [ ] 상품 클릭 시 상세 페이지에 DB 데이터로 표시됨

### 참고
- 테이블 구조: `database/001_initial_schema.sql`, `TABLES_SUMMARY.md`
- Supabase 클라이언트: `lib/supabase.ts`

---

## Step 6. 회원가입·로그인 연동 (1~2시간)

### 목표
- Supabase Auth 사용
- 로그인/회원가입 시 `users` 테이블과 연동 (필요 시 프로필 생성·갱신)

### 할 일
1. **Supabase Auth 설정**
   - 대시보드 → **Authentication** → **Providers**
   - **Email** 활성화
   - (개발 중에는) **Confirm email** 비활성화 가능
2. **인증 훅/유틸 작성**
   - `lib/hooks/useAuth.ts`: signUp, signIn, signOut, user 상태
   - 로그인 성공 시 `users` 테이블에 프로필 없으면 insert 또는 update
3. **로그인/회원가입 페이지 연동**
   - `LoginPage.tsx`: 폼 제출 시 `signIn` 호출
   - `SignupPage.tsx`: 폼 제출 시 `signUp` 호출, 성공 시 로그인 페이지로 이동
4. **전역 상태**
   - 로그인 여부에 따라 헤더(로그인/로그아웃, 마이페이지) 표시
   - 필요 시 Context 또는 Zustand로 user 저장

### 완료 체크
- [ ] 회원가입 후 이메일/비밀번호로 로그인 가능
- [ ] 로그인 시 헤더에 로그아웃 또는 마이페이지 표시
- [ ] 로그아웃 시 로그인 버튼으로 복귀
- [ ] (선택) Supabase 대시보드 **Authentication** → **Users**에 계정 보임

### 참고
- Supabase Auth: https://supabase.com/docs/guides/auth
- `users` 테이블과 auth 연동 시: 가입 후 `auth.uid()`로 users row 생성

---

## Step 7. 장바구니 기능 (2~3시간)

### 목표
- 로그인 사용자만 장바구니 사용 (또는 비로그인 시 로그인 유도)
- 상품 담기/수량 변경/삭제 후 DB 반영

### 할 일
1. **API 함수 작성**
   - `lib/api/cart.ts`
     - getOrCreateCart(userId): 장바구니 없으면 생성 후 반환
     - getCartItems(cartId)
     - addCartItem(cartId, productId, quantity, selectedOptions?)
     - updateCartItemQuantity(cartItemId, quantity)
     - removeCartItem(cartItemId)
2. **장바구니 훅**
   - `lib/hooks/useCart.ts`: 위 API 호출 + React Query 캐시 갱신
3. **UI 연동**
   - 상품 상세 "장바구니 담기" → `addCartItem` 호출
   - (선택) 헤더에 장바구니 아이콘 + 개수 표시
   - 장바구니 페이지 추가: 목록, 수량 변경, 삭제, 빈 장바구니 안내
4. **라우팅**
   - 장바구니 페이지 경로 추가 (예: `/cart` 또는 currentPage === 'cart')

### 완료 체크
- [ ] 상품 상세에서 "장바구니 담기" 클릭 시 cart_items에 행 추가
- [ ] 장바구니 페이지에서 목록/수량/삭제 동작
- [ ] 수량 변경·삭제 시 DB 및 화면 동기화

### 참고
- 테이블: carts (user_id 1:1), cart_items (cart_id, product_id, quantity, selected_options)

---

## Step 8. 배송지 관리 (1시간)

### 목표
- 로그인 사용자가 배송지 등록/수정/삭제/기본 배송지 설정
- 주문 시 선택한 배송지 사용

### 할 일
1. **API 함수 작성**
   - `lib/api/shippingAddresses.ts`
     - list(userId), create, update, delete, setDefault(id)
2. **배송지 UI**
   - 마이페이지 또는 별도 "배송지 관리" 메뉴
   - 목록 + 추가/수정/삭제/기본 설정
3. **주문서에서 사용**
   - 주문 단계에서 배송지 선택 드롭다운 또는 라디오 (Step 9에서 연동)

### 완료 체크
- [ ] 배송지 추가/수정/삭제/기본 설정이 DB에 반영됨
- [ ] 주문 시 선택한 배송지가 orders에 저장됨 (Step 9 완료 후 확인)

### 참고
- 테이블: shipping_addresses (user_id, is_default 등)
- **국내(KR)** : 다음(카카오) 우편번호 API로 "주소 검색" → 우편번호·기본 주소 자동 입력, 상세 주소(동·호수)만 입력. (`index.html`에 postcode.v2.js 로드)
- **해외** : Address Line 1(거리·건물) + Address Line 2(호실·Apt/Suite) + City, State, Postal — 국내의 기본/상세 주소와 같은 개념.

---

## Step 9. 주문/결제 프로세스 (2~3시간)

### 목표
- 장바구니 → 주문서 → (결제 연동은 선택) → 주문 완료 시 orders, order_items 생성 및 장바구니 비우기

### 할 일
1. **주문 API**
   - `lib/api/orders.ts`
     - createOrder(userId, { shippingAddressId, cartItemIds?, usedCouponId? })
     - 내부: order_number 생성, order/order_items insert, cart_items 비우기
     - getMyOrders(userId), getOrderById(orderId)
2. **주문서 페이지**
   - 배송지 선택, 주문 상품 목록, 금액 요약
   - "주문하기" 버튼 → createOrder 호출
3. **결제 연동 (선택)**
   - Toss Payments 등 연동 시 createOrder 전/후에 결제 승인 처리
   - payment_status, paid_at 업데이트
4. **주문 완료 페이지**
   - order_number, 안내 문구 표시
   - 마이페이지 주문 내역으로 이동 링크

### 완료 체크
- [ ] 주문서에서 "주문하기" 시 orders, order_items 생성
- [ ] 주문 후 해당 장바구니 비워짐
- [ ] 주문 완료 화면에서 주문 번호 확인 가능
- [ ] (선택) 결제 연동 시 paid_at 반영

### 참고
- 테이블: orders (order_number, status, total_amount, shipping_* 등), order_items
- order_number 형식: 예) YES-YYYYMMDD-XXXX
- **Supabase SQL Editor에서 실행**: `database/004_orders_insert_policy.sql` (주문·order_items INSERT RLS 정책). 한 번만 실행하면 됨.

---

## Step 10. 회원 등급 시스템 (1~2시간) ⭐ 우선 진행

### 목표
- Basic / Premium / VIP 구분
- 등급에 따른 적립률, 무료배송 등 차등 적용 (규칙만 적용해도 됨)

### 할 일
1. **등급 규칙 정리**
   - **Basic**: 1% 적립, 배송비 유료
   - **Premium**: 월 20만원 이상 구매 시 2% 적립, 무료배송
   - **VIP**: 월 50만원 이상 구매 시 3% 적립, 무료배송, 전담 CS 안내
2. **등급 산정**
   - users 테이블에 `membership_tier` 이미 있음
   - 주문 완료 시 또는 주기적으로 해당 유저의 **월 구매액** 합산 후 tier 업데이트
   - `lib/api/users.ts`: updateMembershipTier(userId) 또는 서버 로직
3. **UI 반영**
   - 마이페이지 또는 헤더에 현재 등급 표시 (Basic/Premium/VIP)
   - 상품/주문 요약에서 "적립률 2%" 등 표시 (선택)
   - 결제 단계에서 등급에 따른 배송비/적립 안내
4. **적립금**
   - 주문 완료 시 `users.points`에 적립 (등급별 % 적용)
   - 사용 시 포인트 차감 (선택, Step 11에서 구체화 가능)

### 완료 체크
- [ ] 마이페이지 또는 프로필에 등급 표시
- [ ] 주문 완료 시 월 구매액 기준으로 tier 갱신 (또는 수동 테스트로 확인)
- [ ] 등급별 적립률이 문서/화면에 맞게 적용됨

### 참고
- users.membership_tier, users.points
- **Supabase SQL Editor에서 실행**: `database/005_orders_update_policy.sql` (주문 완료 후 earned_points 갱신용 UPDATE RLS)
- 등급 규칙: `lib/constants/membership.ts` (TIER_RATES, SHIPPING_FEE_BASIC, TIER_THRESHOLDS)

---

## Step 11. 마이페이지·주문 내역 (1~2시간)

### 목표
- 로그인 사용자의 주문 목록·상세 보기
- (선택) 포인트 내역, 쿠폰함, 배송지 관리 진입점

### 할 일
1. **주문 목록**
   - 마이페이지에서 getMyOrders 호출 후 테이블/카드로 표시
   - 주문번호, 날짜, 상태, 총액
2. **주문 상세**
   - 행 클릭 시 getOrderById로 상세 조회
   - order_items, 배송지, 결제 정보 표시
3. **배송 추적 (선택)**
   - orders.tracking_number, courier_company 있으면 링크 또는 문구 표시
4. **기타**
   - 프로필(이름, 이메일), 포인트 잔액 표시
   - "배송지 관리" 링크 → Step 8 화면

### 완료 체크
- [ ] 마이페이지에서 내 주문 목록 표시
- [ ] 주문 클릭 시 상세(상품, 금액, 배송지) 표시
- [ ] (선택) 포인트, 배송지 관리 진입 가능

### 참고
- orders.status: 결제대기, 상품준비중, 배송중, 배송완료 등

---

---

## 📌 추후 진행 (순서 무관)

아래는 현재 단계에서는 **진행하지 않고**, 이후에 필요할 때 진행합니다.

- 프리오더, 멤버십 구독, 소셜 공유, 출석 체크 (기획)
- 포인트/적립금 상세, 실시간 알림, 재고 관리, 환율, 배송 추적, 관세 계산기, 추천, 쿠폰 자동 발급, 1:1 문의 (기능)
- 리뷰, 찜하기, 검색 완성, 배너/이벤트 관리 등

자세한 목록: `FEATURES_ANALYSIS.md`, `WORK_SUMMARY.md`

---

## 📌 문서 참고 요약

| 보려는 것 | 문서 |
|-----------|------|
| 단계별 진행 | **STEP_BY_STEP.md** (현재 문서) |
| 프로젝트 개요·시작 | README.md |
| DB 테이블 설계 상세 | DATABASE_DESIGN.md |
| 테이블 요약·관계도 | TABLES_SUMMARY.md |
| Supabase 설정 상세 | SUPABASE_SETUP.md |
| 기능·기획 정리 | FEATURES_ANALYSIS.md |
| 작업 완료 요약 | WORK_SUMMARY.md |

---

**Step 0부터 차근차근 진행하시면 됩니다.**  
한 단계 끝날 때마다 위의 "완료 체크"를 해보시고, 다음 단계로 넘어가시면 됩니다.
