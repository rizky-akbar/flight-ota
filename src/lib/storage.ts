import fs from 'fs';
import path from 'path';
import { BookingInquiry, FlightOffer } from './travelport/types';
import { MarkupSettings, DEFAULT_MARKUP_SETTINGS } from './travelport/markup';

// In-memory cache fallback (persists across function invocations within the same container)
let memoryInquiries: BookingInquiry[] = [];
let memoryCustomFlights: FlightOffer[] = [];
let memoryMarkupSettings: MarkupSettings | null = null;
let memoryWhatsAppNumber: string | null = null;

/**
 * Returns the writable directory for data storage.
 * On Vercel / AWS Lambda, process.cwd() is read-only (EROFS), so /tmp is used.
 * In local development, process.cwd()/data is used.
 */
export function getDataDir(): string {
  const isServerless = process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const tmpDir = path.join('/tmp', 'flight-ota-data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      // Seed files from process.cwd()/data if available
      const cwdData = path.join(process.cwd(), 'data');
      if (fs.existsSync(cwdData)) {
        const files = [
          'whatsapp_settings.json',
          'currency_settings.json',
          'markup_settings.json',
          'inquiries.json',
          'custom_flights.json',
        ];
        for (const file of files) {
          const srcFile = path.join(cwdData, file);
          const destFile = path.join(tmpDir, file);
          if (fs.existsSync(srcFile) && !fs.existsSync(destFile)) {
            try {
              fs.copyFileSync(srcFile, destFile);
            } catch {
              // Ignore copy error
            }
          }
        }
      }
      return tmpDir;
    } catch (e) {
      console.warn('[Storage] Could not initialize /tmp directory:', e);
    }
  }

  // Local / standard Node environment
  const localDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    // If localDir cannot be written to, fallback to /tmp
    const tmpDir = path.join('/tmp', 'flight-ota-data');
    try {
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      return tmpDir;
    } catch {
      return localDir;
    }
  }
}

export function getFilePath(filename: string): string {
  return path.join(getDataDir(), filename);
}

export function safeWriteFileSync(filePath: string, data: string): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, data, 'utf-8');
    return true;
  } catch (err) {
    console.warn(`[Storage] Safe write failed for ${filePath} (using memory fallback):`, err);
    return false;
  }
}

export function safeReadFileSync(filePath: string, fallbackFilename?: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    if (fallbackFilename) {
      const fallbackPath = path.join(process.cwd(), 'data', fallbackFilename);
      if (fs.existsSync(fallbackPath)) {
        return fs.readFileSync(fallbackPath, 'utf-8');
      }
    }
  } catch (err) {
    console.warn(`[Storage] Safe read failed for ${filePath}:`, err);
  }
  return null;
}

function ensureDataFiles() {
  try {
    const inquiriesFile = getFilePath('inquiries.json');
    if (!fs.existsSync(inquiriesFile)) {
      safeWriteFileSync(inquiriesFile, JSON.stringify([], null, 2));
    }
    const customFlightsFile = getFilePath('custom_flights.json');
    if (!fs.existsSync(customFlightsFile)) {
      safeWriteFileSync(customFlightsFile, JSON.stringify([], null, 2));
    }
    const markupFile = getFilePath('markup_settings.json');
    if (!fs.existsSync(markupFile)) {
      safeWriteFileSync(markupFile, JSON.stringify(DEFAULT_MARKUP_SETTINGS, null, 2));
    }
    const waFile = getFilePath('whatsapp_settings.json');
    if (!fs.existsSync(waFile)) {
      const defaultPhone = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || '6281234567890';
      safeWriteFileSync(
        waFile,
        JSON.stringify({ whatsappNumber: defaultPhone, lastUpdated: new Date().toISOString() }, null, 2)
      );
    }
  } catch (err) {
    console.error('[Storage] Error ensuring data files:', err);
  }
}

/* ==================== BOOKING INQUIRIES ==================== */

export function getAllInquiries(): BookingInquiry[] {
  try {
    ensureDataFiles();
    const filePath = getFilePath('inquiries.json');
    const content = safeReadFileSync(filePath, 'inquiries.json');
    if (content) {
      const data = JSON.parse(content);
      memoryInquiries = data;
      return data;
    }
  } catch (err) {
    console.error('[Storage] Error reading inquiries:', err);
  }
  return memoryInquiries;
}

export function saveInquiry(inquiry: BookingInquiry): void {
  try {
    ensureDataFiles();
    const current = getAllInquiries();
    const updated = [inquiry, ...current.filter((i) => i.bookingId !== inquiry.bookingId)];
    memoryInquiries = updated;
    const filePath = getFilePath('inquiries.json');
    safeWriteFileSync(filePath, JSON.stringify(updated, null, 2));
  } catch (err) {
    console.error('[Storage] Error saving inquiry:', err);
    memoryInquiries = [inquiry, ...memoryInquiries];
  }
}

export function importInquiries(newInquiries: BookingInquiry[]): { added: number; updated: number; total: number } {
  try {
    ensureDataFiles();
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
    const filePath = getFilePath('inquiries.json');
    safeWriteFileSync(filePath, JSON.stringify(merged, null, 2));

    return { added: addedCount, updated: updatedCount, total: merged.length };
  } catch (err) {
    console.error('[Storage] Error importing inquiries:', err);
    return { added: 0, updated: 0, total: memoryInquiries.length };
  }
}

export function updateInquiryStatus(bookingId: string, status: BookingInquiry['status']): BookingInquiry | null {
  try {
    ensureDataFiles();
    const current = getAllInquiries();
    const item = current.find((i) => i.bookingId === bookingId);
    if (!item) return null;
    item.status = status;
    saveInquiry(item);
    return item;
  } catch (err) {
    console.error('[Storage] Error updating status:', err);
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
    ensureDataFiles();
    const filePath = getFilePath('custom_flights.json');
    const content = safeReadFileSync(filePath, 'custom_flights.json');
    if (content) {
      const data = JSON.parse(content);
      memoryCustomFlights = data;
      return data;
    }
  } catch (err) {
    console.error('[Storage] Error reading custom flights:', err);
  }
  return memoryCustomFlights;
}

export function importCustomFlights(flights: FlightOffer[]): { added: number; updated: number; total: number } {
  try {
    ensureDataFiles();
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
    const filePath = getFilePath('custom_flights.json');
    safeWriteFileSync(filePath, JSON.stringify(merged, null, 2));

    return { added: addedCount, updated: updatedCount, total: merged.length };
  } catch (err) {
    console.error('[Storage] Error importing custom flights:', err);
    return { added: 0, updated: 0, total: memoryCustomFlights.length };
  }
}

/* ==================== MARKUP SETTINGS ==================== */

export function getMarkupSettings(): MarkupSettings {
  try {
    ensureDataFiles();
    const filePath = getFilePath('markup_settings.json');
    const content = safeReadFileSync(filePath, 'markup_settings.json');
    if (content) {
      const data: MarkupSettings = JSON.parse(content);
      memoryMarkupSettings = data;
      return data;
    }
  } catch (err) {
    console.error('[Storage] Error reading markup settings:', err);
  }
  return memoryMarkupSettings || DEFAULT_MARKUP_SETTINGS;
}

export function saveMarkupSettings(settings: MarkupSettings): MarkupSettings {
  try {
    ensureDataFiles();
    const updated: MarkupSettings = {
      ...settings,
      lastUpdated: new Date().toISOString(),
    };
    memoryMarkupSettings = updated;
    const filePath = getFilePath('markup_settings.json');
    safeWriteFileSync(filePath, JSON.stringify(updated, null, 2));
    return updated;
  } catch (err) {
    console.error('[Storage] Error saving markup settings:', err);
    memoryMarkupSettings = settings;
    return settings;
  }
}

/* ==================== WHATSAPP ADMIN NUMBER ==================== */

export function sanitizeWhatsAppPhone(phone: string): string {
  if (!phone) return '6281234567890';
  let cleaned = String(phone).trim();

  // Strip common URL prefixes if user pasted a wa.me / api.whatsapp URL
  cleaned = cleaned.replace(/^https?:\/\/(wa\.me|api\.whatsapp\.com\/send\?phone=)\/?/i, '');
  cleaned = cleaned.replace(/^wa\.me\//i, '');

  // Keep only digits and leading plus
  cleaned = cleaned.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Indonesian local number: 08... -> 628...
  if (cleaned.startsWith('08')) {
    cleaned = '628' + cleaned.substring(2);
  }
  // Egyptian local number starting with 01 (010, 011, 012, 015): 01xxxxxxxxx -> 201xxxxxxxxx
  else if (cleaned.startsWith('01') && cleaned.length >= 10 && cleaned.length <= 11) {
    cleaned = '201' + cleaned.substring(2);
  }
  // Generic 0...: convert to 62...
  else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  // Indonesian number typed without 0 or 62 (e.g. 81234567890)
  else if (cleaned.startsWith('8') && cleaned.length >= 9 && cleaned.length <= 13) {
    cleaned = '62' + cleaned;
  }

  // Fallback if cleaned string is too short to be a valid phone
  if (cleaned.length < 7) {
    cleaned = '6281234567890';
  }

  return cleaned;
}

export function getWhatsAppNumber(): string {
  if (memoryWhatsAppNumber) {
    return memoryWhatsAppNumber;
  }

  try {
    ensureDataFiles();
    const filePath = getFilePath('whatsapp_settings.json');
    const content = safeReadFileSync(filePath, 'whatsapp_settings.json');
    if (content) {
      const data = JSON.parse(content);
      if (data && data.whatsappNumber) {
        memoryWhatsAppNumber = sanitizeWhatsAppPhone(data.whatsappNumber);
        return memoryWhatsAppNumber;
      }
    }
  } catch (err) {
    console.error('[Storage] Error reading WhatsApp number:', err);
  }

  const envPhone = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || process.env.WHATSAPP_ADMIN;
  if (envPhone) {
    memoryWhatsAppNumber = sanitizeWhatsAppPhone(envPhone);
    return memoryWhatsAppNumber;
  }

  return '6281234567890';
}

export function saveWhatsAppNumber(phoneNumber: string): string {
  const cleaned = sanitizeWhatsAppPhone(phoneNumber);
  memoryWhatsAppNumber = cleaned;

  try {
    ensureDataFiles();
    const filePath = getFilePath('whatsapp_settings.json');
    safeWriteFileSync(
      filePath,
      JSON.stringify({ whatsappNumber: cleaned, lastUpdated: new Date().toISOString() }, null, 2)
    );
  } catch (err) {
    console.error('[Storage] Error saving WhatsApp number:', err);
  }

  return cleaned;
}
