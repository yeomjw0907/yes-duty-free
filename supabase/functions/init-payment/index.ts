import { createClient } from "npm:@supabase/supabase-js@2";

type Json = Record<string, unknown>;

function jsonResponse(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function getPortoneAuthToken(portoneKey: string, portoneSecret: string): Promise<string> {
  const res = await fetch("https://api.portone.cloud/api/merchant/auth-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      portone_key: portoneKey,
      portone_secret: portoneSecret,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.message ?? `auth-token failed (${res.status})`);
  const token = (json as any)?.content?.token as string | undefined;
  if (!token) throw new Error("auth-token 응답에 token이 없습니다.");
  return token;
}

async function getSignatureHash(
  jwtToken: string,
  portoneKey: string,
  payload: {
    currency: string;
    amount: number;
    merchant_order_id: string;
    success_url: string;
    failure_url: string;
  },
): Promise<string> {
  const res = await fetch("https://api.portone.cloud/api/merchant/generate-signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
      "X-Portone-Client-Key": portoneKey,
    },
    body: JSON.stringify({
      portone_key: portoneKey,
      currency: payload.currency,
      amount: payload.amount,
      merchant_order_id: payload.merchant_order_id,
      success_url: payload.success_url,
      failure_url: payload.failure_url,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.message ?? `generate-signature failed (${res.status})`);
  const signature = (json as any)?.content?.signature as string | undefined;
  if (!signature) throw new Error("generate-signature 응답에 signature가 없습니다.");
  return signature;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const portoneKey = Deno.env.get("PORTONE_KEY");
  const portoneSecret = Deno.env.get("PORTONE_SECRET");
  const portoneEnvironment = (Deno.env.get("PORTONE_ENV") ?? "sandbox").toLowerCase();

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !portoneKey || !portoneSecret) {
    return jsonResponse({ message: "필수 환경변수가 설정되지 않았습니다." }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const body = (await req.json().catch(() => null)) as
    | { order_id?: string; frontend_base_url?: string }
    | null;

  const orderId = body?.order_id?.trim();
  const frontendBaseUrl = (body?.frontend_base_url?.trim() || "").replace(/\/+$/, "");
  if (!orderId) return jsonResponse({ message: "order_id는 필수입니다." }, 400);
  if (!frontendBaseUrl) return jsonResponse({ message: "frontend_base_url은 필수입니다." }, 400);

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData?.user) return jsonResponse({ message: "인증되지 않은 요청입니다." }, 401);

  const userId = authData.user.id;

  const { data: order, error: orderError } = await serviceClient
    .from("orders")
    .select("id, order_number, user_id, total_amount, shipping_fee, shipping_country, payment_status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) return jsonResponse({ message: "주문을 찾을 수 없습니다." }, 404);
  if (order.user_id !== userId) return jsonResponse({ message: "본인 주문만 결제할 수 있습니다." }, 403);
  if (order.payment_status !== "pending") return jsonResponse({ message: "이미 결제 처리된 주문입니다." }, 409);

  const shippingCountry = String(order.shipping_country ?? "").toUpperCase();
  let currency = "KRW";
  let amount = Number(order.total_amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonResponse({ message: "주문 금액이 올바르지 않습니다." }, 400);
  }

  if (shippingCountry === "TW") {
    const { data: twdRateRow } = await serviceClient
      .from("exchange_rates")
      .select("rate")
      .eq("currency_code", "TWD")
      .order("valid_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    const twdRate = Number(twdRateRow?.rate ?? 0);
    if (Number.isFinite(twdRate) && twdRate > 0) {
      currency = "TWD";
      amount = Math.max(1, Math.round(amount / twdRate));
    }
  }

  const successUrl = `${frontendBaseUrl}?order_number=${encodeURIComponent(order.order_number)}&payment_result=success`;
  const failureUrl = `${frontendBaseUrl}?order_number=${encodeURIComponent(order.order_number)}&payment_result=failure`;
  const pendingUrl = `${frontendBaseUrl}?order_number=${encodeURIComponent(order.order_number)}&payment_result=pending`;

  try {
    const jwtToken = await getPortoneAuthToken(portoneKey, portoneSecret);
    const signatureHash = await getSignatureHash(jwtToken, portoneKey, {
      currency,
      amount,
      merchant_order_id: order.order_number,
      success_url: successUrl,
      failure_url: failureUrl,
    });

    const createRes = await fetch("https://api.portone.cloud/api/paymentLink", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
        "X-Portone-Client-Key": portoneKey,
      },
      body: JSON.stringify({
        portone_key: portoneKey,
        merchant_order_id: order.order_number,
        signature_hash: signatureHash,
        amount,
        currency,
        country_code: shippingCountry || "KR",
        source: "api",
        environment: portoneEnvironment === "live" ? "live" : "sandbox",
        description: `YES DUTY FREE 주문 ${order.order_number}`,
        merchant_details: {
          name: "YES DUTY FREE",
          promo_discount: 0,
          shipping_charges: Number(order.shipping_fee ?? 0),
          back_url: frontendBaseUrl,
        },
        success_url: successUrl,
        failure_url: failureUrl,
        pending_url: pendingUrl,
      }),
    });

    const createJson = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      return jsonResponse(
        { message: (createJson as any)?.message ?? `paymentLink 생성 실패 (${createRes.status})` },
        502,
      );
    }

    const paymentUrl = (createJson as any)?.payment_link as string | undefined;
    const paymentRef = (createJson as any)?.payment_link_ref as string | undefined;
    if (!paymentUrl) return jsonResponse({ message: "payment_link가 응답에 없습니다." }, 502);

    return jsonResponse({
      payment_url: paymentUrl,
      payment_link_ref: paymentRef ?? null,
      order_number: order.order_number,
      currency,
      amount,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "init-payment 처리 중 오류가 발생했습니다.";
    return jsonResponse({ message }, 500);
  }
});

