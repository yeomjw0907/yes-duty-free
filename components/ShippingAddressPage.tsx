import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingAddressInput>(emptyForm);
  const [showAddressSearchInfo, setShowAddressSearchInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isKorea = form.country === 'KR';
  const [addressSearchError, setAddressSearchError] = useState<string | null>(null);

  /** 한국 주소 검색 (다음 우편번호 API) */
  const openAddressSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddressSearchError(null);
    if (typeof window === 'undefined' || !window.daum?.Postcode) {
      setAddressSearchError(t('address.addressSearchUnavailable'));
      return;
    }
    try {
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
    } catch {
      setAddressSearchError(t('address.addressSearchUnavailable'));
    }
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
      alert(t('address.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('address.deleteConfirm'))) return;
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
          <h2 className="text-xl font-black text-gray-900 mb-2">{t('address.loginRequired')}</h2>
          <p className="text-gray-500 text-sm mb-8">{t('address.loginDesc')}</p>
          <button onClick={onNavigateToLogin} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all">
            {t('actions.login')}
          </button>
          <button onClick={() => onNavigateToPage('mypage')} className="w-full mt-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50">
            {t('address.backToMypage')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-16 bg-[#fcfcfc] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter">{t('address.title')}</h1>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm"
        >
          {t('address.addNew')}
        </button>
      </div>

      {/* 국내/해외 주소 UX 안내 */}
      <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-100">
        <button
          type="button"
          onClick={() => setShowAddressSearchInfo(!showAddressSearchInfo)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-sm font-bold text-gray-700">{t('address.guideTitle')}</span>
          <span className="text-gray-400">{showAddressSearchInfo ? '▲' : '▼'}</span>
        </button>
        {showAddressSearchInfo && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-2">
            <p>{t('address.guideKR')}</p>
            <p>{t('address.guideOverseas')}</p>
            <p>{t('address.guideNote')}</p>
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
          <p className="text-gray-500 font-bold mb-6">{t('address.empty')}</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
          >
            {t('address.addFirst')}
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
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded">{t('address.default')}</span>
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
                  {t('address.edit')}
                </button>
                {!a.is_default && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(a.id)}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50"
                  >
                    {t('address.setDefault')}
                  </button>
                )}
                <button
                  type="button"
                  disabled={deletingId === a.id}
                  onClick={() => handleDelete(a.id)}
                  className="px-4 py-2 text-gray-400 hover:text-red-600 text-xs font-bold disabled:opacity-50"
                >
                  {t('address.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-black text-gray-900">{editingId ? t('address.editTitle') : t('address.newTitle')}</h2>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{t('address.country')} *</label>
            <select
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t('address.recipientName')}</label>
              <input
                required
                type="text"
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                placeholder={t('address.placeholderFullName')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t('address.phoneLabel')}</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t('address.placeholderPhone')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          {/* 국내: 주소 검색 → 우편번호·기본 주소·상세 주소 (국내 서비스와 동일한 UX) */}
          {isKorea ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t('address.postalCode')} · {t('address.addressLine1')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={form.postal_code}
                    placeholder={t('signup.addressSearchPlaceholder')}
                    className="w-28 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                  <button
                    type="button"
                    onClick={openAddressSearch}
                    className="px-5 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 whitespace-nowrap"
                  >
                    {t('address.addressSearch')}
                  </button>
                </div>
                {addressSearchError && (
                  <p className="text-xs text-amber-600 mt-1">{addressSearchError}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t('address.addressLine1')} *</label>
                <input
                  required
                  type="text"
                  value={form.address_line1}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  placeholder={t('signup.addressLine1Placeholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t('address.addressLine2')}</label>
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  placeholder={t('signup.addressLine2Placeholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('address.postalCode')} (ZIP/Postal)</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    placeholder={t('address.placeholderOptional')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('signup.stateProvince')} (State/Province)</label>
                  <input
                    type="text"
                    value={form.state_province}
                    onChange={(e) => setForm({ ...form, state_province: e.target.value })}
                    placeholder={t('address.placeholderStateExample')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('signup.city')} (City)</label>
                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder={t('address.placeholderCity')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t('signup.address1Overseas')}
                </label>
                <input
                  required
                  type="text"
                  value={form.address_line1}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  placeholder={t('address.placeholderStreet')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t('signup.address2Overseas')}
                </label>
                <input
                  type="text"
                  value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  placeholder={t('address.placeholderApt')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{t('address.deliveryMemo')}</label>
            <input
              type="text"
              value={form.delivery_memo}
              onChange={(e) => setForm({ ...form, delivery_memo: e.target.value })}
              placeholder={t('address.deliveryMemoPlaceholder')}
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
              {t('address.setDefaultLabel')}
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? t('address.saving') : editingId ? t('address.update') : t('address.save')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-4 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50"
            >
              {t('actions.cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        <button type="button" onClick={() => onNavigateToPage('mypage')} className="text-sm font-bold text-gray-500 hover:text-red-600">
          {t('address.backLink')}
        </button>
      </div>
    </div>
  );
};

export default ShippingAddressPage;
