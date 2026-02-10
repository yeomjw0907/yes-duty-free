-- Yes Duty Free - Admin 상품/products·product_options 조회·수정 RLS
-- 010_admin_users.sql 실행 후, 관리자로 로그인한 사용자는 상품 전체 조회 및 등록/수정/삭제 가능.
-- SQL Editor에서 실행.

-- products: 관리자는 모든 상품 SELECT (비노출 포함)
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- products: 관리자는 상품 INSERT
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- products: 관리자는 상품 UPDATE
CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- products: 관리자는 상품 DELETE (필요 시 비노출 권장)
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- product_options: 관리자는 모든 옵션 SELECT
CREATE POLICY "Admins can view all product options" ON product_options
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- product_options: 관리자는 옵션 INSERT
CREATE POLICY "Admins can insert product options" ON product_options
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- product_options: 관리자는 옵션 UPDATE
CREATE POLICY "Admins can update product options" ON product_options
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- product_options: 관리자는 옵션 DELETE
CREATE POLICY "Admins can delete product options" ON product_options
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
