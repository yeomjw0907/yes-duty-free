# Vercel 배포 가이드

Vercel에 배포 후 **흰 화면**이 나오는 경우, 대부분 **환경 변수 미설정** 때문입니다.

---

## 1. 환경 변수 설정 (필수)

Vite는 빌드 시점에 `VITE_` 접두사 환경 변수를 번들에 넣습니다.  
Vercel에서 아래 두 값을 반드시 설정해야 합니다.

| 이름 | 설명 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL (예: `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon(public) Key |

### 설정 방법

1. [Vercel 대시보드](https://vercel.com/dashboard) → 해당 프로젝트 선택
2. **Settings** → **Environment Variables**
3. **Add New**로 위 두 변수 추가
   - **Key**: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   - **Value**: Supabase 대시보드 → Project Settings → API에서 복사
   - **Environment**: Production, Preview, Development 모두 체크 권장
4. 저장 후 **Redeploy** (Deployments → … → Redeploy)

환경 변수를 추가/수정한 뒤에는 **반드시 재배포**해야 적용됩니다.

---

## 2. 환경 변수가 없을 때

환경 변수가 없으면 앱이 **“환경 변수가 설정되지 않았습니다”** 안내 화면을 보여줍니다.  
흰 화면 대신 위 메시지가 보이면, Vercel에서 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정한 뒤 재배포하면 됩니다.

---

## 3. SPA 라우팅 (vercel.json)

`vercel.json`에 rewrites가 설정되어 있어, 모든 경로가 `index.html`로 넘어갑니다.  
직접 URL 접근이나 새로고침 시에도 정상 동작합니다.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 4. 빌드 명령

- **Build Command**: `npm run build` (또는 `vite build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Vercel이 Vite 프로젝트를 인식하면 위 값은 자동으로 채워집니다.

---

## 5. 체크리스트

- [ ] Vercel에 `VITE_SUPABASE_URL` 추가
- [ ] Vercel에 `VITE_SUPABASE_ANON_KEY` 추가
- [ ] 환경 변수 저장 후 **Redeploy** 실행
- [ ] 배포 URL에서 앱/안내 화면 확인

이후에도 흰 화면이면 브라우저 개발자 도구(F12) → Console 탭에서 에러 메시지를 확인해보세요.
