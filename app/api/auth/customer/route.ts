import { NextRequest, NextResponse } from 'next/server';
import {
  createCustomer,
  authenticateCustomer,
  getCustomerById,
  getCustomerByEmail,
} from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

const SESSION_COOKIE = 'notions_customer_session';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(SESSION_COOKIE);
    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false, customer: null });
    }

    // Session cookie stores base64 encoded { id, email }
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf8'));
    if (!sessionData?.id) {
      return NextResponse.json({ authenticated: false, customer: null });
    }

    const customer = await getCustomerById(sessionData.id);
    if (!customer) {
      const response = NextResponse.json({ authenticated: false, customer: null });
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    return NextResponse.json({ authenticated: true, customer });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, customer: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. SIGN UP / REGISTRATION
    if (action === 'register') {
      const { email, password, fullName, phone } = body;
      const result = await createCustomer({ email, password, fullName, phone });

      if (!result.success || !result.customer) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      // Automatically send Welcome Email
      try {
        await sendWelcomeEmail({
          email: result.customer.email,
          name: result.customer.full_name,
        });
      } catch (e) {
        console.error('Welcome email error (non-blocking):', e);
      }

      const response = NextResponse.json({
        success: true,
        message: 'Account created successfully',
        customer: result.customer,
      });

      // Set secure session cookie (30 days)
      const sessionPayload = Buffer.from(
        JSON.stringify({ id: result.customer.id, email: result.customer.email })
      ).toString('base64');

      response.cookies.set({
        name: SESSION_COOKIE,
        value: sessionPayload,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    // 2. SIGN IN / LOGIN
    if (action === 'login') {
      const { email, password } = body;
      const result = await authenticateCustomer(email, password);

      if (!result.success || !result.customer) {
        return NextResponse.json({ success: false, error: result.error || 'Invalid credentials' }, { status: 401 });
      }

      const response = NextResponse.json({
        success: true,
        message: 'Signed in successfully',
        customer: result.customer,
      });

      const sessionPayload = Buffer.from(
        JSON.stringify({ id: result.customer.id, email: result.customer.email })
      ).toString('base64');

      response.cookies.set({
        name: SESSION_COOKIE,
        value: sessionPayload,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    // 3. SIGN OUT / LOGOUT
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Authentication error' }, { status: 500 });
  }
}

