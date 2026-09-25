import fs from 'fs';
import path from 'path';

export interface CurrencyRateInfo {
  interbankRate: number; // Wholesale market rate (e.g. 52.14)
  paypalSpreadPercent: number; // PayPal FX spread % (e.g. 4.0%)
  paypalRate: number; // Effective rate with PayPal fee applied (e.g. 50.05 or 54.22)
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
  paypalSpreadPercent: number; // Default 4.0%
  autoSync: boolean;
  cacheExpiryMinutes: number; // Default 30 minutes
  lastSyncTime: string;
  source: string; // 'paypal_realtime' | 'paypal_official_api' | 'manual'
}

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'currency_settings.json');

// Default initial baseline settings
export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  mode: 'paypal_realtime',
  baseCurrency: 'USD',
  paypalSpreadPercent: 4.0, // Standard PayPal cross-border currency conversion spread
  autoSync: true,
  cacheExpiryMinutes: 30,
  lastSyncTime: new Date().toISOString(),
  source: 'paypal_realtime',
  rates: {
    EGP: {
      interbankRate: 52.14,
      paypalSpreadPercent: 4.0,
      paypalRate: 50.05, // e.g. 52.14 * (1 - 0.04) = 50.05
      lastUpdated: new Date().toISOString(),
    },
    IDR: {
      interbankRate: 17775,
      paypalSpreadPercent: 3.5,
      paypalRate: 17150,
      lastUpdated: new Date().toISOString(),
    },
  },
  manualRates: {
    EGP: 49.0,
    IDR: 15850,
  },
};

// In-memory cache
let inMemorySettings: CurrencySettings | null = null;
let lastFetchTimestamp = 0;

/**
 * Ensures data directory exists
 */
function ensureDataDir() {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Loads currency settings from disk
 */
export function getStoredCurrencySettings(): CurrencySettings {
  if (inMemorySettings) {
    return inMemorySettings;
  }

  ensureDataDir();
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
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
 * Saves currency settings to disk
 */
export function saveStoredCurrencySettings(settings: CurrencySettings): CurrencySettings {
  ensureDataDir();
  inMemorySettings = {
    ...settings,
    lastSyncTime: new Date().toISOString(),
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(inMemorySettings, null, 2), 'utf-8');
  return inMemorySettings;
}

/**
 * Attempts to fetch live rates from PayPal Official API if credentials are present in env
 */
async function fetchFromPayPalOfficialApi(): Promise<{ egp?: number; idr?: number } | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(5000),
    });

    if (!tokenRes.ok) return null;
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return null;

    // Call PayPal Pricing/Quote API
    const quoteRes = await fetch('https://api-m.paypal.com/v2/pricing/quote-exchange-rates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_currency: 'USD',
        target_currencies: ['EGP', 'IDR'],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!quoteRes.ok) return null;
    const quoteData = await quoteRes.json();
    // Parse quotes
    const result: { egp?: number; idr?: number } = {};
    if (Array.isArray(quoteData.quotes)) {
      for (const q of quoteData.quotes) {
        if (q.target_currency === 'EGP' && q.exchange_rate) {
          result.egp = parseFloat(q.exchange_rate);
        }
        if (q.target_currency === 'IDR' && q.exchange_rate) {
          result.idr = parseFloat(q.exchange_rate);
        }
      }
    }
    return result;
  } catch (err) {
    console.warn('[Currency] PayPal official API call bypassed, using live interbank feed:', err);
    return null;
  }
}

/**
 * Fetches real-time market exchange rates from open feed and applies PayPal's FX conversion formula
 */
export async function fetchLiveExchangeRates(force = false): Promise<CurrencySettings> {
  const current = getStoredCurrencySettings();
  const now = Date.now();
  const cacheTtlMs = (current.cacheExpiryMinutes || 30) * 60 * 1000;

  // Return cached if not forced and within cache TTL
  if (!force && lastFetchTimestamp > 0 && now - lastFetchTimestamp < cacheTtlMs) {
    return current;
  }

  // If set to manual mode and not forced refresh, keep manual
  if (current.mode === 'manual' && !force) {
    return current;
  }

  try {
    // 1. Try PayPal official API first if credentials configured
    const officialRates = await fetchFromPayPalOfficialApi();
    if (officialRates && officialRates.egp && officialRates.egp > 0) {
      const updated: CurrencySettings = {
        ...current,
        source: 'paypal_official_api',
        lastSyncTime: new Date().toISOString(),
        rates: {
          EGP: {
            interbankRate: officialRates.egp,
            paypalSpreadPercent: 0,
            paypalRate: Math.round(officialRates.egp * 100) / 100,
            lastUpdated: new Date().toISOString(),
          },
          IDR: {
            interbankRate: officialRates.idr || current.rates.IDR.interbankRate,
            paypalSpreadPercent: 0,
            paypalRate: Math.round(officialRates.idr || current.rates.IDR.paypalRate),
            lastUpdated: new Date().toISOString(),
          },
        },
      };
      lastFetchTimestamp = now;
      return saveStoredCurrencySettings(updated);
    }

    // 2. Fetch live interbank rate from real-time institutional feed (open.er-api.com)
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Exchange rate provider returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.rates && typeof data.rates.EGP === 'number') {
      const rawEgp = data.rates.EGP; // e.g. 52.14
      const rawIdr = typeof data.rates.IDR === 'number' ? data.rates.IDR : 17775;

      const spread = current.paypalSpreadPercent || 4.0;

      // PayPal retail rate formula:
      // When exchanging USD to local currency or quoting local pricing,
      // PayPal applies the spread to the interbank rate.
      // We calculate the effective PayPal converted rate:
      // For local currency quote: interbankRate * (1 - spread/100)
      const paypalEgp = Math.round(rawEgp * (1 - spread / 100) * 100) / 100;
      const paypalIdr = Math.round(rawIdr * (1 - (spread - 0.5) / 100));

      const updated: CurrencySettings = {
        ...current,
        source: 'paypal_realtime',
        lastSyncTime: new Date().toISOString(),
        rates: {
          EGP: {
            interbankRate: Math.round(rawEgp * 100) / 100,
            paypalSpreadPercent: spread,
            paypalRate: paypalEgp,
            lastUpdated: new Date().toISOString(),
          },
          IDR: {
            interbankRate: Math.round(rawIdr),
            paypalSpreadPercent: spread - 0.5,
            paypalRate: paypalIdr,
            lastUpdated: new Date().toISOString(),
          },
        },
      };

      lastFetchTimestamp = now;
      console.log(`[Currency] Updated PayPal Realtime Rate: 1 USD = ${paypalEgp} EGP (Interbank: ${rawEgp.toFixed(2)}, Spread: ${spread}%)`);
      return saveStoredCurrencySettings(updated);
    }
  } catch (err: any) {
    console.warn('[Currency] Could not refresh live rates, retaining current cached rate:', err.message);
  }

  return current;
}

/**
 * Returns the active USD to EGP exchange rate
 */
export function getUsdToEgpRate(): number {
  const settings = getStoredCurrencySettings();
  if (settings.mode === 'manual' && settings.manualRates?.EGP) {
    return settings.manualRates.EGP;
  }
  return settings.rates.EGP.paypalRate || 50.05;
}

/**
 * Returns the active USD to IDR exchange rate
 */
export function getUsdToIdrRate(): number {
  const settings = getStoredCurrencySettings();
  if (settings.mode === 'manual' && settings.manualRates?.IDR) {
    return settings.manualRates.IDR;
  }
  return settings.rates.IDR.paypalRate || 17150;
}

/**
 * Converts USD to EGP using the active PayPal exchange rate
 */
export function convertUsdToEgp(usd: number): number {
  const rate = getUsdToEgpRate();
  return Math.round(usd * rate);
}

/**
 * Converts EGP to USD using the active PayPal exchange rate
 */
export function convertEgpToUsd(egp: number): number {
  const rate = getUsdToEgpRate();
  return rate > 0 ? Math.round((egp / rate) * 10) / 10 : 0;
}

/**
 * Converts USD to IDR using the active PayPal exchange rate
 */
export function convertUsdToIdr(usd: number): number {
  const rate = getUsdToIdrRate();
  return Math.round(usd * rate);
}
