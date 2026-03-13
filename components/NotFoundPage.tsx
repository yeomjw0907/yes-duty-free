import React from 'react';
import { useTranslation } from 'react-i18next';

interface NotFoundPageProps {
  onGoHome: () => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 bg-[#fcfcfc]">
      <div className="bg-white rounded-[2rem] p-12 max-w-md w-full text-center border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 mb-2">{t('notFound.title')}</h2>
        <p className="text-gray-500 text-sm mb-8">{t('notFound.desc')}</p>
        <button
          type="button"
          onClick={onGoHome}
          className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all"
        >
          {t('actions.goHome')}
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;

