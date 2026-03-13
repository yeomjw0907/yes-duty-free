-- Yes Duty Free - 첫 구매 쿠폰 시드 (선택)
-- 주문 완료(첫 구매) 후 자동 발급용 쿠폰을 추가합니다.
-- 009_coupons.sql 실행 이후, SQL Editor에서 실행하세요.

INSERT INTO coupons (id, code, title, discount_type, discount_value, min_order_amount, max_discount_amount, valid_until, is_active)
VALUES (uuid_generate_v4(), 'FIRSTORDER5000', '첫 구매 5,000원 할인', 'fixed', 5000, 50000, NULL, NOW() + INTERVAL '1 year', true)
ON CONFLICT (code) DO NOTHING;

