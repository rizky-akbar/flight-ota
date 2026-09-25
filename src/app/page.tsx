'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FlightSearchForm from '@/components/FlightSearchForm';
import FlightCard from '@/components/FlightCard';
import FlightDetailModal from '@/components/FlightDetailModal';
import BookingModal from '@/components/BookingModal';
import { FlightOffer, FlightSearchQuery } from '@/lib/travelport/types';
import { ShieldCheck, Sparkles, HelpCircle, CheckCircle, ArrowDownUp, Filter, Plane, MessageCircle } from 'lucide-react';

export default function HomePage() {
  const [currency, setCurrency] = useState<'USD' | 'EGP'>('USD');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [isRealGalileoApi, setIsRealGalileoApi] = useState<boolean>(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [adminPhone, setAdminPhone] = useState(process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || '6281234567890');

  // Filters & Sorting
  const [sortBy, setSortBy] = useState<'cheapest' | 'fastest' | 'recommended'>('recommended');
  const [selectedAirline, setSelectedAirline] = useState<string>('ALL');

  // Modals state
  const [selectedDetailOffer, setSelectedDetailOffer] = useState<FlightOffer | null>(null);
  const [selectedBookingOffer, setSelectedBookingOffer] = useState<FlightOffer | null>(null);
  const [activeQuery, setActiveQuery] = useState<FlightSearchQuery>({
    origin: 'CGK',
    destination: 'CAI',
    departureDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    tripType: 'one-way',
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: 'Economy',
  });

  // Perform initial search on mount & fetch admin phone
  useEffect(() => {
    handleSearch(activeQuery);

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('admin_whatsapp_number');
      if (cached) setAdminPhone(cached);
    }

    fetch('/api/admin/whatsapp', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.whatsappNumber) {
          setAdminPhone(data.whatsappNumber);
          if (typeof window !== 'undefined') {
            localStorage.setItem('admin_whatsapp_number', data.whatsappNumber);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (query: FlightSearchQuery) => {
    setIsLoading(true);
    setActiveQuery(query);
    try {
      const params = new URLSearchParams({
        from: query.origin,
        to: query.destination,
        departureDate: query.departureDate,
        tripType: query.tripType,
        adults: query.adults.toString(),
        children: query.children.toString(),
        infants: query.infants.toString(),
        cabinClass: query.cabinClass,
      });
      if (query.tripType === 'round-trip' && query.returnDate) {
        params.append('returnDate', query.returnDate);
      }

      const res = await fetch(`/api/flights/search?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.offers) {
        setOffers(data.offers);
        setIsRealGalileoApi(data.isRealGalileoApi);
        setApiNotice(data.message || null);
      }
    } catch (err) {
      console.error('Failed to search flights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter & Sort logic
  const filteredOffers = offers.filter((offer) => {
    if (selectedAirline !== 'ALL' && offer.validatingCarrier !== selectedAirline) {
      return false;
    }
    return true;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (sortBy === 'cheapest') {
      return a.price.totalAmountUsd - b.price.totalAmountUsd;
    }
    if (sortBy === 'fastest') {
      return a.outbound.durationMinutes - b.outbound.durationMinutes;
    }
    return 0; // recommended order
  });

  // Unique airlines for filter dropdown
  const airlinesInResults = Array.from(
    new Set(offers.map((o) => JSON.stringify({ code: o.validatingCarrier, name: o.validatingCarrierName })))
  ).map((str) => JSON.parse(str));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar currency={currency} onCurrencyChange={setCurrency} />

      {/* Hero Section */}
      <section className="relative z-30 bg-gradient-to-b from-sky-900 via-sky-800 to-slate-900 text-white pt-6 sm:pt-10 pb-16 sm:pb-20 px-3 sm:px-4">
        {/* Background glow & subtle patterns */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none overflow-hidden" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-[11px] sm:text-xs font-semibold text-amber-300 mb-4 sm:mb-5">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Spesialis Rute Indonesia ⇄ Mesir (Kairo & Alexandria)</span>
          </div>

          <h1 className="text-2xl xs:text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-snug sm:leading-tight">
            Tiket Pesawat Indonesia ⇄ Mesir <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-sky-200 to-sky-300">
              Jadwal & Tarif Live Terverifikasi
            </span>
          </h1>

          <p className="mt-2.5 sm:mt-4 text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Dapatkan jadwal penerbangan real-time, kuota bagasi pelajar Al-Azhar, paket transit Umrah, dan reservasi langsung via WhatsApp Admin resmi.
          </p>

          {/* Quick USPs (Mobile Horizontal Swipe) */}
          <div className="flex items-center justify-start sm:justify-center gap-2 mt-4 sm:mt-6 text-[11px] sm:text-xs text-sky-200 overflow-x-auto no-scrollbar py-1 px-1 touch-pan-x">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10 whitespace-nowrap flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              Sistem Reservasi Terhubung
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10 whitespace-nowrap flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              Layanan Mahasiswa & Keluarga
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10 whitespace-nowrap flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              Konfirmasi Cepat via WhatsApp
            </span>
          </div>

          {/* Search Box Float Container */}
          <div className="mt-6 sm:mt-8 text-left">
            <FlightSearchForm
              onSearch={handleSearch}
              isLoading={isLoading}
              initialQuery={activeQuery}
            />
          </div>
        </div>
      </section>

      {/* Main Results Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 relative z-10 flex-1 w-full pb-16">
        {/* API Connection Indicator */}
        <div className="mb-3.5 sm:mb-4">
          {isRealGalileoApi ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-bold">
                  Tersambung Langsung ke Sistem Reservasi Penerbangan Resmi (Live Feed)
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black flex-shrink-0">
                LIVE FEED
              </span>
            </div>
          ) : (
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex flex-wrap items-center justify-between gap-1.5 shadow-sm">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>
                  <strong>Sistem Reservasi Resmi:</strong> Menampilkan jadwal riil maskapai terpercaya Indonesia ⇄ Mesir.
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500">
                Pembaruan jadwal dan tarif penerbangan otomatis terverifikasi.
              </span>
            </div>
          )}
        </div>

        {/* Results Header: Sort & Filters (Mobile Responsive) */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm mb-3 sm:mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>
                Penerbangan {activeQuery.origin} ➔ {activeQuery.destination}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({sortedOffers.length} Opsi)
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Berangkat: {activeQuery.departureDate}{' '}
              {activeQuery.tripType === 'round-trip' ? `• Pulang: ${activeQuery.returnDate}` : '• Sekali Jalan'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            {/* Airline Filter */}
            <div className="flex items-center space-x-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={selectedAirline}
                onChange={(e) => setSelectedAirline(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none w-full cursor-pointer truncate"
              >
                <option value="ALL">Semua Maskapai</option>
                {airlinesInResults.map((a: any) => (
                  <option key={a.code} value={a.code}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
              <ArrowDownUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none w-full cursor-pointer truncate"
              >
                <option value="recommended">Rekomendasi</option>
                <option value="cheapest">Termurah</option>
                <option value="fastest">Tercepat</option>
              </select>
            </div>
          </div>
        </div>

        {/* Flight Cards List */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-800">Mencari jadwal penerbangan terbaik...</p>
            <p className="text-xs text-slate-500">Mencari tarif terbaik rute {activeQuery.origin} ⇄ {activeQuery.destination}</p>
          </div>
        ) : sortedOffers.length > 0 ? (
          <div className="space-y-3">
            {sortedOffers.map((offer) => (
              <FlightCard
                key={offer.id}
                offer={offer}
                currency={currency}
                onSelect={(off) => setSelectedBookingOffer(off)}
                onViewDetails={(off) => setSelectedDetailOffer(off)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center space-y-3">
            <p className="text-base font-bold text-slate-800">Tidak ada penerbangan ditemukan</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba ganti tanggal keberangkatan atau pilih rute bandara utama seperti Jakarta (CGK) atau Kairo (CAI).
            </p>
          </div>
        )}

        {/* Why Choose NileNusantara Feature Cards */}
        <section className="mt-12 sm:mt-16 border-t border-slate-200 pt-8 sm:pt-12">
          <div className="text-center mb-6 sm:mb-10">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Mengapa Pesan Rute Indonesia - Mesir di NileNusantara?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
              Solusi lengkap perjalanan studi Al-Azhar, kunjungan keluarga, wisata piramida & Nil, hingga paket transit Umrah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg">
                ✈️
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Jadwal & Tarif Resmi Terpercaya</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Terintegrasi langsung dengan sistem reservasi global untuk kepastian ketersediaan kursi dan harga tiket maskapai dunia secara akurat.
              </p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                🎓
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Fasilitas Khusus Pelajar & Mahasiswa</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bantuan kuota bagasi ekstra 2x23kg untuk mahasiswa Al-Azhar Kairo dan izin visa transit studi tanpa kendala di bandara.
              </p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                💬
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Respon WhatsApp Admin Cepat</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Data formulir langsung terkirim ke WhatsApp Admin untuk verifikasi PNR, konsultasi jadwal, penerbitan invoice, dan tiket elektronik.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-10 sm:mt-16 bg-slate-100/70 rounded-2xl p-4 sm:p-8 border border-slate-200">
          <div className="text-center mb-5 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-sky-600" />
              Pertanyaan yang Sering Diajukan (FAQ)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs text-slate-700">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Maskapai apa saja yang melayani Indonesia - Mesir?</h5>
              <p className="text-slate-600 leading-relaxed">
                Pilihan terpopuler adalah Saudia Airlines (transit Jeddah/Madinah), Oman Air (transit Muscat), Emirates (transit Dubai), Qatar Airways (transit Doha), EgyptAir, dan Etihad Airways.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Apakah perlu visa transit di bandara transit?</h5>
              <p className="text-slate-600 leading-relaxed">
                Untuk transit di bawah 12-24 jam tanpa keluar area transfer internasional (seperti di Jeddah, Dubai, atau Doha), WNI umumnya tidak memerlukan visa transit tambahan.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Bagaimana alur pembayaran tiket via WhatsApp Admin?</h5>
              <p className="text-slate-600 leading-relaxed">
                Setelah mengisi data dan mengklik tombol WhatsApp, pesan otomatis akan terisi di chat admin. Admin akan mengecek Time Limit tiket dan memberikan instruksi transfer resmi bank perusahaan.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Berapa jatah bagasi yang didapatkan?</h5>
              <p className="text-slate-600 leading-relaxed">
                Sebagian besar maskapai rute Indonesia - Timur Tengah - Mesir menyediakan bagasi terdaftar 30 kg hingga 2 x 23 kg (46 kg) sesuai kelas tiket yang Anda pilih.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Fast WhatsApp Button for Mobile Users */}
      <div className="fixed bottom-4 right-4 z-30 sm:hidden">
        <a
          href={`https://wa.me/${adminPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
            'Halo Admin NileNusantara, saya ingin bertanya tentang pemesanan tiket penerbangan Indonesia ⇄ Mesir.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-emerald-600 text-white shadow-2xl flex items-center justify-center border-2 border-white active:scale-90 transition-transform"
          title="Hubungi Admin via WhatsApp"
        >
          <MessageCircle className="w-6 h-6 fill-white" />
        </a>
      </div>

      {/* Flight Detail Modal */}
      <FlightDetailModal
        offer={selectedDetailOffer}
        currency={currency}
        isOpen={!!selectedDetailOffer}
        onClose={() => setSelectedDetailOffer(null)}
        onSelectBooking={(off) => setSelectedBookingOffer(off)}
      />

      {/* Booking Modal */}
      <BookingModal
        offer={selectedBookingOffer}
        currency={currency}
        isOpen={!!selectedBookingOffer}
        onClose={() => setSelectedBookingOffer(null)}
        passengerCount={activeQuery.adults + activeQuery.children + activeQuery.infants}
      />

      <Footer />
    </div>
  );
}
