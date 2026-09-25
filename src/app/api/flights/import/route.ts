import { NextRequest, NextResponse } from 'next/server';
import { csvToFlightOffers, getFlightScheduleSampleCsv } from '@/lib/csvHelper';
import { importCustomFlights } from '@/lib/storage';
import { FlightOffer } from '@/lib/travelport/types';

// GET to download template or list custom flights
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('template') === 'true') {
    const sampleCsv = getFlightScheduleSampleCsv();
    return new NextResponse(sampleCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="template_flight_schedules.csv"',
      },
    });
  }

  const { getCustomFlights } = await import('@/lib/storage');
  return NextResponse.json({ success: true, flights: getCustomFlights() });
}

// POST to upload CSV or JSON
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let offers: FlightOffer[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
      }

      const text = await file.text();
      if (file.name.endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        offers = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        offers = csvToFlightOffers(text);
      }
    } else {
      const body = await request.json();
      if (typeof body === 'string') {
        offers = csvToFlightOffers(body);
      } else if (Array.isArray(body)) {
        offers = body;
      } else if (body.csv) {
        offers = csvToFlightOffers(body.csv);
      } else if (body.flights) {
        offers = body.flights;
      }
    }

    if (!offers || offers.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid flight records could be parsed' }, { status: 400 });
    }

    const result = importCustomFlights(offers);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${offers.length} flight schedules`,
      result,
      importedFlights: offers,
    });
  } catch (error: any) {
    console.error('Flight import error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to import flights' }, { status: 500 });
  }
}
