import { createClient } from "npm:@supabase/supabase-js@2";

type WebhookPayload = {
  currency?: string;
  amount?: number | string;
  order_ref?: string;
  merchant_order_ref?: string;
  channel_order_ref?: string;
  country_code?: string;
  status?: string;
  channel_key?: string;
  method_name?: string;
  signature_hash?: string;
  status_code?: string;
  status_reason?: string;
  created_at?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function hmacBase64(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  let binary = "";
  const bytes = new Uint8Array(signature);
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function toQueryStringSorted(values: Record<string, string>): string {
  const entries = Object.entries(values).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

function mapPaymentStatus(payload: WebhookPayload): "pending" | "paid" | "failed" | "refunded" {
  const status = String(payload.status ?? "").toLowerCase();
  const code = String(payload.status_code ?? "").toLowerCase();
  const reason = String(payload.status_reason ?? "").toLowerCase();
  const joined = `${status} ${code} ${reason}`;

  if (/refund|refunded|cancel/.test(joined)) return "refunded";
  if (/success|paid|approved|complete|2000/.test(joined)) return "paid";
  if (/fail|failed|declin|error|cancelled|canceled/.test(joined)) return "failed";
  return "pending";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const portoneWebhookSecret = Deno.env.get("PORTONE_WEBHOOK_SECRET");
  if (!supabaseUrl || !supabaseServiceRoleKey || !portoneWebhookSecret) {
    return jsonResponse({ message: "필수 환경변수가 설정되지 않았습니다." }, 500);
  }

  const rawBody = await req.text();
  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return jsonResponse({ message: "JSON 파싱에 실패했습니다." }, 400);
  }

  const receivedSignature = String(payload.signature_hash ?? "");
  if (!receivedSignature) return jsonResponse({ message: "signature_hash 누락" }, 400);

  const signatureSource = {
    amount: String(payload.amount ?? ""),
    channel_key: String(payload.channel_key ?? ""),
    channel_order_ref: String(payload.channel_order_ref ?? ""),
    country_code: String(payload.country_code ?? ""),
    currency: String(payload.currency ?? ""),
    merchant_order_ref: String(payload.merchant_order_ref ?? ""),
    method_name: String(payload.method_name ?? ""),
    order_ref: String(payload.order_ref ?? ""),
    status: String(payload.status ?? ""),
  };
  const message = toQueryStringSorted(signatureSource);
  const generated = await hmacBase64(message, portoneWebhookSecret);
  if (generated !== receivedSignature) {
    return jsonResponse({ message: "Webhook signature 검증 실패" }, 400);
  }

  const orderNumber = String(payload.merchant_order_ref ?? "").trim();
  if (!orderNumber) return jsonResponse({ message: "merchant_order_ref 누락" }, 400);

  const db = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: order, error: orderError } = await db
    .from("orders")
    .select("id, payment_status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (orderError || !order) return jsonResponse({ message: "주문 매핑 실패" }, 404);

  const nextStatus = mapPaymentStatus(payload);
  const currentStatus = String(order.payment_status ?? "pending");

  // 멱등 처리: 이미 환불/결제완료 상태면 중복 이벤트 업데이트를 스킵
  if ((currentStatus === "paid" || currentStatus === "refunded") && nextStatus !== "refunded") {
    return jsonResponse({ ok: true, skipped: true, reason: "already-final-state" });
  }

  const updates: Record<string, unknown> = {
    payment_status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (nextStatus === "paid") {
    updates.paid_at = new Date().toISOString();
    updates.status = "상품준비중";
  }

  const { error: updateError } = await db.from("orders").update(updates).eq("id", order.id);
  if (updateError) return jsonResponse({ message: "주문 상태 업데이트 실패" }, 500);

  return jsonResponse({
    ok: true,
    order_number: orderNumber,
    payment_status: nextStatus,
  });
});

