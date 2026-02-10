-- Yes Duty Free - 공지/이벤트 (events)
-- 게시판 목록·상세 및 메인 팝업용. SQL Editor에서 실행.

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 제목/내용
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  content_html TEXT,

  -- 타입: notice(공지), event(이벤트)
  type TEXT NOT NULL DEFAULT 'notice' CHECK (type IN ('notice', 'event')),

  -- 메인 팝업용: 이미지 URL(Storage 업로드), 클릭 시 이동 URL
  popup_image_url TEXT,
  link_url TEXT,

  -- 메인에 팝업으로 노출 여부
  is_popup BOOLEAN DEFAULT false,

  -- 게시 기간 (null이면 무제한)
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,

  -- 노출 순서·상태
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_active_dates ON events(is_active, starts_at, ends_at);
CREATE INDEX idx_events_popup ON events(is_popup) WHERE is_popup = true;
CREATE INDEX idx_events_display ON events(display_order, created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 공개: 노출 중인 행만 조회 (기간 내, is_active)
CREATE POLICY "Public can view active events in period" ON events
  FOR SELECT USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );
