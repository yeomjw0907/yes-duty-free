# 🚀 Supabase 연동 가이드

## 1단계: Supabase 프로젝트 생성

### 1. Supabase 계정 생성
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인

### 2. 새 프로젝트 생성
1. "New Project" 클릭
2. 프로젝트 정보 입력:
   - **Name**: `yes-duty-free`
   - **Database Password**: 안전한 비밀번호 생성 (기록 필수!)
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: Free tier 선택
3. "Create new project" 클릭
4. 프로젝트 생성 대기 (약 2분)

---

## 2단계: 데이터베이스 설정

### 1. SQL Editor에서 테이블 생성
1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New Query** 클릭
3. `database/migration.sql` 파일 내용 복사/붙여넣기
4. **Run** 클릭

### 2. 테이블 확인
1. 좌측 메뉴에서 **Table Editor** 클릭
2. 생성된 테이블 확인:
   - users
   - products
   - categories
   - orders
   - carts
   - ... (총 20개)

---

## 3단계: 환경변수 설정

### 1. API Keys 확인
1. 좌측 메뉴에서 **Settings** 클릭
2. **API** 클릭
3. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (공개키)
   - **service_role**: `eyJhbGc...` (비밀키 - 서버용)

### 2. .env.local 파일 생성
프로젝트 루트에 `.env.local` 파일 생성:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Gemini AI (기존)
VITE_GEMINI_API_KEY=your-gemini-api-key

# App
VITE_APP_URL=http://localhost:3001
```

### 3. .gitignore에 추가
`.gitignore` 파일에 추가:
```
.env.local
.env
```

---

## 4단계: Supabase Client 설치

### 1. 패키지 설치
```bash
npm install @supabase/supabase-js
```

### 2. React Query 설치 (선택 - 권장)
```bash
npm install @tanstack/react-query
```

### 3. Zustand 설치 (상태관리 - 선택)
```bash
npm install zustand
```

---

## 5단계: Supabase Client 설정

### 1. `lib/supabase.ts` 파일 생성
이미 생성된 파일 사용

### 2. `lib/api/` 폴더 구조
```
lib/
├── supabase.ts           # Supabase 클라이언트
├── api/
│   ├── products.ts       # 상품 API
│   ├── categories.ts     # 카테고리 API
│   ├── cart.ts           # 장바구니 API
│   ├── orders.ts         # 주문 API
│   ├── users.ts          # 사용자 API
│   ├── coupons.ts        # 쿠폰 API
│   └── reviews.ts        # 리뷰 API
└── hooks/
    ├── useProducts.ts    # 상품 훅
    ├── useCart.ts        # 장바구니 훅
    └── useAuth.ts        # 인증 훅
```

---

## 6단계: 인증 설정 (Supabase Auth)

### 1. 이메일/비밀번호 인증 활성화
1. **Authentication** → **Providers** 클릭
2. **Email** 활성화
3. **Confirm email** 체크 해제 (개발 시)

### 2. 소셜 로그인 설정 (선택)

#### Google 로그인
1. **Google** 활성화
2. Google Cloud Console에서 OAuth 클라이언트 ID 발급
3. Client ID, Secret 입력

#### Kakao 로그인
1. **Kakao** 추가 (Custom Provider)
2. Kakao Developers에서 앱 생성
3. REST API Key 입력

---

## 7단계: Storage 설정 (이미지 업로드)

### 1. Storage Bucket 생성
1. **Storage** 메뉴 클릭
2. **New bucket** 클릭
3. Bucket 정보:
   - **Name**: `product-images`
   - **Public**: ✅ 체크 (공개)
4. **Create bucket**

### 2. 추가 Bucket
- `user-profiles` (사용자 프로필 이미지)
- `review-images` (리뷰 이미지)
- `banners` (배너 이미지)

### 3. Storage Policy 설정
```sql
-- 누구나 조회 가능
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- 인증된 사용자만 업로드
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

---

## 8단계: RLS (Row Level Security) 설정

### 1. RLS 활성화
모든 테이블에 RLS 활성화:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ... 모든 테이블
```

### 2. Policy 예시

#### users 테이블
```sql
-- 사용자는 자신의 정보만 조회/수정
CREATE POLICY "Users can view own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);
```

#### products 테이블
```sql
-- 누구나 상품 조회 가능
CREATE POLICY "Anyone can view products" 
  ON products FOR SELECT 
  USING (true);

-- 관리자만 상품 수정
CREATE POLICY "Only admins can modify products" 
  ON products FOR ALL 
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

#### orders 테이블
```sql
-- 사용자는 자신의 주문만 조회
CREATE POLICY "Users can view own orders" 
  ON orders FOR SELECT 
  USING (auth.uid() = user_id);

-- 관리자는 모든 주문 조회
CREATE POLICY "Admins can view all orders" 
  ON orders FOR SELECT 
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

---

## 9단계: Realtime 설정 (실시간 알림)

### 1. Realtime 활성화
```sql
-- orders 테이블 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- notifications 테이블 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 2. 클라이언트에서 구독
```typescript
// 주문 상태 변경 실시간 구독
supabase
  .channel('orders')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('주문 상태 변경:', payload);
  })
  .subscribe();
```

---

## 10단계: Edge Functions (서버리스 - 선택)

### 1. Edge Functions 설치
```bash
npm install -g supabase
supabase login
supabase functions new send-email
```

### 2. 예시: 주문 완료 이메일 발송
```typescript
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { to, subject, html } = await req.json()
  
  // SendGrid, Resend 등으로 이메일 발송
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

---

## 테스트 데이터 삽입

### 1. 카테고리 데이터
```sql
INSERT INTO categories (name, name_en, icon, display_order) VALUES
('뷰티', 'Beauty', '💄', 1),
('패션', 'Fashion', '👗', 2),
('식품', 'Food', '🍔', 3),
('전자', 'Electronics', '📱', 4),
('럭셔리', 'Luxury', '💎', 5),
('테크·가전', 'Tech', '💻', 6),
('홈·리빙', 'Living', '🏠', 7),
('스포츠', 'Sports', '⚽', 8),
('도서', 'Books', '📚', 9);
```

### 2. 샘플 상품 데이터
`database/seed.sql` 파일 실행

---

## 문제 해결

### 1. CORS 에러
Supabase는 자동으로 CORS 처리됨. 로컬 개발 시 문제없음.

### 2. RLS 에러
- Policy 확인
- `service_role` 키 사용 (서버 사이드에서만)

### 3. 연결 실패
- URL, API Key 확인
- 네트워크 방화벽 확인

---

## 다음 단계

1. ✅ Supabase 프로젝트 생성
2. ✅ 테이블 생성
3. ✅ 환경변수 설정
4. ✅ Client 설정
5. ⏭️ **API 함수 작성 시작**
6. ⏭️ 실제 데이터 연동

**준비 완료! 이제 API 함수를 작성하겠습니다.** 🚀
