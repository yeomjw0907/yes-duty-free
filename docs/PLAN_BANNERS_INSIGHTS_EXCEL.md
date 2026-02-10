# 배너·인사이트·엑셀·송장 일괄 구현 계획 (Step by Step)

> 진행 순서와 단계별 작업 목록입니다. **한 단계 완료 후 다음 단계**로 진행하면 됩니다.

---

## 전체 순서 요약

| 순서 | 항목 | 요약 | 의존성 |
|------|------|------|--------|
| **1** | 배너 관리 | banners 테이블 + 관리자 CRUD + 메인 배너 연동 | 없음 |
| **2** | 인사이트 관리 | search_keywords 테이블 + 검색어 저장 + 관리자 조회·매출 트렌드 | orders 존재 |
| **3** | 엑셀 다운로드 | 주문 목록 → xlsx 파일 다운로드 | 주문 목록 API |
| **4** | 송장 일괄 등록 | 주문번호+송장번호 일괄 입력 → update | 주문 목록·수정 API |

---

## 1단계: 배너 관리

**목표**: 메인 히어로 배너를 DB로 관리하고, 관리자에서 등록·수정·삭제·순서 변경.

### 1-1. DB
- `020_banners.sql`: banners 테이블 생성  
  - 컬럼: id, title, subtitle, description, image_url, (mobile_image_url 선택), link_url, position(main/sub), display_order, valid_from, valid_until, tag_text, is_active, created_at, updated_at  
  - 인덱스: position+display_order, is_active+기간
- `021_admin_banners_policy.sql`: 공개 조회(노출 중인 것만) + 관리자 전부 CRUD

### 1-2. 백엔드/API
- `lib/upload.ts`: `uploadBannerImage()` (Storage `banners/` 경로)
- `lib/api/banners.ts`:  
  - `getBanners(position?)` (사이트용)  
  - `getAdminBanners()`, `createBanner()`, `updateBanner()`, `deleteBanner()`
- `types.ts`: BannerRow, Banner 타입

### 1-3. 관리자 UI
- AdminPanel 메뉴에 **배너 관리** 탭 추가 (이미 있으면 메뉴만 연결)
- 배너 목록 테이블: 썸네일, 제목, 위치, 순서, 기간, 노출, [수정][삭제]
- 등록/수정 폼: 제목, 서브타이틀, 설명, **이미지 업로드**, 링크 URL, 위치(main/sub), 노출 기간, 태그, 표시 순서, 활성
- 순서 변경: display_order 숫자 입력 또는 위/아래 버튼

### 1-4. 사이트 연동
- `HeroBanner.tsx`: 상수 `BANNERS` 제거 → `getBanners('main')` 호출로 슬라이드 데이터 사용, 클릭 시 link_url 이동

**완료 조건**: 관리자에서 배너 CRUD 가능, 메인 페이지에서 DB 배너가 슬라이드로 노출되고 링크 동작.

---

## 2단계: 인사이트 관리

**목표**: 인기 검색어 조회 + 매출 트렌드(일/주/월)를 관리자 화면에서 볼 수 있게.

### 2-1. DB
- `022_search_keywords.sql`: search_keywords 테이블 생성 (keyword, search_count, last_searched_at 등)
- `023_admin_search_keywords_policy.sql`:  
  - 공개: insert만 허용(검색 시 키워드 저장용), select는 관리자만  
  - 또는 anon이 insert, 관리자만 select (정책 설계에 따라)

### 2-2. 검색 시 키워드 저장
- 사이트에서 상품 검색 시 해당 검색어를 `search_keywords`에 insert 또는 upsert(검색 횟수 +1).  
  - 호출 위치: 검색 실행하는 API/훅 (예: useSearchProducts 사용처 또는 API 내부)

### 2-3. API
- `lib/api/insights.ts` (또는 admin 내부):  
  - `getSearchKeywords(limit?)`: 인기 검색어 목록  
  - `getSalesTrend(options)`: 일/주/월별 매출·주문 건수 (orders 집계)

### 2-4. 관리자 UI
- **인사이트 관리** 탭 구현  
  - **인기 검색어**: search_keywords 기반 목록 (키워드, 검색 횟수, 최근 검색일)  
  - **매출 트렌드**: 기간 선택(오늘/최근 7일/최근 30일) + 일별 또는 기간별 매출/주문 건수 표 (표 또는 간단 차트)

**완료 조건**: 관리자에서 인기 검색어와 매출 트렌드를 확인 가능.

---

## 3단계: 엑셀 다운로드

**목표**: 관리자 주문 목록을 엑셀(xlsx) 파일로 다운로드.

### 3-1. 패키지
- `xlsx` (sheetjs) 또는 `exceljs` 설치

### 3-2. 기능
- Admin 주문/해외배송 관리 화면에 **「엑셀 다운로드」** 버튼 추가  
- 현재 필터(상태 등)에 맞는 주문 목록을 가져와서  
  - 컬럼: 주문번호, 주문일시, 상태, 주문자, 연락처, 배송지, 상품명·수량·금액, 총액, 택배사, 송장번호 등  
- xlsx 생성 후 파일 다운로드 (예: `orders_YYYYMMDD_HHmm.xlsx`)

**완료 조건**: 버튼 클릭 시 현재 보이는 주문 목록이 엑셀 파일로 저장됨.

---

## 4단계: 송장 일괄 등록

**목표**: 여러 주문에 대해 주문번호(또는 ID)+택배사+송장번호를 한 번에 입력해 일괄 수정.

### 4-1. UI
- 주문/해외배송 관리에 **「송장 일괄 등록」** 버튼 또는 섹션 추가  
- 입력 방식 (택 1 또는 둘 다):  
  - **A**: 텍스트area에 “주문번호 탭 또는 쉼표 송장번호” 여러 줄 붙여넣기 → 파싱 후 일괄 update  
  - **B**: 테이블 폼으로 행 추가 (주문번호, 택배사, 송장번호) 여러 행 입력 후 일괄 저장

### 4-2. API
- `updateOrderByAdmin` 기존 활용 또는  
- `updateOrdersTrackingBulk([{ orderId, courier_company, tracking_number }])` 같은 일괄 API 추가

### 4-3. 검증
- 주문번호/ID 유효성, 중복 입력 체크, 실패한 행은 에러 메시지로 표시

**완료 조건**: 여러 주문의 택배사·송장번호를 한 번에 저장 가능.

---

## 권장 진행 순서 (한 단계씩)

1. **1단계 배너** → DB 실행 → API → 관리자 CRUD → HeroBanner 연동  
2. **2단계 인사이트** → DB 실행 → 검색어 저장 로직 → API → 관리자 인사이트 탭  
3. **3단계 엑셀** → 라이브러리 설치 → 주문 목록 → xlsx 생성·다운로드  
4. **4단계 송장 일괄** → UI 설계 → 일괄 API(필요 시) → 파싱·저장·에러 처리  

각 단계가 끝날 때마다 빌드/테스트 후 다음 단계로 넘기면 됩니다.
