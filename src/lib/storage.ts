import fs from 'fs';
import path from 'path';
import { BookingInquiry, FlightOffer } from './travelport/types';
import { MarkupSettings, DEFAULT_MARKUP_SETTINGS } from './travelport/markup';

const DATA_DIR = path.join(process.cwd(), 'data');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const CUSTOM_FLIGHTS_FILE = path.join(DATA_DIR, 'custom_flights.json');
const MARKUP_SETTINGS_FILE = path.join(DATA_DIR, 'markup_settings.json');
const WHATSAPP_SETTINGS_FILE = path.join(DATA_DIR, 'whatsapp_settings.json');

// In-memory cache fallback
let memoryInquiries: BookingInquiry[] = [];
let memoryCustomFlights: FlightOffer[] = [];
let memoryMarkupSettings: MarkupSettings | null = null;
let memoryWhatsAppNumber: string | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(INQUIRIES_FILE)) {
      fs.writeFileSync(INQUIRIES_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    if (!fs.existsSync(CUSTOM_FLIGHTS_FILE)) {
      fs.writeFileSync(CUSTOM_FLIGHTS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    if (!fs.existsSync(MARKUP_SETTINGS_FILE)) {
      fs.writeFileSync(MARKUP_SETTINGS_FILE, JSON.stringify(DEFAULT_MARKUP_SETTINGS, null, 2), 'utf-8');
    }
    if (!fs.existsSync(WHATSAPP_SETTINGS_FILE)) {
      const defaultPhone = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || '6281234567890';
      fs.writeFileSync(
        WHATSAPP_SETTINGS_FILE,
        JSON.stringify({ whatsappNumber: defaultPhone, lastUpdated: new Date().toISOString() }, null, 2),
        'utf-8'
      );
    }
  } catch (err) {
    console.error('Could not initialize data files:', err);
  }
}

/* ==================== BOOKING INQUIRIES ==================== */

export function getAllInquiries(): BookingInquiry[] {
  try {
    ensureDataDir();
    if (fs.existsSync(INQUIRIES_FILE)) {
      const content = fs.readFileSync(INQUIRIES_FILE, 'utf-8');
      const data = JSON.parse(content);
      memoryInquiries = data;
      return data;
    }
  } catch (err) {
    console.error('Error reading inquiries:', err);
  }
  return memoryInquiries;
}

export function saveInquiry(inquiry: BookingInquiry): void {
  try {
    ensureDataDir();
    const current = getAllInquiries();
    const updated = [inquiry, ...current.filter((i) => i.bookingId !== inquiry.bookingId)];
    memoryInquiries = updated;
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving inquiry to disk, using memory fallback:', err);
    memoryInquiries = [inquiry, ...memoryInquiries];
  }
}

export function importInquiries(newInquiries: BookingInquiry[]): { added: number; updated: number; total: number } {
  try {
    ensureDataDir();
    const current = getAllInquiries();
    let addedCount = 0;
    let updatedCount = 0;

    const map = new Map<string, BookingInquiry>();
    current.forEach((item) => map.set(item.bookingId, item));

    newInquiries.forEach((item) => {
      if (map.has(item.bookingId)) {
        updatedCount++;
      } else {
        addedCount++;
      }
      map.set(item.bookingId, item);
    });

    const merged = Array.from(map.values());
    memoryInquiries = merged;
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(merged, null, 2), 'utf-8');

    return { added: addedCount, updated: updatedCount, total: merged.length };
  } catch (err) {
    console.error('Error importing inquiries:', err);
    return { added: 0, updated: 0, total: memoryInquiries.length };
  }
}

export function updateInquiryStatus(bookingId: string, status: BookingInquiry['status']): BookingInquiry | null {
  try {
    ensureDataDir();
    const current = getAllInquiries();
    const item = current.find((i) => i.bookingId === bookingId);
    if (!item) return null;
    item.status = status;
    saveInquiry(item);
    return item;
  } catch (err) {
    console.error('Error updating status:', err);
    return null;
  }
}

export function generateBookingId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EGID-${rand}`;
}

/* ==================== CUSTOM FLIGHT SCHEDULES ==================== */

export function getCustomFlights(): FlightOffer[] {
  try {
    ensureDataDir();
    if (fs.existsSync(CUSTOM_FLIGHTS_FILE)) {
      const content = fs.readFileSync(CUSTOM_FLIGHTS_FILE, 'utf-8');
      const data = JSON.parse(content);
      memoryCustomFlights = data;
      return data;
    }
  } catch (err) {
    console.error('Error reading custom flights:', err);
  }
  return memoryCustomFlights;
}

export function importCustomFlights(flights: FlightOffer[]): { added: number; updated: number; total: number } {
  try {
    ensureDataDir();
    const current = getCustomFlights();
    let addedCount = 0;
    let updatedCount = 0;

    const map = new Map<string, FlightOffer>();
    current.forEach((item) => map.set(item.id, item));

    flights.forEach((item) => {
      if (map.has(item.id)) {
        updatedCount++;
      } else {
        addedCount++;
      }
      map.set(item.id, item);
    });

    const merged = Array.from(map.values());
    memoryCustomFlights = merged;
    fs.writeFileSync(CUSTOM_FLIGHTS_FILE, JSON.stringify(merged, null, 2), 'utf-8');

    return { added: addedCount, updated: updatedCount, total: merged.length };
  } catch (err) {
    console.error('Error importing custom flights:', err);
    return { added: 0, updated: 0, total: memoryCustomFlights.length };
  }
}

/* ==================== MARKUP SETTINGS ==================== */

export function getMarkupSettings(): MarkupSettings {
  try {
    ensureDataDir();
    if (fs.existsSync(MARKUP_SETTINGS_FILE)) {
      const content = fs.readFileSync(MARKUP_SETTINGS_FILE, 'utf-8');
      const data: MarkupSettings = JSON.parse(content);
      memoryMarkupSettings = data;
      return data;
    }
  } catch (err) {
    console.error('Error reading markup settings:', err);
  }
  return memoryMarkupSettings || DEFAULT_MARKUP_SETTINGS;
}

export function saveMarkupSettings(settings: MarkupSettings): MarkupSettings {
  try {
    ensureDataDir();
    const updated: MarkupSettings = {
      ...settings,
      lastUpdated: new Date().toISOString(),
    };
    memoryMarkupSettings = updated;
    fs.writeFileSync(MARKUP_SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.error('Error saving markup settings:', err);
    memoryMarkupSettings = settings;
    return settings;
  }
}

/* ==================== WHATSAPP ADMIN NUMBER ==================== */

export function getWhatsAppNumber(): string {
  try {
    ensureDataDir();
    if (fs.existsSync(WHATSAPP_SETTINGS_FILE)) {
      const content = fs.readFileSync(WHATSAPP_SETTINGS_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data && data.whatsappNumber) {
        memoryWhatsAppNumber = data.whatsappNumber;
        return data.whatsappNumber;
      }
    }
  } catch (err) {
    console.error('Error reading WhatsApp number:', err);
  }
  return memoryWhatsAppNumber || process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || '6281234567890';
}

export function saveWhatsAppNumber(phoneNumber: string): string {
  try {
    ensureDataDir();
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    if (!cleaned) {
      cleaned = '6281234567890';
    }

    memoryWhatsAppNumber = cleaned;
    fs.writeFileSync(
      WHATSAPP_SETTINGS_FILE,
      JSON.stringify({ whatsappNumber: cleaned, lastUpdated: new Date().toISOString() }, null, 2),
      'utf-8'
    );
    return cleaned;
  } catch (err) {
    console.error('Error saving WhatsApp number:', err);
    memoryWhatsAppNumber = phoneNumber;
    return phoneNumber;
  }
}


