-- Yes Duty Free - Orders UPDATE RLS (주문 완료 후 earned_points 등 갱신용)
-- 회원 등급 시스템(Step 10)에서 주문 완료 시 포인트 적립을 위해 필요. SQL Editor에서 실행.

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);
