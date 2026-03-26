# PortOne 결제 연동 설정 가이드

이 문서는 `supabase/functions/init-payment`, `supabase/functions/portone-webhook`를 기준으로
PortOne 결제 링크 생성과 웹훅 동기화를 설정하는 방법을 정리합니다.

## 1) 필수 환경변수

아래 값은 **클라이언트(.env.local)** 이 아니라 **서버(Edge Functions secrets)** 에 설정합니다.

- `PORTONE_KEY`
- `PORTONE_SECRET`
- `PORTONE_ENV` (`sandbox` 또는 `live`)
- `PORTONE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2) PortOne 콘솔 설정

- API Key 발급:
  - PortOne 콘솔에서 결제 API 키/시크릿 발급
- Webhook URL 등록:
  - `https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/portone-webhook`
- Webhook Secret 발급 후 `PORTONE_WEBHOOK_SECRET`로 저장

## 3) Supabase Edge Functions 배포

```bash
supabase functions deploy init-payment --project-ref <PROJECT_REF>
supabase functions deploy portone-webhook --project-ref <PROJECT_REF>
```

필요 시 시크릿 설정:

```bash
supabase secrets set PORTONE_KEY=... --project-ref <PROJECT_REF>
supabase secrets set PORTONE_SECRET=... --project-ref <PROJECT_REF>
supabase secrets set PORTONE_ENV=sandbox --project-ref <PROJECT_REF>
supabase secrets set PORTONE_WEBHOOK_SECRET=... --project-ref <PROJECT_REF>
```

## 4) 동작 요약

- 클라이언트 `Checkout`:
  - 주문 생성 후 `init-payment` 호출
  - 응답 `payment_url`로 리다이렉트
- PortOne 결제 완료 후:
  - 등록한 webhook으로 이벤트 전송
  - `portone-webhook`가 시그니처 검증 후 `orders.payment_status`, `paid_at`, `orders.status` 갱신
- 사용자 복귀:
  - `order_number` query 기반으로 `order_complete`에서 상태 표시

