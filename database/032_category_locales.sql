-- Yes Duty Free - 카테고리 로케일 테이블 (category_locales)
-- 001_initial_schema.sql 실행 후 사용. 기존 categories.name, name_en 은 유지(이중 저장·롤백용).

CREATE TABLE IF NOT EXISTS category_locales (
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (category_id, locale),
  CONSTRAINT category_locales_locale_check CHECK (locale IN ('ko', 'zh-TW', 'en'))
);

CREATE INDEX idx_category_locales_category_id ON category_locales(category_id);
CREATE INDEX idx_category_locales_locale ON category_locales(locale);

COMMENT ON TABLE category_locales IS '카테고리별 언어별 이름. locale: ko, zh-TW, en';

ALTER TABLE category_locales ENABLE ROW LEVEL SECURITY;

-- 공개: 부모 카테고리가 활성일 때만 해당 로케일 행 조회
CREATE POLICY "Public can view active category locales" ON category_locales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM categories c WHERE c.id = category_locales.category_id AND c.is_active = true)
  );

-- 관리자: 전체 조회·삽입·수정·삭제 (010_admin_users.sql 실행 후)
CREATE POLICY "Admins can select all category locales" ON category_locales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can insert category locales" ON category_locales
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can update category locales" ON category_locales
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can delete category locales" ON category_locales
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 마이그레이션: ko — categories.name
INSERT INTO category_locales (category_id, locale, name)
SELECT id, 'ko', name
FROM categories
ON CONFLICT (category_id, locale) DO NOTHING;

-- 마이그레이션: en — categories.name_en (있을 때)
INSERT INTO category_locales (category_id, locale, name)
SELECT id, 'en', COALESCE(NULLIF(TRIM(name_en), ''), name)
FROM categories
WHERE name_en IS NOT NULL AND TRIM(name_en) <> ''
ON CONFLICT (category_id, locale) DO NOTHING;

-- name_en 없는 카테고리는 ko 이름으로 en 행 추가 (선택)
INSERT INTO category_locales (category_id, locale, name)
SELECT id, 'en', name
FROM categories
WHERE id NOT IN (SELECT category_id FROM category_locales WHERE locale = 'en')
ON CONFLICT (category_id, locale) DO NOTHING;
