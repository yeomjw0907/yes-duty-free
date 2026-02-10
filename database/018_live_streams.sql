-- Yes Duty Free - 라이브 방송 (live_streams)
-- 관리자에서 등록·수정, 사이트 라이브 페이지에서 임베드 재생. SQL Editor에서 실행.

CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  title TEXT NOT NULL,
  thumbnail_url TEXT,
  -- 영상 임베드용 URL (페이스북/유튜브 등 iframe src 또는 공유 URL)
  video_embed_url TEXT,
  -- 연결 상품 (선택, 클릭 시 해당 상품 상세로)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  -- 예정일·상태
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  -- 표시 순서·노출
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  -- (선택) 시청자 수 표시용
  viewer_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_live_streams_status ON live_streams(status);
CREATE INDEX idx_live_streams_active_order ON live_streams(is_active, display_order, scheduled_at DESC);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- 공개: 노출 중인 라이브만 조회
CREATE POLICY "Public can view active live streams" ON live_streams
  FOR SELECT USING (is_active = true);
