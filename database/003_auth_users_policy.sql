-- Step 6: 회원가입 시 public.users에 프로필 생성 허용
-- Supabase SQL Editor에서 001, 002 실행 후 이 파일 실행

-- 사용자가 본인 id로만 INSERT 가능 (회원가입 직후 프로필 생성용)
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
