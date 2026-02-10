-- Yes Duty Free - 관리자 라이브(live_streams) RLS
-- 010_admin_users.sql, 018_live_streams.sql 실행 후 사용. SQL Editor에서 실행.

CREATE POLICY "Admins can select all live streams" ON live_streams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert live streams" ON live_streams
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update live streams" ON live_streams
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete live streams" ON live_streams
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
