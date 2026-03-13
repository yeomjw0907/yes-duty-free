import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonKo from './locales/ko/common.json';
import commonZhTW from './locales/zh-TW/common.json';

const STORAGE_KEY = 'ydf_lang';

const resources = {
  ko: { common: commonKo },
  'zh-TW': { common: commonZhTW },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export const LANG_STORAGE_KEY = STORAGE_KEY;
export default i18n;

