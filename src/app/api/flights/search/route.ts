import { NextRequest, NextResponse } from 'next/server';
import { searchGalileoFlights } from '@/lib/travelport/galileoClient';
import { FlightSearchQuery, CabinClass } from '@/lib/travelport/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const origin = searchParams.get('from')?.toUpperCase() || 'CGK';
    const destination = searchParams.get('to')?.toUpperCase() || 'CAI';
    const departureDate = searchParams.get('departureDate') || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const returnDate = searchParams.get('returnDate') || undefined;
    const tripType = (searchParams.get('tripType') as 'one-way' | 'round-trip') || 'one-way';
    const adults = Math.max(1, parseInt(searchParams.get('adults') || '1'));
    const children = Math.max(0, parseInt(searchParams.get('children') || '0'));
    const infants = Math.max(0, parseInt(searchParams.get('infants') || '0'));
    const cabinClass = (searchParams.get('cabinClass') as CabinClass) || 'Economy';

    const query: FlightSearchQuery = {
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      tripType,
      adults,
      children,
      infants,
      cabinClass,
    };

    const result = await searchGalileoFlights(query);

    return NextResponse.json({
      success: true,
      query,
      isRealGalileoApi: result.isRealGalileoApi,
      message: result.message,
      count: result.offers.length,
      offers: result.offers,
    });
  } catch (error: any) {
    console.error('Flight search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search flights from Galileo Travelport',
      },
      { status: 500 }
    );
  }
}
