import { supabase } from '../supabase';
import { getCartItems, type CartItemWithProduct } from './cart';
import { getProfile, addPointsForOrder } from './users';
import { SHIPPING_FEE_BASIC } from '../constants/membership';
import type { ShippingAddress } from '../../types';

/** 주문 생성 파라미터 */
export interface CreateOrderParams {
  shippingAddressId: string;
  cartId: string;
  /** 지정 시 해당 아이템만 주문; 미지정 시 장바구니 전체 */
  cartItemIds?: string[];
  paymentMethod?: string;
  /** 사용할 적립금 (원). 사용자 포인트 초과 시 서버에서 상한 적용 */
  usedPoints?: number;
}

/** DB orders 행 → 주문 타입 */
export interface OrderRecord {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number | null;
  total_amount: number;
  earned_points?: number;
  recipient_name: string;
  recipient_phone: string;
  shipping_country: string;
  shipping_address: string;
  delivery_memo: string | null;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/** DB order_items 행 */
export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_brand: string;
  product_image_url: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  selected_options: Record<string, string> | null;
  created_at: string;
}

/** 주문 + 상세 아이템 (목록/상세용) */
export interface OrderWithItems extends OrderRecord {
  order_items?: OrderItemRecord[];
}

function formatOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `YES-${y}${m}${d}-${random}`;
}

function buildShippingAddressString(addr: ShippingAddress): string {
  return [addr.address_line1, addr.address_line2, addr.city, addr.state_province, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(', ');
}

/**
 * 주문 생성: order_number 생성, orders/order_items insert, 해당 장바구니 아이템 삭제
 */
export async function createOrder(userId: string, params: CreateOrderParams): Promise<OrderRecord> {
  const { shippingAddressId, cartId, cartItemIds, paymentMethod = 'card', usedPoints: rawUsedPoints } = params;

  const { data: addr, error: addrError } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('id', shippingAddressId)
    .eq('user_id', userId)
    .single();

  if (addrError || !addr) {
    console.error('createOrder: shipping address not found', addrError);
    throw new Error('배송지를 찾을 수 없습니다.');
  }

  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id, user_id')
    .eq('id', cartId)
    .single();
  if (cartError || !cart || (cart as { user_id: string }).user_id !== userId) {
    throw new Error('장바구니를 찾을 수 없습니다.');
  }

  const allItems = await getCartItems(cartId);
  const items: CartItemWithProduct[] = cartItemIds?.length
    ? allItems.filter((i) => cartItemIds.includes(i.id))
    : allItems;

  if (items.length === 0) {
    throw new Error('주문할 상품이 없습니다.');
  }

  const profile = await getProfile(userId);
  const tier = profile?.membership_tier ?? 'basic';
  const shippingFee = tier === 'basic' ? SHIPPING_FEE_BASIC : 0;
  const subtotal = items.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
  const discountAmount = 0;
  const userPoints = profile?.points ?? 0;
  const usedPoints = Math.min(Math.max(0, Math.floor(rawUsedPoints ?? 0)), userPoints, subtotal + shippingFee);
  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount - usedPoints);

  const shippingAddressStr = buildShippingAddressString(addr as unknown as ShippingAddress);

  const orderNumber = formatOrderNumber();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      status: '결제대기',
      subtotal,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      used_points: usedPoints,
      recipient_name: addr.recipient_name,
      recipient_phone: addr.phone,
      shipping_country: addr.country,
      shipping_address: shippingAddressStr,
      delivery_memo: addr.delivery_memo ?? null,
      payment_method: paymentMethod,
      payment_status: 'pending',
    })
    .select()
    .single();

  if (orderError) {
    console.error('createOrder: order insert error', orderError);
    throw orderError;
  }

  const orderId = (order as OrderRecord).id;

  for (const item of items) {
    const itemSubtotal = item.priceSnapshot * item.quantity;
    const { error: itemError } = await supabase.from('order_items').insert({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.product.name,
      product_brand: item.product.brand,
      product_image_url: item.product.imageUrl ?? null,
      price: item.priceSnapshot,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      selected_options: Object.keys(item.selectedOptions).length ? item.selectedOptions : {},
    });
    if (itemError) {
      console.error('createOrder: order_items insert error', itemError);
      throw itemError;
    }
  }

  for (const item of items) {
    const { error: delError } = await supabase.from('cart_items').delete().eq('id', item.id);
    if (delError) {
      console.error('createOrder: cart_items delete error', delError);
    }
  }

  if (usedPoints > 0) {
    const { data: userRow } = await supabase.from('users').select('points').eq('id', userId).single();
    const currentPoints = Number((userRow as { points: number } | null)?.points ?? 0);
    await supabase
      .from('users')
      .update({ points: Math.max(0, currentPoints - usedPoints), updated_at: new Date().toISOString() })
      .eq('id', userId);
  }

  try {
    await addPointsForOrder(userId, orderId, totalAmount);
  } catch (err) {
    console.error('createOrder: addPointsForOrder error', err);
  }

  return order as OrderRecord;
}

/**
 * 내 주문 목록
 */
export async function getMyOrders(userId: string): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMyOrders error', error);
    throw error;
  }
  return (data ?? []) as OrderRecord[];
}

/**
 * 주문 단건 조회 (본인 주문만)
 */
export async function getOrderById(orderId: string, userId: string): Promise<OrderWithItems | null> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (orderError || !order) return null;

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (itemsError) {
    console.error('getOrderById order_items error', itemsError);
  }

  return {
    ...(order as OrderRecord),
    order_items: (orderItems ?? []) as OrderItemRecord[],
  };
}
