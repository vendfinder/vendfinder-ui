const logger = require('../logger');

const LOCALE_TO_LANG = {
  'en-US': 'en', 'en-GB': 'en',
  'es-MX': 'es', 'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW', 'ja-JP': 'ja',
  'de-DE': 'de', 'fr-FR': 'fr', 'pt-BR': 'pt',
};

const LANG_TO_LOCALE = {
  'en': 'en-US', 'es': 'es-MX', 'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW', 'ja': 'ja-JP', 'de': 'de-DE',
  'fr': 'fr-FR', 'pt': 'pt-BR', 'zh': 'zh-CN',
};

const ALL_LOCALES = ['en-US', 'en-GB', 'es-MX', 'zh-CN', 'zh-TW', 'ja-JP', 'de-DE', 'fr-FR', 'pt-BR'];
const API_BASE = 'https://translation.googleapis.com/language/translate/v2';

module.exports = function(redis) {
  let apiKey = null;

  function init() {
    apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      logger.warn('GOOGLE_TRANSLATE_API_KEY not set — translations disabled');
      return false;
    }
    return true;
  }

  async function callTranslateApi(text, source, target) {
    const res = await fetch(`${API_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' }),
    });
    if (!res.ok) throw new Error(`Translate API error: ${res.status}`);
    const data = await res.json();
    return data.data.translations[0].translatedText;
  }

  async function cachedTranslate(text, sourceLang, targetLang) {
    if (!text || !text.trim()) return text;
    if (sourceLang === targetLang) return text;

    const cacheKey = `translate:${sourceLang}:${targetLang}:${text.substring(0, 80)}`;

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return cached;
      } catch (e) { /* cache miss */ }
    }

    const result = await callTranslateApi(text, sourceLang, targetLang);

    if (redis) {
      try { await redis.set(cacheKey, result, 'EX', 86400); } catch (e) { /* ignore */ }
    }

    return result;
  }

  async function detectSourceLocale(text) {
    if (!apiKey) return 'en-US';
    try {
      const res = await fetch(`${API_BASE}/detect?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text }),
      });
      if (!res.ok) throw new Error(`Detect API error: ${res.status}`);
      const data = await res.json();
      const lang = data.data.detections[0][0].language;
      return LANG_TO_LOCALE[lang] || LANG_TO_LOCALE[lang.split('-')[0]] || 'en-US';
    } catch (err) {
      logger.error('Language detection failed', { error: err.message });
      return 'en-US';
    }
  }

  async function translateProductContent(product, sourceLocale, targetLocales) {
    if (!apiKey) return {};

    const sourceLang = LOCALE_TO_LANG[sourceLocale] || 'en';
    const translations = {};

    await Promise.all(targetLocales.map(async (locale) => {
      const targetLang = LOCALE_TO_LANG[locale];
      if (!targetLang || targetLang === sourceLang) {
        translations[locale] = {
          name: product.name,
          description: product.description || '',
          long_description: product.long_description || '',
          features: product.features || [],
        };
        return;
      }

      try {
        const [name, description, long_description] = await Promise.all([
          cachedTranslate(product.name, sourceLang, targetLang),
          cachedTranslate(product.description || '', sourceLang, targetLang),
          cachedTranslate(product.long_description || '', sourceLang, targetLang),
        ]);

        const features = product.features && product.features.length > 0
          ? await Promise.all(product.features.map(f => cachedTranslate(f, sourceLang, targetLang)))
          : [];

        translations[locale] = { name, description, long_description, features };
      } catch (err) {
        logger.error('Translation failed for locale', { locale, error: err.message });
        translations[locale] = {
          name: product.name,
          description: product.description || '',
          long_description: product.long_description || '',
          features: product.features || [],
        };
      }
    }));

    return translations;
  }

  return {
    init,
    detectSourceLocale,
    translateProductContent,
    cachedTranslate,
    LOCALE_TO_LANG,
    ALL_LOCALES,
  };
};
