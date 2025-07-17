import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Development-only hook to detect missing translation keys
 * Warns when t(key) returns the key itself (meaning missing translation)
 */
export const useI18nGuard = () => {
  const { t } = useTranslation();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Create a wrapper around the t function to detect missing keys
    const checkMissingKey = (key: string) => {
      const result = t(key);
      
      // If translation returns the key itself, it means the translation is missing
      if (typeof result === 'string' && result === key) {
        console.warn(`🌐 Missing i18n key: ${key}`);
      }
      
      return result;
    };

    // Store the check function for potential use
    (window as any).__i18nKeyCheck = checkMissingKey;
  }, [t]);
};

export default useI18nGuard;