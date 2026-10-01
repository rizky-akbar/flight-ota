import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Default credentials (can be overridden via environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || 'nilenusantara_admin_secret_key_2026';

export const ADMIN_COOKIE_NAME = 'admin_session_token';

/**
 * Generates an HMAC-SHA256 signed session token
 */
export function generateAdminToken(username: string): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${username}:${expiry}`;
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * Verifies if the session token is valid and not expired
 */
export function verifyAdminToken(token?: string | null): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;

    const [username, expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);

    if (isNaN(expiry) || Date.now() > expiry) {
      return false;
    }

    if (username !== ADMIN_USERNAME) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${username}:${expiryStr}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

/**
 * Validates login credentials
 */
export function checkAdminCredentials(user: string, pass: string): boolean {
  const isUserValid = user.trim() === ADMIN_USERNAME;
  const isPassValid = pass === ADMIN_PASSWORD;
  return isUserValid && isPassValid;
}

/**
 * Checks whether the incoming request is authenticated as admin
 */
export function isAdminAuthenticated(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieToken && verifyAdminToken(cookieToken)) {
    return true;
  }

  // Also check Authorization header Bearer token if provided
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyAdminToken(token);
  }

  return false;
}
