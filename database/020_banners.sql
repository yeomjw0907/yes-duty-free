-- Yes Duty Free - 배너 (banners)
-- 메인/서브 배너 관리. SQL Editor에서 실행.

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,

  image_url TEXT NOT NULL,
  mobile_image_url TEXT,

  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'main' CHECK (position IN ('main', 'sub')),

  display_order INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  tag_text TEXT,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_banners_position ON banners(position, display_order);
CREATE INDEX idx_banners_active ON banners(is_active, valid_from, valid_until);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- 공개: 노출 중인 배너만 조회 (기간 내, is_active)
CREATE POLICY "Public can view active banners" ON banners
  FOR SELECT USING (
    is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
  );
