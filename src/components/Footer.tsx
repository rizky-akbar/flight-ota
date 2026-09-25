'use client';

import React, { useState, useEffect } from 'react';
import { Plane, ShieldCheck, MessageCircle } from 'lucide-react';

export default function Footer() {
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
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-12 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-amber-400 flex items-center justify-center text-white flex-shrink-0">
                <Plane className="w-4 h-4 sm:w-5 sm:h-5 -rotate-45" />
              </div>
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">NileNusantara</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Specialist Online Travel Agency untuk rute Indonesia ⇄ Mesir. Menghubungkan Jakarta, Surabaya, dan Bali ke Kairo, Alexandria, dan Laut Merah.
            </p>
            <div className="flex items-center space-x-2 text-xs text-sky-400 font-medium">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Tiket & Jadwal Resmi Terverifikasi</span>
            </div>
          </div>

          {/* Col 2: Popular Routes */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-2.5 sm:mb-3">Rute Populer</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-slate-400">
              <li>Jakarta (CGK) ➔ Kairo (CAI)</li>
              <li>Kairo (CAI) ➔ Jakarta (CGK)</li>
              <li>Surabaya (SUB) ➔ Kairo (CAI)</li>
              <li>Bali (DPS) ➔ Kairo (CAI)</li>
              <li>Medan (KNO) ➔ Alexandria (HBE)</li>
              <li>Jakarta (CGK) ➔ Sharm El Sheikh (SSH)</li>
            </ul>
          </div>

          {/* Col 3: Special Programs */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-2.5 sm:mb-3">Layanan Khusus</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-slate-400">
              <li>• Kuota Bagasi Pelajar Al-Azhar Kairo</li>
              <li>• Paket Transit Umrah (Saudia/EgyptAir)</li>
              <li>• Meja Booking Rombongan & Keluarga</li>
              <li>• Konsultasi Visa Studi & Transit</li>
              <li>• Pembayaran & Penerbitan E-Tiket Cepat</li>
            </ul>
          </div>

          {/* Col 4: WhatsApp Support */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-2.5 sm:mb-3">WhatsApp Admin Desk</h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Respon cepat untuk hold reservasi, konfirmasi kode booking (PNR), dan penerbitan tiket elektronik.
            </p>
            <a
              href={`https://wa.me/${adminPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                'Halo Admin NileNusantara, saya membutuhkan info tiket pesawat Indonesia - Mesir.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow w-full sm:w-auto active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white flex-shrink-0" />
              <span>Chat WhatsApp Admin</span>
            </a>
            <p className="text-[11px] text-slate-400 mt-2">Nomor: +{adminPhone}</p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 text-center sm:text-left">
          <p>© {new Date().getFullYear()} NileNusantara OTA. Seluruh hak cipta dilindungi.</p>
          <p className="flex items-center space-x-1">
            <span>Sistem Reservasi Penerbangan Resmi Terintegrasi</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
