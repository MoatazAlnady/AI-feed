import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const languageNames: { [key: string]: string } = {
  en: 'English',
  ar: 'العربية',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  tr: 'Türkçe',
  fa: 'فارسی',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
};

interface TranslateButtonProps {
  contentType: 'post' | 'article' | 'discussion' | 'tool' | 'event';
  contentId: string;
  originalText: string;
  detectedLanguage?: string;
  onTranslated: (translatedText: string) => void;
  className?: string;
}

const TranslateButton: React.FC<TranslateButtonProps> = ({
  contentType,
  contentId,
  originalText,
  detectedLanguage,
  onTranslated,
  className = ''
}) => {
  const { user } = useAuth();
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalContent, setOriginalContent] = useState<string | null>(null);

  // Get user's preferred language
  const getUserLanguage = () => {
    try {
      return localStorage.getItem('preferredLocale') || 'en';
    } catch {
      return 'en';
    }
  };

  const userLanguage = getUserLanguage();

  // Only show translate button if:
  // 1. We know the content language (detected_language exists)
  // 2. Content language is different from user's language
  // 3. Content is long enough to be worth translating (min 20 chars)
  if (!detectedLanguage) {
    return null; // Don't show if language is unknown
  }
  
  if (detectedLanguage === userLanguage) {
    return null; // Same language, no need to translate
  }
  
  if (!originalText || originalText.length < 20) {
    return null; // Content too short
  }

  const handleTranslate = async () => {
    if (isTranslated && originalContent) {
      // Revert to original
      onTranslated(originalContent);
      setIsTranslated(false);
      setOriginalContent(null);
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          content_type: contentType,
          content_id: contentId,
          target_language: userLanguage,
          text_to_translate: originalText,
          source_language: detectedLanguage
        }
      });

      if (error) throw error;

      if (data?.translated_text) {
        setOriginalContent(originalText);
        onTranslated(data.translated_text);
        setIsTranslated(true);
        
        if (data.from_cache) {
          console.log('Translation loaded from cache');
        }
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      toast.error('Translation failed. Please try again later.');
    } finally {
      setIsTranslating(false);
    }
  };

  const targetLanguageName = languageNames[userLanguage] || userLanguage;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleTranslate}
      disabled={isTranslating}
      className={`gap-1.5 text-xs text-muted-foreground hover:text-foreground ${className}`}
    >
      {isTranslating ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Languages className="h-3 w-3" />
      )}
      {isTranslated ? 'Show Original' : `Translate to ${targetLanguageName}`}
    </Button>
  );
};

export default TranslateButton;
