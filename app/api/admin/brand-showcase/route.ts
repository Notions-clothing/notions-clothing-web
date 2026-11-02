import { NextResponse } from 'next/server';
import { getBrandShowcase, updateBrandShowcase } from '@/lib/db';

export async function GET() {
  try {
    const showcase = await getBrandShowcase();
    return NextResponse.json(showcase);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch brand showcase' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Backend validation
    if (typeof data.is_enabled !== 'undefined' && typeof data.is_enabled !== 'boolean') {
      return NextResponse.json({ error: 'is_enabled must be a boolean' }, { status: 400 });
    }

    if (data.heading && typeof data.heading !== 'string') {
      return NextResponse.json({ error: 'heading must be a string' }, { status: 400 });
    }

    if (data.button_text && typeof data.button_text !== 'string') {
      return NextResponse.json({ error: 'button_text must be a string' }, { status: 400 });
    }

    const updated = await updateBrandShowcase(data);
    return NextResponse.json({ success: true, brand_showcase: updated });
  } catch (err: any) {
    console.error('Failed to update brand showcase:', err);
    return NextResponse.json({ error: err.message || 'Failed to update brand showcase' }, { status: 500 });
  }
}

