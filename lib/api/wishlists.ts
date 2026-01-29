import { getSupabase } from '../supabase';
import type { Product } from '../../types';

interface WishlistRow {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
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
}

function mapToProduct(p: WishlistRow['products']): Product | null {
  if (!p) return null;
  const categoryName = p.categories?.name ?? p.category?.name ?? '';
  return {
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
  };
}

export async function listWishlist(userId: string): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from('wishlists')
    .select(`
      id, user_id, product_id, created_at,
      products (id, name, brand, price, original_price, image_url, categories(name))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listWishlist error', error);
    throw error;
  }

  const rows = (data ?? []) as (WishlistRow & { product?: WishlistRow['products'] })[];
  return rows.map((r) => mapToProduct(r.products ?? r.product)).filter((p): p is Product => p != null);
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

export async function addWishlist(userId: string, productId: string): Promise<void> {
  const { error } = await getSupabase().from('wishlists').insert({ user_id: userId, product_id: productId });
  if (error) {
    if ((error as { code?: string }).code === '23505') return;
    console.error('addWishlist error', error);
    throw error;
  }
}

export async function removeWishlist(userId: string, productId: string): Promise<void> {
  const { error } = await getSupabase().from('wishlists').delete().eq('user_id', userId).eq('product_id', productId);
  if (error) {
    console.error('removeWishlist error', error);
    throw error;
  }
}

export async function toggleWishlist(userId: string, productId: string): Promise<boolean> {
  const inList = await isInWishlist(userId, productId);
  if (inList) {
    await removeWishlist(userId, productId);
    return false;
  }
  await addWishlist(userId, productId);
  return true;
}
