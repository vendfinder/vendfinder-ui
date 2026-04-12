/**
 * Translation service compatibility layer
 * This module provides backward compatibility for code expecting ./translation
 */

// lib/translation.js exports a factory function that needs redis parameter
// and returns an object with different function names than expected
const translationFactory = require('./lib/translation.js');

// Create a mock redis object for compatibility
const mockRedis = {
  get: () => Promise.resolve(null),
  setex: () => Promise.resolve(),
  hget: () => Promise.resolve(null),
  hset: () => Promise.resolve(),
};

// Get the translation service instance
const translationService = translationFactory(mockRedis);

// Export functions with expected naming convention
module.exports = {
  initTranslation: translationService.init,
  detectLanguage: translationService.detectSourceLocale,
  translateText: translationService.cachedTranslate,
  translateToMultiple: translationService.translateProductContent,
  getSupportedLanguages: () => translationService.ALL_LOCALES,
};