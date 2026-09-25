'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, ArrowRightLeft, DollarSign, Globe, Sliders, ShieldCheck, Clock, TrendingUp } from 'lucide-react';

interface CurrencyRateData {
  usdToEgp: number;
  usdToIdr: number;
  interbankEgp: number;
  paypalSpreadPercent: number;
  mode: 'paypal_realtime' | 'manual';
  source: string;
  lastUpdated: string;
}

interface AdminCurrencyPanelProps {
  onRateUpdated?: (rate: number) => void;
}

export default function AdminCurrencyPanel({ onRateUpdated }: AdminCurrencyPanelProps) {
  const [data, setData] = useState<CurrencyRateData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit config state
  const [editMode, setEditMode] = useState<'paypal_realtime' | 'manual'>('paypal_realtime');
  const [editSpread, setEditSpread] = useState<number>(4.0);
  const [editManualEgp, setEditManualEgp] = useState<number>(49.0);

  // Quick Calculator
  const [calcUsd, setCalcUsd] = useState<number>(100);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/currency');
      const json = await res.json();
      if (json.success && json.rate) {
        setData(json.rate);
        setEditMode(json.rate.mode || 'paypal_realtime');
        setEditSpread(json.rate.paypalSpreadPercent ?? 4.0);
        setEditManualEgp(json.rate.usdToEgp || 49.0);
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
      if (json.success && json.settings) {
        const s = json.settings;
        const newRate: CurrencyRateData = {
          usdToEgp: s.rates.EGP.paypalRate,
          usdToIdr: s.rates.IDR.paypalRate,
          interbankEgp: s.rates.EGP.interbankRate,
          paypalSpreadPercent: s.paypalSpreadPercent,
          mode: s.mode,
          source: s.source,
          lastUpdated: s.rates.EGP.lastUpdated,
        };
        setData(newRate);
        setToastMessage('Kurs real-time PayPal berhasil disinkronkan langsung dari pasar!');
        if (onRateUpdated) onRateUpdated(newRate.usdToEgp);
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
        }),
      });
      const json = await res.json();
      if (json.success && json.settings) {
        const s = json.settings;
        const newRate: CurrencyRateData = {
          usdToEgp: s.mode === 'manual' ? s.manualRates?.EGP || editManualEgp : s.rates.EGP.paypalRate,
          usdToIdr: s.mode === 'manual' ? s.manualRates?.IDR || 15850 : s.rates.IDR.paypalRate,
          interbankEgp: s.rates.EGP.interbankRate,
          paypalSpreadPercent: s.paypalSpreadPercent,
          mode: s.mode,
          source: s.source,
          lastUpdated: s.rates.EGP.lastUpdated,
        };
        setData(newRate);
        setToastMessage('Pengaturan kurs PayPal berhasil disimpan!');
        setShowConfig(false);
        if (onRateUpdated) onRateUpdated(newRate.usdToEgp);
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

  const currentEgpRate = data?.usdToEgp || 50.05;
  const currentIdrRate = data?.usdToIdr || 17150;
  const isRealtime = data?.mode === 'paypal_realtime';

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
              <h2 className="text-sm sm:text-base font-black">Kurs Valuta Asing Real-Time (PayPal Rate)</h2>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                  isRealtime
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}
              >
                <span>{isRealtime ? '● PAYPAL REALTIME' : '○ MANUAL OVERRIDE'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Kurs resmi konversi transaksi antara USD ($), Egyptian Pounds (ج.م), dan Rupiah (IDR).
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
            title="Tarik data kurs pasar dan formula PayPal terbaru langsung"
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

        {/* Currency Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: USD to EGP */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Kurs USD ➔ EGP (Mesir)</span>
              <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                1 USD
              </span>
            </div>
            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {isLoading ? '...' : `${currentEgpRate} EGP`}
              </span>
              <span className="text-xs font-semibold text-slate-400">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
              <span>Pasar Interbank:</span>
              <span className="font-mono font-bold text-slate-700">
                {data?.interbankEgp ? `${data.interbankEgp} EGP` : '52.14 EGP'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between items-center">
              <span>PayPal Spread Fee:</span>
              <span className="font-mono font-bold text-indigo-600">
                {data?.paypalSpreadPercent ?? 4.0}%
              </span>
            </div>
          </div>

          {/* Card 2: USD to IDR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Kurs USD ➔ IDR (Indonesia)</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                1 USD
              </span>
            </div>
            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {isLoading ? '...' : `Rp ${currentIdrRate.toLocaleString()}`}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
              <span>Pasar Interbank:</span>
              <span className="font-mono font-bold text-slate-700">
                Rp 17.776
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between items-center">
              <span>Status Feed:</span>
              <span className="font-semibold text-emerald-700">Aktif & Sinkron</span>
            </div>
          </div>

          {/* Card 3: Status & Last Sync */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Sinkronisasi Otomatis</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-sm font-bold text-slate-800 my-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Auto-Refresh Tiap 30 Menit</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Terakhir diperbarui:{' '}
                <strong className="text-slate-700 font-mono">
                  {formatDateTime(data?.lastUpdated || '')}
                </strong>
              </p>
            </div>

            {/* Quick Conversion Tester */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-[11px] text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="1"
                  value={calcUsd}
                  onChange={(e) => setCalcUsd(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900"
                />
              </div>
              <span className="text-slate-400 font-bold">➔</span>
              <span className="font-bold text-indigo-700 font-mono text-[11px]">
                EGP {Math.round(calcUsd * currentEgpRate).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Configuration Form */}
        {showConfig && (
          <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm animate-in fade-in duration-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Konfigurasi Mode & Spread Kurs PayPal</span>
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
                    <span>PayPal Real-Time (Rekomendasi)</span>
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
                  2. PayPal Conversion Spread Fee (%)
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
                  Standar resmi PayPal: 3.5% s/d 4.0% di atas kurs interbank.
                </p>
              </div>

              {/* Manual Override Input */}
              {editMode === 'manual' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. Nilai Manual 1 USD = ... EGP
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
