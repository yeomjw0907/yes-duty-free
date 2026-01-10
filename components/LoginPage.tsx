
import React, { useState } from 'react';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignup, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-20 bg-[#fcfcfc]">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] p-10 lg:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-50">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Welcome Back</h2>
            <p className="text-gray-400 font-medium text-sm mt-3">예스 듀티프리에 오신 것을 환영합니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <input
                type="email"
                placeholder="이메일 주소"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:bg-white focus:border-red-500/30 text-[15px] font-medium transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <input
                type="password"
                placeholder="비밀번호"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:bg-white focus:border-red-500/30 text-[15px] font-medium transition-all"
              />
            </div>
            
            <div className="flex items-center justify-between text-[12px] text-gray-400 font-bold py-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded-md border-gray-200 text-red-600 focus:ring-red-500" />
                <span className="group-hover:text-gray-600 transition-colors">로그인 유지</span>
              </label>
              <div className="flex gap-4">
                <button type="button" className="hover:text-red-600 transition-colors">계정 찾기</button>
                <button type="button" className="hover:text-red-600 transition-colors">비밀번호 찾기</button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4.5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/10 active:scale-95 mt-6 py-4"
            >
              로그인하기
            </button>
          </form>

          <div className="mt-12 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
              <div className="relative flex justify-center text-xs font-black uppercase tracking-widest text-gray-300"><span className="bg-white px-4">Social Login</span></div>
            </div>
            <div className="flex justify-center gap-6">
              <button className="w-14 h-14 rounded-2xl bg-[#FEE500] flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                <span className="text-[12px] font-black text-gray-900">K</span>
              </button>
              <button className="w-14 h-14 rounded-2xl bg-[#03C75A] flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                <span className="text-[12px] font-black text-white">N</span>
              </button>
              <button className="w-14 h-14 rounded-2xl border border-gray-100 flex items-center justify-center shadow-sm bg-white hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-[15px] text-gray-400 font-semibold">
            아직 계정이 없으신가요?
            <button 
              onClick={onSwitchToSignup}
              className="ml-3 text-red-600 font-black hover:underline"
            >
              간편 회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
