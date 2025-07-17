import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'header' | 'menu';
  onLocaleChange?: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'header',
  onLocaleChange 
}) => {
  const handleLanguageChange = (value: string) => {
    // Set app locale (placeholder for when i18n is fully implemented)
    console.log('Setting locale to:', value);
    
    // Store in localStorage
    localStorage.setItem('preferredLocale', value);
    
    // Call callback if provided
    if (onLocaleChange) {
      onLocaleChange();
    }
    
    // Reload page
    window.location.reload();
  };

  const currentLocale = localStorage.getItem('preferredLocale') || 'en';

  if (variant === 'menu') {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          const select = document.createElement('select');
          select.innerHTML = `
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
            <option value="fa">فارسی</option>
            <option value="ru">Русский</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
          `;
          select.value = currentLocale;
          select.style.position = 'absolute';
          select.style.opacity = '0';
          select.style.pointerEvents = 'none';
          document.body.appendChild(select);
          
          select.onchange = () => {
            handleLanguageChange(select.value);
            document.body.removeChild(select);
          };
          
          select.focus();
          select.click();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
      >
        <Globe className="h-4 w-4 mr-2" />
        Language
      </button>
    );
  }

  return (
    <select
      value={currentLocale}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    >
      <option value="en">English</option>
      <option value="ar">العربية</option>
      <option value="de">Deutsch</option>
      <option value="fr">Français</option>
      <option value="es">Español</option>
      <option value="fa">فارسی</option>
      <option value="ru">Русский</option>
      <option value="zh">中文</option>
      <option value="ja">日本語</option>
    </select>
  );
};

export default LanguageSelector;