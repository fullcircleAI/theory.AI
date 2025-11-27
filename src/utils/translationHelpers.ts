// Translation helper utilities
// Ensures buttons always show proper text, not translation keys

/**
 * Get translation with fallback
 * If translation returns the key itself, use the fallback
 */
export const getTranslation = (
  t_nested: (path: string) => string,
  key: string,
  fallback: string
): string => {
  const translated = t_nested(key);
  // If translation returns the key itself or starts with the key prefix, use fallback
  return translated === key || translated.startsWith(key.split('.')[0] + '.') ? fallback : translated;
};



