-- Yes Duty Free - Wishlists (찜하기)
-- SQL Editor에서 실행.

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist" ON wishlists
  FOR ALL USING (auth.uid() = user_id);
