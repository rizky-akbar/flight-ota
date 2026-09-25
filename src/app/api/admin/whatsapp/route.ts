import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppNumber, saveWhatsAppNumber } from '@/lib/storage';

export async function GET() {
  try {
    const whatsappNumber = getWhatsAppNumber();
    return NextResponse.json({
      success: true,
      whatsappNumber,
    });
  } catch (error: any) {
    console.error('Failed to get WhatsApp number:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get WhatsApp number' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { whatsappNumber } = body;

    if (!whatsappNumber || typeof whatsappNumber !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp wajib diisi' },
        { status: 400 }
      );
    }

    const savedNumber = saveWhatsAppNumber(whatsappNumber);

    return NextResponse.json({
      success: true,
      whatsappNumber: savedNumber,
      message: 'Nomor WhatsApp Admin berhasil diperbarui!',
    });
  } catch (error: any) {
    console.error('Failed to update WhatsApp number:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update WhatsApp number' },
      { status: 500 }
    );
  }
}
