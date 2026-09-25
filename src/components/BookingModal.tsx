'use client';

import React, { useState } from 'react';
import { X, MessageCircle, Copy, Check, QrCode, Plane, User, Phone, Mail, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FlightOffer, PassengerDetails, ContactDetails } from '@/lib/travelport/types';

interface BookingModalProps {
  offer: FlightOffer | null;
  currency: 'USD' | 'EGP';
  isOpen: boolean;
  onClose: () => void;
  passengerCount?: number;
}

export default function BookingModal({
  offer,
  currency,
  isOpen,
  onClose,
  passengerCount = 1,
}: BookingModalProps) {
  if (!isOpen || !offer) return null;

  // Contact person state
  const [contact, setContact] = useState<ContactDetails>({
    fullName: '',
    email: '',
    phoneNumber: '',
    notes: '',
  });

  // Passengers list state
  const [passengers, setPassengers] = useState<PassengerDetails[]>(() => {
    const list: PassengerDetails[] = [];
    const count = Math.max(1, passengerCount);
    for (let i = 0; i < count; i++) {
      list.push({
        id: `pax-${i + 1}`,
        title: 'Mr',
        firstName: '',
        lastName: '',
        type: 'ADT',
        passportNumber: '',
        passportExpiry: '',
        nationality: 'Indonesia',
        dateOfBirth: '',
      });
    }
    return list;
  });

  // Special requests state
  const [specialRequests, setSpecialRequests] = useState({
    mealPreference: 'Muslim / Halal Meal (MOML)',
    extraBaggage: 'No Extra Baggage',
    wheelchair: false,
    studentVisaAssistance: false,
    umrahTransitPackage: false,
  });

  // Flow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedData, setSubmittedData] = useState<{
    bookingId: string;
    whatsappUrl: string;
    whatsappMessage: string;
    adminPhone: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form field changes
  const handlePassengerChange = (index: number, field: keyof PassengerDetails, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      {
        id: `pax-${passengers.length + 1}`,
        title: 'Mr',
        firstName: '',
        lastName: '',
        type: 'ADT',
        passportNumber: '',
        passportExpiry: '',
        nationality: 'Indonesia',
        dateOfBirth: '',
      },
    ]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Simple validation
    if (!contact.fullName || !contact.phoneNumber) {
      setErrorMsg('Mohon isi nama lengkap dan nomor WhatsApp kontak aktif.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightOffer: offer,
          contact,
          passengers,
          specialRequests,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengirim data booking');
      }

      setSubmittedData({
        bookingId: data.bookingId,
        whatsappUrl: data.whatsappUrl,
        whatsappMessage: data.whatsappMessage,
        adminPhone: data.adminPhone,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyMessage = () => {
    if (!submittedData?.whatsappMessage) return;
    navigator.clipboard.writeText(submittedData.whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const egpPrice = offer.price.totalAmountEgp || Math.round(offer.price.totalAmountUsd * 51.70);
  const formattedPrice = currency === 'EGP'
    ? `EGP ${egpPrice.toLocaleString()} (~$${offer.price.totalAmountUsd.toLocaleString()} USD)`
    : `$${offer.price.totalAmountUsd.toLocaleString()} USD (~EGP ${egpPrice.toLocaleString()})`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="pr-2">
            <div className="flex items-center space-x-2">
              <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 -rotate-45 flex-shrink-0" />
              <h3 className="font-extrabold text-sm sm:text-lg text-white">
                {submittedData ? 'Data Berhasil Terkirim!' : 'Formulir Pemesanan Tiket'}
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-sky-200 truncate mt-0.5">
              {offer.validatingCarrierName} • {offer.outbound.origin} ➔ {offer.outbound.destination}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center flex-shrink-0 active:scale-95"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[80vh] sm:max-h-[75vh] overflow-y-auto">
          {submittedData ? (
            /* STEP 2: WHATSAPP SUCCESS SCREEN */
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div>
                <h4 className="text-lg sm:text-xl font-black text-slate-900">Reservasi Telah Siap!</h4>
                <div className="inline-block mt-2 px-3 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-800">
                  Kode Booking: #{submittedData.bookingId}
                </div>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Data Anda telah dicatat di sistem. Klik tombol hijau di bawah untuk langsung membuka WhatsApp Admin kami guna verifikasi PNR dan pembayaran.
                </p>
              </div>

              {/* Main CTA: Big WhatsApp Button */}
              <div className="max-w-md mx-auto space-y-3">
                <a
                  href={submittedData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-xl hover:shadow-emerald-600/30 flex items-center justify-center space-x-2.5 transition-all transform active:scale-98"
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white flex-shrink-0" />
                  <span>Kirim Data ke WhatsApp Admin</span>
                </a>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition-colors active:scale-95"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    <span>{copied ? 'Teks WhatsApp Tersalin!' : 'Salin Pesan Teks'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code Section for Desktop Only */}
              <div className="hidden sm:block p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-center">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-sky-600" />
                  <span>Buka di Ponsel? Scan QR Code</span>
                </div>
                <div className="bg-white p-3 rounded-lg inline-block shadow-sm border border-slate-100">
                  <QRCodeSVG value={submittedData.whatsappUrl} size={140} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Arahkan kamera HP ke QR Code untuk langsung membuka chat WhatsApp dengan admin.
                </p>
              </div>

              {/* WhatsApp Message Preview */}
              <div className="text-left bg-slate-900 text-slate-200 p-3 sm:p-4 rounded-xl text-[11px] sm:text-xs font-mono max-h-36 sm:max-h-48 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                {submittedData.whatsappMessage}
              </div>
            </div>
          ) : (
            /* STEP 1: FILL FORM */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Flight Summary Card */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-extrabold text-sky-900 block text-xs sm:text-sm">
                    {offer.validatingCarrierName} ({offer.validatingCarrier})
                  </span>
                  <span className="text-sky-700 text-[11px] sm:text-xs">
                    {offer.outbound.origin} ➔ {offer.outbound.destination} • {offer.cabinClass} • {offer.baggageSummary}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-sky-600 block">Total Tarif</span>
                  <span className="text-sm sm:text-base font-black text-sky-900">{formattedPrice}</span>
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-1.5">
                  <User className="w-4 h-4 text-sky-600" />
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">Data Pemesan (Kontak Utama)</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Nama Lengkap Pemesan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Rizky"
                      value={contact.fullName}
                      onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Nomor WhatsApp Aktif *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={contact.phoneNumber}
                      onChange={(e) => setContact({ ...contact, phoneNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all min-h-[40px]"
                    />
                    <span className="text-[10px] text-slate-400">Admin akan mengirim PNR ke nomor ini</span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Alamat Email (Opsional)
                    </label>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Passenger Manifest */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <Plane className="w-4 h-4 text-sky-600" />
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">Data Penumpang ({passengers.length} Pax)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="text-xs font-bold text-sky-700 hover:text-sky-800 active:scale-95"
                  >
                    + Tambah Pax
                  </button>
                </div>

                {passengers.map((pax, index) => (
                  <div key={pax.id} className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Penumpang {index + 1}</span>
                      {passengers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassenger(index)}
                          className="text-[11px] text-red-600 font-semibold hover:underline"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Gelar</label>
                        <select
                          value={pax.title}
                          onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold min-h-[38px]"
                        >
                          <option value="Mr">Mr (Tuan)</option>
                          <option value="Mrs">Mrs (Nyonya)</option>
                          <option value="Ms">Ms (Nona)</option>
                          <option value="Mstr">Mstr (Anak L)</option>
                          <option value="Miss">Miss (Anak P)</option>
                        </select>
                      </div>

                      <div className="col-span-1 sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama Depan *</label>
                        <input
                          type="text"
                          required
                          placeholder="Sesuai Paspor"
                          value={pax.firstName}
                          onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 min-h-[38px]"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama Belakang *</label>
                        <input
                          type="text"
                          required
                          placeholder="Sesuai Paspor"
                          value={pax.lastName}
                          onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 min-h-[38px]"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nomor Paspor</label>
                        <input
                          type="text"
                          placeholder="A12345678"
                          value={pax.passportNumber}
                          onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs uppercase min-h-[38px]"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Masa Berlaku Paspor</label>
                        <input
                          type="date"
                          value={pax.passportExpiry}
                          onChange={(e) => handlePassengerChange(index, 'passportExpiry', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs min-h-[38px]"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Kewarganegaraan</label>
                        <select
                          value={pax.nationality}
                          onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs min-h-[38px]"
                        >
                          <option value="Indonesia">Indonesia</option>
                          <option value="Egypt">Egypt (Mesir)</option>
                          <option value="Malaysia">Malaysia</option>
                          <option value="Saudi Arabia">Saudi Arabia</option>
                          <option value="Other">Lainnya</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Requests & Services */}
              <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-[11px] sm:text-xs text-slate-800 uppercase tracking-wider">
                  Permintaan Khusus Rute Mesir
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Pilihan Makanan</label>
                    <select
                      value={specialRequests.mealPreference}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, mealPreference: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs min-h-[38px]"
                    >
                      <option value="Muslim / Halal Meal (MOML)">Halal / Muslim Meal (MOML)</option>
                      <option value="Vegetarian Meal (VGML)">Vegetarian (VGML)</option>
                      <option value="Diabetic Meal (DBML)">Diabetic (DBML)</option>
                      <option value="Standard Airline Meal">Standar Maskapai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Tambahan Bagasi</label>
                    <select
                      value={specialRequests.extraBaggage}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, extraBaggage: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs min-h-[38px]"
                    >
                      <option value="No Extra Baggage">Sesuai Tiket (Termasuk)</option>
                      <option value="+5 kg Bagasi">+5 kg Ekstra</option>
                      <option value="+10 kg Bagasi">+10 kg Ekstra</option>
                      <option value="+1 Piece (23 kg)">+1 Koli Tambahan (23 kg)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/80 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={specialRequests.studentVisaAssistance}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, studentVisaAssistance: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <span className="text-slate-700 text-[11px] sm:text-xs">
                      Bantuan Pelajar Al-Azhar Kairo (Keringanan Bagasi & Dokumen)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={specialRequests.umrahTransitPackage}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, umrahTransitPackage: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <span className="text-slate-700 text-[11px] sm:text-xs">
                      Paket Transit Umrah (Stopover Jeddah / Madinah)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={specialRequests.wheelchair}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, wheelchair: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                    />
                    <span className="text-slate-700 text-[11px] sm:text-xs">Bantuan Kursi Roda (Wheelchair)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Catatan Tambahan untuk Admin</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Mohon cari kursi dekat lorong, info jadwal transit..."
                    value={contact.notes}
                    onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Submit CTA Bar (Mobile friendly flex) */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex sm:block justify-between items-baseline">
                  <span className="text-[11px] text-slate-500 block">Total Estimasi:</span>
                  <span className="text-lg sm:text-xl font-black text-sky-800">{formattedPrice}</span>
                </div>

                <div className="grid grid-cols-3 sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="col-span-1 sm:col-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors text-center active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="col-span-2 sm:col-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-60 active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 fill-white flex-shrink-0" />
                        <span>Kirim ke WA Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
