'use client';

import React from 'react';
import { X, Plane, Clock, Luggage, ShieldCheck, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react';
import { FlightOffer } from '@/lib/travelport/types';

interface FlightDetailModalProps {
  offer: FlightOffer | null;
  currency: 'USD' | 'EGP';
  isOpen: boolean;
  onClose: () => void;
  onSelectBooking: (offer: FlightOffer) => void;
}

export default function FlightDetailModal({
  offer,
  currency,
  isOpen,
  onClose,
  onSelectBooking,
}: FlightDetailModalProps) {
  if (!isOpen || !offer) return null;

  const { outbound, inbound, price, validatingCarrierName, validatingCarrier } = offer;

  const egpPrice = price.totalAmountEgp || Math.round(price.totalAmountUsd * 50.05);
  const formattedPrice = currency === 'EGP'
    ? `EGP ${egpPrice.toLocaleString()} (~$${price.totalAmountUsd.toLocaleString()} USD)`
    : `$${price.totalAmountUsd.toLocaleString()} USD (~EGP ${egpPrice.toLocaleString()} / ج.م)`;

  const formatDateTime = (str: string) => {
    if (!str) return '';
    if (str.includes('T')) {
      const [d, t] = str.split('T');
      return `${t.substring(0, 5)} (${d})`;
    }
    return str;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-lg text-white">Rincian Penerbangan</h3>
              <span className="text-[10px] bg-sky-600 font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider">
                Penerbangan Resmi
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {validatingCarrierName} • {outbound.origin} ➔ {outbound.destination}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-sm">
          {/* Outbound Leg */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-sky-600 -rotate-45" />
                Penerbangan Pergi (Outbound)
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Total Durasi: {Math.floor(outbound.durationMinutes / 60)}j {outbound.durationMinutes % 60}m
              </span>
            </div>

            {/* Segments Timeline */}
            <div className="space-y-4 pl-2 border-l-2 border-sky-200 ml-3">
              {outbound.segments.map((seg, idx) => (
                <div key={idx} className="relative pl-5">
                  {/* Timeline dot */}
                  <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 border-sky-600 bg-white" />

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                      <span className="text-sky-700 font-black">
                        {seg.carrierName} • {seg.flightNumber}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                        {seg.aircraft || 'Boeing 777'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-2">
                      <div>
                        <div className="text-xs text-slate-400 font-semibold">Keberangkatan</div>
                        <div className="text-sm font-bold text-slate-900">{seg.origin}</div>
                        <div className="text-xs text-slate-600">{formatDateTime(seg.departureTime)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-semibold">Kedatangan</div>
                        <div className="text-sm font-bold text-slate-900">{seg.destination}</div>
                        <div className="text-xs text-slate-600">{formatDateTime(seg.arrivalTime)}</div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <span>Durasi Terbang: {Math.floor(seg.durationMinutes / 60)}j {seg.durationMinutes % 60}m</span>
                      <span className="text-slate-700 font-medium">Bagasi: {seg.baggageAllowance}</span>
                    </div>
                  </div>

                  {/* Transit note if not last segment */}
                  {idx < outbound.segments.length - 1 && (
                    <div className="my-2 p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>
                        Transit di <strong>{seg.destination}</strong> • Bagasi otomatis diteruskan ke tujuan akhir
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inbound Leg (if Round-trip) */}
          {inbound && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-amber-600 rotate-135" />
                  Penerbangan Pulang (Inbound)
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Total Durasi: {Math.floor(inbound.durationMinutes / 60)}j {inbound.durationMinutes % 60}m
                </span>
              </div>

              <div className="space-y-4 pl-2 border-l-2 border-amber-200 ml-3">
                {inbound.segments.map((seg, idx) => (
                  <div key={idx} className="relative pl-5">
                    <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 border-amber-600 bg-white" />

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                        <span className="text-amber-700 font-black">
                          {seg.carrierName} • {seg.flightNumber}
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          {seg.aircraft || 'Airbus A330'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 my-2">
                        <div>
                          <div className="text-xs text-slate-400 font-semibold">Keberangkatan</div>
                          <div className="text-sm font-bold text-slate-900">{seg.origin}</div>
                          <div className="text-xs text-slate-600">{formatDateTime(seg.departureTime)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-semibold">Kedatangan</div>
                          <div className="text-sm font-bold text-slate-900">{seg.destination}</div>
                          <div className="text-xs text-slate-600">{formatDateTime(seg.arrivalTime)}</div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                        <span>Durasi: {Math.floor(seg.durationMinutes / 60)}j {seg.durationMinutes % 60}m</span>
                        <span className="text-slate-700 font-medium">Bagasi: {seg.baggageAllowance}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fare & Inclusions */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Fasilitas Termasuk</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{offer.baggageSummary}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Makanan & Minuman Halal di Pesawat</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Jaminan E-Tiket Resmi & Terverifikasi</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bantuan Pengurusan Visa / Izin Pelajar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Total Estimasi Tarif</span>
            <span className="text-xl font-black text-sky-700">{formattedPrice}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onSelectBooking(offer);
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Lanjut Pesan via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
