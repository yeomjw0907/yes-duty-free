-- Yes Duty Free - Public search_keywords SELECT RLS
-- 일반 사용자(anon/authenticated)가 인기 검색어를 조회할 수 있도록 SELECT 권한을 허용합니다.
-- 022_search_keywords.sql 실행 후, SQL Editor에서 실행하세요.

-- NOTE: search_keywords는 SECURITY DEFINER 함수(record_search_keyword)로만 insert/upsert 됩니다.
-- 여기서는 조회(SELECT)만 공개합니다.

CREATE POLICY "Public can select search_keywords" ON search_keywords
  FOR SELECT USING (true);

