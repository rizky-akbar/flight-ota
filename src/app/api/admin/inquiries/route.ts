import { NextRequest, NextResponse } from 'next/server';
import { getAllInquiries, updateInquiryStatus } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const inquiries = getAllInquiries();
    return NextResponse.json({
      success: true,
      count: inquiries.length,
      inquiries,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: 'bookingId and status are required' },
        { status: 400 }
      );
    }

    const updated = updateInquiryStatus(bookingId, status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      inquiry: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
