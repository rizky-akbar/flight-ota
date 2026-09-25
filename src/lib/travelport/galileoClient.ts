import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { FlightOffer, FlightSearchQuery, FlightSegment, FlightLeg } from './types';
import { generateMockGalileoOffers, AIRLINE_INFO } from './mockData';
import { getUsdToEgpRate, getUsdToIdrRate } from '@/lib/currency';

export interface GalileoConfig {
  endpoint: string;
  username: string;
  password: string;
  targetBranch: string; // Travelport PCC / Branch
  useMock: boolean;
}

export function getGalileoConfig(): GalileoConfig {
  return {
    endpoint: process.env.TRAVELPORT_ENDPOINT || 'https://americas.universal-api.pp.travelport.com/B2BGateway/connect/UAPI/AirService',
    username: process.env.TRAVELPORT_USERNAME || '',
    password: process.env.TRAVELPORT_PASSWORD || '',
    targetBranch: process.env.TRAVELPORT_TARGET_BRANCH || '',
    useMock: process.env.TRAVELPORT_USE_MOCK !== 'false' && (!process.env.TRAVELPORT_USERNAME || !process.env.TRAVELPORT_PASSWORD),
  };
}

/**
 * Builds standard SOAP Envelope for Galileo AirLowFareSearchReq (Provider 1G)
 */
export function buildGalileoLowFareSearchXml(query: FlightSearchQuery, targetBranch: string): string {
  const outboundLeg = `
    <air:SearchAirLeg>
      <air:SearchOrigin>
        <com:Airport Code="${query.origin.toUpperCase()}"/>
      </air:SearchOrigin>
      <air:SearchDestination>
        <com:Airport Code="${query.destination.toUpperCase()}"/>
      </air:SearchDestination>
      <air:SearchDepTime PreferredTime="${query.departureDate}"/>
    </air:SearchAirLeg>`;

  const returnLeg = (query.tripType === 'round-trip' && query.returnDate) ? `
    <air:SearchAirLeg>
      <air:SearchOrigin>
        <com:Airport Code="${query.destination.toUpperCase()}"/>
      </air:SearchOrigin>
      <air:SearchDestination>
        <com:Airport Code="${query.origin.toUpperCase()}"/>
      </air:SearchDestination>
      <air:SearchDepTime PreferredTime="${query.returnDate}"/>
    </air:SearchAirLeg>` : '';

  // Passenger elements
  let passengerXml = '';
  for (let i = 0; i < query.adults; i++) {
    passengerXml += '<com:SearchPassenger Code="ADT"/>';
  }
  for (let i = 0; i < query.children; i++) {
    passengerXml += '<com:SearchPassenger Code="CNN" Age="8"/>';
  }
  for (let i = 0; i < query.infants; i++) {
    passengerXml += '<com:SearchPassenger Code="INF" Age="1"/>';
  }

  const cabinCode = query.cabinClass === 'Business' ? 'C' : query.cabinClass === 'PremiumEconomy' ? 'W' : 'Y';

  const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:air="http://www.travelport.com/schema/air_v52_0"
                  xmlns:com="http://www.travelport.com/schema/common_v52_0">
  <soapenv:Header/>
  <soapenv:Body>
    <air:LowFareSearchReq AuthorizedBy="user"
                          TraceId="INA_EGY_OTA_${Date.now()}"
                          TargetBranch="${targetBranch}">
      <com:BillingPointOfSaleInfo OriginApplication="UAPI"/>
      ${outboundLeg}
      ${returnLeg}
      <air:AirSearchModifiers>
        <air:PreferredProviders>
          <com:Provider Code="1G"/>
        </air:PreferredProviders>
        <air:PermittedCabins>
          <com:CabinClass Type="${cabinCode}"/>
        </air:PermittedCabins>
      </air:AirSearchModifiers>
      ${passengerXml}
    </air:LowFareSearchReq>
  </soapenv:Body>
</soapenv:Envelope>`;

  return xmlPayload.trim();
}

/**
 * Parses raw Galileo SOAP response to FlightOffer array
 */
export function parseGalileoResponse(xmlContent: string, query: FlightSearchQuery): FlightOffer[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });

  const parsed = parser.parse(xmlContent);
  const body = parsed?.Envelope?.Body || parsed?.Body;
  if (!body) {
    throw new Error('Invalid SOAP Envelope received from Travelport Galileo');
  }

  const fault = body.Fault;
  if (fault) {
    const faultString = fault.faultstring || JSON.stringify(fault);
    throw new Error(`Galileo SOAP Fault: ${faultString}`);
  }

  const response = body.LowFareSearchRsp;
  if (!response) {
    throw new Error('LowFareSearchRsp not found in Travelport Galileo response');
  }

  const pricingSolutions = response.AirPricingSolution;
  const solutionsArray = Array.isArray(pricingSolutions) ? pricingSolutions : (pricingSolutions ? [pricingSolutions] : []);

  // Map segments dictionary for fast reference
  const airSegmentList = response.AirSegmentList?.AirSegment || [];
  const segments = Array.isArray(airSegmentList) ? airSegmentList : [airSegmentList];
  const segmentMap = new Map<string, any>();
  segments.forEach((seg: any) => {
    if (seg['@_Key']) {
      segmentMap.set(seg['@_Key'], seg);
    }
  });

  const offers: FlightOffer[] = [];

  for (let i = 0; i < solutionsArray.length; i++) {
    const sol = solutionsArray[i];
    const totalAmountRaw = sol['@_TotalPrice'] || sol['@_ApproximateTotalPrice'] || 'USD500';
    const currency = totalAmountRaw.substring(0, 3);
    const amountNum = parseFloat(totalAmountRaw.substring(3)) || 500;

    const usdToEgp = getUsdToEgpRate();
    const usdToIdr = getUsdToIdrRate();

    const totalUsd = currency === 'USD' ? Math.round(amountNum) : currency === 'EGP' ? Math.round(amountNum / usdToEgp) : Math.round(amountNum / usdToIdr);
    const totalEgp = currency === 'EGP' ? Math.round(amountNum) : Math.round(totalUsd * usdToEgp);
    const totalIdr = currency === 'IDR' ? Math.round(amountNum) : Math.round(totalUsd * usdToIdr);

    // Parse segments for outbound/inbound
    const journey = sol.Journey || [];
    const journeyList = Array.isArray(journey) ? journey : [journey];
    
    // Fallback if journey mapping isn't present
    const airPricingInfo = sol.AirPricingInfo;
    const pricingInfoList = Array.isArray(airPricingInfo) ? airPricingInfo : [airPricingInfo];
    const firstCarrier = pricingInfoList[0]?.['@_PlatingCarrier'] || 'SV';
    const carrierInfo = AIRLINE_INFO[firstCarrier] || { name: firstCarrier, logo: `https://images.kiwi.com/airlines/64/${firstCarrier}.png`, rating: 4.5 };

    // Extract segments mapped by AirPricingInfo
    const outboundSegments: FlightSegment[] = [];
    const airSegments = sol.AirSegment || [];
    const solSegments = Array.isArray(airSegments) ? airSegments : [airSegments];

    solSegments.forEach((segRef: any) => {
      const segKey = segRef['@_Key'] || segRef;
      const fullSeg = segmentMap.get(segKey) || segRef;
      if (fullSeg && fullSeg['@_Carrier']) {
        const cCode = fullSeg['@_Carrier'];
        const fNum = `${cCode}-${fullSeg['@_FlightNumber'] || '101'}`;
        const depTime = fullSeg['@_DepartureTime'] || `${query.departureDate}T10:00:00`;
        const arrTime = fullSeg['@_ArrivalTime'] || `${query.departureDate}T18:00:00`;
        const cInfo = AIRLINE_INFO[cCode] || { name: cCode, logo: '' };

        outboundSegments.push({
          carrierCode: cCode,
          carrierName: cInfo.name,
          flightNumber: fNum,
          origin: fullSeg['@_Origin'] || query.origin,
          destination: fullSeg['@_Destination'] || query.destination,
          departureTime: depTime,
          arrivalTime: arrTime,
          durationMinutes: parseInt(fullSeg['@_FlightTime']) || 480,
          aircraft: fullSeg['@_Equipment'] || 'Boeing 777',
          baggageAllowance: '2 x 23 kg Checked Baggage'
        });
      }
    });

    // If no segments directly resolved, create from solution leg
    const finalSegments = outboundSegments.length > 0 ? outboundSegments : [
      {
        carrierCode: firstCarrier,
        carrierName: carrierInfo.name,
        flightNumber: `${firstCarrier}-101`,
        origin: query.origin,
        destination: query.destination,
        departureTime: `${query.departureDate}T11:00:00`,
        arrivalTime: `${query.departureDate}T21:00:00`,
        durationMinutes: 600,
        aircraft: 'Boeing 787',
        baggageAllowance: '30 kg'
      }
    ];

    const outboundLeg: FlightLeg = {
      origin: query.origin,
      destination: query.destination,
      departureTime: finalSegments[0].departureTime,
      arrivalTime: finalSegments[finalSegments.length - 1].arrivalTime,
      durationMinutes: finalSegments.reduce((acc, s) => acc + s.durationMinutes, 0),
      stops: Math.max(0, finalSegments.length - 1),
      stopAirports: finalSegments.slice(0, -1).map(s => s.destination),
      segments: finalSegments
    };

    offers.push({
      id: `GALILEO-LIVE-${firstCarrier}-${i}-${Date.now().toString(36)}`,
      source: 'Galileo-Live',
      providerCode: '1G',
      validatingCarrier: firstCarrier,
      validatingCarrierName: carrierInfo.name,
      carrierLogoUrl: carrierInfo.logo,
      cabinClass: query.cabinClass,
      seatsRemaining: 5,
      baggageSummary: '2 x 23 kg Checked Baggage + 7 kg Cabin',
      refundable: true,
      price: {
        currency: 'USD',
        totalAmountUsd: totalUsd,
        totalAmountEgp: totalEgp,
        baseFareUsd: Math.round(totalUsd * 0.85),
        baseFareEgp: Math.round(totalEgp * 0.85),
        taxAndFeesUsd: Math.round(totalUsd * 0.15),
        taxAndFeesEgp: Math.round(totalEgp * 0.15),
        totalAmountIdr: totalIdr,
        baseFareIdr: Math.round(totalIdr * 0.85),
        taxAndFeesIdr: Math.round(totalIdr * 0.15),
      },
      outbound: outboundLeg
    });
  }

  return offers;
}

/**
 * Searches flights via Travelport Galileo (1G)
 * Automatically falls back to high-fidelity live simulation if credentials are not configured or request fails.
 */
export async function searchGalileoFlights(query: FlightSearchQuery): Promise<{
  offers: FlightOffer[];
  isRealGalileoApi: boolean;
  message?: string;
}> {
  const config = getGalileoConfig();
  const { getCustomFlights, getMarkupSettings } = await import('@/lib/storage');
  const { applyMarkupToOffer } = await import('./markup');

  const markupSettings = getMarkupSettings();
  const liveRate = getUsdToEgpRate();
  const applyMarkup = (flightList: FlightOffer[]): FlightOffer[] => {
    return flightList.map((offer) => applyMarkupToOffer(offer, markupSettings, liveRate));
  };

  const customFlights = getCustomFlights().filter(
    (f) =>
      f.outbound.origin.toUpperCase() === query.origin.toUpperCase() &&
      f.outbound.destination.toUpperCase() === query.destination.toUpperCase()
  );

  // If credentials are not present or useMock is explicitly enabled, return simulated live offers
  if (config.useMock || !config.username || !config.password) {
    console.log('[Travelport Galileo] Using simulated live Galileo 1G data (Credentials not configured)');
    const rawOffers = generateMockGalileoOffers(query);
    return {
      offers: applyMarkup([...customFlights, ...rawOffers]),
      isRealGalileoApi: false,
      message: 'Running in Galileo Sandbox / Simulation mode. Configure TRAVELPORT_USERNAME & TRAVELPORT_PASSWORD in .env.local for live Galileo XML feed.'
    };
  }

  try {
    const xmlPayload = buildGalileoLowFareSearchXml(query, config.targetBranch);
    const authHeader = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');

    console.log(`[Travelport Galileo] Querying live 1G endpoint: ${config.endpoint}`);

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': '',
        'Authorization': authHeader,
      },
      body: xmlPayload,
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Travelport Galileo] HTTP error ${response.status}: ${errorText.substring(0, 200)}`);
      throw new Error(`Galileo HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlResponse = await response.text();
    const rawOffers = parseGalileoResponse(xmlResponse, query);

    if (rawOffers.length === 0) {
      console.warn('[Travelport Galileo] Live endpoint returned 0 pricing solutions, falling back to simulated schedules');
      return {
        offers: applyMarkup([...customFlights, ...generateMockGalileoOffers(query)]),
        isRealGalileoApi: false,
        message: 'No live Galileo pricing returned for route, displaying schedule alternatives.'
      };
    }

    return {
      offers: applyMarkup([...customFlights, ...rawOffers]),
      isRealGalileoApi: true
    };
  } catch (err: any) {
    console.error('[Travelport Galileo Error]', err.message);
    const rawOffers = generateMockGalileoOffers(query);
    return {
      offers: applyMarkup([...customFlights, ...rawOffers]),
      isRealGalileoApi: false,
      message: `Galileo connection notice: ${err.message}. Showing high-accuracy simulated inventory.`
    };
  }
}
