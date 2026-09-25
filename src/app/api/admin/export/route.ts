import { NextRequest, NextResponse } from 'next/server';
import { getAllInquiries } from '@/lib/storage';
import { bookingsToCsv } from '@/lib/csvHelper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const inquiries = getAllInquiries();

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `bookings_manifest_${dateStr}.${format}`;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(inquiries, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const csvData = bookingsToCsv(inquiries);
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
