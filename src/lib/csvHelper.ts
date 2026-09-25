import { FlightOffer, BookingInquiry } from './travelport/types';

/**
 * Escapes a cell value for CSV formatting
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Parses CSV text into an array of string objects
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    rows.push(obj);
  }

  return rows;
}

/**
 * Converts Booking Inquiries to CSV (Passenger Manifest & Financial Report)
 */
export function bookingsToCsv(inquiries: BookingInquiry[]): string {
  const headers = [
    'Booking ID',
    'Created At',
    'Status',
    'Origin',
    'Destination',
    'Airline',
    'Flight Number',
    'Departure Time',
    'Arrival Time',
    'Trip Type',
    'Cabin Class',
    'Contact Name',
    'Contact WhatsApp',
    'Contact Email',
    'Passenger Title',
    'Passenger First Name',
    'Passenger Last Name',
    'Passport Number',
    'Passport Expiry',
    'Nationality',
    'Date of Birth',
    'Total Price (USD)',
    'Total Price (EGP)',
    'Special Requests',
    'Customer Notes',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  inquiries.forEach((inq) => {
    const out = inq.flightOffer.outbound;
    const isRoundTrip = !!inq.flightOffer.inbound;
    const airline = inq.flightOffer.validatingCarrierName;
    const flightNum = out.segments.map((s) => s.flightNumber).join(' + ');

    const specialReqs = [
      inq.specialRequests?.mealPreference,
      inq.specialRequests?.extraBaggage,
      inq.specialRequests?.studentVisaAssistance ? 'Student Visa' : '',
      inq.specialRequests?.umrahTransitPackage ? 'Umrah Transit' : '',
      inq.specialRequests?.wheelchair ? 'Wheelchair' : '',
    ]
      .filter(Boolean)
      .join('; ');

    const usdPrice = inq.totalEstimatedPriceUsd || Math.round((inq.totalEstimatedPriceIdr || 0) / 15850);
    const egpPrice = inq.totalEstimatedPriceEgp || Math.round(usdPrice * 49.0);

    inq.passengers.forEach((pax) => {
      const row = [
        inq.bookingId,
        inq.createdAt,
        inq.status,
        out.origin,
        out.destination,
        airline,
        flightNum,
        out.departureTime,
        out.arrivalTime,
        isRoundTrip ? 'Round-Trip' : 'One-Way',
        inq.flightOffer.cabinClass,
        inq.contact.fullName,
        inq.contact.phoneNumber,
        inq.contact.email,
        pax.title,
        pax.firstName,
        pax.lastName,
        pax.passportNumber,
        pax.passportExpiry,
        pax.nationality,
        pax.dateOfBirth,
        usdPrice,
        egpPrice,
        specialReqs,
        inq.contact.notes || '',
      ];
      rows.push(row.map(escapeCsvCell).join(','));
    });
  });

  return rows.join('\r\n');
}

/**
 * Converts Flight Offers / Schedules to CSV
 */
export function flightOffersToCsv(offers: FlightOffer[]): string {
  const headers = [
    'Flight ID',
    'Airline Code',
    'Airline Name',
    'Flight Number',
    'Origin',
    'Destination',
    'Departure Time',
    'Arrival Time',
    'Duration (Minutes)',
    'Stops Count',
    'Transit Airports',
    'Aircraft',
    'Cabin Class',
    'Baggage Allowance',
    'Price (USD)',
    'Price (EGP)',
    'Seats Remaining',
    'Refundable',
    'Provider',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  offers.forEach((offer) => {
    const out = offer.outbound;
    const flightNums = out.segments.map((s) => s.flightNumber).join(' + ');
    const aircraft = out.segments.map((s) => s.aircraft || '').filter(Boolean).join(' / ');

    const usd = offer.price.totalAmountUsd;
    const egp = offer.price.totalAmountEgp || Math.round(usd * 49.0);

    const row = [
      offer.id,
      offer.validatingCarrier,
      offer.validatingCarrierName,
      flightNums,
      out.origin,
      out.destination,
      out.departureTime,
      out.arrivalTime,
      out.durationMinutes,
      out.stops,
      out.stopAirports.join('; '),
      aircraft,
      offer.cabinClass,
      offer.baggageSummary,
      usd,
      egp,
      offer.seatsRemaining,
      offer.refundable ? 'Yes' : 'No',
      offer.providerCode || '1G',
    ];
    rows.push(row.map(escapeCsvCell).join(','));
  });

  return rows.join('\r\n');
}

/**
 * Converts CSV rows into FlightOffer objects
 */
export function csvToFlightOffers(csvText: string): FlightOffer[] {
  const records = parseCsv(csvText);
  return records.map((rec, idx) => {
    const origin = rec['Origin'] || 'CGK';
    const destination = rec['Destination'] || 'CAI';
    const depTime = rec['Departure Time'] || `${new Date().toISOString().split('T')[0]}T10:00:00`;
    const arrTime = rec['Arrival Time'] || `${new Date().toISOString().split('T')[0]}T20:00:00`;
    const carrierCode = rec['Airline Code'] || 'SV';
    const carrierName = rec['Airline Name'] || 'Saudia Airlines';
    const flightNum = rec['Flight Number'] || `${carrierCode}-101`;
    const priceUsd = parseInt(rec['Price (USD)']) || (parseInt(rec['Price (EGP)']) ? Math.round(parseInt(rec['Price (EGP)']) / 49.0) : 590);
    const priceEgp = parseInt(rec['Price (EGP)']) || Math.round(priceUsd * 49.0);
    const baggage = rec['Baggage Allowance'] || '2 x 23 kg Checked Baggage';
    const duration = parseInt(rec['Duration (Minutes)']) || 600;
    const stops = parseInt(rec['Stops Count']) || (rec['Transit Airports'] ? 1 : 0);
    const stopAirports = rec['Transit Airports'] ? rec['Transit Airports'].split(';').map((s) => s.trim()) : [];
    const aircraft = rec['Aircraft'] || 'Boeing 777-300ER';

    return {
      id: rec['Flight ID'] || `CUSTOM-FLIGHT-${Date.now()}-${idx}`,
      source: 'Galileo-Live',
      providerCode: '1G',
      validatingCarrier: carrierCode,
      validatingCarrierName: carrierName,
      carrierLogoUrl: `https://images.kiwi.com/airlines/64/${carrierCode}.png`,
      cabinClass: (rec['Cabin Class'] as any) || 'Economy',
      seatsRemaining: parseInt(rec['Seats Remaining']) || 9,
      baggageSummary: baggage,
      refundable: rec['Refundable']?.toLowerCase() === 'yes',
      price: {
        currency: 'USD',
        totalAmountUsd: priceUsd,
        totalAmountEgp: priceEgp,
        baseFareUsd: Math.round(priceUsd * 0.85),
        baseFareEgp: Math.round(priceEgp * 0.85),
        taxAndFeesUsd: Math.round(priceUsd * 0.15),
        taxAndFeesEgp: Math.round(priceEgp * 0.15),
        totalAmountIdr: Math.round(priceUsd * 15850),
        baseFareIdr: Math.round(priceUsd * 0.85 * 15850),
        taxAndFeesIdr: Math.round(priceUsd * 0.15 * 15850),
      },
      outbound: {
        origin,
        destination,
        departureTime: depTime,
        arrivalTime: arrTime,
        durationMinutes: duration,
        stops,
        stopAirports,
        segments: [
          {
            carrierCode,
            carrierName,
            flightNumber: flightNum,
            origin,
            destination: stopAirports[0] || destination,
            departureTime: depTime,
            arrivalTime: arrTime,
            durationMinutes: duration,
            aircraft,
            baggageAllowance: baggage,
          },
        ],
      },
    };
  });
}

/**
 * Returns sample CSV template for flight schedules
 */
export function getFlightScheduleSampleCsv(): string {
  return `Airline Code,Airline Name,Flight Number,Origin,Destination,Departure Time,Arrival Time,Duration (Minutes),Stops Count,Transit Airports,Aircraft,Cabin Class,Baggage Allowance,Price (USD),Price (EGP),Seats Remaining,Refundable,Provider
SV,Saudia Airlines,SV-819 + SV-301,CGK,CAI,2026-10-25T11:00:00,2026-10-25T21:15:00,855,1,JED,Boeing 777-300ER / Airbus A330,Economy,2 x 23 kg Checked Baggage,595,29155,9,Yes,1G
MS,EgyptAir,MS-961 + MS-847,CGK,CAI,2026-10-25T07:20:00,2026-10-25T18:50:00,690,1,BKK,Boeing 787-9 Dreamliner,Economy,2 x 23 kg Checked Baggage,645,31605,7,Yes,1G
EK,Emirates,EK-357 + EK-927,DPS,CAI,2026-10-25T17:40:00,2026-10-26T10:05:00,985,1,DXB,Boeing 777-300ER / A380,Economy,2 x 23 kg Checked Baggage,725,35525,5,Yes,1G`;
}

/**
 * Returns sample CSV template for booking inquiries
 */
export function getBookingsSampleCsv(): string {
  return `Booking ID,Created At,Status,Origin,Destination,Airline,Flight Number,Departure Time,Arrival Time,Trip Type,Cabin Class,Contact Name,Contact WhatsApp,Contact Email,Passenger Title,Passenger First Name,Passenger Last Name,Passport Number,Passport Expiry,Nationality,Date of Birth,Total Price (USD),Total Price (EGP),Special Requests,Customer Notes
EGID-SMPL01,2026-10-15T08:00:00Z,Pending,CGK,CAI,Saudia Airlines,SV-819 + SV-301,2026-10-25T11:00:00,2026-10-25T21:15:00,One-Way,Economy,Budi Santoso,081234567890,budi@example.com,Mr,Budi,Santoso,A12345678,2031-05-10,Indonesia,1990-08-17,595,29155,Halal Meal; Student Visa,Tolong konfirmasi bagasi 2x23kg`;
}
