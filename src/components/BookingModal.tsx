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

  const egpPrice = offer.price.totalAmountEgp || Math.round(offer.price.totalAmountUsd * 49.0);
  const formattedPrice = currency === 'EGP'
    ? `EGP ${egpPrice.toLocaleString()} (~$${offer.price.totalAmountUsd.toLocaleString()} USD)`
    : `$${offer.price.totalAmountUsd.toLocaleString()} USD (~EGP ${egpPrice.toLocaleString()})`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Plane className="w-5 h-5 text-amber-400 -rotate-45" />
              <h3 className="font-black text-lg text-white">
                {submittedData ? 'Data Berhasil Dikirim!' : 'Formulir Pemesanan & WhatsApp Admin'}
              </h3>
            </div>
            <p className="text-xs text-sky-200">
              {offer.validatingCarrierName} • {offer.outbound.origin} ➔ {offer.outbound.destination}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {submittedData ? (
            /* STEP 2: WHATSAPP SUCCESS SCREEN */
            <div className="space-y-6 text-center py-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900">Reservasi Disiapkan!</h4>
                <div className="inline-block mt-2 px-3.5 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono text-sm font-bold text-slate-800">
                  Kode Booking: #{submittedData.bookingId}
                </div>
                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                  Data penumpang Anda telah tercatat. Silakan klik tombol di bawah untuk langsung terhubung dengan WhatsApp Admin resmi kami untuk konfirmasi kode booking (PNR) dan pembayaran.
                </p>
              </div>

              {/* Main CTA: Big WhatsApp Button */}
              <div className="max-w-md mx-auto space-y-3">
                <a
                  href={submittedData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-xl hover:shadow-emerald-600/30 flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-6 h-6 fill-white" />
                  <span>Kirim Data ke WhatsApp Admin</span>
                </a>

                <div className="flex items-center justify-center space-x-3">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-2 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Teks WhatsApp'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code Section for Desktop Users */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-center">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-sky-600" />
                  <span>Buka di Ponsel? Scan QR Code WhatsApp</span>
                </div>
                <div className="bg-white p-3 rounded-lg inline-block shadow-sm border border-slate-100">
                  <QRCodeSVG value={submittedData.whatsappUrl} size={150} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Arahkan kamera HP ke QR Code untuk langsung membuka chat WhatsApp dengan admin.
                </p>
              </div>

              {/* WhatsApp Message Preview */}
              <div className="text-left bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                {submittedData.whatsappMessage}
              </div>
            </div>
          ) : (
            /* STEP 1: FILL FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Flight Summary Card */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-sky-900 block text-sm">
                    {offer.validatingCarrierName} ({offer.validatingCarrier})
                  </span>
                  <span className="text-sky-700">
                    {offer.outbound.origin} ➔ {offer.outbound.destination} • {offer.cabinClass} • {offer.baggageSummary}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-sky-600 block">Total Estimasi</span>
                  <span className="text-base font-black text-sky-900">{formattedPrice}</span>
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-sky-600" />
                  <h4 className="font-bold text-sm text-slate-900">Data Pemesan (Kontak Utama)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Nama Lengkap Pemesan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Rizky"
                      value={contact.fullName}
                      onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Nomor WhatsApp Aktif *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890 / +62..."
                      value={contact.phoneNumber}
                      onChange={(e) => setContact({ ...contact, phoneNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                    <span className="text-[10px] text-slate-400">Admin akan mengirim PNR & invoice ke nomor ini</span>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Alamat Email (Opsional)
                    </label>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Passenger Manifest */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <Plane className="w-4 h-4 text-sky-600" />
                    <h4 className="font-bold text-sm text-slate-900">Data Penumpang ({passengers.length} Pax)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="text-xs font-bold text-sky-700 hover:text-sky-800"
                  >
                    + Tambah Penumpang
                  </button>
                </div>

                {passengers.map((pax, index) => (
                  <div key={pax.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Penumpang {index + 1}</span>
                      {passengers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassenger(index)}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Gelar</label>
                        <select
                          value={pax.title}
                          onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                        >
                          <option value="Mr">Mr (Tuan)</option>
                          <option value="Mrs">Mrs (Nyonya)</option>
                          <option value="Ms">Ms (Nona)</option>
                          <option value="Mstr">Mstr (Anak L)</option>
                          <option value="Miss">Miss (Anak P)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nama Depan *</label>
                        <input
                          type="text"
                          required
                          placeholder="Sesuai Paspor"
                          value={pax.firstName}
                          onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        >
                        </input>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nama Belakang *</label>
                        <input
                          type="text"
                          required
                          placeholder="Sesuai Paspor"
                          value={pax.lastName}
                          onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        >
                        </input>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nomor Paspor</label>
                        <input
                          type="text"
                          placeholder="Contoh: A12345678"
                          value={pax.passportNumber}
                          onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs uppercase"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Masa Berlaku Paspor</label>
                        <input
                          type="date"
                          value={pax.passportExpiry}
                          onChange={(e) => handlePassengerChange(index, 'passportExpiry', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kewarganegaraan</label>
                        <select
                          value={pax.nationality}
                          onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
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
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Permintaan Khusus & Bantuan Khusus Rute Mesir
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pilihan Makanan</label>
                    <select
                      value={specialRequests.mealPreference}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, mealPreference: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    >
                      <option value="Muslim / Halal Meal (MOML)">Halal / Muslim Meal (MOML)</option>
                      <option value="Vegetarian Meal (VGML)">Vegetarian (VGML)</option>
                      <option value="Diabetic Meal (DBML)">Diabetic (DBML)</option>
                      <option value="Standard Airline Meal">Standar Maskapai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tambahan Bagasi</label>
                    <select
                      value={specialRequests.extraBaggage}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, extraBaggage: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    >
                      <option value="No Extra Baggage">Sesuai Tiket (Termasuk)</option>
                      <option value="+5 kg Bagasi">+5 kg Ekstra</option>
                      <option value="+10 kg Bagasi">+10 kg Ekstra</option>
                      <option value="+1 Piece (23 kg)">+1 Koli Tambahan (23 kg)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/80 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={specialRequests.studentVisaAssistance}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, studentVisaAssistance: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-slate-700">
                      Bantuan Pelajar Al-Azhar Kairo (Keringanan Bagasi / Visa Pelajar)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={specialRequests.umrahTransitPackage}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, umrahTransitPackage: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-slate-700">
                      Paket Transit Umrah (Stopover Jeddah / Madinah sebelum ke Kairo)
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={specialRequests.wheelchair}
                      onChange={(e) => setSpecialRequests({ ...specialRequests, wheelchair: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-slate-700">Bantuan Kursi Roda (Wheelchair Assistance)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Catatan Tambahan untuk Admin</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Mohon cari kursi dekat lorong, transit jangan terlalu mepet..."
                    value={contact.notes}
                    onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Pembayaran Estimasi</span>
                  <span className="text-xl font-black text-sky-800">{formattedPrice}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan Reservasi...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>Lanjut ke WhatsApp Admin</span>
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
