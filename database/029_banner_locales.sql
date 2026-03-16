-- Yes Duty Free - 배너 로케일 테이블 (banner_locales)
-- 020_banners.sql, 021_admin_banners_policy.sql 실행 후 사용. 기존 banners 컬럼은 유지(이중 저장·롤백용).

CREATE TABLE IF NOT EXISTS banner_locales (
  banner_id UUID NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  tag_text TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  PRIMARY KEY (banner_id, locale),
  CONSTRAINT banner_locales_locale_check CHECK (locale IN ('ko', 'zh-TW', 'en'))
);

CREATE INDEX idx_banner_locales_banner_id ON banner_locales(banner_id);
CREATE INDEX idx_banner_locales_locale ON banner_locales(locale);

COMMENT ON TABLE banner_locales IS '배너 그룹별 언어별 텍스트·이미지. locale: ko, zh-TW, en';

ALTER TABLE banner_locales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active banner locales" ON banner_locales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM banners b
      WHERE b.id = banner_locales.banner_id
        AND b.is_active = true
        AND (b.valid_from IS NULL OR b.valid_from <= NOW())
        AND (b.valid_until IS NULL OR b.valid_until >= NOW())
    )
  );

CREATE POLICY "Admins can select all banner locales" ON banner_locales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can insert banner locales" ON banner_locales
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can update banner locales" ON banner_locales
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can delete banner locales" ON banner_locales
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

INSERT INTO banner_locales (banner_id, locale, title, subtitle, description, tag_text, image_url, mobile_image_url, link_url)
SELECT id, 'ko', title, subtitle, description, tag_text, image_url, mobile_image_url, link_url
FROM banners
ON CONFLICT (banner_id, locale) DO NOTHING;
