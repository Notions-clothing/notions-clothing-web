import { NextRequest, NextResponse } from 'next/server';
import { verifyPasswordResetOtp } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, role = 'customer' } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP code are required' }, { status: 400 });
    }

    if (role !== 'customer' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid account role' }, { status: 400 });
    }

    const result = await verifyPasswordResetOtp(email.trim(), role, otp.trim());

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Invalid or expired verification code' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Code verified successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

