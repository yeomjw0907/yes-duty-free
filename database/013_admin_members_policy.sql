-- Yes Duty Free - Admin 회원(users) 조회·수정 RLS
-- 010_admin_users.sql 실행 후, 관리자로 로그인한 사용자는 전체 회원 조회 및 탈퇴(is_active)·등급·포인트 수정 가능.
-- SQL Editor에서 실행.

-- users: 관리자는 모든 회원 SELECT
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- users: 관리자는 회원 UPDATE (탈퇴 처리, 등급, 포인트, 이름, 전화번호 등)
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
