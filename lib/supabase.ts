import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'yes-duty-free-web',
    },
  },
})
    : null;

/** 앱 내부(API/훅)에서 사용. env가 없을 때는 App이 마운트되지 않으므로 null이 아님. */
export function getSupabase(): NonNullable<typeof supabase> {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
}

// 타입 추론을 위한 Database 타입 export
export type Database = {
  public: {
    Tables: {
      users: any;
      products: any;
      categories: any;
      orders: any;
      // ... 추가 테이블
    };
  };
};
