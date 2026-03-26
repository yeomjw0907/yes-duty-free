export interface InitPortonePaymentResponse {
  payment_url: string;
}

export interface InitPortonePaymentParams {
  orderId: string;
  frontendBaseUrl: string;
  /** Supabase에서 발급된 사용자 JWT (access token) */
  supabaseUserAccessToken: string;
}

/**
 * Supabase Edge Function `init-payment`를 호출해서 PortOne 결제 링크를 생성합니다.
 * - 클라이언트는 사용자 access token만 전달 (서비스 역할 키는 Edge에서만 사용)
 */
export async function initPortonePayment({
  orderId,
  frontendBaseUrl,
  supabaseUserAccessToken,
}: InitPortonePaymentParams): Promise<InitPortonePaymentResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL이 설정되지 않았습니다.');

  const res = await fetch(`${supabaseUrl}/functions/v1/init-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseUserAccessToken}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      frontend_base_url: frontendBaseUrl,
    }),
  });

  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    const message = json?.message ?? `init-payment failed (${res.status})`;
    throw new Error(message);
  }

  const paymentUrl = json?.payment_url as string | undefined;
  if (!paymentUrl) throw new Error('init-payment 응답에 payment_url이 없습니다.');

  return { payment_url: paymentUrl };
}

