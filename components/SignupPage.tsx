import React, { useState } from 'react';
import { COUNTRY_OPTIONS, PHONE_COUNTRY_OPTIONS } from '../lib/constants/address';
import type { ShippingAddressInput } from '../lib/api/shippingAddresses';

/** 다음(카카오) 우편번호 API 선택 결과 타입 */
interface DaumPostcodeData {
  zonecode: string;
  address: string;
  roadAddress?: string;
  jibunAddress?: string;
  sido?: string;
  sigungu?: string;
  bname?: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: { oncomplete: (data: DaumPostcodeData) => void }) => { open: () => void };
    };
  }
}

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: () => void;
  onSignUp: (
    email: string,
    password: string,
    options?: { name?: string; phone?: string; address?: ShippingAddressInput }
  ) => Promise<{ error: { message: string } | null }>;
}

const emptyAddress = {
  country: '',
  postal_code: '',
  state_province: '',
  city: '',
  address_line1: '',
  address_line2: '',
};

const SignupPage: React.FC<SignupPageProps> = ({ onSwitchToLogin, onSignupSuccess, onSignUp }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phoneCountryCode: '+82',
    phoneNumber: '',
    ...emptyAddress,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isKorea = formData.country === 'KR';

  const openAddressSearch = () => {
    if (typeof window === 'undefined' || !window.daum?.Postcode) {
      alert('주소 검색 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete(data: DaumPostcodeData) {
        setFormData((prev) => ({
          ...prev,
          postal_code: data.zonecode,
          address_line1: data.roadAddress || data.address || '',
          state_province: data.sido ?? prev.state_province,
          city: data.sigungu || data.bname || prev.city || '대한민국',
        }));
      },
    }).open();
  };

  const fullPhone =
    formData.phoneCountryCode === ''
      ? formData.phoneNumber.trim()
      : `${formData.phoneCountryCode} ${formData.phoneNumber.trim()}`.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상 입력해주세요.');
      return;
    }
    if (!fullPhone) {
      setError('전화번호를 입력해 주세요.');
      return;
    }
    const addressPayload: ShippingAddressInput = {
      recipient_name: formData.name,
      phone: fullPhone,
      country: formData.country,
      postal_code: formData.postal_code || undefined,
      state_province: formData.state_province || undefined,
      city: formData.country === 'KR' && !formData.city ? '대한민국' : formData.city,
      address_line1: formData.address_line1,
      address_line2: formData.address_line2 || undefined,
      is_default: true,
    };
    setLoading(true);
    try {
      const { error: err } = await onSignUp(formData.email, formData.password, {
        name: formData.name,
        phone: fullPhone,
        address: addressPayload,
      });
      if (err) {
        setError(err.message === 'User already registered' ? '이미 가입된 이메일입니다.' : err.message);
        return;
      }
      onSignupSuccess();
    } catch (e) {
      setError('회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
            />
          </div>

          {/* 전화번호 (국가 코드 포함) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">전화번호 *</label>
            <div className="flex gap-2">
              <select
                value={formData.phoneCountryCode}
                onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                className="w-28 px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm bg-white"
              >
                {PHONE_COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.value || 'other'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder={formData.phoneCountryCode ? '10 1234 5678' : '국가코드 포함 입력 (+39 123 456 7890)'}
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
              />
            </div>
          </div>

          {/* 배송지 (국가별: 국내 주소검색 / 해외 Address Line) */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-500 mb-2">기본 배송지 *</label>
            <div className="space-y-3">
              <div>
                <span className="block text-xs font-bold text-gray-500 mb-1">국가</span>
                <select
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm bg-white"
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <option key={opt.value || 'select'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {isKorea ? (
                <>
                  <div>
                    <span className="block text-xs font-bold text-gray-500 mb-1">우편번호 · 기본 주소</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={formData.postal_code}
                        placeholder="주소 검색으로 자동 입력"
                        className="w-24 px-3 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm"
                      />
                      <button
                        type="button"
                        onClick={openAddressSearch}
                        className="px-4 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 text-sm whitespace-nowrap"
                      >
                        주소 검색
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-500 mb-1">기본 주소 *</span>
                    <input
                      required
                      type="text"
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      placeholder="주소 검색 후 자동 입력 (수정 가능)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-500 mb-1">상세 주소 (동·호수 등)</span>
                    <input
                      type="text"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      placeholder="상세 주소를 입력하세요"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-xs font-bold text-gray-500 mb-1">우편번호</span>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        placeholder="ZIP"
                        className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                      />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-gray-500 mb-1">주/도</span>
                      <input
                        type="text"
                        value={formData.state_province}
                        onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                        placeholder="State"
                        className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                      />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-gray-500 mb-1">도시 *</span>
                      <input
                        required
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-500 mb-1">주소 1 (거리·건물) *</span>
                    <input
                      required
                      type="text"
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      placeholder="Street address, building"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-500 mb-1">주소 2 (호실·Apt 등)</span>
                    <input
                      type="text"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                      placeholder="Apt, Suite, Floor (선택)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}

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
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div className="mt-10 space-y-4">
          <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest">SNS 계정으로 간편 시작하기</p>
          <div className="flex justify-center gap-6">
            <button className="w-12 h-12 rounded-full bg-[#06C755] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity" title="LINE으로 가입">
              <span className="text-white text-[10px] font-black tracking-tighter">LINE</span>
            </button>
            <button className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity" title="Facebook으로 가입">
              <span className="text-white text-[18px] font-black">f</span>
            </button>
            <button className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors" title="Google으로 가입">
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
            <button onClick={onSwitchToLogin} className="ml-2 text-red-500 font-bold hover:underline">
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
