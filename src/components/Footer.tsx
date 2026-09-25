'use client';

import React, { useState, useEffect } from 'react';
import { Plane, ShieldCheck, MessageCircle, Heart, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const [adminPhone, setAdminPhone] = useState(process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || '6281234567890');

  useEffect(() => {
    fetch('/api/admin/whatsapp')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.whatsappNumber) {
          setAdminPhone(data.whatsappNumber);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-amber-400 flex items-center justify-center text-white">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">NileNusantara</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Specialist Online Travel Agency for Indonesia ⇄ Egypt routes. Connecting Jakarta, Surabaya, and Bali to Cairo, Alexandria, and the Red Sea.
            </p>
            <div className="flex items-center space-x-2 text-xs text-sky-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Tiket & Jadwal Resmi Terverifikasi</span>
            </div>
          </div>

          {/* Col 2: Popular Routes */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Popular Routes</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Jakarta (CGK) ➔ Cairo (CAI)</li>
              <li>Cairo (CAI) ➔ Jakarta (CGK)</li>
              <li>Surabaya (SUB) ➔ Cairo (CAI)</li>
              <li>Bali (DPS) ➔ Cairo (CAI)</li>
              <li>Medan (KNO) ➔ Alexandria (HBE)</li>
              <li>Jakarta (CGK) ➔ Sharm El Sheikh (SSH)</li>
            </ul>
          </div>

          {/* Col 3: Special Programs */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Special Assistance</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Al-Azhar Cairo Student Baggage Assistance</li>
              <li>• Umrah + Cairo Transit Packages (Saudia/EgyptAir)</li>
              <li>• Group & Family Booking Desk</li>
              <li>• Visa Requirement Consultation</li>
              <li>• Flexible Payment & Ticket Issuing via WhatsApp</li>
            </ul>
          </div>

          {/* Col 4: WhatsApp Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">WhatsApp Admin Desk</h4>
            <p className="text-xs text-slate-400 mb-3">
              Fast response for reservation holds, PNR confirmation, seat selection, and e-ticket issuance.
            </p>
            <a
              href={`https://wa.me/${adminPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                'Halo Admin NileNusantara, saya membutuhkan info tiket pesawat Indonesia - Mesir.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat WhatsApp Admin</span>
            </a>
            <p className="text-[11px] text-slate-500 mt-2">Nomor: +{adminPhone}</p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NileNusantara OTA. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Sistem Reservasi Penerbangan Terintegrasi</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
