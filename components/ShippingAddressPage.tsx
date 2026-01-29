import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ShippingAddress } from '../types';
import type { ShippingAddressInput } from '../lib/api/shippingAddresses';
import { COUNTRY_OPTIONS } from '../lib/constants/address';

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

const emptyForm: ShippingAddressInput = {
  recipient_name: '',
  phone: '',
  country: '',
  postal_code: '',
  state_province: '',
  city: '',
  address_line1: '',
  address_line2: '',
  delivery_memo: '',
  is_default: false,
};

interface ShippingAddressPageProps {
  user: User | null;
  addresses: ShippingAddress[];
  isLoading: boolean;
  onCreate: (input: ShippingAddressInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<ShippingAddressInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateToPage: (page: string) => void;
}

const ShippingAddressPage: React.FC<ShippingAddressPageProps> = ({
  user,
  addresses,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onSetDefault,
  onNavigateToLogin,
  onNavigateToPage,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingAddressInput>(emptyForm);
  const [showAddressSearchInfo, setShowAddressSearchInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isKorea = form.country === 'KR';

  /** 한국 주소 검색 (다음 우편번호 API) */
  const openAddressSearch = () => {
    if (typeof window === 'undefined' || !window.daum?.Postcode) {
      alert('주소 검색 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete(data: DaumPostcodeData) {
        setForm((prev) => ({
          ...prev,
          postal_code: data.zonecode,
          address_line1: data.roadAddress || data.address || '',
          state_province: data.sido ?? prev.state_province,
          city: data.sigungu || data.bname || prev.city || '대한민국',
        }));
      },
    }).open();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const fillForm = (a: ShippingAddress) => {
    setForm({
      recipient_name: a.recipient_name,
      phone: a.phone,
      country: a.country,
      postal_code: a.postal_code ?? '',
      state_province: a.state_province ?? '',
      city: a.city,
      address_line1: a.address_line1,
      address_line2: a.address_line2 ?? '',
      delivery_memo: a.delivery_memo ?? '',
      is_default: a.is_default,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.country === 'KR' && !payload.city) {
        payload.city = '대한민국';
      }
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 배송지를 삭제할까요?')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      if (editingId === id) resetForm();
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center text-3xl">📍</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 text-sm mb-8">배송지를 관리하려면 로그인해 주세요.</p>
          <button onClick={onNavigateToLogin} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all">
            로그인하기
          </button>
          <button onClick={() => onNavigateToPage('mypage')} className="w-full mt-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50">
            마이페이지로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-16 bg-[#fcfcfc] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter">배송지 관리</h1>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm"
        >
          + 새 배송지
        </button>
      </div>

      {/* 국내/해외 주소 UX 안내 */}
      <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-100">
        <button
          type="button"
          onClick={() => setShowAddressSearchInfo(!showAddressSearchInfo)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-sm font-bold text-gray-700">📍 국내·해외 주소 입력 안내</span>
          <span className="text-gray-400">{showAddressSearchInfo ? '▲' : '▼'}</span>
        </button>
        {showAddressSearchInfo && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-2">
            <p>
              <strong>한국</strong>: &quot;주소 검색&quot;으로 우편번호·기본 주소를 넣고, <strong>상세 주소</strong>(동·호수 등)만 입력하면 됩니다.
            </p>
            <p>
              <strong>해외</strong>: <strong>Address Line 1</strong>(거리·건물명) + <strong>Address Line 2</strong>(호실·층·Apt/Suite) 로, 국내의 기본 주소/상세 주소와 같은 개념입니다.
            </p>
            <p>
              일부 국가는 우편번호(ZIP/Postal) 입력 후 도시·주 자동 채우기를 지원합니다. (추후 제공 예정)
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500 font-bold mb-6">등록된 배송지가 없습니다.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
          >
            첫 배송지 추가
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${a.is_default ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100'}`}
            >
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-gray-900">{a.recipient_name}</span>
                  {a.is_default && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded">기본</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {[a.address_line1, a.address_line2, a.city, a.state_province, a.postal_code, a.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{a.phone}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fillForm(a)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  수정
                </button>
                {!a.is_default && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(a.id)}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50"
                  >
                    기본 설정
                  </button>
                )}
                <button
                  type="button"
                  disabled={deletingId === a.id}
                  onClick={() => handleDelete(a.id)}
                  className="px-4 py-2 text-gray-400 hover:text-red-600 text-xs font-bold disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-black text-gray-900">{editingId ? '배송지 수정' : '새 배송지'}</h2>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">국가 *</label>
            <select
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">수신자 이름 *</label>
              <input
                required
                type="text"
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                placeholder="Full name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">전화번호 *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          {/* 국내: 주소 검색 → 우편번호·기본 주소·상세 주소 (국내 서비스와 동일한 UX) */}
          {isKorea ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">우편번호 · 기본 주소</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={form.postal_code}
                    placeholder="주소 검색으로 자동 입력"
                    className="w-28 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={openAddressSearch}
                    className="px-5 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 whitespace-nowrap"
                  >
                    주소 검색
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">기본 주소 *</label>
                <input
                  required
                  type="text"
                  value={form.address_line1}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  placeholder="주소 검색 후 자동 입력 (수정 가능)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">상세 주소 (동·호수 등)</label>
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  placeholder="상세 주소를 입력하세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">우편번호 (ZIP/Postal)</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">주/도 (State/Province)</label>
                  <input
                    type="text"
                    value={form.state_province}
                    onChange={(e) => setForm({ ...form, state_province: e.target.value })}
                    placeholder="e.g. CA, Tokyo"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">도시 (City) *</label>
                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  주소 1 (Street, Building) * — 기본 주소에 해당
                </label>
                <input
                  required
                  type="text"
                  value={form.address_line1}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  placeholder="Street address, building name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  주소 2 (Apt, Suite, Floor) — 상세 주소에 해당
                </label>
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  placeholder="Apt, Suite, Unit, Building, Floor (optional)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">배송 메모 (선택)</label>
            <input
              type="text"
              value={form.delivery_memo}
              onChange={(e) => setForm({ ...form, delivery_memo: e.target.value })}
              placeholder="e.g. Leave at door"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="is_default" className="text-sm font-bold text-gray-700">
              기본 배송지로 설정
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? '저장 중...' : editingId ? '수정하기' : '저장하기'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        <button type="button" onClick={() => onNavigateToPage('mypage')} className="text-sm font-bold text-gray-500 hover:text-red-600">
          ← 마이페이지로
        </button>
      </div>
    </div>
  );
};

export default ShippingAddressPage;
