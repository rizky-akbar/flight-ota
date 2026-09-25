'use client';

import React from 'react';
import { Plane, Clock, Luggage, ShieldCheck, ChevronRight, MessageCircle, AlertCircle } from 'lucide-react';
import { FlightOffer } from '@/lib/travelport/types';

interface FlightCardProps {
  offer: FlightOffer;
  currency: 'USD' | 'EGP';
  onSelect: (offer: FlightOffer) => void;
  onViewDetails: (offer: FlightOffer) => void;
}

export default function FlightCard({ offer, currency, onSelect, onViewDetails }: FlightCardProps) {
  const { outbound, inbound, price, validatingCarrierName, validatingCarrier, carrierLogoUrl } = offer;

  const egpPrice = price.totalAmountEgp || Math.round(price.totalAmountUsd * 50.05);
  const formattedPrice = currency === 'EGP'
    ? `EGP ${egpPrice.toLocaleString()}`
    : `$${price.totalAmountUsd.toLocaleString()} USD`;

  const secondaryPrice = currency === 'EGP'
    ? `~$${price.totalAmountUsd.toLocaleString()} USD`
    : `~EGP ${egpPrice.toLocaleString()} (ج.م)`;

  const formatTime = (timeStr: string) => {
    if (timeStr.includes('T')) {
      return timeStr.split('T')[1].substring(0, 5);
    }
    return timeStr;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}j ${m > 0 ? `${m}m` : ''}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:shadow-lg transition-all p-5 mb-4 relative overflow-hidden group">
      {/* Top Banner: Carrier + Status Badge */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-3">
          {carrierLogoUrl ? (
            <img
              src={carrierLogoUrl}
              alt={validatingCarrierName}
              className="w-8 h-8 object-contain rounded-md"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
              {validatingCarrier}
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-sm">{validatingCarrierName}</h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {outbound.segments.map((s) => s.flightNumber).join(' + ')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Kelas: {offer.cabinClass}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <ShieldCheck className="w-3 h-3 text-sky-600" />
            <span>Tiket Resmi Terkonfirmasi</span>
          </span>

          {offer.seatsRemaining <= 4 && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3 h-3" />
              <span>Sisa {offer.seatsRemaining} Kursi</span>
            </span>
          )}
        </div>
      </div>

      {/* Flight Schedule Row (Outbound) */}
      <div className="py-4 grid grid-cols-1 md:grid-cols-12 items-center gap-4">
        {/* Time and Airports */}
        <div className="md:col-span-8 flex items-center justify-between">
          {/* Departure */}
          <div className="text-left">
            <div className="text-xl font-black text-slate-900">{formatTime(outbound.departureTime)}</div>
            <div className="text-xs font-bold text-slate-600">{outbound.origin}</div>
          </div>

          {/* Duration & Stops Indicator */}
          <div className="flex-1 px-4 text-center">
            <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatDuration(outbound.durationMinutes)}</span>
            </div>
            {/* Visual flight line */}
            <div className="relative flex items-center justify-center">
              <div className="w-full h-0.5 bg-slate-200" />
              <Plane className="w-4 h-4 text-sky-600 absolute bg-white px-0.5 -rotate-45" />
            </div>
            <div className="text-[11px] font-medium text-amber-700 mt-1">
              {outbound.stops === 0 ? (
                <span className="text-emerald-600 font-semibold">Langsung (Direct)</span>
              ) : (
                <span>
                  1 Transit via <strong>{outbound.stopAirports.join(', ')}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="text-xl font-black text-slate-900">{formatTime(outbound.arrivalTime)}</div>
            <div className="text-xs font-bold text-slate-600">{outbound.destination}</div>
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="md:col-span-4 md:border-l md:border-slate-100 md:pl-5 flex flex-col items-end justify-center">
          <div className="text-[11px] text-slate-400">Total Harga / Penumpang</div>
          <div className="text-xl font-black text-sky-700 tracking-tight">{formattedPrice}</div>
          <div className="text-[11px] font-semibold text-amber-700">{secondaryPrice}</div>
          <div className="text-[10px] text-slate-400 mb-3">Termasuk pajak & biaya bandara</div>

          <div className="flex items-center space-x-2 w-full justify-end">
            <button
              onClick={() => onViewDetails(offer)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Detail
            </button>
            <button
              onClick={() => onSelect(offer)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all flex items-center space-x-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Pesan via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inbound Schedule (if Round-trip) */}
      {inbound && (
        <div className="pt-3 border-t border-dashed border-slate-200 grid grid-cols-1 md:grid-cols-12 items-center gap-4">
          <div className="md:col-span-8 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Penerbangan Pulang</span>
              <div className="text-base font-bold text-slate-800">{formatTime(inbound.departureTime)}</div>
              <div className="text-xs font-semibold text-slate-500">{inbound.origin}</div>
            </div>

            <div className="flex-1 px-4 text-center">
              <div className="text-[11px] text-slate-400 mb-1">{formatDuration(inbound.durationMinutes)}</div>
              <div className="relative flex items-center justify-center">
                <div className="w-full h-0.5 bg-slate-200" />
                <Plane className="w-3.5 h-3.5 text-amber-600 absolute bg-white px-0.5 rotate-135" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Transit: {inbound.stopAirports.join(', ')}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">&nbsp;</span>
              <div className="text-base font-bold text-slate-800">{formatTime(inbound.arrivalTime)}</div>
              <div className="text-xs font-semibold text-slate-500">{inbound.destination}</div>
            </div>
          </div>
          <div className="md:col-span-4 flex items-center justify-end text-xs text-slate-500 font-medium">
            Pulang-Pergi Termasuk
          </div>
        </div>
      )}

      {/* Bottom Features Pill: Baggage, Aircraft, Refundable */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1 font-medium text-slate-700">
            <Luggage className="w-3.5 h-3.5 text-sky-600" />
            <span>{offer.baggageSummary}</span>
          </span>
          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="hidden sm:inline text-slate-600">
            Pesawat: {outbound.segments[0]?.aircraft || 'Boeing / Airbus'}
          </span>
        </div>

        <div>
          {offer.refundable ? (
            <span className="text-[11px] font-semibold text-emerald-700">Bisa Reschedule / Refund*</span>
          ) : (
            <span className="text-[11px] text-slate-500">Non-refundable Promo</span>
          )}
        </div>
      </div>
    </div>
  );
}
