-- Yes Duty Free - 상품 로케일 테이블 (product_locales)
-- 001_initial_schema.sql, 028_products_locale_zh.sql, 012_admin_products_policy.sql 실행 후 사용.
-- 기존 products의 name, description, detail_html, name_zh 등은 유지(이중 저장·롤백용).

CREATE TABLE IF NOT EXISTS product_locales (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  detail_html TEXT,
  price_twd INTEGER CHECK (price_twd IS NULL OR price_twd >= 0),
  PRIMARY KEY (product_id, locale),
  CONSTRAINT product_locales_locale_check CHECK (locale IN ('ko', 'zh-TW', 'en'))
);

CREATE INDEX idx_product_locales_product_id ON product_locales(product_id);
CREATE INDEX idx_product_locales_locale ON product_locales(locale);

COMMENT ON TABLE product_locales IS '상품별 언어별 이름·설명·상세 HTML·대만가격. locale: ko, zh-TW, en';

ALTER TABLE product_locales ENABLE ROW LEVEL SECURITY;

-- 공개: 부모 상품이 활성일 때만 해당 로케일 행 조회
CREATE POLICY "Public can view active product locales" ON product_locales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_locales.product_id AND p.is_active = true)
  );

-- 관리자: 전체 조회·삽입·수정·삭제
CREATE POLICY "Admins can select all product locales" ON product_locales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can insert product locales" ON product_locales
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can update product locales" ON product_locales
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can delete product locales" ON product_locales
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 마이그레이션: ko
INSERT INTO product_locales (product_id, locale, name, description, detail_html, price_twd)
SELECT id, 'ko', name, description, detail_html, NULL
FROM products
ON CONFLICT (product_id, locale) DO NOTHING;

-- 마이그레이션: zh-TW (name_zh 있는 경우)
INSERT INTO product_locales (product_id, locale, name, description, detail_html, price_twd)
SELECT id, 'zh-TW', COALESCE(NULLIF(TRIM(name_zh), ''), name), description_zh, detail_html_zh, price_twd
FROM products
WHERE name_zh IS NOT NULL AND TRIM(name_zh) <> ''
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  detail_html = EXCLUDED.detail_html,
  price_twd = EXCLUDED.price_twd;

-- zh-TW 행이 없는 상품은 ko 기준으로 추가
INSERT INTO product_locales (product_id, locale, name, description, detail_html, price_twd)
SELECT id, 'zh-TW', name, description, detail_html, price_twd
FROM products
WHERE id NOT IN (SELECT product_id FROM product_locales WHERE locale = 'zh-TW')
ON CONFLICT (product_id, locale) DO NOTHING;
