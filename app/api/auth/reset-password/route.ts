import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithOtp } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword, role = 'customer' } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP code, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (role !== 'customer' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid account role' }, { status: 400 });
    }

    const result = await resetPasswordWithOtp(email.trim(), role, otp.trim(), newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to reset password' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

