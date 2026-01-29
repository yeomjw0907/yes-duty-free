-- Yes Duty Free - Orders / Order Items INSERT RLS
-- Step 9: 주문 생성 시 필요. Supabase SQL Editor에서 실행.

-- Orders: 본인이 주문 생성 가능
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items: 본인 주문에 대해서만 아이템 추가 가능
CREATE POLICY "Users can insert order items for own orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );
