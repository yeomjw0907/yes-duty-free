-- Yes Duty Free - Reviews (상품 리뷰)
-- SQL Editor에서 실행.

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  is_verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 누구나 상품별 리뷰 목록 조회
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

-- 로그인 사용자만 자신의 리뷰 작성
CREATE POLICY "Authenticated users can insert own review" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 리뷰만 수정/삭제
CREATE POLICY "Users can update own review" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own review" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 상품의 review_count, rating 자동 갱신
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products
    SET
      review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = OLD.product_id),
      rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = OLD.product_id), 0)
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;

  UPDATE products
  SET
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)),
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)), 0)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();
