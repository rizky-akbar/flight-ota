import { getFilePath, safeReadFileSync, safeWriteFileSync } from './storage';

export interface CurrencyRateInfo {
  interbankRate: number; // Wholesale market rate (e.g. 51.70)
  paypalSpreadPercent: number; // PayPal FX spread % (0 for pure market rate, or 3-4%)
  paypalRate: number; // Effective rate (e.g. 51.70 or with spread applied)
  lastUpdated: string;
}

export interface CurrencySettings {
  mode: 'paypal_realtime' | 'manual';
  baseCurrency: 'USD';
  rates: {
    EGP: CurrencyRateInfo;
    IDR: CurrencyRateInfo;
  };
  manualRates?: {
    EGP: number;
    IDR: number;
  };
  paypalSpreadPercent: number; // 0 for exact market rate, default 0 or user-chosen
  autoSync: boolean;
  cacheExpiryMinutes: number; // Default 5 minutes for genuine real-time accuracy
  lastSyncTime: string;
  source: string;
}

export interface RealtimeRatesMatrix {
  usdToEgp: number;
  egpToUsd: number;
  usdToIdr: number;
  idrToUsd: number;
  egpToIdr: number;
  idrToEgp: number;
  interbankEgp: number;
  interbankIdr: number;
  paypalSpreadPercent: number;
  mode: 'paypal_realtime' | 'manual';
  source: string;
  lastUpdated: string;
}

// Default initial baseline settings
export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  mode: 'paypal_realtime',
  baseCurrency: 'USD',
  paypalSpreadPercent: 0, // Direct real-time market rate by default
  autoSync: true,
  cacheExpiryMinutes: 5, // 5 minutes cache for real-time freshness
  lastSyncTime: new Date().toISOString(),
  source: 'paypal_realtime',
  rates: {
    EGP: {
      interbankRate: 51.70,
      paypalSpreadPercent: 0,
      paypalRate: 51.70,
      lastUpdated: new Date().toISOString(),
    },
    IDR: {
      interbankRate: 17907,
      paypalSpreadPercent: 0,
      paypalRate: 17907,
      lastUpdated: new Date().toISOString(),
    },
  },
  manualRates: {
    EGP: 51.70,
    IDR: 17907,
  },
};

// In-memory cache
let inMemorySettings: CurrencySettings | null = null;
let lastFetchTimestamp = 0;

/**
 * Loads currency settings from disk or serverless tmp
 */
export function getStoredCurrencySettings(): CurrencySettings {
  if (inMemorySettings) {
    return inMemorySettings;
  }

  const filePath = getFilePath('currency_settings.json');
  const content = safeReadFileSync(filePath, 'currency_settings.json');
  if (content) {
    try {
      const parsed = JSON.parse(content);
      inMemorySettings = {
        ...DEFAULT_CURRENCY_SETTINGS,
        ...parsed,
        rates: {
          ...DEFAULT_CURRENCY_SETTINGS.rates,
          ...(parsed.rates || {}),
        },
      };
      return inMemorySettings!;
    } catch (err) {
      console.error('[Currency] Failed to parse currency_settings.json, using defaults:', err);
    }
  }

  inMemorySettings = DEFAULT_CURRENCY_SETTINGS;
  saveStoredCurrencySettings(inMemorySettings);
  return inMemorySettings;
}

/**
 * Saves currency settings to disk or serverless tmp
 */
export function saveStoredCurrencySettings(settings: CurrencySettings): CurrencySettings {
  inMemorySettings = {
    ...settings,
    lastSyncTime: new Date().toISOString(),
  };
  const filePath = getFilePath('currency_settings.json');
  safeWriteFileSync(filePath, JSON.stringify(inMemorySettings, null, 2));
  return inMemorySettings;
}

/**
 * Fetches real-time institutional exchange rates from live providers
 */
async function fetchFromLiveProviders(): Promise<{ egp: number; idr: number } | null> {
  const providers = [
    {
      name: 'open.er-api.com',
      url: 'https://open.er-api.com/v6/latest/USD',
      extract: (data: any) => ({
        egp: typeof data?.rates?.EGP === 'number' ? data.rates.EGP : null,
        idr: typeof data?.rates?.IDR === 'number' ? data.rates.IDR : null,
      }),
    },
    {
      name: 'exchangerate-api.com',
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      extract: (data: any) => ({
        egp: typeof data?.rates?.EGP === 'number' ? data.rates.EGP : null,
        idr: typeof data?.rates?.IDR === 'number' ? data.rates.IDR : null,
      }),
    },
    {
      name: 'currency-api-cdn',
      url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      extract: (data: any) => ({
        egp: typeof data?.usd?.egp === 'number' ? data.usd.egp : null,
        idr: typeof data?.usd?.idr === 'number' ? data.usd.idr : null,
      }),
    },
  ];

  for (const provider of providers) {
    try {
      const res = await fetch(provider.url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        const extracted = provider.extract(json);
        if (extracted.egp && extracted.idr) {
          return {
            egp: Math.round(extracted.egp * 100) / 100,
            idr: Math.round(extracted.idr),
          };
        }
      }
    } catch {
      // Continue to next provider
    }
  }

  return null;
}

/**
 * Fetches real-time market exchange rates and applies configured spread
 */
export async function fetchLiveExchangeRates(force = false): Promise<CurrencySettings> {
  const current = getStoredCurrencySettings();
  const now = Date.now();
  // 5 minutes cache for real-time freshness
  const cacheTtlMs = (current.cacheExpiryMinutes || 5) * 60 * 1000;

  // Return cached if not forced and within cache TTL
  if (!force && lastFetchTimestamp > 0 && now - lastFetchTimestamp < cacheTtlMs) {
    return current;
  }

  // If set to manual mode and not forced refresh, keep manual
  if (current.mode === 'manual' && !force) {
    return current;
  }

  try {
    const liveRates = await fetchFromLiveProviders();
    if (liveRates && liveRates.egp > 0 && liveRates.idr > 0) {
      const rawEgp = liveRates.egp;
      const rawIdr = liveRates.idr;
      const spread = typeof current.paypalSpreadPercent === 'number' ? current.paypalSpreadPercent : 0;

      // Effective rates with optional spread applied
      const effectiveEgp = spread > 0
        ? Math.round(rawEgp * (1 - spread / 100) * 100) / 100
        : rawEgp;
      const effectiveIdr = spread > 0
        ? Math.round(rawIdr * (1 - spread / 100))
        : rawIdr;

      const updated: CurrencySettings = {
        ...current,
        source: 'paypal_realtime',
        lastSyncTime: new Date().toISOString(),
        rates: {
          EGP: {
            interbankRate: rawEgp,
            paypalSpreadPercent: spread,
            paypalRate: effectiveEgp,
            lastUpdated: new Date().toISOString(),
          },
          IDR: {
            interbankRate: rawIdr,
            paypalSpreadPercent: spread,
            paypalRate: effectiveIdr,
            lastUpdated: new Date().toISOString(),
          },
        },
      };

      lastFetchTimestamp = now;
      return saveStoredCurrencySettings(updated);
    }
  } catch (err: any) {
    console.warn('[Currency] Could not refresh live rates, retaining current cached rate:', err.message);
  }

  return current;
}

/* ==================== EXCHANGE RATE GETTERS ==================== */

/**
 * 1 USD ➔ EGP
 */
export function getUsdToEgpRate(): number {
  const settings = getStoredCurrencySettings();
  if (settings.mode === 'manual' && settings.manualRates?.EGP) {
    return settings.manualRates.EGP;
  }
  return settings.rates.EGP.paypalRate || settings.rates.EGP.interbankRate || 51.70;
}

/**
 * 1 EGP ➔ USD (Vice Versa)
 */
export function getEgpToUsdRate(): number {
  const usdToEgp = getUsdToEgpRate();
  return usdToEgp > 0 ? Math.round((1 / usdToEgp) * 100000) / 100000 : 0.01934;
}

/**
 * 1 USD ➔ IDR
 */
export function getUsdToIdrRate(): number {
  const settings = getStoredCurrencySettings();
  if (settings.mode === 'manual' && settings.manualRates?.IDR) {
    return settings.manualRates.IDR;
  }
  return settings.rates.IDR.paypalRate || settings.rates.IDR.interbankRate || 17907;
}

/**
 * 1 IDR ➔ USD (Vice Versa)
 */
export function getIdrToUsdRate(): number {
  const usdToIdr = getUsdToIdrRate();
  return usdToIdr > 0 ? Math.round((1 / usdToIdr) * 10000000) / 10000000 : 0.0000558;
}

/**
 * 1 EGP ➔ IDR (Cross-Rate)
 */
export function getEgpToIdrRate(): number {
  const usdToEgp = getUsdToEgpRate();
  const usdToIdr = getUsdToIdrRate();
  return usdToEgp > 0 ? Math.round((usdToIdr / usdToEgp) * 100) / 100 : 346.36;
}

/**
 * 1 IDR ➔ EGP (Vice Versa Cross-Rate)
 */
export function getIdrToEgpRate(): number {
  const egpToIdr = getEgpToIdrRate();
  return egpToIdr > 0 ? Math.round((1 / egpToIdr) * 100000) / 100000 : 0.00289;
}

/* ==================== CONVERSION FUNCTIONS ==================== */

/**
 * USD ➔ EGP
 */
export function convertUsdToEgp(usd: number): number {
  return Math.round(usd * getUsdToEgpRate());
}

/**
 * EGP ➔ USD (Vice Versa)
 */
export function convertEgpToUsd(egp: number): number {
  return Math.round(egp * getEgpToUsdRate() * 100) / 100;
}

/**
 * USD ➔ IDR
 */
export function convertUsdToIdr(usd: number): number {
  return Math.round(usd * getUsdToIdrRate());
}

/**
 * IDR ➔ USD (Vice Versa)
 */
export function convertIdrToUsd(idr: number): number {
  return Math.round(idr * getIdrToUsdRate() * 100) / 100;
}

/**
 * EGP ➔ IDR
 */
export function convertEgpToIdr(egp: number): number {
  return Math.round(egp * getEgpToIdrRate());
}

/**
 * IDR ➔ EGP (Vice Versa)
 */
export function convertIdrToEgp(idr: number): number {
  return Math.round(idr * getIdrToEgpRate() * 100) / 100;
}

/**
 * Full Realtime Currency Matrix
 */
export function getRealtimeRatesMatrix(): RealtimeRatesMatrix {
  const settings = getStoredCurrencySettings();
  const usdToEgp = getUsdToEgpRate();
  const egpToUsd = getEgpToUsdRate();
  const usdToIdr = getUsdToIdrRate();
  const idrToUsd = getIdrToUsdRate();
  const egpToIdr = getEgpToIdrRate();
  const idrToEgp = getIdrToEgpRate();

  return {
    usdToEgp,
    egpToUsd,
    usdToIdr,
    idrToUsd,
    egpToIdr,
    idrToEgp,
    interbankEgp: settings.rates.EGP.interbankRate || usdToEgp,
    interbankIdr: settings.rates.IDR.interbankRate || usdToIdr,
    paypalSpreadPercent: settings.paypalSpreadPercent ?? 0,
    mode: settings.mode,
    source: settings.source,
    lastUpdated: settings.rates.EGP.lastUpdated || settings.lastSyncTime || new Date().toISOString(),
  };
}
