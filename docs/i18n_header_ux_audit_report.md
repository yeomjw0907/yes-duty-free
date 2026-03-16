# i18n & 헤더 UX 개선 — 종합 점검 보고서

**프로젝트:** Yes Duty Free (yesdutyfree)  
**점검일:** 2026-03-16  
**대상:** 하드코딩 i18n 정리 + 헤더(로그인/다국어) UX 개선  

---

## 1. DB 점검 결과

### 1.1 category_locales ✅ 정상

| ko (원본) | zh-TW | 상태 |
|-----------|-------|------|
| 뷰티 | 美妝 | ✅ |
| 패션 | 時尚 | ✅ |
| 푸드 | 食品 | ✅ |
| 전자 | 電子 | ✅ |
| 럭셔리 | 精品 | ✅ |
| 테크·가전 | 科技·家電 | ✅ |
| 홈·리빙 | 家居·生活 | ✅ |
| 스포츠 | 運動 | ✅ |
| 도서 | 圖書 | ✅ |

- locale별 행 수: ko=9, en=9, zh-TW=9 → 전체 일치

### 1.2 product_locales ⚠️ 테이블 미생성

- `product_locales` 테이블이 **DB에 존재하지 않음**
- 코드(`lib/api/products.ts`)에서 `product_locales` 조회 시 에러를 silent하게 처리하므로 즉시 장애는 아님
- 상품 zh-TW 이름은 `products.name_zh` 컬럼으로 폴백됨 (현재 모든 상품의 `name_zh`가 NULL이므로 ko 이름이 표시됨)
- **조치 필요:** `database/031_product_locales.sql` 마이그레이션 적용 후, 상품별 zh-TW 이름·설명·가격 등록

### 1.3 banner_locales ⚠️ 테이블 미생성

- `banner_locales` 테이블 미존재
- 현재 배너 자체가 0건이므로 HeroBanner에서 코드 내 fallback(i18n 키 기반)이 표시됨 → **fallback 동작은 정상**
- 배너를 Admin에서 등록하면 ko 텍스트만 나옴
- **조치 필요:** `database/029_banner_locales.sql` 적용 + Admin UI에서 zh-TW 입력 지원

### 1.4 event_locales ⚠️ 테이블 미생성

- `event_locales` 테이블 미존재, 이벤트 데이터 0건
- **조치 필요:** `database/030_event_locales.sql` 적용 (이벤트 등록 시 다국어 지원)

---

## 2. 코드 점검 결과

### 2.1 이번 작업에서 완료된 항목 ✅

| 파일 | 변경 내용 | 상태 |
|------|----------|------|
| `locales/ko/common.json` | nav, footer, aria, search, signup, address, banner, product 키 추가 | ✅ |
| `locales/zh-TW/common.json` | 동일 키 zh-TW 번역 추가 | ✅ |
| `Layout.tsx` | 네비(nav.deals/best/live), 푸터(support/logistics/connect/terms/privacy), 검색(trending/realtimePopular), aria(language/cart) → t() | ✅ |
| `Layout.tsx` | 헤더 언어/인증 → 모바일에도 노출 (`hidden lg:*` 제거), 로그인 시 "회원명 \| 로그아웃" | ✅ |
| `Layout.tsx` | 언어 드롭다운 `text-gray-900` 추가 (라이브모드 가시성) | ✅ |
| `SignupPage.tsx` | placeholder(ZIP/State/City/Street/Apt), SNS 문구, LINE/Facebook/Google title → t() | ✅ |
| `ShippingAddressPage.tsx` | placeholder(FullName/Phone/Optional/City/State/Street/Apt) → t() | ✅ |
| `HeroBanner.tsx` | fallback 배너 텍스트 → t(banner.fallback*), aria → t(banner.slideN/prev/next) | ✅ |
| `FooterModal.tsx` | aria-label → t('actions.close') | ✅ |
| `TierBenefitsModal.tsx` | aria-label → t('actions.close') | ✅ |
| `OrderDetailModal.tsx` | aria-label + 닫기 버튼 텍스트 → t('actions.close') | ✅ |
| `ProductDetail.tsx` | 찜 aria-label → t('product.wishlistAddTitle/RemoveTitle') | ✅ |
| `LoginPage.tsx` | 카카오/네이버/구글 → 공식 SVG 로고 적용 | ✅ |
| `App.tsx`, `Layout.tsx` | 카테고리 필터를 이름→ID 기반으로 변경 (zh-TW 카테고리 동작) | ✅ |
| `types.ts` | Product에 `categoryId` 필드 추가 | ✅ |
| `lib/api/products.ts`, `cart.ts`, `wishlists.ts` | categoryId 매핑 추가 | ✅ |
| DB `category_locales` | 테이블 생성 + zh-TW 9개 카테고리 데이터 적용 | ✅ |

### 2.2 잔여 하드코딩 (이번 스코프 외)

> AdminPanel.tsx는 계획상 제외. 아래는 **공개 페이지**에 남은 하드코딩 목록.

#### 🔴 HIGH — 사용자에게 직접 표시되는 한국어/영어

| 파일 | 줄 | 내용 | 비고 |
|------|-----|------|------|
| **App.tsx** | 319-326 | 메인 빠른링크 라벨 "면세 에디션", "글로벌 트렌드", "프리주문", "로컬마켓" 등 8개 | ⚠️ |
| **App.tsx** | 474 | 라이브 상태 `'Live Now'`, `'예정 ...'`, `'방송'` | ⚠️ |
| **App.tsx** | 551-554 | 마이페이지 등급 혜택 설명 "무료배송 · 3% 적립 · 전담 CS" 등 | ⚠️ |
| **App.tsx** | 557 | "적립금 {n}P" | ⚠️ |
| **App.tsx** | 567,574,581,588 | 마이페이지 메뉴 "📍 배송지 관리", "💰 포인트 내역" 등 | ⚠️ |
| **App.tsx** | 638 | 주문 금액 `{n}원` | ⚠️ |
| **App.tsx** | 767 | "한정 수량으로 만나는 글로벌 면세 특가" | ⚠️ |
| **App.tsx** | 134,157,271,307 | 에러/알림 메시지 한국어 | ⚠️ |
| **ProductDetail.tsx** | 84,196 | 통화 접미사 `'원'`/`'元'` | ⚠️ |
| **ProductDetail.tsx** | 249-252 | "당신의 피부를 위한 최고의 선택" 등 상품 설명 폴백 | ⚠️ |
| **CartPage.tsx** | 178,201 | `{n}원` | ⚠️ |
| **CheckoutPage.tsx** | 239,243,255,259,308,320,356,368 | `{n}원`, 에러 메시지 한국어 | ⚠️ |
| **OrderDetailModal.tsx** | 42,59,67,71,75,79,94,103-118,122,128-146 | "주문 상세", "주문번호", 금액 "원" 등 전체 | ⚠️ |
| **TierBenefitsModal.tsx** | 12-21,34,79 | 등급별 혜택 텍스트 전체 | ⚠️ |
| **InquiriesPage.tsx** | 17 | statusLabel `'답변완료'`, `'종료'`, `'대기중'` | ⚠️ |
| **Layout.tsx** | 363-364 | 푸터 회사 정보 "(주)원케이션 \| 대표이사: 염정원" | LOW |
| **Layout.tsx** | 420-473 | 푸터 모달 내용 (FAQ/통관/배송국가/이용약관/개인정보) | ⚠️ |

#### 🟡 LOW — 코드 주석, 내부 상수

| 파일 | 내용 |
|------|------|
| App.tsx 주석 | "마이페이지는 로그인한 사용자만 접근" 등 → 주석이므로 UI 무관 |
| SignupPage/ShippingAddressPage | `'대한민국'` 기본값 → 한국 주소 검색 시 city fallback (기능 로직) |

---

## 3. 헤더 UX 점검

| 항목 | 상태 | 상세 |
|------|------|------|
| 언어 전환 버튼 — 모바일 노출 | ✅ PASS | `hidden lg:block` 제거됨. `<div className="relative">` (줄 228) |
| 로그인/회원가입 — 모바일 노출 | ✅ PASS | `hidden lg:flex` 제거됨. `<div className="flex items-center gap-2 lg:gap-6">` (줄 277) |
| 로그인 시 회원명 표시 | ✅ PASS | `profile?.name ?? user?.email?.split('@')[0] ?? t('header.myProfile')` (줄 285) |
| 드롭다운 라이브모드 가시성 | ✅ PASS | `text-gray-900` 명시 (줄 249, 255) |
| 네비 3개 — 데스크톱 전용 | ✅ OK | Special Offers/Best Sellers/Live TV는 `hidden lg:flex` 유지 (의도된 동작) |

---

## 4. 빌드 점검

| 항목 | 결과 |
|------|------|
| `npm run build` | ✅ 성공 (exit code 0) |
| 린트 에러 | ✅ 없음 |
| 번들 크기 경고 | ⚠️ 1,552KB (500KB 초과) — 코드 스플리팅 권장 |

---

## 5. 요약 & 권장 조치

### ✅ 완료 (즉시 동작)
- 카테고리 zh-TW 번역 (DB + UI)
- 헤더: 다국어 버튼 + 로그인/회원명 모바일 노출
- 네비/푸터/검색/배너/회원가입/배송지/모달 aria → i18n 키 전환
- 카테고리 필터 name→id 변환 (zh-TW 카테고리 페이지 빈 목록 해결)

### ⚠️ 후속 작업 필요

| 우선순위 | 항목 | 설명 |
|---------|------|------|
| **P1** | `031_product_locales.sql` 적용 | 상품명 zh-TW 등록 가능하게 (현재 모든 상품이 한국어로 표시) |
| **P1** | App.tsx 메인/마이페이지 하드코딩 | 빠른링크 라벨, 등급 혜택 설명, 적립금 등 → t() 전환 |
| **P1** | 통화 표시 통일 | `원`/`元` 하드코딩 → locale 기반 통화 포맷 함수 |
| **P2** | OrderDetailModal 전체 | 주문 상세 텍스트 20여 곳 한국어 → t() |
| **P2** | TierBenefitsModal 전체 | 등급별 혜택 텍스트 → t() |
| **P2** | CheckoutPage 금액/에러 | "원", 에러 메시지 → t() |
| **P2** | CartPage 금액 | "원" → locale 통화 포맷 |
| **P2** | Layout.tsx 푸터 모달 | FAQ/통관/배송국가/이용약관/개인정보 → t() 또는 CMS |
| **P3** | `029_banner_locales.sql` 적용 | 배너 zh-TW 지원 (현재 배너 0건) |
| **P3** | `030_event_locales.sql` 적용 | 이벤트 zh-TW 지원 (현재 이벤트 0건) |
| **P3** | 번들 크기 최적화 | React.lazy + manualChunks로 코드 스플리팅 |

---

## 6. 파일 변경 목록

| 파일 | 변경 유형 |
|------|----------|
| `locales/ko/common.json` | 키 추가 |
| `locales/zh-TW/common.json` | 키 추가 |
| `components/Layout.tsx` | i18n + 헤더 UX + 드롭다운 색상 |
| `components/SignupPage.tsx` | placeholder/SNS i18n |
| `components/ShippingAddressPage.tsx` | placeholder i18n |
| `components/HeroBanner.tsx` | fallback + aria i18n |
| `components/FooterModal.tsx` | aria i18n + import |
| `components/TierBenefitsModal.tsx` | aria i18n + import |
| `components/OrderDetailModal.tsx` | aria + 닫기 i18n + import |
| `components/ProductDetail.tsx` | 찜 aria i18n + categoryId 필터 |
| `components/LoginPage.tsx` | 카카오/네이버/구글 SVG 로고 |
| `App.tsx` | 카테고리 id 기반 전환 |
| `types.ts` | Product.categoryId 추가 |
| `lib/api/products.ts` | categoryId 매핑 |
| `lib/api/cart.ts` | category_id select + 매핑 |
| `lib/api/wishlists.ts` | category_id select + 매핑 |
| `database/032_category_locales.sql` | 테이블 생성 (DB 적용 완료) |
| `database/033_category_locales_zh_tw.sql` | zh-TW 데이터 (DB 적용 완료) |
