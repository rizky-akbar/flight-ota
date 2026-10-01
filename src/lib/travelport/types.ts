export interface AirportInfo {
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: 'ID' | 'EG' | 'SA' | 'AE' | 'QA' | 'TR' | 'MY' | 'SG' | 'TH' | 'GB' | 'FR' | 'DE' | 'NL' | 'US' | 'JP' | 'KR' | string;
  region?: 'Egypt' | 'Indonesia' | 'MiddleEast' | 'Asia' | 'Europe' | 'Americas';
}

export const SUPPORTED_AIRPORTS: AirportInfo[] = [
  // 🇪🇬 Mesir (Egypt) - Hub Utama
  { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', countryCode: 'EG', region: 'Egypt' },
  { code: 'HBE', name: 'Borg El Arab Airport', city: 'Alexandria', country: 'Egypt', countryCode: 'EG', region: 'Egypt' },
  { code: 'HRG', name: 'Hurghada International Airport', city: 'Hurghada', country: 'Egypt', countryCode: 'EG', region: 'Egypt' },
  { code: 'SSH', name: 'Sharm El Sheikh International Airport', city: 'Sharm El Sheikh', country: 'Egypt', countryCode: 'EG', region: 'Egypt' },
  { code: 'LXR', name: 'Luxor International Airport', city: 'Luxor', country: 'Egypt', countryCode: 'EG', region: 'Egypt' },
  { code: 'ASW', name: 'Aswan International Airport', city: 'Aswan', country: 'Egypt', countryCode: 'EG', region: 'Egypt' },

  // 🇮🇩 Indonesia
  { code: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', countryCode: 'ID', region: 'Indonesia' },
  { code: 'SUB', name: 'Juanda International Airport', city: 'Surabaya', country: 'Indonesia', countryCode: 'ID', region: 'Indonesia' },
  { code: 'DPS', name: 'I Gusti Ngurah Rai International Airport', city: 'Denpasar / Bali', country: 'Indonesia', countryCode: 'ID', region: 'Indonesia' },
  { code: 'KNO', name: 'Kualanamu International Airport', city: 'Medan', country: 'Indonesia', countryCode: 'ID', region: 'Indonesia' },
  { code: 'UPG', name: 'Sultan Hasanuddin International Airport', city: 'Makassar', country: 'Indonesia', countryCode: 'ID', region: 'Indonesia' },

  // 🇸🇦 Timur Tengah / Middle East (Transit / Umrah)
  { code: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', countryCode: 'SA', region: 'MiddleEast' },
  { code: 'MED', name: 'Prince Mohammad Bin Abdulaziz Airport', city: 'Medina', country: 'Saudi Arabia', countryCode: 'SA', region: 'MiddleEast' },
  { code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', region: 'MiddleEast' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', region: 'MiddleEast' },
  { code: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE', region: 'MiddleEast' },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', countryCode: 'QA', region: 'MiddleEast' },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', countryCode: 'TR', region: 'MiddleEast' },

  // 🌏 Asia & Tenggara
  { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', region: 'Asia' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', countryCode: 'SG', region: 'Asia' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', countryCode: 'TH', region: 'Asia' },
  { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan', countryCode: 'JP', region: 'Asia' },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', countryCode: 'KR', region: 'Asia' },

  // 🇪🇺 Eropa & 🌎 Amerika
  { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', countryCode: 'GB', region: 'Europe' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', countryCode: 'FR', region: 'Europe' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', countryCode: 'DE', region: 'Europe' },
  { code: 'AMS', name: 'Amsterdam Schiphol Airport', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', region: 'Europe' },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', countryCode: 'US', region: 'Americas' },
];

export const EGYPT_AIRPORT_CODES = new Set(['CAI', 'HBE', 'HRG', 'SSH', 'LXR', 'ASW']);

export function isEgyptAirport(code?: string | null): boolean {
  if (!code) return false;
  return EGYPT_AIRPORT_CODES.has(code.toUpperCase());
}

/**
 * Validates route policy:
 * - Keberangkatan (Origin) WAJIB dari bandara di Mesir (Kairo, Alexandria, dll).
 */
export function validateRoute(
  origin: string,
  destination: string,
  _tripType?: 'one-way' | 'round-trip'
): { valid: boolean; error?: string } {
  const orig = (origin || '').toUpperCase();
  const dest = (destination || '').toUpperCase();

  if (!orig || !dest) {
    return { valid: false, error: 'Bandara keberangkatan dan tujuan wajib dipilih.' };
  }

  if (orig === dest) {
    return { valid: false, error: 'Bandara keberangkatan dan tujuan tidak boleh sama.' };
  }

  if (!isEgyptAirport(orig)) {
    return {
      valid: false,
      error: 'Keberangkatan hanya tersedia dari bandara di Mesir (seperti Kairo / Alexandria).',
    };
  }

  return { valid: true };
}

export type CabinClass = 'Economy' | 'PremiumEconomy' | 'Business' | 'First';

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (optional for round trip)
  tripType: 'one-way' | 'round-trip';
  adults: number;
  children: number;
  infants: number;
  cabinClass: CabinClass;
}

export interface FlightSegment {
  carrierCode: string;
  carrierName: string;
  flightNumber: string;
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  departureTime: string; // ISO or YYYY-MM-DDTHH:mm
  arrivalTime: string;   // ISO or YYYY-MM-DDTHH:mm
  durationMinutes: number;
  aircraft?: string;
  bookingClass?: string;
  baggageAllowance?: string;
}

export interface FlightLeg {
  segments: FlightSegment[];
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  durationMinutes: number;
  stops: number;
  stopAirports: string[];
}

export interface FlightOffer {
  id: string;
  source: 'Galileo-Live' | 'Galileo-UAPI-Simulated';
  providerCode: '1G'; // 1G is Galileo
  validatingCarrier: string;
  validatingCarrierName: string;
  carrierLogoUrl?: string;
  cabinClass: CabinClass;
  price: {
    currency: 'USD' | 'EGP' | string;
    totalAmountUsd: number;
    totalAmountEgp: number;
    baseFareUsd: number;
    baseFareEgp: number;
    taxAndFeesUsd: number;
    taxAndFeesEgp: number;
    totalAmountIdr?: number;
    baseFareIdr?: number;
    taxAndFeesIdr?: number;
    markup?: {
      mode: 'percentage' | 'fixed' | 'both' | 'none';
      percentageApplied: number;
      fixedAmountUsdApplied: number;
      totalMarkupUsd: number;
      totalMarkupEgp: number;
      netCostUsd: number;
      netCostEgp: number;
    };
  };
  outbound: FlightLeg;
  inbound?: FlightLeg;
  seatsRemaining: number;
  baggageSummary: string;
  refundable: boolean;
}

export interface PassengerDetails {
  id: string;
  title: 'Mr' | 'Mrs' | 'Ms' | 'Mstr' | 'Miss';
  firstName: string;
  lastName: string;
  type: 'ADT' | 'CNN' | 'INF'; // Galileo standard passenger codes
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  dateOfBirth: string;
}

export interface ContactDetails {
  fullName: string;
  email: string;
  phoneNumber: string; // WhatsApp active number
  notes?: string;
}

export interface BookingInquiry {
  bookingId: string;
  createdAt: string;
  status: 'Pending' | 'Contacted' | 'Confirmed' | 'Ticketed' | 'Cancelled';
  flightOffer: FlightOffer;
  contact: ContactDetails;
  passengers: PassengerDetails[];
  specialRequests?: {
    mealPreference?: string;
    extraBaggage?: string;
    wheelchair?: boolean;
    studentVisaAssistance?: boolean;
    umrahTransitPackage?: boolean;
  };
  totalEstimatedPriceUsd: number;
  totalEstimatedPriceEgp: number;
  totalEstimatedPriceIdr?: number;
}
