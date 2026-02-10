# 업데이트 내역 (Changelog)

> Yes Duty Free 프로젝트에서 반영된 기능·변경 사항 목록입니다.

---

## 공지/이벤트 관리 (1번)

- **DB**: `016_events.sql`, `017_admin_events_policy.sql` — events 테이블, 공개/관리자 RLS
- **이미지 업로드**: `lib/upload.ts` — `uploadEventImage()` (Storage `events/`)
- **타입**: `types.ts` — `EventRow`
- **API**: `lib/api/events.ts` — getPopupEvents, getEvents, getEventById, getAdminEvents, createEvent, updateEvent, deleteEvent
- **관리자**: 공지/이벤트 관리 탭 — 목록, 등록/수정/삭제, 팝업 이미지 업로드, 클릭 시 이동 URL, 메인 팝업 노출, 노출 기간
- **메인 팝업**: `MainPopupModal.tsx` — 메인 진입 시 팝업, 오늘 하루 안 보기
- **게시판**: 공지사항 목록/상세, 이벤트 목록/상세 페이지, 푸터 링크(공지사항·이벤트)

---

## 라이브 방송 관리 (2번)

- **DB**: `018_live_streams.sql`, `019_admin_live_streams_policy.sql` — live_streams 테이블, RLS
- **이미지 업로드**: `lib/upload.ts` — `uploadLiveThumbnail()` (Storage `live/`)
- **타입**: `types.ts` — `LiveStreamRow`, `LiveStream` 확장 (videoEmbedUrl, productId)
- **API**: `lib/api/liveStreams.ts` — getLiveStreams, getLiveStreamById, getAdminLiveStreams, create/update/delete
- **관리자**: 라이브 방송 관리 탭 — 목록, 등록/수정/삭제, 썸네일 업로드, 영상 임베드 URL, 연결 상품, 예정일, 상태
- **사이트**: 메인 “지금 뜨는 라방”·라이브 전용 페이지 — 실데이터 연동, 영상 임베드 iframe, 실시간 혜택받기(연결 상품)

---

## 배너 관리 (1단계)

- **DB**: `020_banners.sql`, `021_admin_banners_policy.sql` — banners 테이블, RLS
- **이미지 업로드**: `lib/upload.ts` — `uploadBannerImage()` (Storage `banners/`)
- **타입**: `types.ts` — `BannerRow`, `BannerSlide`
- **API**: `lib/api/banners.ts` — getBanners(position?), getAdminBanners, create/update/delete
- **관리자**: 배너 관리 탭 — 목록, 등록/수정/삭제, 이미지 업로드, 링크 URL, 위치(main/sub), 노출 기간, 순서
- **사이트**: `HeroBanner.tsx` — DB 배너 연동(getBanners('main')), fallback 배너, 링크 동작

---

## 인사이트 관리 (2단계)

- **DB**: `022_search_keywords.sql`, `023_admin_search_keywords_policy.sql` — search_keywords 테이블, record_search_keyword 함수, RLS
- **검색 시 기록**: `lib/api/products.ts` — searchProducts 성공 시 recordSearchKeyword 호출
- **API**: `lib/api/insights.ts` — recordSearchKeyword, getSearchKeywords, getSalesTrend(7d/30d)
- **관리자**: 인사이트 관리 탭 — 인기 검색어 목록(순위·키워드·검색 횟수·최근 검색), 매출 트렌드(최근 7일/30일 일별 주문·매출)

---

## 엑셀 다운로드 (3단계)

- **패키지**: xlsx (SheetJS) 설치
- **유틸**: `lib/exportOrdersToExcel.ts` — exportOrdersToExcel(orders), 주문번호·일시·상태·수령인·연락처·배송지·상품내역·금액·택배·송장·메모 등
- **관리자**: 주문/해외배송 관리 — “엑셀 다운로드” 버튼(현재 필터 기준 주문 목록 xlsx 저장)

---

## 송장 일괄 등록 (4단계)

- **관리자**: 주문/해외배송 관리 — “송장 일괄 등록” 버튼, 모달
- **기능**: 텍스트area 붙여넣기(한 줄에 주문번호·택배사·송장번호, 탭/쉼표 구분) → 현재 목록 기준 일괄 update, 성공/실패 결과 표시

---

## DB 스키마 추가 요약

| 파일 | 테이블/내용 |
|------|-------------|
| 016_events.sql | events (공지/이벤트) |
| 017_admin_events_policy.sql | events 관리자 RLS |
| 018_live_streams.sql | live_streams |
| 019_admin_live_streams_policy.sql | live_streams 관리자 RLS |
| 020_banners.sql | banners |
| 021_admin_banners_policy.sql | banners 관리자 RLS |
| 022_search_keywords.sql | search_keywords + record_search_keyword 함수 |
| 023_admin_search_keywords_policy.sql | search_keywords 관리자 RLS |

---

## 문서/폴더 구조 (정리 후)

- `docs/updates/` — 업데이트·변경 내역 (본 파일)
- `docs/spec/` — 명세·기획
- `docs/plan/` — 계획·작업 순서
- `docs/setup/` — 배포·설정·참고
- `docs/database/` — DB 설계·테이블 요약
