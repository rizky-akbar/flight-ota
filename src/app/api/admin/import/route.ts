import { NextRequest, NextResponse } from 'next/server';
import { parseCsv, getBookingsSampleCsv } from '@/lib/csvHelper';
import { importInquiries } from '@/lib/storage';
import { BookingInquiry, FlightOffer } from '@/lib/travelport/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('template') === 'true') {
    const sampleCsv = getBookingsSampleCsv();
    return new NextResponse(sampleCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="template_bookings.csv"',
      },
    });
  }

  return NextResponse.json({ success: true, message: 'Use POST to import bookings or ?template=true to download template' });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let inquiries: BookingInquiry[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
      }

      const text = await file.text();
      if (file.name.endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        inquiries = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        inquiries = csvToBookings(text);
      }
    } else {
      const body = await request.json();
      if (Array.isArray(body)) {
        inquiries = body;
      } else if (body.csv) {
        inquiries = csvToBookings(body.csv);
      } else if (body.inquiries) {
        inquiries = body.inquiries;
      }
    }

    if (!inquiries || inquiries.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid booking records found' }, { status: 400 });
    }

    const result = importInquiries(inquiries);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${inquiries.length} booking records`,
      result,
    });
  } catch (error: any) {
    console.error('Bookings import error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to import bookings' }, { status: 500 });
  }
}

function csvToBookings(csvText: string): BookingInquiry[] {
  const records = parseCsv(csvText);
  const map = new Map<string, BookingInquiry>();

  records.forEach((rec, idx) => {
    const bookingId = rec['Booking ID'] || `EGID-IMP-${idx + 1}`;
    const origin = rec['Origin'] || 'CGK';
    const destination = rec['Destination'] || 'CAI';
    const airline = rec['Airline'] || 'Saudia Airlines';
    const flightNum = rec['Flight Number'] || 'SV-819';
    const depTime = rec['Departure Time'] || new Date().toISOString();
    const arrTime = rec['Arrival Time'] || new Date().toISOString();
    const status = (rec['Status'] as any) || 'Pending';
    const priceUsd = parseInt(rec['Total Price (USD)']) || parseInt(rec['Price (USD)']) || (parseInt(rec['Total Price (EGP)']) ? Math.round(parseInt(rec['Total Price (EGP)']) / 49.0) : 590);
    const priceEgp = parseInt(rec['Total Price (EGP)']) || parseInt(rec['Price (EGP)']) || Math.round(priceUsd * 49.0);
    const priceIdr = parseInt(rec['Total Price (IDR)']) || Math.round(priceUsd * 15850);

    const passenger = {
      id: `pax-${idx + 1}`,
      title: (rec['Passenger Title'] as any) || 'Mr',
      firstName: rec['Passenger First Name'] || 'Passenger',
      lastName: rec['Passenger Last Name'] || '',
      type: 'ADT' as const,
      passportNumber: rec['Passport Number'] || '',
      passportExpiry: rec['Passport Expiry'] || '',
      nationality: rec['Nationality'] || 'Indonesia',
      dateOfBirth: rec['Date of Birth'] || '',
    };

    if (map.has(bookingId)) {
      map.get(bookingId)!.passengers.push(passenger);
    } else {
      const flightOffer: FlightOffer = {
        id: `OFFER-${bookingId}`,
        source: 'Galileo-Live',
        providerCode: '1G',
        validatingCarrier: 'SV',
        validatingCarrierName: airline,
        cabinClass: (rec['Cabin Class'] as any) || 'Economy',
        seatsRemaining: 5,
        baggageSummary: '2 x 23 kg Checked Baggage',
        refundable: true,
        price: {
          currency: 'USD',
          totalAmountUsd: priceUsd,
          totalAmountEgp: priceEgp,
          baseFareUsd: Math.round(priceUsd * 0.85),
          baseFareEgp: Math.round(priceEgp * 0.85),
          taxAndFeesUsd: Math.round(priceUsd * 0.15),
          taxAndFeesEgp: Math.round(priceEgp * 0.15),
          totalAmountIdr: priceIdr,
          baseFareIdr: Math.round(priceIdr * 0.85),
          taxAndFeesIdr: Math.round(priceIdr * 0.15),
        },
        outbound: {
          origin,
          destination,
          departureTime: depTime,
          arrivalTime: arrTime,
          durationMinutes: 600,
          stops: 1,
          stopAirports: ['JED'],
          segments: [
            {
              carrierCode: 'SV',
              carrierName: airline,
              flightNumber: flightNum,
              origin,
              destination,
              departureTime: depTime,
              arrivalTime: arrTime,
              durationMinutes: 600,
              baggageAllowance: '2 x 23 kg',
            },
          ],
        },
      };

      map.set(bookingId, {
        bookingId,
        createdAt: rec['Created At'] || new Date().toISOString(),
        status,
        flightOffer,
        contact: {
          fullName: rec['Contact Name'] || `${passenger.firstName} ${passenger.lastName}`,
          phoneNumber: rec['Contact WhatsApp'] || '',
          email: rec['Contact Email'] || '',
          notes: rec['Customer Notes'] || '',
        },
        passengers: [passenger],
        totalEstimatedPriceUsd: priceUsd,
        totalEstimatedPriceEgp: priceEgp,
        totalEstimatedPriceIdr: priceIdr,
      });
    }
  });

  return Array.from(map.values());
}
