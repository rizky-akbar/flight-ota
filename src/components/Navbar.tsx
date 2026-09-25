'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plane, ShieldCheck, MessageCircle, Globe } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">NileNusantara</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  ID ⇄ EG
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Indonesia ⇄ Egypt Flight Specialist OTA</p>
            </div>
          </Link>

          {/* Center Badge: Real-Time Verified Data */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Jadwal & Tarif Penerbangan Resmi</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
              <button
                onClick={() => onCurrencyChange('USD')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currency === 'USD' ? 'bg-white text-sky-700 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => onCurrencyChange('EGP')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currency === 'EGP' ? 'bg-white text-sky-700 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
              >
                EGP (ج.م)
              </button>
            </div>

            {/* Direct WhatsApp Admin Button */}
            <a
              href={`https://wa.me/${adminPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                'Halo Admin NileNusantara, saya ingin konsultasi penerbangan rute Indonesia - Mesir.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">WhatsApp Admin</span>
              <span className="sm:hidden">WA</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
