'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plane, ShieldCheck, MessageCircle } from 'lucide-react';

interface NavbarProps {
  currency: 'USD' | 'EGP';
  onCurrencyChange: (curr: 'USD' | 'EGP') => void;
}

export default function Navbar({ currency, onCurrencyChange }: NavbarProps) {
  const [adminPhone, setAdminPhone] = useState(process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || '6281234567890');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('admin_whatsapp_number');
      if (cached) setAdminPhone(cached);
    }

    fetch('/api/admin/whatsapp', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.whatsappNumber) {
          setAdminPhone(data.whatsappNumber);
          if (typeof window !== 'undefined') {
            localStorage.setItem('admin_whatsapp_number', data.whatsappNumber);
          }
        }
      })
      .catch(() => {});

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setAdminPhone(e.detail);
      }
    };
    window.addEventListener('admin-whatsapp-updated', handleUpdate);
    return () => window.removeEventListener('admin-whatsapp-updated', handleUpdate);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
              <Plane className="w-4 h-4 sm:w-5 sm:h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">NileNusantara</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  ID ⇄ EG
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Indonesia ⇄ Egypt Flight Specialist OTA</p>
            </div>
          </Link>

          {/* Center Badge: Real-Time Verified Data (Desktop Only) */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Jadwal & Tarif Penerbangan Resmi</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => onCurrencyChange('USD')}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-[11px] sm:text-xs ${
                  currency === 'USD' ? 'bg-white text-sky-700 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
                title="Tampilkan harga dalam US Dollar"
              >
                <span className="sm:hidden">USD</span>
                <span className="hidden sm:inline">USD ($)</span>
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange('EGP')}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-[11px] sm:text-xs ${
                  currency === 'EGP' ? 'bg-white text-sky-700 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
                title="Tampilkan harga dalam Egyptian Pound"
              >
                <span className="sm:hidden">EGP</span>
                <span className="hidden sm:inline">EGP (ج.م)</span>
              </button>
            </div>

            {/* Direct WhatsApp Admin Button */}
            <a
              href={`https://wa.me/${adminPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                'Halo Admin NileNusantara, saya ingin konsultasi penerbangan rute Indonesia - Mesir.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white flex-shrink-0" />
              <span className="hidden sm:inline">WhatsApp Admin</span>
              <span className="sm:hidden text-[11px]">Admin</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
