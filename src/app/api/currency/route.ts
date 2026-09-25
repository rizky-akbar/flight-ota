import { NextResponse } from 'next/server';
import { fetchLiveExchangeRates, getUsdToEgpRate, getUsdToIdrRate, getStoredCurrencySettings } from '@/lib/currency';

export async function GET() {
  try {
    // Attempt non-forced sync if cache expired
    await fetchLiveExchangeRates(false);

    const settings = getStoredCurrencySettings();
    const usdToEgp = getUsdToEgpRate();
    const usdToIdr = getUsdToIdrRate();

    return NextResponse.json({
      success: true,
      rate: {
        usdToEgp,
        usdToIdr,
        interbankEgp: settings.rates.EGP.interbankRate,
        paypalSpreadPercent: settings.paypalSpreadPercent,
        mode: settings.mode,
        source: settings.source,
        lastUpdated: settings.rates.EGP.lastUpdated,
      },
    });
  } catch (error: any) {
    console.error('Error fetching currency rate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch currency rate',
        fallbackRate: { usdToEgp: 50.05, usdToIdr: 17150 },
      },
      { status: 500 }
    );
  }
}
