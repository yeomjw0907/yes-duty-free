import { supabase } from '../supabase';
import type { ShippingAddress } from '../../types';

export interface ShippingAddressInput {
  recipient_name: string;
  phone: string;
  country: string;
  postal_code?: string;
  state_province?: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  delivery_memo?: string;
  is_default?: boolean;
}

function mapRow(row: Record<string, unknown>): ShippingAddress {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    recipient_name: row.recipient_name as string,
    phone: row.phone as string,
    country: row.country as string,
    postal_code: row.postal_code as string | undefined,
    state_province: row.state_province as string | undefined,
    city: row.city as string,
    address_line1: row.address_line1 as string,
    address_line2: row.address_line2 as string | undefined,
    is_default: (row.is_default as boolean) ?? false,
    delivery_memo: row.delivery_memo as string | undefined,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function listShippingAddresses(userId: string): Promise<ShippingAddress[]> {
  const { data, error } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listShippingAddresses error:', error);
    throw error;
  }
  return (data ?? []).map(mapRow);
}

export async function createShippingAddress(userId: string, input: ShippingAddressInput): Promise<ShippingAddress> {
  if (input.is_default) {
    await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', userId);
  }
  const { data, error } = await supabase
    .from('shipping_addresses')
    .insert({
      user_id: userId,
      recipient_name: input.recipient_name,
      phone: input.phone,
      country: input.country,
      postal_code: input.postal_code ?? null,
      state_province: input.state_province ?? null,
      city: input.city,
      address_line1: input.address_line1,
      address_line2: input.address_line2 ?? null,
      delivery_memo: input.delivery_memo ?? null,
      is_default: input.is_default ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error('createShippingAddress error:', error);
    throw error;
  }
  return mapRow(data);
}

export async function updateShippingAddress(
  id: string,
  userId: string,
  input: Partial<ShippingAddressInput>
): Promise<ShippingAddress> {
  if (input.is_default) {
    await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', userId);
  }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.recipient_name !== undefined) updates.recipient_name = input.recipient_name;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.country !== undefined) updates.country = input.country;
  if (input.postal_code !== undefined) updates.postal_code = input.postal_code;
  if (input.state_province !== undefined) updates.state_province = input.state_province;
  if (input.city !== undefined) updates.city = input.city;
  if (input.address_line1 !== undefined) updates.address_line1 = input.address_line1;
  if (input.address_line2 !== undefined) updates.address_line2 = input.address_line2;
  if (input.delivery_memo !== undefined) updates.delivery_memo = input.delivery_memo;
  if (input.is_default !== undefined) updates.is_default = input.is_default;

  const { data, error } = await supabase
    .from('shipping_addresses')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('updateShippingAddress error:', error);
    throw error;
  }
  return mapRow(data);
}

export async function deleteShippingAddress(id: string, userId: string): Promise<void> {
  const { error } = await supabase.from('shipping_addresses').delete().eq('id', id).eq('user_id', userId);
  if (error) {
    console.error('deleteShippingAddress error:', error);
    throw error;
  }
}

export async function setDefaultShippingAddress(id: string, userId: string): Promise<void> {
  await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', userId);
  const { error } = await supabase
    .from('shipping_addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) {
    console.error('setDefaultShippingAddress error:', error);
    throw error;
  }
}
