import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppNumber, saveWhatsAppNumber } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: NextRequest) {
  try {
    // 1. Check cookie if present from recent admin update
    const cookiePhone = request.cookies.get('admin_wa_number')?.value;

    // 2. Storage / env fallback
    const whatsappNumber = cookiePhone || getWhatsAppNumber();

    return NextResponse.json(
      {
        success: true,
        whatsappNumber,
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error: any) {
    console.error('Failed to get WhatsApp number:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get WhatsApp number' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawNumber =
      body.whatsappNumber ?? body.phoneNumber ?? body.phone ?? body.number;

    if (!rawNumber || typeof rawNumber !== 'string' || !rawNumber.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp wajib diisi' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const savedNumber = saveWhatsAppNumber(rawNumber);

    const response = NextResponse.json(
      {
        success: true,
        whatsappNumber: savedNumber,
        message: 'Nomor WhatsApp Admin berhasil diperbarui!',
      },
      {
        headers: NO_CACHE_HEADERS,
      }
    );

    // Set 1-year cookie so both client and serverless runtime have instant access
    response.cookies.set({
      name: 'admin_wa_number',
      value: savedNumber,
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error('Failed to update WhatsApp number:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update WhatsApp number' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
