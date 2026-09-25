'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Percent, DollarSign, Check, AlertCircle, Save, RotateCcw, TrendingUp, ShieldCheck, ChevronDown, ChevronUp, Plane } from 'lucide-react';
import { MarkupSettings, DEFAULT_MARKUP_SETTINGS, calculateMarkup, AirlineMarkupRule } from '@/lib/travelport/markup';

interface AdminMarkupPanelProps {
  onMarkupUpdated?: () => void;
}

export default function AdminMarkupPanel({ onMarkupUpdated }: AdminMarkupPanelProps) {
  const [settings, setSettings] = useState<MarkupSettings>(DEFAULT_MARKUP_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showOverrides, setShowOverrides] = useState<boolean>(false);

  // Simulator State
  const [simCurrency, setSimCurrency] = useState<'USD' | 'EGP'>('USD');
  const [simNetCostUsd, setSimNetCostUsd] = useState<number>(650);
  const [simCarrier, setSimCarrier] = useState<string>('DEFAULT');
  const [usdToEgpRate, setUsdToEgpRate] = useState<number>(50.05);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/markup');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch markup settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrencyRate = async () => {
    try {
      const res = await fetch('/api/currency');
      const json = await res.json();
      if (json.success && json.rate?.usdToEgp) {
        setUsdToEgpRate(json.rate.usdToEgp);
      }
    } catch (err) {
      console.error('Failed to fetch live currency rate in markup panel:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCurrencyRate();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setToastMessage(null);
    try {
      const res = await fetch('/api/admin/markup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setToastMessage('Pengaturan markup berhasil disimpan dan langsung aktif di web OTA!');
        if (onMarkupUpdated) onMarkupUpdated();
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setToastMessage(`Gagal menyimpan: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      setToastMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncEgpFromUsd = () => {
    setSettings((prev) => ({
      ...prev,
      fixedAmountEgp: Math.round(prev.fixedAmountUsd * usdToEgpRate),
    }));
  };

  const handleSyncUsdFromEgp = () => {
    setSettings((prev) => ({
      ...prev,
      fixedAmountUsd: prev.fixedAmountEgp > 0 ? Math.round((prev.fixedAmountEgp / usdToEgpRate) * 10) / 10 : 0,
    }));
  };

  const handleRemoveAirlineOverride = (carrierCode: string) => {
    setSettings((prev) => ({
      ...prev,
      airlineOverrides: (prev.airlineOverrides || []).filter(
        (o) => o.carrierCode.toUpperCase() !== carrierCode.toUpperCase()
      ),
    }));
  };

  const handleResetAllOverridesToGlobal = () => {
    setSettings((prev) => ({
      ...prev,
      airlineOverrides: [],
    }));
  };

  const updateAirlineOverride = (
    carrierCode: string,
    carrierName: string,
    partial: Partial<AirlineMarkupRule>
  ) => {
    setSettings((prev) => {
      const list = [...(prev.airlineOverrides || [])];
      const idx = list.findIndex((o) => o.carrierCode.toUpperCase() === carrierCode.toUpperCase());
      const current = idx !== -1 ? list[idx] : { carrierCode, carrierName };
      const updated: AirlineMarkupRule = {
        ...current,
        ...partial,
      };

      // Check if any rule is active
      const hasPercentage = typeof updated.percentage === 'number' && !isNaN(updated.percentage);
      const hasFixedUsd = typeof updated.fixedAmountUsd === 'number' && updated.fixedAmountUsd > 0;
      const hasFixedEgp = typeof updated.fixedAmountEgp === 'number' && updated.fixedAmountEgp > 0;

      if (!hasPercentage && !hasFixedUsd && !hasFixedEgp) {
        return {
          ...prev,
          airlineOverrides: list.filter((o) => o.carrierCode.toUpperCase() !== carrierCode.toUpperCase()),
        };
      }

      if (idx !== -1) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }
      return { ...prev, airlineOverrides: list };
    });
  };

  const activeOverridesCount = (settings.airlineOverrides || []).filter(
    (o) =>
      typeof o.percentage === 'number' ||
      (typeof o.fixedAmountUsd === 'number' && o.fixedAmountUsd > 0) ||
      (typeof o.fixedAmountEgp === 'number' && o.fixedAmountEgp > 0)
  ).length;

  // Live simulation calculation
  const simNetCostEgp = Math.round(simNetCostUsd * usdToEgpRate);
  const simResult = calculateMarkup(
    simNetCostUsd,
    simNetCostEgp,
    settings,
    simCarrier === 'DEFAULT' ? undefined : simCarrier,
    usdToEgpRate
  );

  const profitMarginPct = simResult.totalAmountUsd > 0
    ? ((simResult.markupUsd / simResult.totalAmountUsd) * 100).toFixed(1)
    : '0';

  const POPULAR_AIRLINES = [
    { code: 'MS', name: 'EgyptAir' },
    { code: 'SV', name: 'Saudia Airlines' },
    { code: 'EK', name: 'Emirates' },
    { code: 'QR', name: 'Qatar Airways' },
    { code: 'WY', name: 'Oman Air' },
    { code: 'EY', name: 'Etihad Airways' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-black">Pengaturan Markup Harga Tiket (Profit Margin)</h2>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  settings.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                }`}
              >
                {settings.enabled ? '● AKTIF' : '○ NONAKTIF'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {settings.enabled ? (
                <span>
                  Mode saat ini:{' '}
                  <strong>
                    {settings.mode === 'percentage'
                      ? `+${settings.percentage}%`
                      : settings.mode === 'fixed'
                      ? `+$${settings.fixedAmountUsd} USD / +EGP ${settings.fixedAmountEgp.toLocaleString()} (ج.م)`
                      : `+${settings.percentage}% PLUS +$${settings.fixedAmountUsd} USD / +EGP ${settings.fixedAmountEgp.toLocaleString()} (ج.م)`}
                  </strong>{' '}
                  pada harga modal dasar
                </span>
              ) : (
                'Markup dinonaktifkan — harga tiket di web sama persis dengan modal net dasar.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Master Enable/Disable Toggle */}
          <button
            onClick={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              settings.enabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>{settings.enabled ? 'Matikan Markup' : 'Aktifkan Markup'}</span>
          </button>

          {/* Expand / Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-1"
          >
            <span>{isExpanded ? 'Tutup Panel' : 'Kelola Margin'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6 bg-slate-50/50">
          {toastMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                toastMessage.includes('berhasil')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Grid Layout: Config Inputs + Live Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Settings Form */}
            <div className="lg:col-span-7 space-y-5 bg-white p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. Pilih Metode Markup Harga
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, mode: 'percentage' }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center space-y-1 ${
                      settings.mode === 'percentage'
                        ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Percent className="w-4 h-4 text-sky-600" />
                    <span>Persentase (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, mode: 'fixed' }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center space-y-1 ${
                      settings.mode === 'fixed'
                        ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-sky-600" />
                    <span>Nominal Tetap</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, mode: 'both' }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center space-y-1 ${
                      settings.mode === 'both'
                        ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                    <span>Kombinasi (% + Tetap)</span>
                  </button>
                </div>
              </div>

              {/* Input: Percentage */}
              {(settings.mode === 'percentage' || settings.mode === 'both') && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-sky-600" />
                      <span>Markup Persentase (%)</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Dihitung dari modal fare
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={settings.percentage === 0 ? '' : settings.percentage}
                      onChange={(e) => {
                        const text = e.target.value;
                        setSettings((prev) => ({
                          ...prev,
                          percentage: text === '' ? 0 : Math.max(0, parseFloat(text) || 0),
                        }));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="font-bold text-slate-600 text-sm px-2">%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Contoh: Jika modal tiket $600 dan markup 5%, harga bertambah <strong>+$30 USD</strong> (~EGP 1,470).
                  </p>
                </div>
              )}

              {/* Input: Fixed Amount USD & EGP */}
              {(settings.mode === 'fixed' || settings.mode === 'both') && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Markup Nominal Tetap (Flat Fee per Tiket)</span>
                    </label>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-slate-500 font-mono text-[10px]">1 USD = {usdToEgpRate} EGP (PayPal)</span>
                      <button
                        type="button"
                        onClick={handleSyncEgpFromUsd}
                        className="font-bold text-sky-600 hover:text-sky-700 underline"
                        title="Hitung EGP dari nominal USD"
                      >
                        USD → EGP
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleSyncUsdFromEgp}
                        className="font-bold text-emerald-600 hover:text-emerald-700 underline"
                        title="Hitung USD dari nominal EGP"
                      >
                        EGP → USD
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nominal USD */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Nominal USD ($)
                        </span>
                        <span className="text-[10px] text-slate-400">Harga Dollar</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={settings.fixedAmountUsd === 0 ? '' : settings.fixedAmountUsd}
                          onChange={(e) => {
                            const text = e.target.value;
                            const val = text === '' ? 0 : Math.max(0, parseFloat(text) || 0);
                            setSettings((prev) => ({
                              ...prev,
                              fixedAmountUsd: val,
                              fixedAmountEgp: Math.round(val * usdToEgpRate),
                            }));
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* Nominal EGP */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Nominal EGP (ج.م)
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">Bisa Langsung Isi EGP</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-[11px]">EGP</span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          placeholder="0"
                          value={settings.fixedAmountEgp === 0 ? '' : settings.fixedAmountEgp}
                          onChange={(e) => {
                            const text = e.target.value;
                            const val = text === '' ? 0 : Math.max(0, parseFloat(text) || 0);
                            setSettings((prev) => ({
                              ...prev,
                              fixedAmountEgp: val,
                              fixedAmountUsd: val > 0 ? Math.round((val / usdToEgpRate) * 10) / 10 : 0,
                            }));
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    💡 Anda dapat mengetik nominal dalam <strong>EGP</strong> atau <strong>USD</strong>. Keduanya otomatis tersinkronisasi dengan kurs PayPal real-time (1 USD = {usdToEgpRate} EGP) dan langsung aktif di tiket web OTA.
                  </p>
                </div>
              )}

              {/* Specific Airline Overrides */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowOverrides(!showOverrides)}
                    className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center space-x-1"
                  >
                    <span>Aturan Khusus Maskapai Tertentu ({activeOverridesCount} aktif)</span>
                    {showOverrides ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {activeOverridesCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAllOverridesToGlobal}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
                      title="Hapus semua aturan khusus dan gunakan markup global untuk seluruh maskapai"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Semua Ikuti Global</span>
                    </button>
                  )}
                </div>

                {showOverrides && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Tentukan margin khusus per maskapai jika diperlukan (% atau nominal tetap EGP/USD). Jika kosong atau diklik &quot;Ikuti Global&quot;, maskapai otomatis menggunakan markup global ({settings.percentage}% {settings.fixedAmountEgp ? `+ EGP ${settings.fixedAmountEgp.toLocaleString()}` : ''}).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {POPULAR_AIRLINES.map((airline) => {
                        const existing = settings.airlineOverrides?.find(
                          (o) => o.carrierCode.toUpperCase() === airline.code.toUpperCase()
                        );
                        const hasActiveOverride =
                          existing &&
                          (typeof existing.percentage === 'number' ||
                            (typeof existing.fixedAmountUsd === 'number' && existing.fixedAmountUsd > 0) ||
                            (typeof existing.fixedAmountEgp === 'number' && existing.fixedAmountEgp > 0));

                        const overrideLabels: string[] = [];
                        if (existing) {
                          if (typeof existing.percentage === 'number') {
                            overrideLabels.push(`+${existing.percentage}%`);
                          }
                          if (typeof existing.fixedAmountEgp === 'number' && existing.fixedAmountEgp > 0) {
                            overrideLabels.push(`+EGP ${existing.fixedAmountEgp.toLocaleString()}`);
                          } else if (typeof existing.fixedAmountUsd === 'number' && existing.fixedAmountUsd > 0) {
                            overrideLabels.push(`+$${existing.fixedAmountUsd}`);
                          }
                        }

                        return (
                          <div
                            key={airline.code}
                            className={`p-3 rounded-xl border text-xs transition-all ${
                              hasActiveOverride
                                ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/30 shadow-sm'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Plane className={`w-3.5 h-3.5 ${hasActiveOverride ? 'text-amber-600' : 'text-sky-600'}`} />
                                <span>
                                  {airline.name} ({airline.code})
                                </span>
                              </div>

                              {hasActiveOverride ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAirlineOverride(airline.code)}
                                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg transition-colors"
                                  title="Hapus aturan khusus dan gunakan markup global"
                                >
                                  ✕ Ikuti Global
                                </button>
                              ) : (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  Ikuti Global
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-600 mb-2">
                              {hasActiveOverride ? (
                                <span className="font-bold text-amber-800">
                                  Override: {overrideLabels.join(' & ') || 'Aktif'}
                                </span>
                              ) : (
                                <span className="text-slate-500">
                                  Global: {settings.mode === 'percentage' ? `+${settings.percentage}%` : settings.mode === 'fixed' ? `+EGP ${settings.fixedAmountEgp.toLocaleString()} (+$${settings.fixedAmountUsd})` : `+${settings.percentage}% & +EGP ${settings.fixedAmountEgp.toLocaleString()}`}
                                </span>
                              )}
                            </div>

                            {/* Inputs for airline override: % and EGP/USD */}
                            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                  Custom %:
                                </label>
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    placeholder={`${settings.percentage}%`}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    value={existing?.percentage !== undefined ? existing.percentage : ''}
                                    onChange={(e) => {
                                      const text = e.target.value.trim();
                                      const val = text === '' ? undefined : parseFloat(text);
                                      updateAirlineOverride(airline.code, airline.name, {
                                        percentage: val !== undefined && !isNaN(val) ? val : undefined,
                                      });
                                    }}
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold">%</span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                  + Nominal (EGP):
                                </label>
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    step="50"
                                    placeholder={settings.fixedAmountEgp > 0 ? `${settings.fixedAmountEgp}` : 'EGP'}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    value={existing?.fixedAmountEgp !== undefined && existing.fixedAmountEgp > 0 ? existing.fixedAmountEgp : ''}
                                    onChange={(e) => {
                                      const text = e.target.value.trim();
                                      const egp = text === '' ? 0 : parseFloat(text) || 0;
                                      const usd = egp > 0 ? Math.round((egp / usdToEgpRate) * 10) / 10 : 0;
                                      updateAirlineOverride(airline.code, airline.name, {
                                        fixedAmountEgp: egp > 0 ? egp : undefined,
                                        fixedAmountUsd: usd > 0 ? usd : undefined,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSettings(DEFAULT_MARKUP_SETTINGS)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Markup'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Live Price Simulator */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                      Simulator Harga & Profit Live
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    Real-time
                  </span>
                </div>

                {/* Currency Switcher in Simulator */}
                <div className="flex items-center justify-between mb-3 bg-slate-950/60 p-1 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 font-semibold px-2">Mata Uang Tes:</span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setSimCurrency('USD')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        simCurrency === 'USD'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimCurrency('EGP')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        simCurrency === 'EGP'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      EGP (ج.م)
                    </button>
                  </div>
                </div>

                {/* Simulation Inputs */}
                <div className="space-y-3 mb-5">
                  {simCurrency === 'USD' ? (
                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Tes Modal Net Dasar (USD):
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 font-bold text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            step="10"
                            value={simNetCostUsd}
                            onChange={(e) => setSimNetCostUsd(Math.max(1, parseFloat(e.target.value) || 0))}
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-7 pr-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          ≈ EGP {simNetCostEgp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Tes Modal Net Dasar (EGP):
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 font-bold text-slate-400 text-[10px]">EGP</span>
                          <input
                            type="number"
                            step="500"
                            value={simNetCostEgp}
                            onChange={(e) => {
                              const egp = Math.max(1, parseFloat(e.target.value) || 0);
                              setSimNetCostUsd(Math.round((egp / usdToEgpRate) * 10) / 10);
                            }}
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          ≈ ${simNetCostUsd.toLocaleString()} USD
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      Pilih Maskapai Pengujian:
                    </label>
                    <select
                      value={simCarrier}
                      onChange={(e) => setSimCarrier(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="DEFAULT">Markup Standar / Global</option>
                      {POPULAR_AIRLINES.map((a) => (
                        <option key={a.code} value={a.code}>
                          {a.name} ({a.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Simulation Calculation Breakdown */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-700/60 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Modal Net (A):</span>
                    <span className="font-mono text-white font-semibold">
                      ${simResult.netCostUsd.toLocaleString()} USD (~EGP {simResult.netCostEgp.toLocaleString()})
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-300 font-semibold">
                    <span>Tambahan Markup Profit (B):</span>
                    <span className="font-mono text-emerald-400">
                      +${simResult.markupUsd.toLocaleString()} USD (~EGP {simResult.markupEgp.toLocaleString()})
                    </span>
                  </div>

                  <div className="border-t border-slate-700 pt-2.5 flex justify-between items-baseline">
                    <span className="font-bold text-white">Harga Jual Web (A + B):</span>
                    <div className="text-right">
                      <div className="text-base font-black text-amber-300 font-mono">
                        ${simResult.totalAmountUsd.toLocaleString()} USD
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        EGP {simResult.totalAmountEgp.toLocaleString()} (ج.م)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Metric Badge */}
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold">Margin Keuntungan Agen:</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {profitMarginPct}% Gross Margin
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
