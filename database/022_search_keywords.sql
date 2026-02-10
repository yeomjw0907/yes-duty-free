-- Yes Duty Free - 검색 키워드 (search_keywords) + 기록 함수
-- 인기 검색어 집계용. SQL Editor에서 실행.

CREATE TABLE IF NOT EXISTS search_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_search_keywords_keyword ON search_keywords(keyword);
CREATE INDEX idx_search_keywords_count ON search_keywords(search_count DESC);

ALTER TABLE search_keywords ENABLE ROW LEVEL SECURITY;

-- 검색 기록용 함수 (anon/authenticated 호출, RLS 우회)
CREATE OR REPLACE FUNCTION record_search_keyword(p_keyword TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NULLIF(TRIM(p_keyword), '') IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO search_keywords (keyword, search_count, last_searched_at)
  VALUES (TRIM(p_keyword), 1, NOW())
  ON CONFLICT (keyword)
  DO UPDATE SET
    search_count = search_keywords.search_count + 1,
    last_searched_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION record_search_keyword(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION record_search_keyword(TEXT) TO authenticated;
