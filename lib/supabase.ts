import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL과 Anon Key가 환경변수에 설정되어 있지 않습니다.\n' +
    '.env.local 파일을 확인해주세요.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
});

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
