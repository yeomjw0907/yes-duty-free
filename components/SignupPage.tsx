
import React, { useState } from 'react';

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSwitchToLogin, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    alert('회원가입 완료! 로그인 페이지로 이동합니다.');
    onSignupSuccess();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
          <p className="text-gray-500 text-sm mt-2">전세계 어디서든 면세 혜택을 누리세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">비밀번호</label>
            <input
              type="password"
              placeholder="8자 이상 입력해주세요"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">비밀번호 확인</label>
            <input
              type="password"
              placeholder="다시 한번 입력해주세요"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">이름</label>
            <input
              type="text"
              placeholder="실명을 입력해주세요"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">해외 배송지 (기본)</label>
            <textarea
              placeholder="정확한 영문 주소를 입력해주세요"
              required
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm resize-none"
            />
          </div>

          <div className="space-y-3 py-4 border-t border-gray-50 mt-4">
            <div className="flex items-start gap-3 text-xs text-gray-500">
              <input type="checkbox" id="terms" required className="mt-0.5 w-4 h-4 accent-red-500" />
              <label htmlFor="terms" className="cursor-pointer font-medium">[필수] 예스 듀티프리 이용약관 동의</label>
            </div>
            <div className="flex items-start gap-3 text-xs text-gray-500">
              <input type="checkbox" id="privacy" required className="mt-0.5 w-4 h-4 accent-red-500" />
              <label htmlFor="privacy" className="cursor-pointer font-medium">[필수] 개인정보 수집 및 이용 동의</label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100"
          >
            가입하기
          </button>
        </form>

        <div className="mt-10 space-y-4">
          <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest">SNS 계정으로 간편 시작하기</p>
          <div className="flex justify-center gap-6">
            {/* LINE */}
            <button className="w-12 h-12 rounded-full bg-[#06C755] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity" title="LINE으로 가입">
              <span className="text-white text-[10px] font-black tracking-tighter">LINE</span>
            </button>
            {/* FACEBOOK */}
            <button className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity" title="Facebook으로 가입">
              <span className="text-white text-[18px] font-black">f</span>
            </button>
            {/* GOOGLE */}
            <button className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors" title="Google로 가입">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            이미 계정이 있으신가요?
            <button 
              onClick={onSwitchToLogin}
              className="ml-2 text-red-500 font-bold hover:underline"
            >
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
