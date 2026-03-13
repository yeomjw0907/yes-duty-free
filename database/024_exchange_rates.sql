-- Yes Duty Free - 환율 정보 (exchange_rates)
-- 해외 배송/표시용 환율 저장. SQL Editor에서 실행.

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency_code TEXT NOT NULL,
  rate NUMERIC NOT NULL CHECK (rate > 0),
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency ON exchange_rates(currency_code);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_valid ON exchange_rates(valid_from, valid_until);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- 공개: 최신 환율 조회 허용 (표시용)
CREATE POLICY "Public can select exchange_rates" ON exchange_rates
  FOR SELECT USING (true);

