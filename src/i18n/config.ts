import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import deCommon from './locales/de/common.json';
import frCommon from './locales/fr/common.json';
import esCommon from './locales/es/common.json';
import faCommon from './locales/fa/common.json';
import ruCommon from './locales/ru/common.json';
import zhCommon from './locales/zh/common.json';
import jaCommon from './locales/ja/common.json';

const resources = {
  en: { common: enCommon },
  ar: { common: arCommon },
  de: { common: deCommon },
  fr: { common: frCommon },
  es: { common: esCommon },
  fa: { common: faCommon },
  ru: { common: ruCommon },
  zh: { common: zhCommon },
  ja: { common: jaCommon },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('preferredLocale') || 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;