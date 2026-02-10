import React from 'react';
import type { EventRow } from '../types';

const MAIN_POPUP_DISMISSED_KEY = 'main-popup-dismissed';

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isPopupDismissedToday(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MAIN_POPUP_DISMISSED_KEY) === getTodayDateString();
}

export function setPopupDismissedToday(): void {
  try {
    localStorage.setItem(MAIN_POPUP_DISMISSED_KEY, getTodayDateString());
  } catch (_) {}
}

interface MainPopupModalProps {
  event: EventRow;
  onClose: () => void;
  onDismissToday: () => void;
}

const MainPopupModal: React.FC<MainPopupModalProps> = ({ event, onClose, onDismissToday }) => {
  const handleImageClick = () => {
    if (event.link_url?.trim()) {
      window.open(event.link_url.trim(), '_blank', 'noopener,noreferrer');
    }
  };

  const handleDismissToday = () => {
    setPopupDismissedToday();
    onDismissToday();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        {event.popup_image_url ? (
          <button
            type="button"
            onClick={handleImageClick}
            className="w-full block cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 rounded-t-2xl overflow-hidden"
          >
            <img
              src={event.popup_image_url}
              alt={event.title}
              className="w-full h-auto max-h-[70vh] object-contain bg-gray-50"
            />
          </button>
        ) : (
          <div className="w-full py-16 px-6 text-center bg-gray-50 rounded-t-2xl">
            <p className="text-lg font-black text-gray-800">{event.title}</p>
            {event.link_url?.trim() && (
              <a
                href={event.link_url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
              >
                자세히 보기
              </a>
            )}
          </div>
        )}
        <div className="p-4 flex flex-wrap gap-2 justify-center border-t border-gray-100">
          <button
            type="button"
            onClick={handleDismissToday}
            className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            오늘 하루 안 보기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainPopupModal;
