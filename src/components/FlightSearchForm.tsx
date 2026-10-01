'use client';

import React, { useState } from 'react';
import { ArrowRightLeft, Calendar, Users, PlaneTakeoff, Sparkles, X, AlertCircle, Info } from 'lucide-react';
import { SUPPORTED_AIRPORTS, FlightSearchQuery, CabinClass, isEgyptAirport, validateRoute } from '@/lib/travelport/types';

interface FlightSearchFormProps {
  onSearch: (query: FlightSearchQuery) => void;
  isLoading: boolean;
  initialQuery?: FlightSearchQuery;
}

export default function FlightSearchForm({ onSearch, isLoading, initialQuery }: FlightSearchFormProps) {
  // Default values: Cairo -> Jakarta round-trip or one-way
  const defaultDeparture = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const defaultReturn = new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0];

  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>(initialQuery?.tripType || 'one-way');
  const [origin, setOrigin] = useState<string>(
    initialQuery?.origin && isEgyptAirport(initialQuery.origin) ? initialQuery.origin : 'CAI'
  );
  const [destination, setDestination] = useState<string>(initialQuery?.destination || 'CGK');
  const [departureDate, setDepartureDate] = useState<string>(initialQuery?.departureDate || defaultDeparture);
  const [returnDate, setReturnDate] = useState<string>(initialQuery?.returnDate || defaultReturn);
  const [adults, setAdults] = useState<number>(initialQuery?.adults || 1);
  const [children, setChildren] = useState<number>(initialQuery?.children || 0);
  const [infants, setInfants] = useState<number>(initialQuery?.infants || 0);
  const [cabinClass, setCabinClass] = useState<CabinClass>(initialQuery?.cabinClass || 'Economy');
  const [isPassengerOpen, setIsPassengerOpen] = useState<boolean>(false);
  const [routeNotice, setRouteNotice] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Switch trip type
  const handleTripTypeChange = (type: 'one-way' | 'round-trip') => {
    setTripType(type);
    setValidationError(null);
    setRouteNotice(null);

    // Keberangkatan selalu dari bandara di Mesir
    if (!isEgyptAirport(origin)) {
      setOrigin('CAI');
    }
  };

  const handleSwapAirports = () => {
    setValidationError(null);

    // Departure is strictly from Egypt
    if (!isEgyptAirport(destination)) {
      setRouteNotice('Keberangkatan hanya tersedia dari bandara di Mesir (Kairo, Alexandria, dll).');
      return;
    }

    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const setPresetRoute = (from: string, to: string, forceTripType?: 'one-way' | 'round-trip') => {
    setValidationError(null);
    setRouteNotice(null);
    setOrigin(from);
    setDestination(to);
    if (forceTripType) {
      setTripType(forceTripType);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validation = validateRoute(origin, destination, tripType);
    if (!validation.valid) {
      setValidationError(validation.error || 'Rute penerbangan tidak valid.');
      return;
    }

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

  // Filtered lists for dropdowns
  const egyptAirports = SUPPORTED_AIRPORTS.filter((a) => a.countryCode === 'EG');
  const indonesiaAirports = SUPPORTED_AIRPORTS.filter((a) => a.countryCode === 'ID');
  const middleEastAirports = SUPPORTED_AIRPORTS.filter((a) => a.region === 'MiddleEast');
  const asiaAirports = SUPPORTED_AIRPORTS.filter((a) => a.region === 'Asia');
  const westernAirports = SUPPORTED_AIRPORTS.filter((a) => a.region === 'Europe' || a.region === 'Americas');

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-4 sm:p-6 relative text-slate-900">
      {/* Quick Route Preset Pills (Departing from Egypt to the world) */}
      <div className="mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 touch-pan-x">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Rute Populer:</span>
          </span>
          <button
            type="button"
            onClick={() => setPresetRoute('CAI', 'CGK')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-95 touch-manipulation ${
              origin === 'CAI' && destination === 'CGK'
                ? 'bg-sky-700 text-white shadow-sm font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🇪🇬 Kairo ➔ 🇮🇩 Jakarta
          </button>
          <button
            type="button"
            onClick={() => setPresetRoute('CAI', 'JED')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-95 touch-manipulation ${
              origin === 'CAI' && destination === 'JED'
                ? 'bg-sky-700 text-white shadow-sm font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🇪🇬 Kairo ➔ 🇸🇦 Jeddah (Umrah)
          </button>
          <button
            type="button"
            onClick={() => setPresetRoute('CAI', 'KUL')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-95 touch-manipulation ${
              origin === 'CAI' && destination === 'KUL'
                ? 'bg-sky-700 text-white shadow-sm font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🇪🇬 Kairo ➔ 🇲🇾 Kuala Lumpur
          </button>
          <button
            type="button"
            onClick={() => setPresetRoute('HBE', 'CGK')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-95 touch-manipulation ${
              origin === 'HBE' && destination === 'CGK'
                ? 'bg-sky-700 text-white shadow-sm font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🇪🇬 Alexandria ➔ 🇮🇩 Jakarta
          </button>
          <button
            type="button"
            onClick={() => setPresetRoute('CAI', 'IST')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-95 touch-manipulation ${
              origin === 'CAI' && destination === 'IST'
                ? 'bg-sky-700 text-white shadow-sm font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🇪🇬 Kairo ➔ 🇹🇷 Istanbul
          </button>
          <button
            type="button"
            onClick={() => setPresetRoute('CAI', 'DXB')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-95 touch-manipulation ${
              origin === 'CAI' && destination === 'DXB'
                ? 'bg-sky-700 text-white shadow-sm font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🇪🇬 Kairo ➔ 🇦🇪 Dubai
          </button>
          <button
            type="button"
            onClick={() => setPresetRoute('CAI', 'CGK', 'round-trip')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 transition-all active:scale-95 touch-manipulation ${
              origin === 'CAI' && destination === 'CGK' && tripType === 'round-trip'
                ? 'bg-sky-700 text-white shadow-sm font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🇪🇬 Kairo ⇄ 🇮🇩 Jakarta (PP)
          </button>
        </div>
      </div>

      {/* Validation or helpful route notice */}
      {validationError && (
        <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {routeNotice && (
        <div className="mb-3.5 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <span>{routeNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Top bar: Trip type and Cabin Class (Mobile Responsive) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-4">
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleTripTypeChange('one-way')}
              className={`py-2 px-3 sm:px-3.5 rounded-lg transition-all text-center touch-manipulation ${
                tripType === 'one-way'
                  ? 'bg-white text-sky-700 shadow font-black'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span className="sm:hidden">Sekali Jalan</span>
              <span className="hidden sm:inline">Sekali Jalan (Dari Mesir)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTripTypeChange('round-trip')}
              className={`py-2 px-3 sm:px-3.5 rounded-lg transition-all text-center touch-manipulation ${
                tripType === 'round-trip'
                  ? 'bg-white text-sky-700 shadow font-black'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span className="sm:hidden">Pulang - Pergi</span>
              <span className="hidden sm:inline">Pulang - Pergi (Round-Trip)</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 bg-slate-50 sm:bg-transparent p-1.5 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
            <label className="text-xs text-slate-500 font-bold sm:font-medium pl-1 sm:pl-0">Kelas:</label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as CabinClass)}
              className="text-base sm:text-xs font-semibold bg-white sm:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 flex-1 sm:flex-none cursor-pointer touch-manipulation"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
              <span>Dari (Keberangkatan Mesir)</span>
              <span className="text-[10px] text-sky-700 font-extrabold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                Hanya Mesir
              </span>
            </label>
            <div className="relative">
              <select
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  setValidationError(null);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <optgroup label="🇪🇬 Mesir (Egypt) - Hub Keberangkatan">
                  {egyptAirports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Swap Button (Vertical flip on Mobile, Horizontal on Desktop) */}
          <div className="md:col-span-1 flex justify-center -my-1.5 md:my-0 md:pt-4 z-10">
            <button
              type="button"
              onClick={handleSwapAirports}
              className="p-2 sm:p-2.5 rounded-full bg-white hover:bg-sky-50 hover:text-sky-600 text-slate-600 border border-slate-200 transition-all active:scale-90 shadow-sm flex items-center justify-center touch-manipulation min-h-[40px] min-w-[40px]"
              title="Tukar Asal & Tujuan"
            >
              <ArrowRightLeft className="w-4 h-4 rotate-90 md:rotate-0 text-sky-600" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-3 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Ke (Destination Seluruh Dunia)
            </label>
            <div className="relative">
              <select
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setValidationError(null);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <optgroup label="🇮🇩 Indonesia">
                  {indonesiaAirports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇸🇦 Arab Saudi & Timur Tengah">
                  {middleEastAirports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌏 Asia">
                  {asiaAirports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇪🇺 Eropa & 🌎 Amerika">
                  {westernAirports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇪🇬 Mesir (Egypt)">
                  {egyptAirports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code}) - {airport.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Dates Section */}
          <div
            className={`grid ${
              tripType === 'round-trip' ? 'grid-cols-2 md:grid-cols-4 md:col-span-3' : 'grid-cols-1 md:col-span-3'
            } gap-2`}
          >
            {/* Departure Date */}
            <div className={`${tripType === 'round-trip' ? 'col-span-1 md:col-span-2' : ''} relative`}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Berangkat</span>
              </label>
              <input
                type="date"
                value={departureDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 text-base sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all min-h-[44px] touch-manipulation"
              />
            </div>

            {/* Return Date (if Round-trip) */}
            {tripType === 'round-trip' && (
              <div className="col-span-1 md:col-span-2 relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pulang</span>
                </label>
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 text-base sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all min-h-[44px] touch-manipulation"
                />
              </div>
            )}
          </div>

          {/* Passengers Selector */}
          <div className="md:col-span-2 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>Penumpang</span>
            </label>
            <button
              type="button"
              onClick={() => setIsPassengerOpen(!isPassengerOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm font-bold text-slate-900 text-left focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all truncate flex items-center justify-between min-h-[44px] touch-manipulation"
            >
              <span>{totalPassengers} Penumpang</span>
              <span className="text-[10px] text-sky-700 bg-sky-100 font-bold px-1.5 py-0.5 rounded">
                Ubah
              </span>
            </button>

            {/* Passenger Modal Sheet */}
            {isPassengerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs"
                  onClick={() => setIsPassengerOpen(false)}
                />

                <div className="fixed sm:absolute inset-x-3 bottom-4 sm:bottom-auto sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 sm:p-5 z-50 text-xs text-slate-900 animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                    <span className="font-black text-sm text-slate-900">Jumlah Penumpang</span>
                    <button
                      type="button"
                      onClick={() => setIsPassengerOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors touch-manipulation"
                      aria-label="Tutup"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Adults */}
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Dewasa (Adult)</div>
                      <div className="text-[11px] text-slate-500 font-medium">Usia 12+ tahun</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={adults <= 1}
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-8 h-8 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center font-black text-sm text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        -
                      </button>
                      <span className="font-black w-6 text-center text-sm sm:text-base text-slate-900">{adults}</span>
                      <button
                        type="button"
                        disabled={adults >= 9}
                        onClick={() => setAdults(adults + 1)}
                        className="w-8 h-8 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center font-black text-sm text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Anak (Child)</div>
                      <div className="text-[11px] text-slate-500 font-medium">Usia 2 - 11 tahun</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={children <= 0}
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-8 h-8 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center font-black text-sm text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        -
                      </button>
                      <span className="font-black w-6 text-center text-sm sm:text-base text-slate-900">{children}</span>
                      <button
                        type="button"
                        disabled={children >= 6}
                        onClick={() => setChildren(children + 1)}
                        className="w-8 h-8 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center font-black text-sm text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between py-2.5 mb-3">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Bayi (Infant)</div>
                      <div className="text-[11px] text-slate-500 font-medium">&lt; 2 tahun (pangkuan)</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={infants <= 0}
                        onClick={() => setInfants(Math.max(0, infants - 1))}
                        className="w-8 h-8 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center font-black text-sm text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        -
                      </button>
                      <span className="font-black w-6 text-center text-sm sm:text-base text-slate-900">{infants}</span>
                      <button
                        type="button"
                        disabled={infants >= adults}
                        onClick={() => setInfants(infants + 1)}
                        className="w-8 h-8 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center font-black text-sm text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPassengerOpen(false)}
                    className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-black text-xs rounded-xl shadow transition-all active:scale-98 touch-manipulation min-h-[40px]"
                  >
                    Terapkan Penumpang
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search Submit Button */}
        <div className="mt-5">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white font-black text-sm sm:text-base rounded-xl shadow-lg hover:shadow-sky-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 active:scale-98 touch-manipulation min-h-[48px]"
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
