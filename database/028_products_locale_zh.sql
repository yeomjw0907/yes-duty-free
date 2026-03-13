-- Yes Duty Free - 상품 한국/대만(繁體中文) 버전 필드
-- 관리자에서 한국어·대만어 따로 입력 후, 언어별로 그룹(같은 상품)처럼 표시

ALTER TABLE products ADD COLUMN IF NOT EXISTS name_zh TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_zh TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_html_zh TEXT;
-- 대만 가격(선택). 없으면 환율로 원화→TWD 환산 표시
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_twd INTEGER CHECK (price_twd IS NULL OR price_twd >= 0);

COMMENT ON COLUMN products.name_zh IS '상품명 (繁體中文, 대만)';
COMMENT ON COLUMN products.description_zh IS '상품 요약 (繁體中文)';
COMMENT ON COLUMN products.detail_html_zh IS '상품 상세 HTML (繁體中文)';
COMMENT ON COLUMN products.price_twd IS '대만 판매가(TWD). NULL이면 원화 기준 환율로 표시';
