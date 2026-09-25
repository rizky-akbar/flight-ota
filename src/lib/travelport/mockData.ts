import { FlightOffer, FlightSearchQuery, FlightLeg, CabinClass } from './types';

// Real-world airline mapping
export const AIRLINE_INFO: Record<string, { name: string; logo: string; rating: number }> = {
  SV: { name: 'Saudia Airlines', logo: 'https://images.kiwi.com/airlines/64/SV.png', rating: 4.5 },
  MS: { name: 'EgyptAir', logo: 'https://images.kiwi.com/airlines/64/MS.png', rating: 4.2 },
  EK: { name: 'Emirates', logo: 'https://images.kiwi.com/airlines/64/EK.png', rating: 4.8 },
  QR: { name: 'Qatar Airways', logo: 'https://images.kiwi.com/airlines/64/QR.png', rating: 4.9 },
  WY: { name: 'Oman Air', logo: 'https://images.kiwi.com/airlines/64/WY.png', rating: 4.4 },
  EY: { name: 'Etihad Airways', logo: 'https://images.kiwi.com/airlines/64/EY.png', rating: 4.6 },
  TK: { name: 'Turkish Airlines', logo: 'https://images.kiwi.com/airlines/64/TK.png', rating: 4.7 }
};

interface RouteTemplate {
  carrierCode: string;
  flight1: string;
  flight2: string;
  transitAirport: string;
  transitCity: string;
  aircraft1: string;
  aircraft2: string;
  outboundDepTime: string; // "11:30"
  transitArrTime: string;  // "17:15"
  transitDepTime: string;  // "19:40"
  finalArrTime: string;    // "21:30"
  basePriceUsd: number;
  baggage: string;
  refundable: boolean;
}

const TEMPLATES_ID_TO_EG: RouteTemplate[] = [
  {
    carrierCode: 'SV',
    flight1: 'SV-819',
    flight2: 'SV-301',
    transitAirport: 'JED',
    transitCity: 'Jeddah',
    aircraft1: 'Boeing 777-300ER',
    aircraft2: 'Airbus A330-300',
    outboundDepTime: '11:00',
    transitArrTime: '17:10',
    transitDepTime: '19:30',
    finalArrTime: '21:15',
    basePriceUsd: 590,
    baggage: '2 x 23 kg Checked Baggage + 7 kg Cabin',
    refundable: true
  },
  {
    carrierCode: 'WY',
    flight1: 'WY-850',
    flight2: 'WY-405',
    transitAirport: 'MCT',
    transitCity: 'Muscat',
    aircraft1: 'Boeing 787-9 Dreamliner',
    aircraft2: 'Boeing 737 MAX 8',
    outboundDepTime: '14:55',
    transitArrTime: '19:45',
    transitDepTime: '21:40',
    finalArrTime: '00:10',
    basePriceUsd: 545,
    baggage: '30 kg Checked Baggage + 7 kg Cabin',
    refundable: true
  },
  {
    carrierCode: 'EK',
    flight1: 'EK-357',
    flight2: 'EK-927',
    transitAirport: 'DXB',
    transitCity: 'Dubai',
    aircraft1: 'Boeing 777-300ER',
    aircraft2: 'Airbus A380-800',
    outboundDepTime: '17:40',
    transitArrTime: '23:05',
    transitDepTime: '08:15',
    finalArrTime: '10:05',
    basePriceUsd: 685,
    baggage: '2 x 23 kg Checked Baggage + 7 kg Cabin',
    refundable: true
  },
  {
    carrierCode: 'QR',
    flight1: 'QR-957',
    flight2: 'QR-1301',
    transitAirport: 'DOH',
    transitCity: 'Doha',
    aircraft1: 'Boeing 787-9 Dreamliner',
    aircraft2: 'Airbus A350-900',
    outboundDepTime: '18:55',
    transitArrTime: '23:15',
    transitDepTime: '01:55',
    finalArrTime: '05:40',
    basePriceUsd: 660,
    baggage: '25 kg Checked Baggage + 7 kg Cabin',
    refundable: true
  },
  {
    carrierCode: 'EY',
    flight1: 'EY-475',
    flight2: 'EY-653',
    transitAirport: 'AUH',
    transitCity: 'Abu Dhabi',
    aircraft1: 'Boeing 787-10',
    aircraft2: 'Airbus A321neo',
    outboundDepTime: '00:40',
    transitArrTime: '06:05',
    transitDepTime: '09:30',
    finalArrTime: '11:45',
    basePriceUsd: 610,
    baggage: '30 kg Checked Baggage + 7 kg Cabin',
    refundable: false
  },
  {
    carrierCode: 'MS',
    flight1: 'MS-961',
    flight2: 'MS-847',
    transitAirport: 'BKK',
    transitCity: 'Bangkok',
    aircraft1: 'Boeing 777-300ER',
    aircraft2: 'Boeing 787-9 Dreamliner',
    outboundDepTime: '07:20',
    transitArrTime: '11:00',
    transitDepTime: '13:50',
    finalArrTime: '18:50',
    basePriceUsd: 640,
    baggage: '2 x 23 kg Checked Baggage (EgyptAir Special)',
    refundable: true
  }
];

const TEMPLATES_EG_TO_ID: RouteTemplate[] = [
  {
    carrierCode: 'SV',
    flight1: 'SV-302',
    flight2: 'SV-820',
    transitAirport: 'JED',
    transitCity: 'Jeddah',
    aircraft1: 'Airbus A330-300',
    aircraft2: 'Boeing 777-300ER',
    outboundDepTime: '02:45',
    transitArrTime: '06:15',
    transitDepTime: '09:00',
    finalArrTime: '23:10',
    basePriceUsd: 580,
    baggage: '2 x 23 kg Checked Baggage + 7 kg Cabin',
    refundable: true
  },
  {
    carrierCode: 'WY',
    flight1: 'WY-406',
    flight2: 'WY-849',
    transitAirport: 'MCT',
    transitCity: 'Muscat',
    aircraft1: 'Boeing 737 MAX 8',
    aircraft2: 'Boeing 787-9 Dreamliner',
    outboundDepTime: '01:50',
    transitArrTime: '07:30',
    transitDepTime: '09:10',
    finalArrTime: '19:40',
    basePriceUsd: 535,
    baggage: '30 kg Checked Baggage + 7 kg Cabin',
    refundable: true
  },
  {
    carrierCode: 'EK',
    flight1: 'EK-928',
    flight2: 'EK-356',
    transitAirport: 'DXB',
    transitCity: 'Dubai',
    aircraft1: 'Airbus A380-800',
    aircraft2: 'Boeing 777-300ER',
    outboundDepTime: '12:05',
    transitArrTime: '17:35',
    transitDepTime: '04:15',
    finalArrTime: '15:40',
    basePriceUsd: 675,
    baggage: '2 x 23 kg Checked Baggage + 7 kg Cabin',
    refundable: true
  },
  {
    carrierCode: 'QR',
    flight1: 'QR-1302',
    flight2: 'QR-956',
    transitAirport: 'DOH',
    transitCity: 'Doha',
    aircraft1: 'Airbus A350-900',
    aircraft2: 'Boeing 787-9 Dreamliner',
    outboundDepTime: '19:35',
    transitArrTime: '23:45',
    transitDepTime: '02:30',
    finalArrTime: '15:10',
    basePriceUsd: 650,
    baggage: '25 kg Checked Baggage + 7 kg Cabin',
    refundable: true
  },
  {
    carrierCode: 'EY',
    flight1: 'EY-654',
    flight2: 'EY-474',
    transitAirport: 'AUH',
    transitCity: 'Abu Dhabi',
    aircraft1: 'Airbus A321neo',
    aircraft2: 'Boeing 787-10',
    outboundDepTime: '13:10',
    transitArrTime: '18:40',
    transitDepTime: '02:40',
    finalArrTime: '14:25',
    basePriceUsd: 605,
    baggage: '30 kg Checked Baggage + 7 kg Cabin',
    refundable: false
  }
];

import { getUsdToEgpRate, getUsdToIdrRate } from '@/lib/currency';

export const USD_TO_EGP_RATE = 50.05; // Fallback rate (PayPal Realtime rate used dynamically)
const USD_TO_IDR_RATE = 17150;

function calculateDurationMinutes(depTime: string, arrTime: string): number {
  const [dh, dm] = depTime.split(':').map(Number);
  const [ah, am] = arrTime.split(':').map(Number);
  let diff = (ah * 60 + am) - (dh * 60 + dm);
  if (diff < 0) {
    diff += 24 * 60; // next day
  }
  return diff;
}

function buildFlightLeg(
  template: RouteTemplate,
  origin: string,
  destination: string,
  dateStr: string
): FlightLeg {
  const seg1Duration = calculateDurationMinutes(template.outboundDepTime, template.transitArrTime);
  const seg2Duration = calculateDurationMinutes(template.transitDepTime, template.finalArrTime);
  const totalDuration = calculateDurationMinutes(template.outboundDepTime, template.finalArrTime) + (template.finalArrTime < template.outboundDepTime ? 24 * 60 : 0);

  const airline = AIRLINE_INFO[template.carrierCode] || { name: template.carrierCode, logo: '', rating: 4.0 };

  return {
    origin,
    destination,
    departureTime: `${dateStr}T${template.outboundDepTime}:00`,
    arrivalTime: `${dateStr}T${template.finalArrTime}:00`,
    durationMinutes: totalDuration > 0 ? totalDuration : 840,
    stops: 1,
    stopAirports: [template.transitAirport],
    segments: [
      {
        carrierCode: template.carrierCode,
        carrierName: airline.name,
        flightNumber: template.flight1,
        origin,
        destination: template.transitAirport,
        departureTime: `${dateStr}T${template.outboundDepTime}:00`,
        arrivalTime: `${dateStr}T${template.transitArrTime}:00`,
        durationMinutes: seg1Duration > 0 ? seg1Duration : 480,
        aircraft: template.aircraft1,
        bookingClass: 'Economy Saver',
        baggageAllowance: template.baggage
      },
      {
        carrierCode: template.carrierCode,
        carrierName: airline.name,
        flightNumber: template.flight2,
        origin: template.transitAirport,
        destination,
        departureTime: `${dateStr}T${template.transitDepTime}:00`,
        arrivalTime: `${dateStr}T${template.finalArrTime}:00`,
        durationMinutes: seg2Duration > 0 ? seg2Duration : 180,
        aircraft: template.aircraft2,
        bookingClass: 'Economy Saver',
        baggageAllowance: template.baggage
      }
    ]
  };
}

export function generateMockGalileoOffers(query: FlightSearchQuery): FlightOffer[] {
  const isIndonesiaOrigin = ['CGK', 'SUB', 'DPS', 'KNO', 'UPG'].includes(query.origin.toUpperCase());
  const templates = isIndonesiaOrigin ? TEMPLATES_ID_TO_EG : TEMPLATES_EG_TO_ID;

  const passengerMultiplier = query.adults + query.children * 0.75 + query.infants * 0.15;
  const cabinMultiplier = query.cabinClass === 'Business' ? 2.8 : query.cabinClass === 'PremiumEconomy' ? 1.5 : 1.0;
  const roundTripMultiplier = query.tripType === 'round-trip' ? 1.85 : 1.0;

  return templates.map((template, idx) => {
    const airline = AIRLINE_INFO[template.carrierCode] || { name: template.carrierCode, logo: '', rating: 4.2 };
    const outbound = buildFlightLeg(template, query.origin, query.destination, query.departureDate);

    let inbound: FlightLeg | undefined = undefined;
    if (query.tripType === 'round-trip' && query.returnDate) {
      // Find matching reverse template
      const returnTemplates = isIndonesiaOrigin ? TEMPLATES_EG_TO_ID : TEMPLATES_ID_TO_EG;
      const returnTemplate = returnTemplates.find(t => t.carrierCode === template.carrierCode) || returnTemplates[0];
      inbound = buildFlightLeg(returnTemplate, query.destination, query.origin, query.returnDate);
    }

    const baseFareUsd = Math.round(template.basePriceUsd * passengerMultiplier * cabinMultiplier * roundTripMultiplier);
    const taxUsd = Math.round(baseFareUsd * 0.14);
    const totalUsd = baseFareUsd + taxUsd;
    const currentUsdToEgp = getUsdToEgpRate();
    const currentUsdToIdr = getUsdToIdrRate();
    const baseFareEgp = Math.round(baseFareUsd * currentUsdToEgp);
    const taxEgp = Math.round(taxUsd * currentUsdToEgp);
    const totalEgp = baseFareEgp + taxEgp;
    const totalIdr = Math.round(totalUsd * currentUsdToIdr);
    const baseIdr = Math.round(baseFareUsd * currentUsdToIdr);
    const taxIdr = Math.round(taxUsd * currentUsdToIdr);

    return {
      id: `GALILEO-1G-${template.carrierCode}-${Date.now().toString(36)}-${idx}`,
      source: 'Galileo-UAPI-Simulated',
      providerCode: '1G',
      validatingCarrier: template.carrierCode,
      validatingCarrierName: airline.name,
      carrierLogoUrl: airline.logo,
      cabinClass: query.cabinClass,
      seatsRemaining: Math.floor(Math.random() * 7) + 3,
      baggageSummary: template.baggage,
      refundable: template.refundable,
      price: {
        currency: 'USD',
        totalAmountUsd: totalUsd,
        totalAmountEgp: totalEgp,
        baseFareUsd: baseFareUsd,
        baseFareEgp: baseFareEgp,
        taxAndFeesUsd: taxUsd,
        taxAndFeesEgp: taxEgp,
        totalAmountIdr: totalIdr,
        baseFareIdr: baseIdr,
        taxAndFeesIdr: taxIdr
      },
      outbound,
      inbound
    };
  });
}
