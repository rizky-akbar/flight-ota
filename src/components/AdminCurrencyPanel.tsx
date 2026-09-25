'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, ArrowRightLeft, DollarSign, Globe, Sliders, ShieldCheck, Clock, TrendingUp, ArrowRight } from 'lucide-react';

interface CurrencyRateData {
  usdToEgp: number;
  egpToUsd: number;
  usdToIdr: number;
  idrToUsd: number;
  egpToIdr: number;
  idrToEgp: number;
  interbankEgp: number;
  interbankIdr: number;
  paypalSpreadPercent: number;
  mode: 'paypal_realtime' | 'manual';
  source: string;
  lastUpdated: string;
}

interface AdminCurrencyPanelProps {
  onRateUpdated?: (rate: number) => void;
}

type ConversionDirection =
  | 'USD_TO_EGP'
  | 'EGP_TO_USD'
  | 'USD_TO_IDR'
  | 'IDR_TO_USD'
  | 'EGP_TO_IDR'
  | 'IDR_TO_EGP';

const DIRECTION_LABELS: Record<ConversionDirection, { label: string; from: string; to: string; prefix: string }> = {
  USD_TO_EGP: { label: 'USD ➔ EGP', from: 'USD ($)', to: 'EGP (ج.م)', prefix: '$' },
  EGP_TO_USD: { label: 'EGP ➔ USD', from: 'EGP (ج.م)', to: 'USD ($)', prefix: 'EGP' },
  USD_TO_IDR: { label: 'USD ➔ IDR', from: 'USD ($)', to: 'IDR (Rp)', prefix: '$' },
  IDR_TO_USD: { label: 'IDR ➔ USD', from: 'IDR (Rp)', to: 'USD ($)', prefix: 'Rp' },
  EGP_TO_IDR: { label: 'EGP ➔ IDR', from: 'EGP (ج.م)', to: 'IDR (Rp)', prefix: 'EGP' },
  IDR_TO_EGP: { label: 'IDR ➔ EGP', from: 'IDR (Rp)', to: 'EGP (ج.م)', prefix: 'Rp' },
};

export default function AdminCurrencyPanel({ onRateUpdated }: AdminCurrencyPanelProps) {
  const [data, setData] = useState<CurrencyRateData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit config state
  const [editMode, setEditMode] = useState<'paypal_realtime' | 'manual'>('paypal_realtime');
  const [editSpread, setEditSpread] = useState<number>(0);
  const [editManualEgp, setEditManualEgp] = useState<number>(51.70);
  const [editManualIdr, setEditManualIdr] = useState<number>(17907);

  // Quick Calculator state
  const [calcDirection, setCalcDirection] = useState<ConversionDirection>('USD_TO_EGP');
  const [calcAmount, setCalcAmount] = useState<number>(100);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/currency');
      const json = await res.json();
      if (json.success && json.rate) {
        setData(json.rate);
        setEditMode(json.rate.mode || 'paypal_realtime');
        setEditSpread(json.rate.paypalSpreadPercent ?? 0);
        setEditManualEgp(json.rate.usdToEgp || 51.70);
        setEditManualIdr(json.rate.usdToIdr || 17907);
        if (onRateUpdated) onRateUpdated(json.rate.usdToEgp);
      }
    } catch (err) {
      console.error('Failed to fetch currency rates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setToastMessage(null);
    try {
      const res = await fetch('/api/admin/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      const json = await res.json();
      if (json.success) {
        const matrix: CurrencyRateData = json.matrix || {
          usdToEgp: json.settings.rates.EGP.paypalRate,
          egpToUsd: 1 / json.settings.rates.EGP.paypalRate,
          usdToIdr: json.settings.rates.IDR.paypalRate,
          idrToUsd: 1 / json.settings.rates.IDR.paypalRate,
          egpToIdr: json.settings.rates.IDR.paypalRate / json.settings.rates.EGP.paypalRate,
          idrToEgp: json.settings.rates.EGP.paypalRate / json.settings.rates.IDR.paypalRate,
          interbankEgp: json.settings.rates.EGP.interbankRate,
          interbankIdr: json.settings.rates.IDR.interbankRate,
          paypalSpreadPercent: json.settings.paypalSpreadPercent,
          mode: json.settings.mode,
          source: json.settings.source,
          lastUpdated: json.settings.rates.EGP.lastUpdated,
        };
        setData(matrix);
        setToastMessage('Kurs real-time USD/EGP & USD/IDR serta vice versa berhasil disinkronkan langsung dari pasar!');
        if (onRateUpdated) onRateUpdated(matrix.usdToEgp);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      setToastMessage(`Gagal refresh: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setToastMessage(null);
    try {
      const res = await fetch('/api/admin/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: editMode,
          paypalSpreadPercent: editSpread,
          manualEgp: editManualEgp,
          manualIdr: editManualIdr,
        }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.matrix) {
          setData(json.matrix);
          if (onRateUpdated) onRateUpdated(json.matrix.usdToEgp);
        }
        setToastMessage('Pengaturan kurs berhasil disimpan!');
        setShowConfig(false);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      setToastMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const handleDirectionChange = (newDir: ConversionDirection) => {
    setCalcDirection(newDir);
    // Adjust friendly default amounts if switching units
    if (newDir === 'IDR_TO_USD' || newDir === 'IDR_TO_EGP') {
      if (calcAmount <= 100) setCalcAmount(1000000);
    } else if (newDir === 'EGP_TO_USD' || newDir === 'EGP_TO_IDR') {
      if (calcAmount >= 100000 || calcAmount <= 10) setCalcAmount(500);
    } else {
      if (calcAmount >= 10000) setCalcAmount(100);
    }
  };

  const calculateConversion = () => {
    if (!data) return { resultFormatted: '0', rateFormula: '', note: '' };
    const amount = Number(calcAmount) || 0;

    switch (calcDirection) {
      case 'USD_TO_EGP': {
        const val = amount * data.usdToEgp;
        return {
          resultFormatted: `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`,
          rateFormula: `1 USD = ${data.usdToEgp} EGP`,
          note: `Interbank: ${data.interbankEgp} EGP`,
        };
      }
      case 'EGP_TO_USD': {
        const val = amount * (data.egpToUsd || (1 / data.usdToEgp));
        return {
          resultFormatted: `$${val.toFixed(2)} USD`,
          rateFormula: `1 EGP = $${(data.egpToUsd || (1 / data.usdToEgp)).toFixed(4)} USD`,
          note: `Kebalikan dari 1 USD = ${data.usdToEgp} EGP`,
        };
      }
      case 'USD_TO_IDR': {
        const val = Math.round(amount * data.usdToIdr);
        return {
          resultFormatted: `Rp ${val.toLocaleString('id-ID')}`,
          rateFormula: `1 USD = Rp ${Math.round(data.usdToIdr).toLocaleString('id-ID')}`,
          note: `Interbank: Rp ${Math.round(data.interbankIdr).toLocaleString('id-ID')}`,
        };
      }
      case 'IDR_TO_USD': {
        const val = amount * (data.idrToUsd || (1 / data.usdToIdr));
        return {
          resultFormatted: `$${val.toFixed(2)} USD`,
          rateFormula: `100.000 IDR = $${(100000 * (data.idrToUsd || (1 / data.usdToIdr))).toFixed(2)} USD`,
          note: `1 IDR = $${(data.idrToUsd || (1 / data.usdToIdr)).toFixed(6)} USD`,
        };
      }
      case 'EGP_TO_IDR': {
        const val = Math.round(amount * (data.egpToIdr || (data.usdToIdr / data.usdToEgp)));
        return {
          resultFormatted: `Rp ${val.toLocaleString('id-ID')}`,
          rateFormula: `1 EGP = Rp ${(data.egpToIdr || (data.usdToIdr / data.usdToEgp)).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`,
          note: `Cross-Rate Langsung Real-Time`,
        };
      }
      case 'IDR_TO_EGP': {
        const val = amount * (data.idrToEgp || (data.usdToEgp / data.usdToIdr));
        return {
          resultFormatted: `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`,
          rateFormula: `1.000 IDR = ${(1000 * (data.idrToEgp || (data.usdToEgp / data.usdToIdr))).toFixed(2)} EGP`,
          note: `Cross-Rate Langsung Real-Time`,
        };
      }
      default:
        return { resultFormatted: '0', rateFormula: '', note: '' };
    }
  };

  const currentEgpRate = data?.usdToEgp || 51.70;
  const currentEgpToUsd = data?.egpToUsd || (1 / currentEgpRate);
  const currentIdrRate = data?.usdToIdr || 17907;
  const currentIdrToUsd = data?.idrToUsd || (1 / currentIdrRate);
  const currentEgpToIdr = data?.egpToIdr || (currentIdrRate / currentEgpRate);
  const currentIdrToEgp = data?.idrToEgp || (currentEgpRate / currentIdrRate);
  const isRealtime = data?.mode === 'paypal_realtime';

  const calcResult = calculateConversion();
  const dirConfig = DIRECTION_LABELS[calcDirection];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 transition-all">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-black">Kurs Valuta Asing Real-Time (USD, EGP & IDR)</h2>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                  isRealtime
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}
              >
                <span>{isRealtime ? '● REAL-TIME PASS-THROUGH' : '○ MANUAL OVERRIDE'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Konversi interbank & transaksi dua arah: USD ⇄ EGP, USD ⇄ IDR, dan EGP ⇄ IDR secara otomatis.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 transition-all flex items-center space-x-1.5 shadow-sm"
            title="Tarik data kurs pasar terbaru sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memperbarui...' : 'Refresh Kurs Real-Time'}</span>
          </button>

          {/* Config Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Tutup Pengaturan' : 'Atur Kurs & Fee'}</span>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6 bg-slate-50/50 space-y-5">
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

        {/* Currency Highlight Cards (3-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: USD to EGP & Vice Versa */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Kurs USD ⇄ EGP (Mesir)</span>
                <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded border border-sky-200">
                  1 USD
                </span>
              </div>
              <div className="flex items-baseline space-x-2 my-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {isLoading ? '...' : `${currentEgpRate} EGP`}
                </span>
                <span className="text-xs font-semibold text-slate-400">ج.م</span>
              </div>

              {/* Vice Versa Highlight Pill */}
              <div className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-sky-50/80 border border-sky-200 text-sky-800 text-[11px] font-bold my-1.5">
                <ArrowRightLeft className="w-3 h-3 text-sky-600 flex-shrink-0" />
                <span>1 EGP = ${currentEgpToUsd.toFixed(4)} USD</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
              <div className="flex justify-between items-center">
                <span>Pasar Interbank:</span>
                <span className="font-mono font-bold text-slate-700">
                  {data?.interbankEgp ? `${data.interbankEgp} EGP` : '51.70 EGP'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Spread Fee:</span>
                <span className="font-mono font-bold text-indigo-600">
                  {data?.paypalSpreadPercent ?? 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: USD to IDR & Vice Versa */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Kurs USD ⇄ IDR (Indonesia)</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  1 USD
                </span>
              </div>
              <div className="flex items-baseline space-x-2 my-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {isLoading ? '...' : `Rp ${Math.round(currentIdrRate).toLocaleString('id-ID')}`}
                </span>
              </div>

              {/* Vice Versa Highlight Pill */}
              <div className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[11px] font-bold my-1.5">
                <ArrowRightLeft className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>100.000 IDR = ${(100000 * currentIdrToUsd).toFixed(2)} USD</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
              <div className="flex justify-between items-center">
                <span>Pasar Interbank:</span>
                <span className="font-mono font-bold text-slate-700">
                  Rp {Math.round(data?.interbankIdr || currentIdrRate).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status Feed:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Aktif & Real-Time (5m cache)
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: EGP to IDR Cross-Rate & Sync Info */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Cross-Rate EGP ⇄ IDR</span>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
                  Cross
                </span>
              </div>
              <div className="flex items-baseline space-x-2 my-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {isLoading
                    ? '...'
                    : `Rp ${currentEgpToIdr.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 1 EGP</span>
              </div>

              {/* Vice Versa Highlight Pill */}
              <div className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-purple-50/80 border border-purple-200 text-purple-800 text-[11px] font-bold my-1.5">
                <ArrowRightLeft className="w-3 h-3 text-purple-600 flex-shrink-0" />
                <span>1.000 IDR = {(1000 * currentIdrToEgp).toFixed(2)} EGP</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
              <div className="flex justify-between items-center">
                <span>Sinkronisasi Otomatis:</span>
                <span className="font-semibold text-slate-700">Tiap 5 Menit</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Terakhir diperbarui:</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {formatDateTime(data?.lastUpdated || '')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Interactive Bidirectional Calculator */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Kalkulator Konversi Real-Time (Dua Arah / Vice Versa)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Pilih arah konversi di bawah untuk menghitung seketika
            </span>
          </div>

          {/* Direction Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            {(Object.keys(DIRECTION_LABELS) as ConversionDirection[]).map((dir) => {
              const active = calcDirection === dir;
              return (
                <button
                  key={dir}
                  type="button"
                  onClick={() => handleDirectionChange(dir)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border text-center ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                  }`}
                >
                  {DIRECTION_LABELS[dir].label}
                </button>
              );
            })}
          </div>

          {/* Interactive Calculator Input & Output Row */}
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Input Box */}
            <div className="flex-1 flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 w-16 sm:w-20 flex-shrink-0">
                Jumlah {dirConfig.from.split(' ')[0]}:
              </span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {dirConfig.prefix}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Direction Indicator */}
            <div className="hidden md:flex items-center justify-center px-2 text-indigo-400">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Result Box */}
            <div className="flex-1 flex items-center justify-between md:justify-end gap-3 bg-white md:bg-transparent p-2.5 md:p-0 rounded-xl border md:border-0 border-slate-200">
              <span className="text-xs font-bold text-slate-500 md:hidden">Hasil:</span>
              <div className="text-right">
                <div className="text-lg sm:text-xl font-black text-indigo-900 font-mono tracking-tight">
                  {calcResult.resultFormatted}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {calcResult.rateFormula} • {calcResult.note}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Configuration Form */}
        {showConfig && (
          <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm animate-in fade-in duration-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Konfigurasi Mode & Spread Kurs Real-Time</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Mode Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Mode Pengambilan Kurs
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="currencyMode"
                      checked={editMode === 'paypal_realtime'}
                      onChange={() => setEditMode('paypal_realtime')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Real-Time Pasar (Rekomendasi)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="currencyMode"
                      checked={editMode === 'manual'}
                      onChange={() => setEditMode('manual')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Manual (Kunci Angka Sendiri)</span>
                  </label>
                </div>
              </div>

              {/* PayPal Spread Percentage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Conversion Spread Fee (%)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.5"
                    value={editSpread}
                    disabled={editMode === 'manual'}
                    onChange={(e) => setEditSpread(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  0% untuk kurs pasar murni, atau 3.5% s/d 4.0% jika menyesuaikan fee PayPal.
                </p>
              </div>

              {/* Manual Override Input */}
              {editMode === 'manual' ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Manual 1 USD = ... EGP
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={editManualEgp}
                        onChange={(e) => setEditManualEgp(Math.max(1, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-500">EGP</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Manual 1 USD = ... IDR
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1000"
                        step="50"
                        value={editManualIdr}
                        onChange={(e) => setEditManualIdr(Math.max(1000, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-500">IDR</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-slate-600 flex flex-col justify-center">
                  <span className="font-bold text-indigo-900 mb-0.5">Mode Otomatis Aktif</span>
                  <span>Data kurs diperbarui otomatis dari 3 provider API global setiap 5 menit dengan auto-fallback.</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
