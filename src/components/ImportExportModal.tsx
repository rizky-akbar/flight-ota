'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Download, FileText, CheckCircle2, AlertCircle, FileSpreadsheet, Plane } from 'lucide-react';

interface ImportExportModalProps {
  type?: 'flights' | 'bookings';
  allowTypeSwitch?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  flightSearchParams?: { from?: string; to?: string; departureDate?: string; tripType?: string };
}

export default function ImportExportModal({
  type = 'bookings',
  allowTypeSwitch = true,
  isOpen,
  onClose,
  onSuccess,
  flightSearchParams,
}: ImportExportModalProps) {
  const [currentType, setCurrentType] = useState<'flights' | 'bookings'>(type);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (type) {
      setCurrentType(type);
    }
  }, [type, isOpen]);

  if (!isOpen) return null;

  const isFlights = currentType === 'flights';
  const title = isFlights ? 'Jadwal Penerbangan (Flight Inventory)' : 'Data Reservasi & Manifest (Bookings)';

  const templateEndpoint = isFlights ? '/api/flights/import?template=true' : '/api/admin/import?template=true';
  const importEndpoint = isFlights ? '/api/flights/import' : '/api/admin/import';

  // Export handlers
  const handleExport = (format: 'csv' | 'json') => {
    let url = '';
    if (isFlights) {
      const p = new URLSearchParams({
        from: flightSearchParams?.from || 'CGK',
        to: flightSearchParams?.to || 'CAI',
        departureDate: flightSearchParams?.departureDate || new Date().toISOString().split('T')[0],
        tripType: flightSearchParams?.tripType || 'one-way',
        format,
      });
      url = `/api/flights/export?${p.toString()}`;
    } else {
      url = `/api/admin/export?format=${format}`;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Upload handler
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setResultMessage({ success: false, text: 'Silakan pilih file CSV atau JSON terlebih dahulu.' });
      return;
    }

    setIsUploading(true);
    setResultMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(importEndpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengimpor data.');
      }

      setResultMessage({
        success: true,
        text: data.message || `Berhasil mengimpor data (${data.result?.total || 0} total data).`,
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setResultMessage({ success: false, text: err.message || 'Terjadi kesalahan saat mengunggah.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-sky-600">
              {activeTab === 'export' ? <Download className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-xs text-slate-400">Ekspor & Impor Data (CSV / Excel & JSON)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type Switcher: Flights vs Bookings */}
        {allowTypeSwitch && (
          <div className="p-3 bg-slate-100 border-b border-slate-200">
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setCurrentType('flights');
                  setResultMessage(null);
                  setSelectedFile(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  currentType === 'flights' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-sky-600" />
                <span>Jadwal Penerbangan (Flight)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentType('bookings');
                  setResultMessage(null);
                  setSelectedFile(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  currentType === 'bookings' ? 'bg-white text-sky-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data Reservasi (Bookings)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setResultMessage(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-sky-600 text-sky-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Data (Export)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setResultMessage(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-sky-600 text-sky-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Data (Import)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-xs text-slate-600 space-y-5">
          {activeTab === 'export' ? (
            /* EXPORT VIEW */
            <div className="space-y-4">
              <p className="text-slate-500 leading-relaxed">
                Unduh data {isFlights ? 'jadwal penerbangan & penawaran tarif' : 'seluruh reservasi dan manifest paspor penumpang'} dalam format spreadsheet Excel/CSV atau backup JSON:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition-all group flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span>Format CSV (Excel)</span>
                  </div>
                  <span className="text-[11px] text-emerald-700">
                    Bisa langsung dibuka di Microsoft Excel, Google Sheets, atau aplikasi akuntansi.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100 text-left transition-all group flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center space-x-2 text-sky-800 font-bold">
                    <FileText className="w-5 h-5 text-sky-600" />
                    <span>Format JSON (Backup)</span>
                  </div>
                  <span className="text-[11px] text-sky-700">
                    Format data mentah lengkap untuk sinkronisasi sistem atau migrasi database.
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* IMPORT VIEW */
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <p className="text-slate-500 leading-relaxed">
                Unggah berkas CSV atau JSON untuk {isFlights ? 'menambahkan jadwal charter / promosi khusus rute Indonesia ⇄ Mesir' : 'memulihkan atau menambah data reservasi penumpang'}:
              </p>

              {/* Sample Template Link */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Butuh contoh template?</span>
                  <span className="text-[11px] text-slate-400">Unduh format kolom CSV yang sesuai</span>
                </div>
                <a
                  href={templateEndpoint}
                  download
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-sky-700 font-bold text-xs flex items-center space-x-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </a>
              </div>

              {/* File Input */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-sky-500 transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <label className="block text-xs font-bold text-slate-700 mb-1 cursor-pointer">
                  <span>Pilih file CSV atau JSON</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json,text/csv,application/json"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  {selectedFile ? (
                    <strong className="text-sky-700">File dipilih: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</strong>
                  ) : (
                    'Klik untuk memilih berkas dari komputer Anda (.csv, .json)'
                  )}
                </p>
              </div>

              {/* Result Notice */}
              {resultMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                    resultMessage.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {resultMessage.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span>{resultMessage.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 font-semibold"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Mulai Impor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
