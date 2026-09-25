import { NextRequest, NextResponse } from 'next/server';
import { getMarkupSettings, saveMarkupSettings } from '@/lib/storage';
import { MarkupSettings } from '@/lib/travelport/markup';
import { getUsdToEgpRate } from '@/lib/currency';

export async function GET() {
  try {
    const settings = getMarkupSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error fetching markup settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get markup settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { success: false, error: 'Invalid markup settings payload' },
        { status: 400 }
      );
    }

    const current = getMarkupSettings();
    const usdToEgp = getUsdToEgpRate();

    const updatedSettings: MarkupSettings = {
      enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
      mode: ['percentage', 'fixed', 'both'].includes(body.mode) ? body.mode : current.mode,
      percentage: typeof body.percentage === 'number' ? Math.max(0, body.percentage) : current.percentage,
      fixedAmountUsd: (() => {
        if (typeof body.fixedAmountUsd === 'number' && body.fixedAmountUsd > 0) {
          return Math.max(0, body.fixedAmountUsd);
        }
        if (typeof body.fixedAmountEgp === 'number' && body.fixedAmountEgp > 0) {
          return Math.round((body.fixedAmountEgp / usdToEgp) * 10) / 10;
        }
        return typeof body.fixedAmountUsd === 'number' ? 0 : current.fixedAmountUsd;
      })(),
      fixedAmountEgp: (() => {
        if (typeof body.fixedAmountEgp === 'number' && body.fixedAmountEgp > 0) {
          return Math.max(0, body.fixedAmountEgp);
        }
        if (typeof body.fixedAmountUsd === 'number' && body.fixedAmountUsd > 0) {
          return Math.round(body.fixedAmountUsd * usdToEgp);
        }
        return typeof body.fixedAmountEgp === 'number' ? 0 : current.fixedAmountEgp;
      })(),
      applyPer: body.applyPer === 'passenger' ? 'passenger' : 'ticket',
      airlineOverrides: Array.isArray(body.airlineOverrides)
        ? body.airlineOverrides
            .filter(
              (o: any) =>
                o &&
                typeof o.carrierCode === 'string' &&
                (typeof o.percentage === 'number' ||
                  (typeof o.fixedAmountUsd === 'number' && o.fixedAmountUsd > 0) ||
                  (typeof o.fixedAmountEgp === 'number' && o.fixedAmountEgp > 0))
            )
            .map((o: any) => ({
              carrierCode: o.carrierCode,
              carrierName: o.carrierName,
              percentage: typeof o.percentage === 'number' ? o.percentage : undefined,
              fixedAmountUsd:
                typeof o.fixedAmountUsd === 'number' && o.fixedAmountUsd > 0
                  ? o.fixedAmountUsd
                  : typeof o.fixedAmountEgp === 'number' && o.fixedAmountEgp > 0
                  ? Math.round((o.fixedAmountEgp / usdToEgp) * 10) / 10
                  : 0,
              fixedAmountEgp:
                typeof o.fixedAmountEgp === 'number' && o.fixedAmountEgp > 0
                  ? o.fixedAmountEgp
                  : typeof o.fixedAmountUsd === 'number' && o.fixedAmountUsd > 0
                  ? Math.round(o.fixedAmountUsd * usdToEgp)
                  : 0,
            }))
        : current.airlineOverrides,
    };

    const saved = saveMarkupSettings(updatedSettings);

    return NextResponse.json({
      success: true,
      message: 'Markup pricing settings updated successfully',
      settings: saved,
    });
  } catch (error: any) {
    console.error('Error saving markup settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save markup settings' },
      { status: 500 }
    );
  }
}
