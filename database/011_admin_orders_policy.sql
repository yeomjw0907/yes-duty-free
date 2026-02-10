-- Yes Duty Free - Admin 주문/order_items 조회·수정 RLS
-- 010_admin_users.sql 실행 후, 관리자로 로그인한 사용자는 전체 주문 조회 및 물류 정보 수정 가능.
-- SQL Editor에서 실행.

-- orders: 관리자는 모든 주문 SELECT 가능
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- orders: 관리자는 주문 UPDATE 가능 (상태, 택배사, 송장, admin_memo 등)
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- order_items: 관리자는 모든 주문의 order_items SELECT 가능 (주문 목록에서 상품 보기용)
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
