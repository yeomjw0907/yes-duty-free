-- Yes Duty Free - Admin 쿠폰(coupons)·user_coupons 조회·수정 RLS
-- 010_admin_users.sql 실행 후, 관리자로 로그인한 사용자는 쿠폰 전체 조회·생성·수정, user_coupons 조회 가능.
-- SQL Editor에서 실행.

-- coupons: 관리자는 모든 쿠폰 SELECT (비활성 포함)
CREATE POLICY "Admins can view all coupons" ON coupons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- coupons: 관리자는 쿠폰 INSERT
CREATE POLICY "Admins can insert coupons" ON coupons
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- coupons: 관리자는 쿠폰 UPDATE
CREATE POLICY "Admins can update coupons" ON coupons
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- user_coupons: 관리자는 모든 user_coupons SELECT (쿠폰별 발급·사용 건수 집계용)
CREATE POLICY "Admins can view all user_coupons" ON user_coupons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
