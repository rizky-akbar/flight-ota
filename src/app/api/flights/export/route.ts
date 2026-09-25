import { NextRequest, NextResponse } from 'next/server';
import { searchGalileoFlights } from '@/lib/travelport/galileoClient';
import { flightOffersToCsv } from '@/lib/csvHelper';
import { FlightSearchQuery } from '@/lib/travelport/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('from')?.toUpperCase() || 'CGK';
    const destination = searchParams.get('to')?.toUpperCase() || 'CAI';
    const departureDate = searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
    const tripType = (searchParams.get('tripType') as any) || 'one-way';
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    const query: FlightSearchQuery = {
      origin,
      destination,
      departureDate,
      tripType,
      adults: 1,
      children: 0,
      infants: 0,
      cabinClass: 'Economy',
    };

    const { offers } = await searchGalileoFlights(query);

    const filename = `flights_${origin}_${destination}_${departureDate}.${format}`;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(offers, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Default CSV
    const csvData = flightOffersToCsv(offers);
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
