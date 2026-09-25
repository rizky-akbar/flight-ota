import { NextResponse } from 'next/server';
import { fetchLiveExchangeRates, getRealtimeRatesMatrix } from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  try {
    // Attempt live sync if cache expired (5 min TTL)
    await fetchLiveExchangeRates(false);

    const rate = getRealtimeRatesMatrix();

    return NextResponse.json(
      {
        success: true,
        rate,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error fetching currency rate:', error);
    const rate = getRealtimeRatesMatrix();
    return NextResponse.json(
      {
        success: true,
        rate,
        warning: 'Serving cached rates due to network delay',
      },
      { headers: NO_CACHE_HEADERS }
    );
  }
}
