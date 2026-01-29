-- Yes Duty Free - Initial Database Schema
-- Phase 1: MVP Tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  profile_image_url TEXT,
  
  -- Social Login
  provider TEXT DEFAULT 'email',
  provider_id TEXT,
  
  -- Membership
  membership_tier TEXT DEFAULT 'basic' CHECK (membership_tier IN ('basic', 'premium', 'vip')),
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  
  -- Marketing
  marketing_agreed BOOLEAN DEFAULT false,
  
  -- Account Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  name_en TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_order ON categories(display_order);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  
  -- Pricing
  price INTEGER NOT NULL CHECK (price >= 0),
  original_price INTEGER NOT NULL CHECK (original_price >= 0),
  discount INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN original_price > 0 
      THEN ROUND(((original_price - price)::NUMERIC / original_price * 100)::NUMERIC, 0)::INTEGER
      ELSE 0
    END
  ) STORED,
  
  -- Images
  image_url TEXT NOT NULL,
  image_urls TEXT[],
  
  -- Classification
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sub_category TEXT,
  tags TEXT[],
  
  -- Stats
  sold_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  
  -- Stock
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  is_unlimited_stock BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  
  -- Description
  description TEXT,
  detail_html TEXT,
  
  -- Shipping
  shipping_fee INTEGER DEFAULT 0,
  estimated_delivery_days INTEGER DEFAULT 7,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_sold_count ON products(sold_count DESC);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_is_active ON products(is_active);

-- ============================================
-- 4. PRODUCT_OPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  option_name TEXT NOT NULL,
  option_value TEXT NOT NULL,
  price_difference INTEGER DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_id, option_name, option_value)
);

CREATE INDEX idx_product_options_product ON product_options(product_id);

-- ============================================
-- 5. SHIPPING_ADDRESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  country TEXT NOT NULL,
  postal_code TEXT,
  state_province TEXT,
  city TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  
  is_default BOOLEAN DEFAULT false,
  delivery_memo TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipping_addresses_user ON shipping_addresses(user_id);
CREATE INDEX idx_shipping_addresses_default ON shipping_addresses(user_id, is_default);

-- ============================================
-- 6. CARTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. CART_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_options JSONB DEFAULT '{}'::jsonb,
  price_snapshot INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- ============================================
-- 8. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT '결제대기' CHECK (
    status IN (
      '결제대기', '상품준비중', '배송대기', '배송중', '배송완료',
      '취소접수', '반품접수', '해외배송중', '현지집하완료', '통관진행중'
    )
  ),
  
  -- Amounts
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_fee INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  
  -- Shipping Info (Snapshot)
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  delivery_memo TEXT,
  
  -- Payment
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'failed', 'refunded')
  ),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery
  courier_company TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Coupon/Points
  used_coupon_id UUID,
  used_points INTEGER DEFAULT 0,
  earned_points INTEGER DEFAULT 0,
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  admin_memo TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ============================================
-- 9. ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Product Snapshot
  product_name TEXT NOT NULL,
  product_brand TEXT NOT NULL,
  product_image_url TEXT,
  
  -- Pricing
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  
  selected_options JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- TRIGGERS: updated_at 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) 활성화
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users: 자신의 정보만 조회/수정
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Categories: 모두 조회 가능
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- Products: 모두 조회 가능
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Product Options: 모두 조회 가능
CREATE POLICY "Anyone can view product options" ON product_options
  FOR SELECT USING (is_active = true);

-- Shipping Addresses: 자신의 배송지만 관리
CREATE POLICY "Users can manage own addresses" ON shipping_addresses
  FOR ALL USING (auth.uid() = user_id);

-- Carts: 자신의 장바구니만 관리
CREATE POLICY "Users can manage own cart" ON carts
  FOR ALL USING (auth.uid() = user_id);

-- Cart Items: 자신의 장바구니 아이템만 관리
CREATE POLICY "Users can manage own cart items" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id 
      AND carts.user_id = auth.uid()
    )
  );

-- Orders: 자신의 주문만 조회
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Order Items: 자신의 주문 아이템만 조회
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

COMMIT;
