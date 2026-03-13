import React, { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createInquiry, getMyInquiries, type InquiryRow } from '../lib/api/inquiries';

interface InquiriesPageProps {
  user: User | null;
  onNavigateToLogin: () => void;
  onBack: () => void;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const statusLabel = (s: InquiryRow['status']) => (s === 'answered' ? '답변완료' : s === 'closed' ? '종료' : '대기중');

const InquiriesPage: React.FC<InquiriesPageProps> = ({ user, onNavigateToLogin, onBack }) => {
  const [list, setList] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const fetchList = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setList(await getMyInquiries(user.id));
    } catch (e) {
      console.error(e);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const canSubmit = useMemo(() => subject.trim().length > 0 && message.trim().length > 0, [subject, message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await createInquiry(user.id, { subject, message });
      setSubject('');
      setMessage('');
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : '문의 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
        <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 text-sm mb-8">1:1 문의를 이용하려면 로그인해 주세요.</p>
          <button onClick={onNavigateToLogin} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700">
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-[#fcfcfc] min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <button type="button" onClick={onBack} className="text-sm font-bold text-gray-500 hover:text-red-600">
          ← 마이페이지
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tighter">1:1 문의</h1>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white rounded-[2rem] border border-gray-100 p-6">
          <h2 className="text-lg font-black text-gray-900 mb-4">문의 작성</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-500 mb-1">제목</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm"
                placeholder="예) 배송지 변경 요청"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 mb-1">내용</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm min-h-[140px]"
                placeholder="문의 내용을 입력해 주세요."
              />
            </div>
            {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '등록 중…' : '문의 등록'}
            </button>
          </form>
        </section>

        <section className="lg:col-span-7 bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">내 문의</h2>
            <button type="button" onClick={fetchList} className="text-xs font-black text-gray-400 hover:text-red-600">
              새로고침
            </button>
          </div>
          {loading ? (
            <div className="p-10">
              <div className="h-6 w-40 bg-gray-100 rounded-lg animate-pulse mb-3" />
              <div className="h-6 w-56 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ) : list.length === 0 ? (
            <div className="p-14 text-center">
              <p className="text-gray-400 font-bold">등록된 문의가 없습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {list.map((q) => (
                <li key={q.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 truncate">{q.subject}</p>
                      <p className="text-xs text-gray-400 font-bold mt-1">{formatDateTime(q.created_at)}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black ${
                        q.status === 'answered' ? 'bg-green-50 text-green-700' : q.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {statusLabel(q.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{q.message}</p>
                  {q.admin_reply && (
                    <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-black text-gray-500 mb-2">관리자 답변</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.admin_reply}</p>
                      {q.replied_at && <p className="text-[11px] text-gray-400 font-bold mt-2">{formatDateTime(q.replied_at)}</p>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default InquiriesPage;

