import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const plan = body?.plan || 'pro';

    // If a real Stripe secret key is present, you could call Stripe SDK here.
    // For now return a mock URL so the UI flow can be tested locally.
    const mockUrl = `http://localhost:3013/?mock_checkout=1&plan=${encodeURIComponent(plan)}`;

    return NextResponse.json({ url: mockUrl });
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
