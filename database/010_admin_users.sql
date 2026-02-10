-- Yes Duty Free - Admin Users (관리자 계정)
-- 관리자는 Supabase Auth로 로그인하며, 이 테이블에 등록된 user_id만 Admin 패널 접근·전체 주문 조회/수정 가능.
-- SQL Editor에서 실행.

-- auth.users는 Supabase Auth 스키마에 있음. public에서 참조 가능.
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_users_user ON admin_users(user_id);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 본인 행만 조회 가능 (앱에서 "현재 로그인 사용자가 관리자인지" 확인용)
CREATE POLICY "Users can view own admin row" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- 최초 관리자 등록: Supabase 대시보드 → Authentication → Users 에서 관리자 이메일로 가입한 뒤,
-- 아래에서 해당 user_id로 INSERT (예시는 주석).
-- INSERT INTO admin_users (user_id) SELECT id FROM auth.users WHERE email = 'admin@onecation.co.kr' LIMIT 1;
