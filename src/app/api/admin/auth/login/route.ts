import { NextRequest, NextResponse } from 'next/server';
import { checkAdminCredentials, generateAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    if (!checkAdminCredentials(username, password)) {
      return NextResponse.json(
        { success: false, error: 'Username atau kata sandi tidak sesuai.' },
        { status: 401 }
      );
    }

    const token = generateAdminToken(username.trim());

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      username: username.trim(),
    });

    // Set HTTP-only secure session cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat login.' },
      { status: 500 }
    );
  }
}
