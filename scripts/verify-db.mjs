/**
 * DB 검증 스크립트: 회원가입/주문 후 Supabase 테이블 확인
 * 사용: node --env-file=.env.local scripts/verify-db.mjs
 * (Node 20+ 또는 dotenv 사용)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const path = join(root, '.env.local');
  if (!existsSync(path)) {
    console.error('.env.local not found. Run from project root with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set.');
    process.exit(1);
  }
  const content = readFileSync(path, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (key && !key.startsWith('#')) env[key] = val;
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const url = env.VITE_SUPABASE_URL;
// 서비스 롤 키가 있으면 사용 (RLS 무시, 전체 데이터 조회). 없으면 anon (비로그인 시 users/orders는 RLS로 0건일 수 있음)
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required. For full verification set SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}
const isServiceRole = !!(env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY);
if (!isServiceRole) console.log('(Using anon key; RLS may return 0 rows for users/orders. Set SUPABASE_SERVICE_ROLE_KEY for full check.)\n');

const supabase = createClient(url, key);

async function main() {
  console.log('=== DB 검증 (최근 데이터) ===\n');

  const { data: users, error: e1 } = await supabase
    .from('users')
    .select('id, email, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  if (e1) console.error('users error:', e1.message);
  else console.log('users (최근 5건):', users?.length ?? 0, users ?? []);

  const { data: addrs, error: e2 } = await supabase
    .from('shipping_addresses')
    .select('id, user_id, recipient_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  if (e2) console.error('shipping_addresses error:', e2.message);
  else console.log('\nshipping_addresses (최근 5건):', addrs?.length ?? 0, addrs ?? []);

  const { data: orders, error: e3 } = await supabase
    .from('orders')
    .select('id, order_number, user_id, status, total_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  if (e3) console.error('orders error:', e3.message);
  else console.log('\norders (최근 5건):', orders?.length ?? 0, orders ?? []);

  const { data: items, error: e4 } = await supabase
    .from('order_items')
    .select('id, order_id, product_name, quantity, subtotal')
    .order('created_at', { ascending: false })
    .limit(10);
  if (e4) console.error('order_items error:', e4.message);
  else console.log('\norder_items (최근 10건):', items?.length ?? 0, items ?? []);

  console.log('\n=== 검증 완료 ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
