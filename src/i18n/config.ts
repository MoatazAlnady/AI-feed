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
import trCommon from './locales/tr/common.json';

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
  tr: { common: trCommon },
};

// Safe localStorage access
const getStoredLanguage = () => {
  try {
    return localStorage.getItem('preferredLocale') || 'en';
  } catch (error) {
    console.warn('localStorage not available:', error);
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    
    interpolation: {
      escapeValue: false,
    },
    
    // Ensure fallback values are shown instead of keys
    returnNull: false,
    returnEmptyString: false,
    
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
    
    debug: process.env.NODE_ENV === 'development',
  });

// Log language changes in development
if (process.env.NODE_ENV === 'development') {
  i18n.on('languageChanged', (lng) => {
    console.log('🌐 Language changed to:', lng);
    document.documentElement.lang = lng;
    
    // Handle RTL languages
    const rtlLanguages = ['ar', 'fa'];
    document.documentElement.dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
  });
}

export default i18n;