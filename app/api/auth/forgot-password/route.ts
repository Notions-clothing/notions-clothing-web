import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetOtp } from '@/lib/db';
import { sendPasswordResetOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, role = 'customer' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (role !== 'customer' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid account role' }, { status: 400 });
    }

    const result = await createPasswordResetOtp(email.trim(), role);

    if (!result.success || !result.otp) {
      return NextResponse.json({ error: result.error || 'Failed to initiate password reset' }, { status: 400 });
    }

    // Send OTP verification email
    try {
      const emailRes = await sendPasswordResetOtpEmail({
        email: email.trim(),
        name: result.name || (role === 'admin' ? 'Administrator' : 'Customer'),
        otp: result.otp,
        role,
      });

      if (!emailRes.success) {
        console.error('OTP email dispatch returned error:', emailRes.message);
        return NextResponse.json(
          { error: emailRes.message || 'Failed to deliver security verification email. Please try again.' },
          { status: 500 }
        );
      }
    } catch (e: any) {
      console.error('OTP email dispatch error:', e);
      return NextResponse.json(
        { error: 'Failed to deliver security verification email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email address.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

