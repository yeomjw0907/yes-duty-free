import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { supabase } from './lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function EnvError() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Pretendard, sans-serif',
        backgroundColor: '#fcfcfc',
        color: '#1a1a1a',
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>환경 변수가 설정되지 않았습니다</h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
          Vercel 대시보드에서 다음 환경 변수를 추가한 뒤 재배포해주세요.
        </p>
        <code style={{ display: 'block', background: '#f0f0f0', padding: 12, borderRadius: 8, fontSize: 13 }}>
          VITE_SUPABASE_URL<br />
          VITE_SUPABASE_ANON_KEY
        </code>
        <p style={{ fontSize: 12, color: '#999', marginTop: 16 }}>
          설정: Project → Settings → Environment Variables
        </p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
if (!supabase) {
  root.render(<EnvError />);
} else {
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
}
