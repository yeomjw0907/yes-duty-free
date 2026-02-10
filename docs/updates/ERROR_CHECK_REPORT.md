# 렌더링·API·로그인/로그아웃 점검 보고서

**점검 일자:** 2025-02-10  
**대상:** yes-duty-free 프로젝트 전반 (App, AdminPanel, useAuth, API, 컴포넌트)

---

## 1. 요약

| 항목 | 결과 | 비고 |
|------|------|------|
| **빌드** | ✅ 성공 | `npm run build` 정상 완료 (163 modules) |
| **린트** | ✅ 오류 없음 | App.tsx, AdminPanel.tsx, useAuth.ts 등 검사 |
| **렌더링** | ✅ 이상 없음 | key·optional chaining·배열 접근 적절히 사용 |
| **로그인/로그아웃** | ⚠️ 개선 권장 | 관리자 로그아웃·UI 흐름 정상, 예외 처리 보강 권장 |
| **API/비동기** | ⚠️ 개선 권장 | 일부 Promise 미처리·getProfile 예외 시 loading 고착 가능 |

---

## 2. 빌드·린트

- **Vite 빌드:** 성공 (1.51s, `dist/` 생성)
- **TypeScript/ESLint:** 검사한 주요 파일에서 오류 없음

---

## 3. 로그인·로그아웃

### 3.1 일반 로그인 (useAuth + LoginPage)

- **useAuth.signIn:** 에러 시 `{ error }` 반환, 탈퇴 계정 시 메시지 반환 후 signOut. 정상.
- **LoginPage:** `onSignIn` 호출 후 `setLoading(false)` 실행.  
  **권장:** `onSignIn`이 예기치 않게 throw하면 `setLoading(false)`가 실행되지 않을 수 있으므로, `try { ... } finally { setLoading(false); }` 적용 권장.
- **Layout.onLogout:** `signOut` 전달, 로그아웃 버튼 연동 정상.

### 3.2 관리자 로그인·로그아웃

- **handleAdminLogin (App.tsx):**
  - signIn → checkIsAdmin → 실패 시 signOut 호출. 흐름 정상.
  - **권장:** `signIn` 또는 `checkIsAdmin` 예외 시 사용자에게 메시지 표시를 위해 `try/catch` + `setError` 적용 권장.
- **AdminPanel 로그아웃:**
  - "LOGOUT SYSTEM" 클릭 → `handleLogout()` → `Promise.resolve(onClose()).catch(...)` 호출.
  - App의 `onClose`: `try { await signOut(); } finally { setIsAdminLoggedIn(false); }` 로 **항상** 로그아웃 상태로 전환. ✅ 정상.

### 3.3 useAuth 초기 세션·프로필

- **getSession().then(async ...):**  
  내부에서 `getProfile(s.user.id)` 호출. **getProfile이 throw하면** (네트워크/DB 오류) Promise가 reject되고 **setLoading(false)가 호출되지 않아** `authLoading`이 계속 true일 수 있음.
- **onAuthStateChange** 콜백 역시 동일: `getProfile` 예외 시 loading 해제 없음.

**권장:**  
- getSession / onAuthStateChange 내부를 `try { ... } finally { setLoading(false); }` 로 감싸거나,  
- 최소한 `.catch(() => setLoading(false))` 를 붙여 로딩이 풀리도록 처리.

---

## 4. API·비동기 호출

### 4.1 App.tsx useEffect

| 위치 | API | 처리 |
|------|-----|------|
| 팝업 이벤트 | `getPopupEvents()` | `.then(...)` 만 사용, **.catch 없음** → 실패 시 unhandled rejection 가능 |
| 라이브 | `getLiveStreams()` | `.finally(setLiveStreamsLoading(false))` ✅ |
| 공지/이벤트 목록 | `getEvents(...)` | `.finally(setBoardEventsLoading(false))` ✅ |
| 공지/이벤트 상세 | `getEventById(...)` | `.finally(setBoardEventDetailLoading(false))` ✅ |

**권장:** `getPopupEvents()` 에 `.catch(() => {})` 또는 로깅 후 상태 초기화 추가.

### 4.2 기타 API

- **lib/api:** 대부분 `if (error) throw error` 패턴. 호출 측(React Query 등)에서 catch 하면 무방.
- **recordSearchKeyword:** `products.ts`에서 `.catch(() => {})` 로 무시. 의도된 처리.

---

## 5. 렌더링·null 안전성

### 5.1 Optional chaining·기본값

- `user?.id`, `profile?.name`, `user?.email`, `profile?.membership_tier` 등 적절히 사용.
- `(profile?.name ?? user?.email ?? 'Y').charAt(0)` 등 fallback 처리 있음.

### 5.2 리스트·key

- `products.map(p => ...)` 에 `key={p.id}` 사용.
- `liveStreams`, `boardEventsList`, `myOrders` 등 length 체크 후 렌더링.
- `popupEvents[popupIndex]` 접근 전 `popupEvents.length > 0 && popupEvents[popupIndex]` 조건으로 방어. ✅

### 5.3 훅 인자

- `useCart(user?.id)`, `useProfile(user?.id)` 등 `undefined` 허용.  
- useCart/useProfile 내부에서 `enabled: !!userId` 로 비활성화. ✅

---

## 6. 정리·권장 조치 (✅ 반영 완료)

1. **useAuth** ✅
   - `getSession().then(...)` 에 `try/finally` 로 `setLoading(false)` 보장, `.catch(() => setLoading(false))` 추가.
   - `onAuthStateChange` 콜백에 `try/finally` 로 예외 시에도 `setLoading(false)` 실행.
2. **LoginPage / SignupPage** ✅
   - `handleSubmit` 에 `try/catch/finally` 적용, `finally`에서 `setLoading(false)` 실행. 예외 시 사용자 메시지 표시.
3. **App.tsx** ✅
   - `getPopupEvents().then(...).catch(() => {})` 추가로 unhandled rejection 방지.
   - `handleAdminLogin` 에 `try/catch` + `setError` 로 예외 메시지 노출.
4. **로그아웃**
   - 관리자·일반 로그아웃 흐름은 현재 구현으로 정상 동작. 추가 수정 불필요.

위 항목이 반영되어 렌더링·API·로그인/로그아웃 관련 예외 처리가 보강되었습니다.
