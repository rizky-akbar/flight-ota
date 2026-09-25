'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Save, Phone, Check, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface AdminWhatsAppPanelProps {
  onWhatsAppUpdated?: (newNumber: string) => void;
}

export default function AdminWhatsAppPanel({ onWhatsAppUpdated }: AdminWhatsAppPanelProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string>('6281234567890');
  const [inputNumber, setInputNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const fetchWhatsAppNumber = async () => {
    setIsLoading(true);
    // Instant initial load from localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('admin_whatsapp_number');
      if (cached) {
        setWhatsappNumber(cached);
        setInputNumber(cached);
      }
    }

    try {
      const res = await fetch('/api/admin/whatsapp', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.whatsappNumber) {
        setWhatsappNumber(data.whatsappNumber);
        setInputNumber(data.whatsappNumber);
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_whatsapp_number', data.whatsappNumber);
        }
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp number:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppNumber();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNumber.trim()) {
      setToastMessage({ type: 'error', text: 'Nomor WhatsApp tidak boleh kosong.' });
      return;
    }

    setIsSaving(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ whatsappNumber: inputNumber.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        const newNum = data.whatsappNumber;
        setWhatsappNumber(newNum);
        setInputNumber(newNum);
        setIsEditing(false);
        setToastMessage({ type: 'success', text: 'Nomor WhatsApp Admin berhasil diperbarui!' });

        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_whatsapp_number', newNum);
          document.cookie = `admin_wa_number=${newNum}; path=/; max-age=31536000; SameSite=Lax`;
          window.dispatchEvent(new CustomEvent('admin-whatsapp-updated', { detail: newNum }));
        }

        if (onWhatsAppUpdated) onWhatsAppUpdated(newNum);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setToastMessage({ type: 'error', text: data.error || 'Gagal menyimpan nomor WhatsApp.' });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Terjadi kesalahan jaringan saat menyimpan.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Format preview with spaces for readability:
  // Indonesia: 6281234567890 -> +62 812-3456-7890
  // Egypt: 201012345678 -> +20 10-1234-5678
  const formatDisplayPhone = (num: string) => {
    if (!num) return '';
    const cleaned = num.replace(/[^\d]/g, '');
    if (cleaned.startsWith('62') && cleaned.length >= 10) {
      return `+62 ${cleaned.substring(2, 5)}-${cleaned.substring(5, 9)}-${cleaned.substring(9)}`;
    }
    if (cleaned.startsWith('20') && cleaned.length >= 10) {
      return `+20 ${cleaned.substring(2, 4)}-${cleaned.substring(4, 8)}-${cleaned.substring(8)}`;
    }
    return `+${cleaned}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
            <MessageCircle className="w-5 h-5 fill-emerald-600 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-sm">Nomor WhatsApp Penerima Booking Admin</h3>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh data manifes penumpang & reservasi tiket dari web OTA dikirim otomatis ke nomor ini.
            </p>

            {/* Current Active Number Pill */}
            {!isEditing && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs font-bold">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isLoading ? 'Memuat...' : formatDisplayPhone(whatsappNumber)}</span>
                </div>

                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    'Halo Admin, ini tes pesan WhatsApp dari dashboard NileNusantara.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  title="Uji coba kirim pesan ke nomor ini"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Tes Buka WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 self-start md:self-center">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setInputNumber(whatsappNumber);
                setToastMessage(null);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Ubah Nomor
            </button>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div>
                <input
                  type="text"
                  value={inputNumber}
                  onChange={(e) => setInputNumber(e.target.value)}
                  placeholder="Contoh: 081234567890 atau +201..."
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-56"
                  autoFocus
                />
                <span className="block text-[10px] text-slate-400 mt-1">
                  Format otomatis: Indonesia (08../62..) / Mesir (01../20..)
                </span>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center space-x-1 disabled:opacity-60"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setInputNumber(whatsappNumber);
                    setToastMessage(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Toast feedback */}
      {toastMessage && (
        <div
          className={`mt-3 p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
