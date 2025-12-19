import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { toast } from '@/hooks/use-toast';

interface LanguageSelectorProps {
  variant?: 'header' | 'menu';
  onLocaleChange?: () => void;
}

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'header',
  onLocaleChange 
}) => {
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(i18n.language || 'en');
  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      console.log('🌐 LanguageSelector detected change:', lng);
      setCurrentLocale(lng);
      
      // Update document lang and direction
      document.documentElement.lang = lng;
      const rtlLanguages = ['ar', 'fa'];
      document.documentElement.dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      console.log('🌐 Changing language to:', languageCode);
      
      // Change i18n language
      await i18n.changeLanguage(languageCode);
      
      // Store in localStorage
      localStorage.setItem('preferredLocale', languageCode);
      
      // Update local state
      setCurrentLocale(languageCode);
      
      // Close popover
      setIsOpen(false);
      
      // Show success toast
      const languageName = languages.find(l => l.code === languageCode)?.nativeName || languageCode;
      toast({
        title: "Language changed",
        description: `Language set to ${languageName}`,
      });
      
      // Call callback if provided
      if (onLocaleChange) {
        onLocaleChange();
      }
      
      console.log('✅ Language change complete:', languageCode);
    } catch (error) {
      console.error('❌ Error changing language:', error);
      toast({
        title: "Error",
        description: "Failed to change language. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (variant === 'menu') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center justify-between"
          >
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              {t('language', 'Language')}
            </div>
            <span className="text-xs text-muted-foreground">
              {currentLanguage.nativeName}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-40 p-0 z-50 bg-popover border border-border shadow-lg backdrop-blur-sm" 
          side="right" 
          align="start"
          sideOffset={8}
        >
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center justify-between gap-2"
              >
                <span>{language.nativeName}</span>
                {currentLocale === language.code && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <select
      value={currentLocale}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="px-3 py-1 text-sm border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
    >
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.nativeName}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;