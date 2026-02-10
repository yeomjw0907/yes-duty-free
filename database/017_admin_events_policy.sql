-- Yes Duty Free - 관리자 공지/이벤트(events) RLS
-- 010_admin_users.sql, 016_events.sql 실행 후 사용. SQL Editor에서 실행.

-- 관리자는 events 전체 조회
CREATE POLICY "Admins can select all events" ON events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 관리자는 events insert/update/delete
CREATE POLICY "Admins can insert events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update events" ON events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
