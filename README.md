# 🛫 Yes Duty Free - 글로벌 면세 쇼핑 플랫폼

> 전세계 어디든, 면세 혜택을 배달합니다.

React + TypeScript + Vite + Supabase 기반의 면세점 E-Commerce 플랫폼

---

## 📋 프로젝트 개요

### 주요 기능
- ✈️ **글로벌 배송**: 전세계 어디든 면세가로 배송
- 🎁 **면세 혜택**: 관세 걱정 없는 순수 면세가
- 📺 **라이브 쇼핑**: 틱톡 스타일의 실시간 라이브 방송
- 💳 **간편 결제**: 다양한 결제 수단 지원
- 📦 **배송 추적**: DHL, EMS, FedEx 실시간 추적

### 기술 스택
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State**: Zustand (예정), React Query (예정)
- **Payment**: Toss Payments, Stripe (예정)

---

## 📋 단계별 진행 가이드

**차근차근 개발하려면** → **[STEP_BY_STEP.md](./STEP_BY_STEP.md)** 참고

- Step 0: 환경 준비  
- Step 1~4: Supabase 생성·DB·시드·환경변수  
- Step 5~11: 상품 연동 → 로그인 → 장바구니 → 배송지 → 주문 → 회원 등급 → 마이페이지  

---

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/yeomjw0907/yes-duty-free.git
cd yes-duty-free
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
`.env.local` 파일 생성:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3001 접속

---

## 📁 프로젝트 구조

```
dutyfree/
├── components/           # React 컴포넌트
│   ├── Layout.tsx       # 레이아웃 (헤더/푸터)
│   ├── ProductCard.tsx  # 상품 카드
│   ├── ProductDetail.tsx # 상품 상세
│   ├── LoginPage.tsx    # 로그인
│   ├── AdminPanel.tsx   # 관리자 패널
│   └── ...
├── lib/                 # 라이브러리/유틸리티
│   ├── supabase.ts     # Supabase 클라이언트
│   ├── api/            # API 함수들
│   └── hooks/          # Custom Hooks
├── database/            # 데이터베이스 마이그레이션
│   ├── 001_initial_schema.sql  # 초기 스키마
│   └── 002_seed_data.sql       # 시드 데이터
├── types.ts            # TypeScript 타입 정의
├── constants.tsx       # 상수 및 목 데이터
├── App.tsx             # 메인 앱
└── index.tsx           # 진입점
```

---

## 📊 데이터베이스 설계

### 핵심 테이블 (Phase 1 - MVP)
1. **users** - 사용자 정보 및 회원 등급
2. **categories** - 상품 카테고리
3. **products** - 면세 상품
4. **product_options** - 상품 옵션 (용량, 사이즈 등)
5. **shipping_addresses** - 해외 배송지
6. **carts** / **cart_items** - 장바구니
7. **orders** / **order_items** - 주문 및 주문 상품

### 추가 테이블 (Phase 2-3)
- **coupons** / **user_coupons** - 쿠폰 시스템
- **live_streams** - 라이브 방송
- **reviews** - 상품 리뷰
- **wishlists** - 찜하기
- **notifications** - 알림

상세 설계: [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)  
요약표: [TABLES_SUMMARY.md](./TABLES_SUMMARY.md)

---

## 🔧 Supabase 설정

### 1. 프로젝트 생성
1. https://supabase.com 접속
2. 새 프로젝트 생성 (Region: Seoul)
3. API Keys 확인 (Settings → API)

### 2. 데이터베이스 초기화
SQL Editor에서 실행:
```sql
-- 1. 스키마 생성
\i database/001_initial_schema.sql

-- 2. 시드 데이터 삽입
\i database/002_seed_data.sql
```

### 3. Storage 설정
Buckets 생성:
- `product-images` (공개)
- `user-profiles` (공개)
- `review-images` (공개)

자세한 설정: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## 📈 현재 구현 상태

### ✅ 완료
- [x] UI/UX 디자인 (모바일/데스크톱 반응형)
- [x] 상품 카탈로그 (카테고리별 필터링)
- [x] 상품 상세 페이지
- [x] 라이브 방송 UI (틱톡 스타일)
- [x] 회원가입/로그인 UI
- [x] 관리자 주문 관리 UI
- [x] 데이터베이스 설계

### 🚧 진행 중
- [ ] Supabase 연동
- [ ] 장바구니 기능 구현
- [ ] 주문/결제 프로세스
- [ ] 마이페이지 (주문 내역)

### 📋 예정
- [ ] 리뷰 시스템
- [ ] 포인트/적립금
- [ ] 쿠폰 시스템
- [ ] 실시간 알림
- [ ] 배송 추적

전체 기능 분석: [FEATURES_ANALYSIS.md](./FEATURES_ANALYSIS.md)

---

## 🎯 개발 로드맵

### Phase 1 - MVP (2-3주) 🔴
- [ ] Supabase 연동 완료
- [ ] 장바구니 완성
- [ ] 주문/결제 프로세스
- [ ] 배송지 관리
- [ ] 마이페이지 주문 내역

### Phase 2 - 핵심 기능 (2주) 🟡
- [ ] 리뷰 시스템
- [ ] 찜하기
- [ ] 포인트/적립금
- [ ] 쿠폰 시스템
- [ ] 알림

### Phase 3 - 부가 기능 (2주) 🟠
- [ ] 검색 완성
- [ ] 재고 관리
- [ ] 배송 추적
- [ ] 추천 시스템

### Phase 4 - 고급 기능 (2주) ⚪
- [ ] **회원 등급 시스템** (우선 진행)
- [ ] 환율 정보 (추후 진행)
- [ ] 관세 계산기 (추후 진행)
- ~~라이브 채팅~~ (진행 제외)

---

## 🤝 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 📧 문의

**Yes Duty Free** - admin@onecation.co.kr

프로젝트 링크: [https://github.com/yeomjw0907/yes-duty-free](https://github.com/yeomjw0907/yes-duty-free)

---

## 📚 참고 문서

- [**STEP_BY_STEP.md**](./STEP_BY_STEP.md) - **단계별 진행 가이드 (차근차근)**
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - 상세 데이터베이스 설계
- [TABLES_SUMMARY.md](./TABLES_SUMMARY.md) - 테이블 요약표
- [FEATURES_ANALYSIS.md](./FEATURES_ANALYSIS.md) - 기능 분석 및 개선사항
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 설정 가이드

---

Made with ❤️ by Onecation Co., Ltd.
