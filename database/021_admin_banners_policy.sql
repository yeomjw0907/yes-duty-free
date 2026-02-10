-- Yes Duty Free - 관리자 배너(banners) RLS
-- 010_admin_users.sql, 020_banners.sql 실행 후 사용. SQL Editor에서 실행.

CREATE POLICY "Admins can select all banners" ON banners
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert banners" ON banners
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update banners" ON banners
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete banners" ON banners
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
