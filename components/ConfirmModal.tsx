import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = '확인',
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
