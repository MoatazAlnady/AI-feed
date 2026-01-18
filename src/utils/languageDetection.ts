/**
 * Simple client-side language detection utility based on character ranges.
 * Returns a language code if detected, or the user's current language as fallback.
 */

// Character ranges for different scripts
const languagePatterns: { pattern: RegExp; code: string; minRatio: number }[] = [
  { pattern: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, code: 'ar', minRatio: 0.3 }, // Arabic
  { pattern: /[\u0400-\u04FF\u0500-\u052F]/g, code: 'ru', minRatio: 0.3 }, // Cyrillic (Russian)
  { pattern: /[\u4E00-\u9FFF\u3400-\u4DBF]/g, code: 'zh', minRatio: 0.3 }, // Chinese
  { pattern: /[\u3040-\u309F\u30A0-\u30FF]/g, code: 'ja', minRatio: 0.1 }, // Japanese (Hiragana + Katakana)
  { pattern: /[\u0600-\u06FF][\u200C\u200D]?[\u0600-\u06FF]/g, code: 'fa', minRatio: 0.3 }, // Persian (similar to Arabic)
  { pattern: /[ğüşıöçĞÜŞİÖÇ]/g, code: 'tr', minRatio: 0.05 }, // Turkish specific characters
  { pattern: /[äöüßÄÖÜ]/g, code: 'de', minRatio: 0.03 }, // German specific characters
  { pattern: /[àâçéèêëîïôûùüÿœæ]/gi, code: 'fr', minRatio: 0.03 }, // French specific characters
  { pattern: /[áéíóúüñ¿¡]/gi, code: 'es', minRatio: 0.03 }, // Spanish specific characters
];

// Common words for additional language detection
const commonWords: { [code: string]: string[] } = {
  en: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'on', 'with', 'that', 'this', 'it', 'you', 'are'],
  de: ['und', 'die', 'der', 'ist', 'das', 'mit', 'auf', 'für', 'ein', 'den', 'nicht', 'sich', 'auch'],
  fr: ['et', 'est', 'les', 'des', 'une', 'que', 'pour', 'dans', 'qui', 'pas', 'sur', 'avec', 'sont'],
  es: ['el', 'la', 'los', 'las', 'es', 'que', 'para', 'por', 'con', 'del', 'una', 'son', 'pero'],
  tr: ['ve', 'bir', 'bu', 'için', 'ile', 'olan', 'olarak', 'daha', 'gibi', 'var', 'ama', 'çok'],
};

/**
 * Detects the language of the given text.
 * @param text - The text to analyze
 * @param fallbackLanguage - Language to return if detection fails (default: user's current locale)
 * @returns ISO 639-1 language code
 */
export function detectLanguage(text: string, fallbackLanguage?: string): string {
  if (!text || text.trim().length < 10) {
    return fallbackLanguage || getUserLanguage();
  }

  const cleanText = text.replace(/\s+/g, ' ').trim();
  const textLength = cleanText.replace(/\s/g, '').length;

  // Check script-based patterns first (most reliable)
  for (const { pattern, code, minRatio } of languagePatterns) {
    const matches = cleanText.match(pattern);
    if (matches) {
      const ratio = matches.join('').length / textLength;
      if (ratio >= minRatio) {
        // Special case: distinguish Arabic from Persian
        if (code === 'ar' || code === 'fa') {
          // Persian uses specific characters more often
          const persianSpecific = /[پچژگک]/g;
          const persianMatches = cleanText.match(persianSpecific);
          if (persianMatches && persianMatches.length > 0) {
            return 'fa';
          }
          return 'ar';
        }
        return code;
      }
    }
  }

  // Word-based detection for Latin-script languages
  const words = cleanText.toLowerCase().split(/\s+/);
  const wordCounts: { [code: string]: number } = {};

  for (const [code, commonWordList] of Object.entries(commonWords)) {
    wordCounts[code] = words.filter(word => commonWordList.includes(word)).length;
  }

  // Find the language with the most common word matches
  let bestMatch = fallbackLanguage || 'en';
  let bestCount = 0;

  for (const [code, count] of Object.entries(wordCounts)) {
    if (count > bestCount && count >= 2) { // Require at least 2 matches
      bestMatch = code;
      bestCount = count;
    }
  }

  return bestMatch;
}

/**
 * Gets the user's preferred language from localStorage.
 */
export function getUserLanguage(): string {
  try {
    return localStorage.getItem('preferredLocale') || 'en';
  } catch {
    return 'en';
  }
}

/**
 * Checks if two language codes represent the same language.
 */
export function isSameLanguage(lang1: string, lang2: string): boolean {
  if (!lang1 || !lang2) return false;
  return lang1.toLowerCase().slice(0, 2) === lang2.toLowerCase().slice(0, 2);
}

export default detectLanguage;
