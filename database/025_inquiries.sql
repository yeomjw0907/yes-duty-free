-- Yes Duty Free - 1:1 문의 (inquiries)
-- 사용자 문의 등록/조회 및 관리자 답변용. SQL Editor에서 실행.

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  subject TEXT NOT NULL,
  message TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_user_created ON inquiries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created ON inquiries(status, created_at DESC);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 사용자: 본인 문의만 조회
CREATE POLICY "Users can select own inquiries" ON inquiries
  FOR SELECT USING (user_id = auth.uid());

-- 사용자: 본인 문의만 등록
CREATE POLICY "Users can insert own inquiries" ON inquiries
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 관리자: 전체 조회
CREATE POLICY "Admins can select inquiries" ON inquiries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 관리자: 답변/상태 업데이트
CREATE POLICY "Admins can update inquiries" ON inquiries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

