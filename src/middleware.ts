import { NextRequest, NextResponse } from 'next/server';
import {
  locales,
  defaultLocale,
  countryToLocale,
  LOCALE_COOKIE,
  isValidLocale,
  type Locale,
} from './i18n/config';

function detectLocaleFromGeo(request: NextRequest): Locale | null {
  const country =
    request.headers.get('X-Vercel-IP-Country') ||
    request.headers.get('CF-IPCountry') ||
    request.headers.get('CloudFront-Viewer-Country');

  if (country && countryToLocale[country.toUpperCase()]) {
    return countryToLocale[country.toUpperCase()];
  }
  return null;
}

function detectLocaleFromAcceptLanguage(request: NextRequest): Locale | null {
  const acceptLanguage = request.headers.get('Accept-Language');
  if (!acceptLanguage) return null;

  const parsed = acceptLanguage
    .split(',')
    .map((part) => {
      const [lang, qPart] = part.trim().split(';');
      const q = qPart ? parseFloat(qPart.replace('q=', '')) : 1.0;
      return { lang: lang.trim(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of parsed) {
    if (isValidLocale(lang)) return lang;

    // Case-insensitive exact match (e.g. "zh-cn" → "zh-CN")
    const exactMatch = locales.find(
      (l) => l.toLowerCase() === lang.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Prefix match (e.g. "zh" → first zh-* locale)
    const prefix = lang.split('-')[0].toLowerCase();
    const match = locales.find((l) => l.toLowerCase().startsWith(prefix + '-'));
    if (match) return match;
  }

  return null;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Check existing cookie
  const existingCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isValidLocale(existingCookie)) {
    return response;
  }

  // 2. Detect from CDN geo headers
  let detectedLocale = detectLocaleFromGeo(request);

  // 3. Detect from Accept-Language
  if (!detectedLocale) {
    detectedLocale = detectLocaleFromAcceptLanguage(request);
  }

  // 4. Fallback
  const locale = detectedLocale || defaultLocale;

  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|api|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp|woff2?|ttf|css|js)).*)',
  ],
};
