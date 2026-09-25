import { NextRequest, NextResponse } from 'next/server';
import { generateBookingId, saveInquiry, getWhatsAppNumber } from '@/lib/storage';
import { formatWhatsAppMessage, buildWhatsAppAdminUrl } from '@/lib/whatsapp';
import { BookingInquiry } from '@/lib/travelport/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightOffer, contact, passengers, specialRequests } = body;

    if (!flightOffer || !contact || !contact.fullName || !contact.phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Flight offer, contact name, and WhatsApp number are required' },
        { status: 400 }
      );
    }

    const bookingId = generateBookingId();
    const cookiePhone = request.cookies.get('admin_wa_number')?.value;
    const adminPhone = cookiePhone || getWhatsAppNumber();

    const booking: BookingInquiry = {
      bookingId,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      flightOffer,
      contact,
      passengers: passengers && passengers.length > 0 ? passengers : [
        {
          id: 'pax-1',
          title: 'Mr',
          firstName: contact.fullName.split(' ')[0] || 'Passenger',
          lastName: contact.fullName.split(' ').slice(1).join(' ') || '',
          type: 'ADT',
          passportNumber: '',
          passportExpiry: '',
          nationality: 'Indonesia',
          dateOfBirth: '',
        }
      ],
      specialRequests,
      totalEstimatedPriceUsd: flightOffer.price?.totalAmountUsd || 0,
      totalEstimatedPriceEgp: flightOffer.price?.totalAmountEgp || Math.round((flightOffer.price?.totalAmountUsd || 0) * 49.0),
      totalEstimatedPriceIdr: flightOffer.price?.totalAmountIdr || 0,
    };

    // Save inquiry to persistent storage
    saveInquiry(booking);

    // Build WhatsApp message & direct URL
    const whatsappMessage = formatWhatsAppMessage(booking);
    const whatsappUrl = buildWhatsAppAdminUrl(adminPhone, booking);

    return NextResponse.json({
      success: true,
      bookingId,
      booking,
      whatsappUrl,
      whatsappMessage,
      adminPhone,
    });
  } catch (error: any) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process booking inquiry' },
      { status: 500 }
    );
  }
}
