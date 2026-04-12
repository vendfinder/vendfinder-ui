export type ConsentCategory =
  | 'necessary'
  | 'functional'
  | 'analytics'
  | 'marketing';

export interface ConsentRecord {
  version: 1;
  timestamp: number;
  expiresAt: number;
  categories: {
    necessary: true;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

const STORAGE_KEY = 'cookie_consent';
const THIRTEEN_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 13;

export function getConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as ConsentRecord;
    if (record.version !== 1) return null;
    if (record.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function setConsent(
  categories: Omit<ConsentRecord['categories'], 'necessary'>
): ConsentRecord {
  const record: ConsentRecord = {
    version: 1,
    timestamp: Date.now(),
    expiresAt: Date.now() + THIRTEEN_MONTHS_MS,
    categories: {
      necessary: true,
      functional: categories.functional,
      analytics: categories.analytics,
      marketing: categories.marketing,
    },
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    window.dispatchEvent(
      new CustomEvent('consentchange', { detail: record.categories })
    );
  }
  return record;
}

export function hasConsented(): boolean {
  return getConsent() !== null;
}

export function clearConsent(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function isCategoryAllowed(category: ConsentCategory): boolean {
  if (category === 'necessary') return true;
  const record = getConsent();
  if (!record) return false;
  return record.categories[category];
}

export function acceptAll(): ConsentRecord {
  return setConsent({ functional: true, analytics: true, marketing: true });
}

export function rejectOptional(): ConsentRecord {
  return setConsent({ functional: false, analytics: false, marketing: false });
}
