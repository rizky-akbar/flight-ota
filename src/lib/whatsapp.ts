import { BookingInquiry } from './travelport/types';

/**
 * Formats a phone number for WhatsApp wa.me links
 * e.g. "+62 812-3456-7890" -> "6281234567890"
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Builds a beautifully formatted WhatsApp text message for the admin
 */
export function formatWhatsAppMessage(booking: BookingInquiry): string {
  const { flightOffer, contact, passengers, bookingId, specialRequests, totalEstimatedPriceUsd, totalEstimatedPriceEgp } = booking;
  const outbound = flightOffer.outbound;
  const inbound = flightOffer.inbound;

  const isRoundTrip = !!inbound;
  const egpAmount = totalEstimatedPriceEgp || Math.round(totalEstimatedPriceUsd * 49.0);
  const formattedUsd = `$${totalEstimatedPriceUsd.toLocaleString()}`;
  const formattedEgp = `EGP ${egpAmount.toLocaleString()}`;

  const outboundSegmentsText = outbound.segments.map((seg, idx) => {
    return `   ├ Leg ${idx + 1}: *${seg.flightNumber}* (${seg.carrierName})
   │   ${seg.origin} (${formatTime(seg.departureTime)}) ➔ ${seg.destination} (${formatTime(seg.arrivalTime)})
   │   Transit/Equip: ${seg.aircraft || 'Commercial Jet'}`;
  }).join('\n');

  let inboundSegmentsText = '';
  if (inbound) {
    inboundSegmentsText = `\n🔄 *RETURN FLIGHT:*
${inbound.segments.map((seg, idx) => {
  return `   ├ Leg ${idx + 1}: *${seg.flightNumber}* (${seg.carrierName})
   │   ${seg.origin} (${formatTime(seg.departureTime)}) ➔ ${seg.destination} (${formatTime(seg.arrivalTime)})
   │   Transit/Equip: ${seg.aircraft || 'Commercial Jet'}`;
}).join('\n')}`;
  }

  const passengersListText = passengers.map((p, idx) => {
    return `${idx + 1}. *${p.title}. ${p.firstName} ${p.lastName}*
   • Passport: \`${p.passportNumber || 'N/A'}\` (Exp: ${p.passportExpiry || 'N/A'})
   • Nationality: ${p.nationality || 'Indonesia'} | DOB: ${p.dateOfBirth || 'N/A'}`;
  }).join('\n');

  const specialList: string[] = [];
  if (specialRequests?.extraBaggage) specialList.push(`Extra Baggage: ${specialRequests.extraBaggage}`);
  if (specialRequests?.mealPreference) specialList.push(`Meal: ${specialRequests.mealPreference}`);
  if (specialRequests?.wheelchair) specialList.push(`Wheelchair Assistance`);
  if (specialRequests?.studentVisaAssistance) specialList.push(`Student/Al-Azhar Visa Assistance`);
  if (specialRequests?.umrahTransitPackage) specialList.push(`Umrah / Transit Visa Package`);

  const specialText = specialList.length > 0 ? specialList.map(s => `• ${s}`).join('\n') : 'None';

  const message = `🛫 *BOOKING INQUIRY FLIGHT INDONESIA ⇄ EGYPT* 🛬
*Booking Reference:* #${bookingId}
*Layanan:* NileNusantara Official Booking
*Date:* ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
═══════════════════════════

📋 *TRIP SUMMARY:*
• *Route:* ${outbound.origin} ⇄ ${outbound.destination} (${isRoundTrip ? 'Round-Trip' : 'One-Way'})
• *Airline:* ${flightOffer.validatingCarrierName} (${flightOffer.validatingCarrier})
• *Cabin Class:* ${flightOffer.cabinClass}
• *Baggage:* ${flightOffer.baggageSummary}

✈️ *OUTBOUND FLIGHT:*
${outboundSegmentsText}
${inboundSegmentsText}

═══════════════════════════
👥 *PASSENGER MANIFEST (${passengers.length} Pax):*
${passengersListText}

👤 *CONTACT PERSON:*
• *Name:* ${contact.fullName}
• *WhatsApp:* ${contact.phoneNumber}
• *Email:* ${contact.email}
${contact.notes ? `• *Customer Note:* "${contact.notes}"` : ''}

🎁 *SPECIAL REQUESTS & ADD-ONS:*
${specialText}

═══════════════════════════
💰 *ESTIMATED TOTAL FARE:*
*${formattedUsd}* (~${formattedEgp} / ج.م)
═══════════════════════════
_Mohon konfirmasi ketersediaan kursi, batas waktu reservasi (Time Limit PNR), dan detail invoice pembayaran._`;

  return message;
}

/**
 * Builds the direct https://wa.me URL for the WhatsApp admin
 */
export function buildWhatsAppAdminUrl(adminNumber: string, booking: BookingInquiry): string {
  const sanitizedAdmin = sanitizeWhatsAppNumber(adminNumber);
  const message = formatWhatsAppMessage(booking);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${sanitizedAdmin}?text=${encodedMessage}`;
}

function formatTime(isoOrTime: string): string {
  if (!isoOrTime) return '';
  if (isoOrTime.includes('T')) {
    const parts = isoOrTime.split('T');
    return `${parts[0]} ${parts[1].substring(0, 5)}`;
  }
  return isoOrTime;
}
