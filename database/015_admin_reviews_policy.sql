-- Yes Duty Free - 리뷰 숨김 처리 + Admin 리뷰 관리 RLS
-- 010_admin_users.sql 실행 후 사용. SQL Editor에서 실행.

-- 리뷰 숨김 컬럼 추가 (부적절 리뷰 비노출용)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- 기존 "Anyone can view reviews" 제거 후, 비숨김 또는 관리자만 조회 가능하도록 변경
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "View non-hidden or admin" ON reviews
  FOR SELECT USING (
    is_hidden = false
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 관리자는 모든 리뷰 수정 (숨김 처리)
CREATE POLICY "Admins can update reviews" ON reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
