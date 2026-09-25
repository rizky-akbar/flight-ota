import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLiveExchangeRates,
  getStoredCurrencySettings,
  saveStoredCurrencySettings,
  CurrencySettings,
} from '@/lib/currency';

export async function GET() {
  try {
    const settings = await fetchLiveExchangeRates(false);
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error fetching admin currency settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch currency settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'refresh') {
      // Force immediate refresh of live rates
      const updated = await fetchLiveExchangeRates(true);
      return NextResponse.json({
        success: true,
        message: 'Kurs real-time PayPal berhasil diperbarui langsung dari feed!',
        settings: updated,
      });
    }

    const current = getStoredCurrencySettings();
    const newMode = ['paypal_realtime', 'manual'].includes(body.mode) ? body.mode : current.mode;
    const newSpread = typeof body.paypalSpreadPercent === 'number' ? Math.max(0, Math.min(20, body.paypalSpreadPercent)) : current.paypalSpreadPercent;

    let updatedSettings: CurrencySettings = {
      ...current,
      mode: newMode,
      paypalSpreadPercent: newSpread,
      manualRates: {
        EGP: typeof body.manualEgp === 'number' && body.manualEgp > 0 ? body.manualEgp : current.manualRates?.EGP || 49.0,
        IDR: typeof body.manualIdr === 'number' && body.manualIdr > 0 ? body.manualIdr : current.manualRates?.IDR || 15850,
      },
    };

    // If spread changed, recalculate paypal rates
    if (newSpread !== current.paypalSpreadPercent) {
      const rawEgp = updatedSettings.rates.EGP.interbankRate || 52.14;
      const rawIdr = updatedSettings.rates.IDR.interbankRate || 17775;
      updatedSettings.rates.EGP.paypalSpreadPercent = newSpread;
      updatedSettings.rates.EGP.paypalRate = Math.round(rawEgp * (1 - newSpread / 100) * 100) / 100;
      updatedSettings.rates.IDR.paypalRate = Math.round(rawIdr * (1 - (newSpread - 0.5) / 100));
    }

    const saved = saveStoredCurrencySettings(updatedSettings);

    // If switched to realtime, trigger a refresh
    if (newMode === 'paypal_realtime' && current.mode !== 'paypal_realtime') {
      const fresh = await fetchLiveExchangeRates(true);
      return NextResponse.json({
        success: true,
        message: 'Pengaturan kurs diperbarui ke Mode PayPal Real-Time!',
        settings: fresh,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan kurs berhasil disimpan!',
      settings: saved,
    });
  } catch (error: any) {
    console.error('Error updating currency settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save currency settings' },
      { status: 500 }
    );
  }
}
