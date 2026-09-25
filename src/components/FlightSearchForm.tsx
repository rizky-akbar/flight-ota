'use client';

import React, { useState } from 'react';
import { ArrowRightLeft, Calendar, Users, Search, PlaneTakeoff, Sparkles } from 'lucide-react';
import { SUPPORTED_AIRPORTS, FlightSearchQuery, CabinClass } from '@/lib/travelport/types';

interface FlightSearchFormProps {
  onSearch: (query: FlightSearchQuery) => void;
  isLoading: boolean;
  initialQuery?: FlightSearchQuery;
}

export default function FlightSearchForm({ onSearch, isLoading, initialQuery }: FlightSearchFormProps) {
  // Default values
  const defaultDeparture = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const defaultReturn = new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0];

  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>(initialQuery?.tripType || 'one-way');
  const [origin, setOrigin] = useState<string>(initialQuery?.origin || 'CGK');
  const [destination, setDestination] = useState<string>(initialQuery?.destination || 'CAI');
  const [departureDate, setDepartureDate] = useState<string>(initialQuery?.departureDate || defaultDeparture);
  const [returnDate, setReturnDate] = useState<string>(initialQuery?.returnDate || defaultReturn);
  const [adults, setAdults] = useState<number>(initialQuery?.adults || 1);
  const [children, setChildren] = useState<number>(initialQuery?.children || 0);
  const [infants, setInfants] = useState<number>(initialQuery?.infants || 0);
  const [cabinClass, setCabinClass] = useState<CabinClass>(initialQuery?.cabinClass || 'Economy');
  const [isPassengerOpen, setIsPassengerOpen] = useState<boolean>(false);

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const setPresetRoute = (from: string, to: string) => {
    setOrigin(from);
    setDestination(to);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      tripType,
      adults,
      children,
      infants,
      cabinClass,
    });
  };

  const totalPassengers = adults + children + infants;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-6 relative">
      {/* Quick Route Preset Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Rute Populer:
        </span>
        <button
          type="button"
          onClick={() => setPresetRoute('CGK', 'CAI')}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
            origin === 'CGK' && destination === 'CAI'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🇮🇩 Jakarta ➔ 🇪🇬 Kairo
        </button>
        <button
          type="button"
          onClick={() => setPresetRoute('CAI', 'CGK')}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
            origin === 'CAI' && destination === 'CGK'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🇪🇬 Kairo ➔ 🇮🇩 Jakarta
        </button>
        <button
          type="button"
          onClick={() => setPresetRoute('SUB', 'CAI')}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
            origin === 'SUB' && destination === 'CAI'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🇮🇩 Surabaya ➔ 🇪🇬 Kairo
        </button>
        <button
          type="button"
          onClick={() => setPresetRoute('DPS', 'CAI')}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
            origin === 'DPS' && destination === 'CAI'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🇮🇩 Bali ➔ 🇪🇬 Kairo
        </button>
        <button
          type="button"
          onClick={() => setPresetRoute('CGK', 'HBE')}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
            origin === 'CGK' && destination === 'HBE'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          🇮🇩 Jakarta ➔ 🇪🇬 Alexandria
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Top bar: Trip type and Cabin Class */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTripType('one-way')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                tripType === 'one-way' ? 'bg-white text-sky-700 shadow font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sekali Jalan (One-Way)
            </button>
            <button
              type="button"
              onClick={() => setTripType('round-trip')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                tripType === 'round-trip' ? 'bg-white text-sky-700 shadow font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pulang - Pergi (Round-Trip)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium">Kelas:</label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as CabinClass)}
              className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Economy">Economy</option>
              <option value="PremiumEconomy">Premium Economy</option>
              <option value="Business">Business Class</option>
            </select>
          </div>
        </div>

        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Origin */}
          <div className="md:col-span-3 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Dari (Origin)
            </label>
            <div className="relative">
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-pointer"
              >
                <optgroup label="🇮🇩 Indonesia">
                  {SUPPORTED_AIRPORTS.filter((a) => a.countryCode === 'ID').map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇪🇬 Mesir (Egypt)">
                  {SUPPORTED_AIRPORTS.filter((a) => a.countryCode === 'EG').map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center -my-2 md:my-0 md:pt-4">
            <button
              type="button"
              onClick={handleSwapAirports}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 border border-slate-200 transition-all active:scale-95 shadow-sm"
              title="Tukar Asal & Tujuan"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-3 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Ke (Destination)
            </label>
            <div className="relative">
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-pointer"
              >
                <optgroup label="🇪🇬 Mesir (Egypt)">
                  {SUPPORTED_AIRPORTS.filter((a) => a.countryCode === 'EG').map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇮🇩 Indonesia">
                  {SUPPORTED_AIRPORTS.filter((a) => a.countryCode === 'ID').map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Departure Date */}
          <div className={`${tripType === 'round-trip' ? 'md:col-span-2' : 'md:col-span-3'} relative`}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              Berangkat
            </label>
            <input
              type="date"
              value={departureDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          {/* Return Date (if Round-trip) */}
          {tripType === 'round-trip' && (
            <div className="md:col-span-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                Pulang
              </label>
              <input
                type="date"
                value={returnDate}
                min={departureDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
          )}

          {/* Passengers Selector */}
          <div className={`${tripType === 'round-trip' ? 'md:col-span-1' : 'md:col-span-2'} relative`}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              Penumpang
            </label>
            <button
              type="button"
              onClick={() => setIsPassengerOpen(!isPassengerOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 text-left focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all truncate"
            >
              {totalPassengers} Penumpang
            </button>

            {/* Passenger popover */}
            {isPassengerOpen && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <div className="font-bold text-slate-800">Dewasa (Adult)</div>
                    <div className="text-[11px] text-slate-400">12+ tahun</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="font-bold w-4 text-center">{adults}</span>
                    <button
                      type="button"
                      disabled={adults >= 9}
                      onClick={() => setAdults(adults + 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <div className="font-bold text-slate-800">Anak (Child)</div>
                    <div className="text-[11px] text-slate-400">2 - 11 tahun</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="font-bold w-4 text-center">{children}</span>
                    <button
                      type="button"
                      disabled={children >= 6}
                      onClick={() => setChildren(children + 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 mb-2">
                  <div>
                    <div className="font-bold text-slate-800">Bayi (Infant)</div>
                    <div className="text-[11px] text-slate-400">&lt; 2 tahun</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={infants <= 0}
                      onClick={() => setInfants(Math.max(0, infants - 1))}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="font-bold w-4 text-center">{infants}</span>
                    <button
                      type="button"
                      disabled={infants >= adults}
                      onClick={() => setInfants(infants + 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPassengerOpen(false)}
                  className="w-full py-1.5 bg-sky-700 text-white font-bold rounded-lg hover:bg-sky-800 transition-colors"
                >
                  Selesai
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Submit Button */}
        <div className="mt-5 flex items-center justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Mencari Jadwal Penerbangan...</span>
              </>
            ) : (
              <>
                <PlaneTakeoff className="w-5 h-5" />
                <span>Cari Tiket Penerbangan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
