-- Yes Duty Free - 카테고리 zh-TW(繁體中文) 로케일 추가
-- 032_category_locales.sql 실행 후 사용. categories 테이블의 name 기준으로 zh-TW 이름 삽입.

INSERT INTO category_locales (category_id, locale, name)
SELECT id, 'zh-TW',
  CASE name
    WHEN '뷰티' THEN '美妝'
    WHEN '패션' THEN '時尚'
    WHEN '푸드' THEN '食品'
    WHEN '전자' THEN '電子'
    WHEN '럭셔리' THEN '精品'
    WHEN '테크·가전' THEN '科技·家電'
    WHEN '홈·리빙' THEN '家居·生活'
    WHEN '스포츠' THEN '運動'
    WHEN '도서' THEN '圖書'
    ELSE name
  END
FROM categories
ON CONFLICT (category_id, locale) DO UPDATE SET name = EXCLUDED.name;
