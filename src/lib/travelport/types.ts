export interface AirportInfo {
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: 'ID' | 'EG' | string;
}

export const SUPPORTED_AIRPORTS: AirportInfo[] = [
  // Indonesia
  { code: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', countryCode: 'ID' },
  { code: 'SUB', name: 'Juanda International Airport', city: 'Surabaya', country: 'Indonesia', countryCode: 'ID' },
  { code: 'DPS', name: 'I Gusti Ngurah Rai International Airport', city: 'Denpasar / Bali', country: 'Indonesia', countryCode: 'ID' },
  { code: 'KNO', name: 'Kualanamu International Airport', city: 'Medan', country: 'Indonesia', countryCode: 'ID' },
  { code: 'UPG', name: 'Sultan Hasanuddin International Airport', city: 'Makassar', country: 'Indonesia', countryCode: 'ID' },

  // Egypt
  { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', countryCode: 'EG' },
  { code: 'HBE', name: 'Borg El Arab Airport', city: 'Alexandria', country: 'Egypt', countryCode: 'EG' },
  { code: 'HRG', name: 'Hurghada International Airport', city: 'Hurghada', country: 'Egypt', countryCode: 'EG' },
  { code: 'SSH', name: 'Sharm El Sheikh International Airport', city: 'Sharm El Sheikh', country: 'Egypt', countryCode: 'EG' },
  { code: 'LXR', name: 'Luxor International Airport', city: 'Luxor', country: 'Egypt', countryCode: 'EG' },
  { code: 'ASW', name: 'Aswan International Airport', city: 'Aswan', country: 'Egypt', countryCode: 'EG' }
];

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
