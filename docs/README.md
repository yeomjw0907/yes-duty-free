# 문서 (docs)

프로젝트 명세·계획·설정·DB 설계 문서를 폴더별로 정리했습니다.  
`database/` 에서 .sql을 번호로 관리하는 것처럼, 여기서는 **역할별 폴더**로 .md를 관리합니다.

---

## 폴더 구조

| 폴더 | 용도 | 문서 예시 |
|------|------|-----------|
| **spec/** | 명세·기획 | ADMIN_PAGE_SPEC.md, WORK_SCOPE_2026-02-10.md, HOME_GRID_PLAN.md, FEATURES.md, FEATURES_ANALYSIS.md |
| **plan/** | 계획·작업 순서 | PLAN_BANNERS_INSIGHTS_EXCEL.md, STEP_BY_STEP.md, WORK_SUMMARY.md |
| **setup/** | 배포·설정·참고 | DEPLOY.md, SUPABASE_SETUP.md, PAYMENT_COST_ANALYSIS_TW.md |
| **database/** | DB 설계·테이블 요약 | DATABASE_DESIGN.md, TABLES_SUMMARY.md |
| **updates/** | 업데이트·변경 내역 | UPDATES_CHANGELOG.md |

---

## 루트에 두는 문서

- **README.md** — 프로젝트 개요·실행 방법
- **TODO.md** — 할 일 목록

DB 스키마·마이그레이션은 **`database/`** 폴더의 번호 붙은 .sql 파일로 관리합니다.
