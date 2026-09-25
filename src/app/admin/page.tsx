'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plane, ArrowLeft, MessageCircle, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle, Phone, Mail, User, ShieldCheck, Download, Upload } from 'lucide-react';
import { BookingInquiry } from '@/lib/travelport/types';
import ImportExportModal from '@/components/ImportExportModal';
import AdminMarkupPanel from '@/components/AdminMarkupPanel';
import AdminWhatsAppPanel from '@/components/AdminWhatsAppPanel';
import AdminCurrencyPanel from '@/components/AdminCurrencyPanel';

export default function AdminPage() {
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedInquiry, setSelectedInquiry] = useState<BookingInquiry | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState<boolean>(false);
  const [importExportType, setImportExportType] = useState<'bookings' | 'flights'>('bookings');

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/inquiries');
      const data = await res.json();
      if (data.success && data.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleUpdateStatus = async (bookingId: string, status: BookingInquiry['status']) => {
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setInquiries(inquiries.map((i) => (i.bookingId === bookingId ? data.inquiry : i)));
        if (selectedInquiry?.bookingId === bookingId) {
          setSelectedInquiry(data.inquiry);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (filterStatus === 'ALL') return true;
    return inq.status === filterStatus;
  });

  const getStatusBadge = (status: BookingInquiry['status']) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Menunggu</span>;
      case 'Contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">Dihubungi</span>;
      case 'Confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Dikonfirmasi</span>;
      case 'Ticketed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Tiket Terbit</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">Dibatalkan</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Web OTA</span>
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2">
                <span>Dashboard Admin Reservasi</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-600 text-white">Portal Resmi</span>
              </h1>
              <p className="text-xs text-slate-400">Pemesanan Rute Indonesia ⇄ Mesir</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Flight Inventory Export/Import Button */}
            <button
              onClick={() => {
                setImportExportType('flights');
                setIsImportExportOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-700 hover:bg-sky-600 text-white shadow transition-colors"
              title="Kelola & Ekspor / Impor Jadwal Tiket Penerbangan (CSV/JSON)"
            >
              <Plane className="w-3.5 h-3.5 text-sky-200" />
              <span>Flight Inventory</span>
            </button>

            {/* Bookings Manifest Export/Import Button */}
            <button
              onClick={() => {
                setImportExportType('bookings');
                setIsImportExportOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow transition-colors"
              title="Ekspor Manifes Penumpang & Laporan Reservasi (Excel/CSV/JSON)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>Data Reservasi</span>
            </button>

            <button
              onClick={fetchInquiries}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        {/* WhatsApp Admin Desk Configuration Card */}
        <AdminWhatsAppPanel />

        {/* Real-time PayPal Currency Exchange Rate Engine */}
        <AdminCurrencyPanel onRateUpdated={() => fetchInquiries()} />

        {/* Markup Pricing Control Panel */}
        <AdminMarkupPanel onMarkupUpdated={fetchInquiries} />

        {/* Status Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div
            onClick={() => setFilterStatus('ALL')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'ALL' ? 'bg-sky-50 border-sky-400 shadow-sm' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-xs text-slate-500 font-semibold">Total Semua</div>
            <div className="text-2xl font-black text-slate-900">{inquiries.length}</div>
          </div>
          <div
            onClick={() => setFilterStatus('Pending')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'Pending' ? 'bg-amber-50 border-amber-400 shadow-sm' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-xs text-amber-600 font-semibold">Menunggu (Pending)</div>
            <div className="text-2xl font-black text-amber-700">
              {inquiries.filter((i) => i.status === 'Pending').length}
            </div>
          </div>
          <div
            onClick={() => setFilterStatus('Contacted')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'Contacted' ? 'bg-sky-50 border-sky-400 shadow-sm' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-xs text-sky-600 font-semibold">Sedang Dihubungi</div>
            <div className="text-2xl font-black text-sky-700">
              {inquiries.filter((i) => i.status === 'Contacted').length}
            </div>
          </div>
          <div
            onClick={() => setFilterStatus('Ticketed')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'Ticketed' ? 'bg-emerald-50 border-emerald-400 shadow-sm' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-xs text-emerald-600 font-semibold">Tiket Issued</div>
            <div className="text-2xl font-black text-emerald-700">
              {inquiries.filter((i) => i.status === 'Ticketed').length}
            </div>
          </div>
          <div
            onClick={() => setFilterStatus('Cancelled')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              filterStatus === 'Cancelled' ? 'bg-slate-200 border-slate-400 shadow-sm' : 'bg-white border-slate-200'
            }`}
          >
            <div className="text-xs text-slate-500 font-semibold">Dibatalkan</div>
            <div className="text-2xl font-black text-slate-600">
              {inquiries.filter((i) => i.status === 'Cancelled').length}
            </div>
          </div>
        </div>

        {/* Content Layout: Table + Detail Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inquiries Table */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">
                Daftar Reservasi WhatsApp ({filteredInquiries.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">Memuat data reservasi...</div>
            ) : filteredInquiries.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700">Belum ada data reservasi</p>
                <p className="text-xs text-slate-500">
                  Ketika pengunjung memesan tiket di web, data akan otomatis muncul di sini dan dikirim ke WhatsApp admin.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Ref ID</th>
                      <th className="p-3">Pemesan</th>
                      <th className="p-3">Rute & Maskapai</th>
                      <th className="p-3">Pax</th>
                      <th className="p-3">Total Estimasi</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInquiries.map((inq) => {
                      const isSelected = selectedInquiry?.bookingId === inq.bookingId;
                      return (
                        <tr
                          key={inq.bookingId}
                          onClick={() => setSelectedInquiry(inq)}
                          className={`hover:bg-sky-50/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-sky-50' : ''
                          }`}
                        >
                          <td className="p-3 font-mono font-bold text-slate-900">#{inq.bookingId}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{inq.contact.fullName}</div>
                            <div className="text-[11px] text-slate-500">{inq.contact.phoneNumber}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">
                              {inq.flightOffer.outbound.origin} ➔ {inq.flightOffer.outbound.destination}
                            </div>
                            <div className="text-[11px] text-sky-700">
                              {inq.flightOffer.validatingCarrierName}
                            </div>
                          </td>
                          <td className="p-3 font-semibold">{inq.passengers.length} Pax</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">
                              ${inq.totalEstimatedPriceUsd.toLocaleString()} USD
                            </div>
                            <div className="text-[11px] text-amber-700 font-medium">
                              EGP {(inq.totalEstimatedPriceEgp || Math.round(inq.totalEstimatedPriceUsd * 49.0)).toLocaleString()} (ج.م)
                            </div>
                          </td>
                          <td className="p-3">{getStatusBadge(inq.status)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInquiry(inq);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detailed Inspector Card */}
          <div className="lg:col-span-4">
            {selectedInquiry ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 sticky top-20">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      Rincian Reservasi
                    </span>
                    <h3 className="font-mono font-black text-lg text-slate-900">#{selectedInquiry.bookingId}</h3>
                  </div>
                  <div>{getStatusBadge(selectedInquiry.status)}</div>
                </div>

                {/* Status Updater */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Update Status Reservasi</label>
                  <select
                    value={selectedInquiry.status}
                    onChange={(e) => handleUpdateStatus(selectedInquiry.bookingId, e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Pending">Pending (Menunggu)</option>
                    <option value="Contacted">Contacted (Sudah Dihubungi)</option>
                    <option value="Confirmed">Confirmed (PNR Issued / DP Masuk)</option>
                    <option value="Ticketed">Ticketed (Lunas & Tiket Terbit)</option>
                    <option value="Cancelled">Cancelled (Dibatalkan)</option>
                  </select>
                </div>

                {/* Direct WhatsApp Contact Button */}
                <div>
                  <a
                    href={`https://wa.me/${selectedInquiry.contact.phoneNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                      `Halo Bpk/Ibu ${selectedInquiry.contact.fullName}, kami dari Admin NileNusantara Flight OTA mengenai reservasi tiket penerbangan Anda #${selectedInquiry.bookingId} (${selectedInquiry.flightOffer.outbound.origin} - ${selectedInquiry.flightOffer.outbound.destination}). Apakah ada yang bisa kami bantu konfirmasikan?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Chat Penumpang via WhatsApp</span>
                  </a>
                </div>

                {/* Contact Information */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    <span>Kontak Pemesan</span>
                  </div>
                  <div>• Nama: <strong>{selectedInquiry.contact.fullName}</strong></div>
                  <div>• WhatsApp: <strong>{selectedInquiry.contact.phoneNumber}</strong></div>
                  {selectedInquiry.contact.email && <div>• Email: {selectedInquiry.contact.email}</div>}
                  {selectedInquiry.contact.notes && (
                    <div className="text-amber-800 bg-amber-50 p-1.5 rounded mt-1">
                      Catatan: &ldquo;{selectedInquiry.contact.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Passenger Manifest */}
                <div className="text-xs space-y-2">
                  <div className="font-bold text-slate-900">
                    Manifest Penumpang ({selectedInquiry.passengers.length} Pax):
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedInquiry.passengers.map((pax, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-800">
                          {idx + 1}. {pax.title}. {pax.firstName} {pax.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Paspor: <span className="font-mono">{pax.passportNumber || 'N/A'}</span> (Exp: {pax.passportExpiry || 'N/A'})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Warga Negara: {pax.nationality} | Lahir: {pax.dateOfBirth || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flight & Pricing with Profit Margin */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Maskapai:</span>
                    <span className="font-bold text-slate-800">
                      {selectedInquiry.flightOffer.validatingCarrierName}
                    </span>
                  </div>

                  {selectedInquiry.flightOffer.price.markup && selectedInquiry.flightOffer.price.markup.totalMarkupUsd > 0 && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] text-slate-600">
                        <span>Harga Modal Net:</span>
                        <span className="font-mono font-semibold text-slate-700">
                          ${selectedInquiry.flightOffer.price.markup.netCostUsd.toLocaleString()} USD (~EGP {selectedInquiry.flightOffer.price.markup.netCostEgp.toLocaleString()})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-emerald-800 font-bold">
                        <span>Markup / Margin Keuntungan:</span>
                        <span className="font-mono text-emerald-700">
                          +${selectedInquiry.flightOffer.price.markup.totalMarkupUsd.toLocaleString()} USD (~EGP {selectedInquiry.flightOffer.price.markup.totalMarkupEgp.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-semibold">Total Ditagih ke Penumpang</span>
                      <span className="font-black text-base text-slate-900 block font-mono">
                        ${selectedInquiry.totalEstimatedPriceUsd.toLocaleString()} USD
                      </span>
                      <span className="text-xs text-amber-700 font-bold font-mono">
                        EGP {(selectedInquiry.totalEstimatedPriceEgp || Math.round(selectedInquiry.totalEstimatedPriceUsd * 49.0)).toLocaleString()} (LE / ج.م)
                      </span>
                    </div>
                    {selectedInquiry.flightOffer.price.markup?.totalMarkupUsd ? (
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Margin: +{Math.round((selectedInquiry.flightOffer.price.markup.totalMarkupUsd / selectedInquiry.totalEstimatedPriceUsd) * 100)}%
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                Pilih salah satu reservasi di tabel untuk melihat detail penumpang dan membuka chat WhatsApp langsung.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Admin Flight & Bookings Import/Export Modal */}
      <ImportExportModal
        type={importExportType}
        allowTypeSwitch={true}
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onSuccess={fetchInquiries}
      />
    </div>
  );
}
