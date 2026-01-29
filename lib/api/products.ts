import { getSupabase } from '../supabase';
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
}

/** product_options 테이블 행 */
interface ProductOptionRow {
  option_name: string;
  option_value: string;
  price_difference: number;
  display_order: number;
}

function mapRowToProduct(row: ProductRow): Product {
  const categoryName = row.categories?.name ?? row.category?.name ?? '';
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: row.price,
    originalPrice: row.original_price,
    imageUrl: row.image_url,
    category: categoryName,
    subCategory: row.sub_category ?? undefined,
    tags: row.tags ?? [],
    soldCount: row.sold_count ?? 0,
    discount: row.discount ?? 0,
  };
}

/**
 * 상품 목록 조회 (카테고리 필터 옵션)
 */
export async function getProducts(categoryName?: string): Promise<Product[]> {
  let query = getSupabase()
    .from('products')
    .select('id, name, brand, price, original_price, image_url, category_id, sub_category, tags, sold_count, discount, categories(name)')
    .eq('is_active', true);

  if (categoryName) {
    // category name으로 필터: categories.name = categoryName 인 products
    const { data: cats } = await getSupabase().from('categories').select('id').eq('name', categoryName).limit(1);
    const categoryId = cats?.[0]?.id;
    if (categoryId) query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('sold_count', { ascending: false });

  if (error) {
    console.error('getProducts error:', error);
    throw error;
  }
  return (data ?? []).map(mapRowToProduct);
}

/**
 * 상품 단건 조회 (옵션 포함)
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data: productRow, error: productError } = await getSupabase()
    .from('products')
    .select('id, name, brand, price, original_price, image_url, category_id, sub_category, tags, sold_count, discount, categories(name)')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (productError || !productRow) {
    if (productError?.code === 'PGRST116') return null; // not found
    console.error('getProductById error:', productError);
    throw productError;
  }

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

  const product = mapRowToProduct(productRow as ProductRow);

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
