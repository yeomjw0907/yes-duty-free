import { supabase } from '../supabase';
import type { Product } from '../../types';

/** Supabase cart_items 행 (products join 포함, 관계명 product 또는 products) */
interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  selected_options: Record<string, string> | null;
  price_snapshot: number | null;
  products?: {
    id: string;
    name: string;
    brand: string;
    price: number;
    original_price: number;
    image_url: string;
    categories?: { name: string } | null;
    category?: { name: string } | null;
  } | null;
  product?: {
    id: string;
    name: string;
    brand: string;
    price: number;
    original_price: number;
    image_url: string;
    categories?: { name: string } | null;
    category?: { name: string } | null;
  } | null;
}

/** 화면 표시용 장바구니 아이템 (상품 정보 포함) */
export interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  selectedOptions: Record<string, string>;
  priceSnapshot: number;
  product: Product;
}

function mapCartItem(row: CartItemRow): CartItemWithProduct | null {
  const p = row.products ?? row.product;
  if (!p) return null;
  const categoryName = p.categories?.name ?? p.category?.name ?? '';
  return {
    id: row.id,
    cartId: row.cart_id,
    productId: row.product_id,
    quantity: row.quantity,
    selectedOptions: (row.selected_options as Record<string, string>) ?? {},
    priceSnapshot: row.price_snapshot ?? p.price,
    product: {
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      originalPrice: p.original_price,
      imageUrl: p.image_url,
      category: categoryName,
      tags: [],
      soldCount: 0,
      discount: 0,
    },
  };
}

/**
 * 사용자 장바구니 조회, 없으면 생성 후 반환
 */
export async function getOrCreateCart(userId: string): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) return { id: existing.id };

  const { data: created, error } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (error) {
    console.error('getOrCreateCart error:', error);
    throw error;
  }
  return { id: created!.id };
}

/**
 * 장바구니 아이템 목록 조회 (상품 정보 포함)
 */
export async function getCartItems(cartId: string): Promise<CartItemWithProduct[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id, cart_id, product_id, quantity, selected_options, price_snapshot,
      products (id, name, brand, price, original_price, image_url, categories(name))
    `)
    .eq('cart_id', cartId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getCartItems error:', error);
    throw error;
  }

  const items = (data ?? [])
    .map((row) => mapCartItem(row as unknown as CartItemRow))
    .filter((item): item is CartItemWithProduct => item !== null);
  return items;
}

function optionsMatch(a: Record<string, string> | null, b: Record<string, string> | null): boolean {
  const x = a ?? {};
  const y = b ?? {};
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  for (const k of keys) {
    if (x[k] !== y[k]) return false;
  }
  return true;
}

/**
 * 장바구니에 상품 추가 (같은 상품+옵션이 있으면 수량만 증가).
 * @returns 추가/수정된 cart_item id (즉시구매 등에서 사용)
 */
export async function addCartItem(
  cartId: string,
  productId: string,
  quantity: number,
  price: number,
  selectedOptions?: Record<string, string>
): Promise<string> {
  const options = selectedOptions ?? {};
  const optionsJson = Object.keys(options).length ? options : {};

  const { data: existingRows } = await supabase
    .from('cart_items')
    .select('id, quantity, selected_options')
    .eq('cart_id', cartId)
    .eq('product_id', productId);

  const existing = existingRows?.find((row) =>
    optionsMatch(row.selected_options as Record<string, string> | null, optionsJson)
  );

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartId,
      product_id: productId,
      quantity,
      price_snapshot: price,
      selected_options: optionsJson,
    })
    .select('id')
    .single();

  if (error) {
    console.error('addCartItem error:', error);
    throw error;
  }
  return (inserted as { id: string }).id;
}

/**
 * 장바구니 아이템 수량 변경
 */
export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<void> {
  if (quantity < 1) {
    await removeCartItem(cartItemId);
    return;
  }
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('id', cartItemId);

  if (error) {
    console.error('updateCartItemQuantity error:', error);
    throw error;
  }
}

/**
 * 장바구니 아이템 삭제
 */
export async function removeCartItem(cartItemId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
  if (error) {
    console.error('removeCartItem error:', error);
    throw error;
  }
}
