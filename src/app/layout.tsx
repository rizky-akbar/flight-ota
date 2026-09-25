import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NileNusantara - Tiket Pesawat Indonesia ⇄ Mesir Resmi Terverifikasi',
  description: 'Pemesanan tiket pesawat spesialis rute Indonesia (Jakarta, Surabaya, Bali) ke Mesir (Kairo, Alexandria) dan sebaliknya dengan jadwal penerbangan resmi terpercaya & konfirmasi instan WhatsApp Admin.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#075985',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
