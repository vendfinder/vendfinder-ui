export const defaultLocale = 'en-US' as const;

export const locales = [
  'en-US',
  'en-GB',
  'es-MX',
  'zh-CN',
  'zh-TW',
  'ja-JP',
  'de-DE',
  'fr-FR',
  'pt-BR',
] as const;

export type Locale = (typeof locales)[number];

export function isValidLocale(value: string | undefined): value is Locale {
  return !!value && locales.includes(value as Locale);
}

// Country code (from CDN geo headers) → locale
export const countryToLocale: Record<string, Locale> = {
  US: 'en-US',
  GB: 'en-GB',
  TW: 'zh-TW',
  JP: 'ja-JP',
  MX: 'es-MX',
  DE: 'de-DE',
  FR: 'fr-FR',
  BR: 'pt-BR',
  CN: 'zh-CN',
};

// Locale → display currency
export const localeToCurrency: Record<Locale, string> = {
  'en-US': 'USD',
  'en-GB': 'GBP',
  'es-MX': 'MXN',
  'zh-TW': 'TWD',
  'ja-JP': 'JPY',
  'de-DE': 'EUR',
  'fr-FR': 'EUR',
  'pt-BR': 'BRL',
  'zh-CN': 'CNY',
};

export const LOCALE_COOKIE = 'locale';
