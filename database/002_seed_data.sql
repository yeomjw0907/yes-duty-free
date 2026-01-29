-- Yes Duty Free - Seed Data
-- 초기 테스트 데이터

-- ============================================
-- 1. CATEGORIES
-- ============================================
INSERT INTO categories (name, name_en, icon, display_order) VALUES
('뷰티', 'Beauty', '💄', 1),
('패션', 'Fashion', '👗', 2),
('푸드', 'Food', '🍔', 3),
('전자', 'Electronics', '📱', 4),
('럭셔리', 'Luxury', '💎', 5),
('테크·가전', 'Tech', '💻', 6),
('홈·리빙', 'Living', '🏠', 7),
('스포츠', 'Sports', '⚽', 8),
('도서', 'Books', '📚', 9)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. PRODUCTS
-- ============================================
WITH cat_beauty AS (
  SELECT id FROM categories WHERE name = '뷰티' LIMIT 1
),
cat_tech AS (
  SELECT id FROM categories WHERE name = '테크·가전' LIMIT 1
),
cat_food AS (
  SELECT id FROM categories WHERE name = '푸드' LIMIT 1
),
cat_fashion AS (
  SELECT id FROM categories WHERE name = '패션' LIMIT 1
)

INSERT INTO products (
  name, brand, price, original_price, image_url, 
  category_id, sub_category, tags, sold_count, 
  stock_quantity, is_active, description
) VALUES
-- 뷰티
(
  '갈색병 어드밴스드 나이트 리페어 50ml',
  '에스티로더',
  125000,
  155000,
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
  (SELECT id FROM cat_beauty),
  '스킨케어',
  ARRAY['Best Seller', 'Duty Free Exclusive'],
  1250,
  50,
  true,
  '전세계 면세점에서 가장 사랑받는 에스티로더의 시그니처 세럼입니다.'
),

-- 테크·가전
(
  '에어팟 프로 2세대 USB-C',
  'Apple',
  289000,
  359000,
  'https://images.unsplash.com/photo-1588423770674-f2855ee476e7?auto=format&fit=crop&q=80&w=600',
  (SELECT id FROM cat_tech),
  '생활가전',
  ARRAY['Hot', 'Limit 1'],
  850,
  100,
  true,
  '액티브 노이즈 캔슬링과 공간 오디오를 경험하세요.'
),

-- 푸드
(
  '정관장 홍삼정 에브리타임 30포',
  '정관장',
  85000,
  102000,
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
  (SELECT id FROM cat_food),
  '건강식품',
  ARRAY['Gift', 'Popular'],
  3400,
  200,
  true,
  '언제 어디서나 간편하게 즐기는 홍삼 건강 솔루션'
),

-- 패션
(
  '오버사이즈 울 캐시미어 코트',
  '우영미',
  890000,
  1200000,
  'https://images.unsplash.com/photo-1539533318447-63bc97672208?auto=format&fit=crop&q=80&w=600',
  (SELECT id FROM cat_fashion),
  '의류',
  ARRAY['Premium'],
  12,
  10,
  true,
  '한국 디자이너 브랜드 우영미의 시그니처 코트'
),

(
  '모노그램 자카드 셔츠',
  '아미',
  245000,
  320000,
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
  (SELECT id FROM cat_fashion),
  '의류',
  ARRAY['Best'],
  450,
  30,
  true,
  '프랑스 브랜드 아미의 클래식 셔츠'
);

-- ============================================
-- 3. PRODUCT OPTIONS
-- ============================================
DO $$
DECLARE
  product_serum_id UUID;
  product_coat_id UUID;
  product_shirt_id UUID;
BEGIN
  -- 에스티로더 세럼 옵션
  SELECT id INTO product_serum_id FROM products WHERE name LIKE '%어드밴스드 나이트 리페어%' LIMIT 1;
  
  IF product_serum_id IS NOT NULL THEN
    INSERT INTO product_options (product_id, option_name, option_value, price_difference, stock_quantity, display_order) VALUES
    (product_serum_id, '용량', '50ml', 0, 50, 1),
    (product_serum_id, '용량', '75ml', 40000, 30, 2),
    (product_serum_id, '용량', '100ml', 80000, 20, 3);
  END IF;

  -- 우영미 코트 옵션
  SELECT id INTO product_coat_id FROM products WHERE name LIKE '%캐시미어 코트%' LIMIT 1;
  
  IF product_coat_id IS NOT NULL THEN
    INSERT INTO product_options (product_id, option_name, option_value, price_difference, stock_quantity, display_order) VALUES
    (product_coat_id, '사이즈', '46(S)', 0, 3, 1),
    (product_coat_id, '사이즈', '48(M)', 0, 4, 2),
    (product_coat_id, '사이즈', '50(L)', 0, 2, 3),
    (product_coat_id, '사이즈', '52(XL)', 0, 1, 4);
  END IF;

  -- 아미 셔츠 옵션
  SELECT id INTO product_shirt_id FROM products WHERE name LIKE '%모노그램%' LIMIT 1;
  
  IF product_shirt_id IS NOT NULL THEN
    INSERT INTO product_options (product_id, option_name, option_value, price_difference, stock_quantity, display_order) VALUES
    (product_shirt_id, '사이즈', 'XS', 0, 5, 1),
    (product_shirt_id, '사이즈', 'S', 0, 10, 2),
    (product_shirt_id, '사이즈', 'M', 0, 10, 3),
    (product_shirt_id, '사이즈', 'L', 0, 5, 4),
    (product_shirt_id, '컬러', '화이트', 0, 10, 1),
    (product_shirt_id, '컬러', '블랙', 0, 10, 2),
    (product_shirt_id, '컬러', '네이비', 0, 10, 3);
  END IF;
END $$;

-- ============================================
-- 4. TEST USER (개발용)
-- ============================================
-- 비밀번호: test1234
-- bcrypt hash는 실제로는 Supabase Auth를 통해 생성됨
INSERT INTO users (email, name, phone, membership_tier, points) VALUES
('test@example.com', '테스트 사용자', '010-1234-5678', 'premium', 50000)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 5. SHIPPING ADDRESS (테스트용)
-- ============================================
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com' LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    INSERT INTO shipping_addresses (
      user_id, recipient_name, phone, country, city, 
      address_line1, address_line2, is_default
    ) VALUES
    (
      test_user_id,
      '홍길동',
      '+1 213-445-1234',
      'USA',
      'Los Angeles',
      '1234 Wilshire Blvd',
      'Apt 5B',
      true
    ),
    (
      test_user_id,
      'Yuki Tanaka',
      '+81 90-1234-5678',
      'Japan',
      'Tokyo',
      '2-chrome-1, Shinjuku',
      '',
      false
    );
  END IF;
END $$;

-- ============================================
-- 6. 통계 업데이트
-- ============================================
-- 상품 평점 (임의 값)
UPDATE products SET rating = 4.8 WHERE brand = '에스티로더';
UPDATE products SET rating = 4.9 WHERE brand = 'Apple';
UPDATE products SET rating = 4.7 WHERE brand = '정관장';
UPDATE products SET rating = 4.6 WHERE brand = '우영미';
UPDATE products SET rating = 4.8 WHERE brand = '아미';

COMMIT;

-- ============================================
-- 확인 쿼리
-- ============================================
SELECT 
  '카테고리' as table_name, 
  COUNT(*)::text as count 
FROM categories
UNION ALL
SELECT 
  '상품', 
  COUNT(*)::text 
FROM products
UNION ALL
SELECT 
  '상품옵션', 
  COUNT(*)::text 
FROM product_options
UNION ALL
SELECT 
  '사용자', 
  COUNT(*)::text 
FROM users
UNION ALL
SELECT 
  '배송지', 
  COUNT(*)::text 
FROM shipping_addresses;
