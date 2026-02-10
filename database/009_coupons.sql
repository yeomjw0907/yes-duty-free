-- Yes Duty Free - Coupons & User Coupons
-- SQL Editor에서 실행.

-- ============================================
-- COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order_amount INTEGER DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount INTEGER,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_valid ON coupons(valid_until);

-- ============================================
-- USER_COUPONS TABLE (발급/보유 쿠폰)
-- ============================================
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_coupon ON user_coupons(coupon_id);
CREATE INDEX idx_user_coupons_used ON user_coupons(user_id, is_used);

ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- 본인 user_coupons만 조회
CREATE POLICY "Users can view own user_coupons" ON user_coupons
  FOR SELECT USING (auth.uid() = user_id);

-- 주문 시 used_coupon_id로 orders 참조. orders 테이블에 FK 추가 (user_coupons 생성 후)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_used_coupon;
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_used_coupon
  FOREIGN KEY (used_coupon_id) REFERENCES user_coupons(id) ON DELETE SET NULL;

-- user_coupons.order_id는 위에서 orders 참조. orders가 먼저 있어서 순환 가능. FK를 나중에 걸거나 제거.
-- 순환 방지: user_coupons에 order_id FK 없이 두고, 주문 생성 시 used_coupon_id만 orders에 저장.
-- 필요 시 나중에 order_id 컬럼 추가 가능.

-- 트리거: coupons.updated_at
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS: coupons는 모두 조회 (공개)
-- ============================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active coupons" ON coupons
  FOR SELECT USING (is_active = true);

-- ============================================
-- SEED: 샘플 쿠폰 (선택)
-- ============================================
INSERT INTO coupons (id, code, title, discount_type, discount_value, min_order_amount, max_discount_amount, valid_until, is_active)
VALUES
  (uuid_generate_v4(), 'WELCOME3000', '신규 가입 3,000원 할인', 'fixed', 3000, 30000, NULL, NOW() + INTERVAL '1 year', true),
  (uuid_generate_v4(), 'PERCENT10', '10% 할인 (최대 1만원)', 'percent', 10, 50000, 10000, NOW() + INTERVAL '1 year', true)
ON CONFLICT (code) DO NOTHING;
