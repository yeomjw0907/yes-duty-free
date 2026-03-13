import React from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/api/users';
import type { OrderRecord } from '../lib/api/orders';

type PointEntry =
  | { id: string; type: 'earn'; points: number; created_at: string; order_number: string }
  | { id: string; type: 'use'; points: number; created_at: string; order_number: string };

interface PointHistoryPageProps {
  user: User | null;
  profile: UserProfile | null;
  orders: OrderRecord[];
  isLoading: boolean;
  onNavigateToLogin: () => void;
  onBack: () => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const PointHistoryPage: React.FC<PointHistoryPageProps> = ({
  user,
  profile,
  orders,
  isLoading,
  onNavigateToLogin,
  onBack,
}) => {
  const { t } = useTranslation();
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-2">{t('point.loginRequired')}</h2>
          <p className="text-gray-500 text-sm mb-8">{t('point.loginDesc')}</p>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700"
          >
            {t('actions.login')}
          </button>
        </div>
      </div>
    );
  }

  const entries: PointEntry[] = [];
  for (const o of orders) {
    const used = Math.max(0, Math.floor((o as any).used_points ?? 0));
    const earned = Math.max(0, Math.floor((o as any).earned_points ?? 0));
    if (used > 0) {
      entries.push({
        id: `${o.id}-use`,
        type: 'use',
        points: used,
        created_at: o.created_at,
        order_number: o.order_number,
      });
    }
    if (earned > 0) {
      entries.push({
        id: `${o.id}-earn`,
        type: 'earn',
        points: earned,
        created_at: o.created_at,
        order_number: o.order_number,
      });
    }
  }
  entries.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 bg-[#fcfcfc] min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-bold text-gray-500 hover:text-red-600"
        >
          {t('point.backToMypage')}
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tighter">{t('point.title')}</h1>
        <div className="w-16" />
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('point.balance')}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {(profile?.points ?? 0).toLocaleString()}P
            </p>
          </div>
          <p className="text-xs text-gray-400 font-bold">{t('point.orderHistory')}</p>
        </div>

        {isLoading ? (
          <div className="p-10">
            <div className="h-6 w-40 bg-gray-100 rounded-lg animate-pulse mb-4" />
            <div className="h-6 w-56 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-gray-400 font-bold">{t('point.empty')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entries.map((e) => (
              <li key={e.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {e.type === 'earn' ? t('point.earn') : t('point.use')} · {e.order_number}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(e.created_at)}</p>
                </div>
                <p className={`font-black ${e.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                  {e.type === 'earn' ? '+' : '-'}
                  {e.points.toLocaleString()}P
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PointHistoryPage;

