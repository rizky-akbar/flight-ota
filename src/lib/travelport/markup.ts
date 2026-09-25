import { FlightOffer } from './types';

export interface AirlineMarkupRule {
  carrierCode: string; // e.g. 'MS', 'SV', 'EK'
  carrierName?: string;
  percentage?: number;
  fixedAmountUsd?: number;
  fixedAmountEgp?: number;
}

export interface MarkupSettings {
  enabled: boolean;
  mode: 'percentage' | 'fixed' | 'both';
  percentage: number; // e.g. 5 for 5%
  fixedAmountUsd: number; // e.g. 25 for $25 USD
  fixedAmountEgp: number; // e.g. 1225 for EGP 1,225
  applyPer: 'ticket' | 'passenger';
  airlineOverrides?: AirlineMarkupRule[];
  lastUpdated?: string;
}

export const DEFAULT_MARKUP_SETTINGS: MarkupSettings = {
  enabled: true,
  mode: 'both',
  percentage: 5,
  fixedAmountUsd: 20,
  fixedAmountEgp: 980,
  applyPer: 'ticket',
  airlineOverrides: [],
  lastUpdated: new Date().toISOString(),
};

export interface MarkupCalculationResult {
  netCostUsd: number;
  netCostEgp: number;
  markupUsd: number;
  markupEgp: number;
  totalAmountUsd: number;
  totalAmountEgp: number;
  percentageApplied: number;
  fixedAmountUsdApplied: number;
  fixedAmountEgpApplied: number;
  modeApplied: 'percentage' | 'fixed' | 'both' | 'none';
}

/**
 * Calculates markup for a given net fare in USD & EGP
 */
export function calculateMarkup(
  netUsd: number,
  netEgp: number,
  settings: MarkupSettings,
  carrierCode?: string,
  usdToEgpRate = 50.05
): MarkupCalculationResult {
  if (!settings.enabled) {
    return {
      netCostUsd: netUsd,
      netCostEgp: netEgp,
      markupUsd: 0,
      markupEgp: 0,
      totalAmountUsd: netUsd,
      totalAmountEgp: netEgp,
      percentageApplied: 0,
      fixedAmountUsdApplied: 0,
      fixedAmountEgpApplied: 0,
      modeApplied: 'none',
    };
  }

  const currentRate = usdToEgpRate || 50.05;

  // Check if there is an airline-specific override
  let activePercentage = settings.percentage || 0;
  let activeFixedUsd = settings.fixedAmountUsd || 0;
  let activeFixedEgp = settings.fixedAmountEgp || (activeFixedUsd > 0 ? Math.round(activeFixedUsd * currentRate) : 0);

  // Auto-sync between USD and EGP if only one is provided
  if (activeFixedEgp > 0 && activeFixedUsd === 0) {
    activeFixedUsd = Math.round((activeFixedEgp / currentRate) * 10) / 10;
  } else if (activeFixedUsd > 0 && activeFixedEgp === 0) {
    activeFixedEgp = Math.round(activeFixedUsd * currentRate);
  }

  let activeMode = settings.mode;

  if (carrierCode && settings.airlineOverrides && settings.airlineOverrides.length > 0) {
    const override = settings.airlineOverrides.find(
      (o) => o.carrierCode.toUpperCase() === carrierCode.toUpperCase()
    );
    if (override) {
      if (typeof override.percentage === 'number') {
        activePercentage = override.percentage;
      }
      if (typeof override.fixedAmountUsd === 'number' && override.fixedAmountUsd > 0) {
        activeFixedUsd = override.fixedAmountUsd;
        activeFixedEgp = typeof override.fixedAmountEgp === 'number' && override.fixedAmountEgp > 0
          ? override.fixedAmountEgp
          : Math.round(activeFixedUsd * currentRate);
      } else if (typeof override.fixedAmountEgp === 'number' && override.fixedAmountEgp > 0) {
        activeFixedEgp = override.fixedAmountEgp;
        activeFixedUsd = Math.round((activeFixedEgp / currentRate) * 10) / 10;
      }
    }
  }

  let markupUsd = 0;
  let markupEgp = 0;

  if (activeMode === 'percentage' || activeMode === 'both') {
    const pctUsd = (netUsd * activePercentage) / 100;
    const pctEgp = (netEgp * activePercentage) / 100;
    markupUsd += pctUsd;
    markupEgp += pctEgp;
  }

  if (activeMode === 'fixed' || activeMode === 'both') {
    markupUsd += activeFixedUsd;
    markupEgp += activeFixedEgp;
  }

  // Round values cleanly
  const roundedMarkupUsd = Math.round(markupUsd);
  const roundedMarkupEgp = Math.round(markupEgp);

  return {
    netCostUsd: netUsd,
    netCostEgp: netEgp,
    markupUsd: roundedMarkupUsd,
    markupEgp: roundedMarkupEgp,
    totalAmountUsd: netUsd + roundedMarkupUsd,
    totalAmountEgp: netEgp + roundedMarkupEgp,
    percentageApplied: activePercentage,
    fixedAmountUsdApplied: activeFixedUsd,
    fixedAmountEgpApplied: activeFixedEgp,
    modeApplied: activeMode,
  };
}

/**
 * Applies active markup to a single FlightOffer
 */
export function applyMarkupToOffer(offer: FlightOffer, settings: MarkupSettings, usdToEgpRate = 50.05): FlightOffer {
  // If price already has markup applied, retain original net cost
  const netUsd = offer.price.markup?.netCostUsd ?? offer.price.totalAmountUsd;
  const netEgp = offer.price.markup?.netCostEgp ?? offer.price.totalAmountEgp;

  const result = calculateMarkup(netUsd, netEgp, settings, offer.validatingCarrier, usdToEgpRate);

  return {
    ...offer,
    price: {
      ...offer.price,
      totalAmountUsd: result.totalAmountUsd,
      totalAmountEgp: result.totalAmountEgp,
      baseFareUsd: offer.price.baseFareUsd + result.markupUsd,
      baseFareEgp: offer.price.baseFareEgp + result.markupEgp,
      markup: {
        mode: result.modeApplied,
        percentageApplied: result.percentageApplied,
        fixedAmountUsdApplied: result.fixedAmountUsdApplied,
        totalMarkupUsd: result.markupUsd,
        totalMarkupEgp: result.markupEgp,
        netCostUsd: result.netCostUsd,
        netCostEgp: result.netCostEgp,
      },
    },
  };
}
