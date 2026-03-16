-- Yes Duty Free - 공지/이벤트 로케일 테이블 (event_locales)
-- 016_events.sql, 017_admin_events_policy.sql 실행 후 사용. 기존 events 컬럼은 유지(이중 저장·롤백용).

CREATE TABLE IF NOT EXISTS event_locales (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  content_html TEXT,
  popup_image_url TEXT,
  link_url TEXT,
  PRIMARY KEY (event_id, locale),
  CONSTRAINT event_locales_locale_check CHECK (locale IN ('ko', 'zh-TW', 'en'))
);

CREATE INDEX idx_event_locales_event_id ON event_locales(event_id);
CREATE INDEX idx_event_locales_locale ON event_locales(locale);

COMMENT ON TABLE event_locales IS '공지/이벤트 그룹별 언어별 제목·내용. locale: ko, zh-TW, en';

ALTER TABLE event_locales ENABLE ROW LEVEL SECURITY;

-- 공개: 부모 이벤트가 노출 중일 때만 해당 로케일 행 조회
CREATE POLICY "Public can view active event locales" ON event_locales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_locales.event_id
        AND e.is_active = true
        AND (e.starts_at IS NULL OR e.starts_at <= NOW())
        AND (e.ends_at IS NULL OR e.ends_at >= NOW())
    )
  );

-- 관리자: 전체 조회·삽입·수정·삭제
CREATE POLICY "Admins can select all event locales" ON event_locales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can insert event locales" ON event_locales
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can update event locales" ON event_locales
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can delete event locales" ON event_locales
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 마이그레이션: 기존 events 행마다 locale='ko' 로 event_locales에 삽입
INSERT INTO event_locales (event_id, locale, title, content, content_html, popup_image_url, link_url)
SELECT id, 'ko', title, COALESCE(content, ''), content_html, popup_image_url, link_url
FROM events
ON CONFLICT (event_id, locale) DO NOTHING;
