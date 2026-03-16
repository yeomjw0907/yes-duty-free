import { getSupabase } from '../supabase';
import { recordSearchKeyword } from './insights';
import type { Product, ProductOption } from '../../types';

/** Supabase products + categories join 결과 (관계명은 categories 또는 category) */
interface ProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number;
  image_url: string;
  category_id: string | null;
  sub_category: string | null;
  tags: string[] | null;
  sold_count: number;
  discount: number | null;
  categories?: { name: string } | null;
  category?: { name: string } | null;
  description?: string | null;
  detail_html?: string | null;
  stock_quantity?: number;
  is_unlimited_stock?: boolean;
  name_zh?: string | null;
  description_zh?: string | null;
  detail_html_zh?: string | null;
  price_twd?: number | null;
}

/** product_options 테이블 행 */
interface ProductOptionRow {
  option_name: string;
  option_value: string;
  price_difference: number;
  display_order: number;
}

interface ProductLocaleRow {
  product_id: string;
  locale: string;
  name: string;
  description: string | null;
  detail_html: string | null;
  price_twd: number | null;
}

const FALLBACK_LOCALE = 'ko';

function mapRowToProduct(row: ProductRow, localeRow?: ProductLocaleRow | null): Product {
  const categoryName = row.categories?.name ?? row.category?.name ?? '';
  const name = localeRow?.name ?? row.name;
  const detailHtml = localeRow?.detail_html ?? row.detail_html ?? undefined;
  const priceTwd = localeRow?.price_twd ?? row.price_twd ?? undefined;
  return {
    id: row.id,
    name,
    brand: row.brand,
    price: row.price,
    originalPrice: row.original_price,
    imageUrl: row.image_url,
    categoryId: row.category_id ?? undefined,
    category: categoryName,
    subCategory: row.sub_category ?? undefined,
    tags: row.tags ?? [],
    soldCount: row.sold_count ?? 0,
    discount: row.discount ?? 0,
    detailHtml: detailHtml ?? undefined,
    stockQuantity: row.stock_quantity ?? 0,
    isUnlimitedStock: row.is_unlimited_stock ?? false,
    nameZh: row.name_zh ?? undefined,
    descriptionZh: row.description_zh ?? undefined,
    detailHtmlZh: row.detail_html_zh ?? undefined,
    priceTwd: priceTwd ?? undefined,
  };
}

function pickLocaleRow(
  byProduct: Map<string, ProductLocaleRow[]>,
  productId: string,
  locale: string
): ProductLocaleRow | null {
  const rows = byProduct.get(productId);
  if (!rows?.length) return null;
  const preferred = rows.find((r) => r.locale === locale);
  const fallback = rows.find((r) => r.locale === FALLBACK_LOCALE);
  return preferred ?? fallback ?? null;
}

/** ilike 패턴에서 % _ 이스케이프 */
function escapeIlikePattern(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * 상품명·브랜드 검색 (일치 또는 부분 일치). locale 없으면 'ko'.
 */
export async function searchProducts(query: string, locale?: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  const loc = locale || FALLBACK_LOCALE;
  const pattern = `%${escapeIlikePattern(q)}%`;

  const { data, error } = await getSupabase()
    .from('products')
    .select('id, name, brand, price, original_price, image_url, category_id, sub_category, tags, sold_count, discount, stock_quantity, is_unlimited_stock, name_zh, description_zh, detail_html_zh, price_twd, categories(name)')
    .eq('is_active', true)
    .or(`name.ilike.${pattern},brand.ilike.${pattern}`)
    .order('sold_count', { ascending: false });

  if (error) {
    console.error('searchProducts error:', error);
    throw error;
  }
  recordSearchKeyword(q).catch(() => {});
  const rows = (data ?? []) as ProductRow[];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { data: locData } = await getSupabase()
    .from('product_locales')
    .select('product_id, locale, name, description, detail_html, price_twd')
    .in('product_id', ids)
    .in('locale', [loc, FALLBACK_LOCALE]);
  const byProduct = new Map<string, ProductLocaleRow[]>();
  for (const r of (locData ?? []) as (ProductLocaleRow & { product_id: string })[]) {
    const arr = byProduct.get(r.product_id) ?? [];
    arr.push(r);
    byProduct.set(r.product_id, arr);
  }
  return rows.map((row) =>
    mapRowToProduct(row, pickLocaleRow(byProduct, row.id, loc))
  );
}

/**
 * 상품 목록 조회 (카테고리 필터 옵션). locale 없으면 'ko'.
 */
export async function getProducts(categoryName?: string, locale?: string): Promise<Product[]> {
  const loc = locale || FALLBACK_LOCALE;
  let query = getSupabase()
    .from('products')
    .select('id, name, brand, price, original_price, image_url, category_id, sub_category, tags, sold_count, discount, stock_quantity, is_unlimited_stock, name_zh, description_zh, detail_html_zh, price_twd, categories(name)')
    .eq('is_active', true);

  if (categoryName) {
    const { data: cats } = await getSupabase().from('categories').select('id').eq('name', categoryName).limit(1);
    const categoryId = cats?.[0]?.id;
    if (categoryId) query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('sold_count', { ascending: false });

  if (error) {
    console.error('getProducts error:', error);
    throw error;
  }
  const rows = (data ?? []) as ProductRow[];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { data: locData } = await getSupabase()
    .from('product_locales')
    .select('product_id, locale, name, description, detail_html, price_twd')
    .in('product_id', ids)
    .in('locale', [loc, FALLBACK_LOCALE]);
  const byProduct = new Map<string, ProductLocaleRow[]>();
  for (const r of (locData ?? []) as (ProductLocaleRow & { product_id: string })[]) {
    const arr = byProduct.get(r.product_id) ?? [];
    arr.push(r);
    byProduct.set(r.product_id, arr);
  }
  return rows.map((row) =>
    mapRowToProduct(row, pickLocaleRow(byProduct, row.id, loc))
  );
}

/**
 * 상품 단건 조회 (옵션 포함). locale 없으면 'ko'.
 */
export async function getProductById(id: string, locale?: string): Promise<Product | null> {
  const loc = locale || FALLBACK_LOCALE;
  const { data: productRow, error: productError } = await getSupabase()
    .from('products')
    .select('id, name, brand, price, original_price, image_url, category_id, sub_category, tags, sold_count, discount, description, detail_html, stock_quantity, is_unlimited_stock, name_zh, description_zh, detail_html_zh, price_twd, categories(name)')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (productError || !productRow) {
    if (productError?.code === 'PGRST116') return null;
    console.error('getProductById error:', productError);
    throw productError;
  }

  const { data: locRows } = await getSupabase()
    .from('product_locales')
    .select('product_id, locale, name, description, detail_html, price_twd')
    .eq('product_id', id)
    .in('locale', [loc, FALLBACK_LOCALE])
    .order('locale', { ascending: false });
  const preferred = (locRows ?? []).find((r: { locale: string }) => r.locale === loc);
  const fallback = (locRows ?? []).find((r: { locale: string }) => r.locale === FALLBACK_LOCALE);
  const localeRow = (preferred ?? fallback) as ProductLocaleRow | undefined;

  const { data: optionRows, error: optError } = await getSupabase()
    .from('product_options')
    .select('option_name, option_value, price_difference, display_order')
    .eq('product_id', id)
    .eq('is_active', true)
    .order('option_name')
    .order('display_order', { ascending: true });

  if (optError) {
    console.error('getProductById options error:', optError);
  }

  const product = mapRowToProduct(productRow as ProductRow, localeRow ?? null);

  if (optionRows && optionRows.length > 0) {
    const optionsMap = new Map<string, string[]>();
    for (const o of optionRows as ProductOptionRow[]) {
      const arr = optionsMap.get(o.option_name) ?? [];
      if (!arr.includes(o.option_value)) arr.push(o.option_value);
      optionsMap.set(o.option_name, arr);
    }
    product.options = Array.from(optionsMap.entries()).map(([name, values]) => ({
      name,
      values,
    }));
  }

  return product;
}

/** 상품 재고만 조회 (주문 검증·차감용) */
export async function getProductsStock(
  productIds: string[]
): Promise<Map<string, { stock_quantity: number; is_unlimited_stock: boolean }>> {
  if (productIds.length === 0) return new Map();
  const uniq = [...new Set(productIds)];
  const { data, error } = await getSupabase()
    .from('products')
    .select('id, stock_quantity, is_unlimited_stock')
    .in('id', uniq);

  if (error) {
    console.error('getProductsStock error:', error);
    throw error;
  }
  const map = new Map<string, { stock_quantity: number; is_unlimited_stock: boolean }>();
  for (const row of data ?? []) {
    const r = row as { id: string; stock_quantity: number; is_unlimited_stock: boolean };
    map.set(r.id, {
      stock_quantity: r.stock_quantity ?? 0,
      is_unlimited_stock: r.is_unlimited_stock ?? false,
    });
  }
  return map;
}
