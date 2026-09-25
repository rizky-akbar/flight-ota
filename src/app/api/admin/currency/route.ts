import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLiveExchangeRates,
  getStoredCurrencySettings,
  saveStoredCurrencySettings,
  getRealtimeRatesMatrix,
  CurrencySettings,
} from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  try {
    const settings = await fetchLiveExchangeRates(false);
    const matrix = getRealtimeRatesMatrix();
    return NextResponse.json(
      {
        success: true,
        settings,
        matrix,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error fetching admin currency settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch currency settings' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'refresh') {
      // Force immediate refresh of live rates
      const updated = await fetchLiveExchangeRates(true);
      const matrix = getRealtimeRatesMatrix();
      return NextResponse.json(
        {
          success: true,
          message: 'Kurs real-time berhasil diperbarui langsung dari feed pasar!',
          settings: updated,
          matrix,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const current = getStoredCurrencySettings();
    const newMode = ['paypal_realtime', 'manual'].includes(body.mode) ? body.mode : current.mode;
    const newSpread =
      typeof body.paypalSpreadPercent === 'number'
        ? Math.max(0, Math.min(20, body.paypalSpreadPercent))
        : current.paypalSpreadPercent;

    const rawEgp = current.rates.EGP.interbankRate || 51.70;
    const rawIdr = current.rates.IDR.interbankRate || 17907;

    const manualEgp =
      typeof body.manualEgp === 'number' && body.manualEgp > 0
        ? body.manualEgp
        : current.manualRates?.EGP || 51.70;

    const manualIdr =
      typeof body.manualIdr === 'number' && body.manualIdr > 0
        ? body.manualIdr
        : current.manualRates?.IDR || 17907;

    let updatedSettings: CurrencySettings = {
      ...current,
      mode: newMode,
      paypalSpreadPercent: newSpread,
      manualRates: {
        EGP: manualEgp,
        IDR: manualIdr,
      },
      rates: {
        EGP: {
          ...current.rates.EGP,
          paypalSpreadPercent: newSpread,
          paypalRate: newSpread > 0 ? Math.round(rawEgp * (1 - newSpread / 100) * 100) / 100 : rawEgp,
          lastUpdated: new Date().toISOString(),
        },
        IDR: {
          ...current.rates.IDR,
          paypalSpreadPercent: newSpread,
          paypalRate: newSpread > 0 ? Math.round(rawIdr * (1 - newSpread / 100)) : rawIdr,
          lastUpdated: new Date().toISOString(),
        },
      },
    };

    const saved = saveStoredCurrencySettings(updatedSettings);

    // If switched to realtime, trigger a refresh
    if (newMode === 'paypal_realtime') {
      const fresh = await fetchLiveExchangeRates(true);
      const matrix = getRealtimeRatesMatrix();
      return NextResponse.json(
        {
          success: true,
          message: 'Pengaturan kurs diperbarui ke Mode Real-Time Pasar!',
          settings: fresh,
          matrix,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const matrix = getRealtimeRatesMatrix();
    return NextResponse.json(
      {
        success: true,
        message: 'Pengaturan kurs berhasil disimpan!',
        settings: saved,
        matrix,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error updating currency settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save currency settings' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
