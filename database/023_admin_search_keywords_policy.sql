-- Yes Duty Free - 관리자 search_keywords 조회 RLS
-- 010_admin_users.sql, 022_search_keywords.sql 실행 후 사용. SQL Editor에서 실행.

CREATE POLICY "Admins can select search_keywords" ON search_keywords
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
