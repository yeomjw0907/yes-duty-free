# 회원가입/주문 DB 검증 가이드

회원가입·주문 시 Supabase에 데이터가 정상 저장되는지, 관리자에서 확인 가능한지 검증하는 방법입니다.

- **검증 스크립트**: `scripts/verify-db.mjs` → `npm run verify-db` (Service Role Key 설정 시 전체 데이터 조회)
- **PG 연동 준비**: `lib/api/orders.ts`에 `updateOrderPaymentStatus(orderId, { payment_status, paid_at })` 추가됨. 결제 완료 시 호출용.

## 사전 조건

- `.env.local`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정
- Supabase 프로젝트에 마이그레이션 적용: `database/001_initial_schema.sql` → `003`, `004`, `010`, `011`, `013` 등
- 관리자 계정: `database/010_admin_users.sql` 참고해 `admin_users`에 테스트용 `user_id` INSERT
- 상품/카테고리 시드: 주문 테스트를 위해 `002_seed_data.sql` 또는 수동 1건 이상

## 1. 앱 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3001` 접속.

## 2. 회원가입 검증

1. **회원가입**: 로그인 페이지 → "간편 회원가입" → 이메일/비밀번호/이름/전화/배송지 입력 후 "가입하기"
2. **테스트 이메일 주의**: Supabase Auth는 `example.com` 도메인을 "invalid"로 거부합니다. 다음처럼 사용하세요.
   - `verify-test-001@test.local` (로컬 테스트용)
   - 또는 본인 Gmail 등에서 `본인이메일+verify001@gmail.com` 형태의 +별칭 사용
3. 성공 시 로그인 페이지로 이동
3. **DB 확인**
   - **방법 A (권장)**  
     `.env.local`에 Supabase **Service Role Key**를 `SUPABASE_SERVICE_ROLE_KEY`로 추가한 뒤:
     ```bash
     npm run verify-db
     ```
     `users`, `shipping_addresses` 최근 5건이 출력되는지 확인.
   - **방법 B**  
     Supabase 대시보드 → **Table Editor** → `users`, `shipping_addresses`에서 방금 가입한 사용자 행 확인.

## 3. 주문 검증

1. **로그인** 후 상품을 장바구니에 담기
2. **장바구니** → "주문하기" → 배송지 선택 후 결제하기(주문 생성)
3. 주문 완료 페이지에서 주문번호 확인
4. **DB 확인**
   - `npm run verify-db` (Service Role Key 설정 시): `orders`, `order_items` 최근 건 확인
   - Table Editor: `orders`에 해당 `order_number`, `order_items`에 상품 행, 해당 `cart_items` 삭제 여부 확인

## 4. 관리자 검증

1. 푸터 등에서 "관리자" 링크로 **관리자 로그인** 모달 오픈
2. `admin_users`에 등록된 계정으로 로그인
3. **주문/해외배송 관리**에서 방금 생성한 주문 노출 확인
4. **회원 관리**에서 방금 가입한 회원 노출 확인

## 검증 스크립트 (verify-db)

- **경로**: `scripts/verify-db.mjs`
- **실행**: `npm run verify-db`
- **동작**: `.env.local`을 읽어 Supabase에 연결 후 `users`, `shipping_addresses`, `orders`, `order_items` 최근 데이터를 조회해 출력.
- **RLS**: anon 키만 사용하면 본인 데이터만 보이므로 비로그인 시 0건일 수 있음. **전체 데이터 검증**을 위해 `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY`를 추가해 사용하면 RLS를 우회해 최근 행을 볼 수 있음.
- Service Role Key는 Supabase 대시보드 → Settings → API → `service_role` (secret).

## 오류 시 점검

- **"Email address ... is invalid"**: `example.com` 사용 금지. 위 "테스트 이메일 주의"대로 `@test.local` 또는 `+별칭@gmail.com` 사용.
- **회원가입 실패**: `database/003_auth_users_policy.sql` 적용 여부, Supabase Auth 이메일 설정
- **주문 생성 실패**: `004_orders_insert_policy.sql`, `011_admin_orders_policy.sql` 적용 여부
- **관리자 로그인 실패**: `admin_users`에 해당 `auth.users.id` INSERT 여부 (`010_admin_users.sql` 참고)
