import { get } from '@vercel/blob';
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Missing or invalid checkout session.' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID || !process.env.BOOK_BLOB_PATHNAME) {
    return NextResponse.json({ error: 'Delivery service is not configured.' }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    const lineItem = session.line_items?.data?.[0];
    const purchasedPriceId = typeof lineItem?.price === 'string' ? lineItem.price : lineItem?.price?.id;

    if (
      session.payment_status !== 'paid' ||
      session.mode !== 'payment' ||
      purchasedPriceId !== process.env.STRIPE_PRICE_ID
    ) {
      return NextResponse.json({ error: 'This checkout session is not authorized for this ebook.' }, { status: 403 });
    }

    const blob = await get(process.env.BOOK_BLOB_PATHNAME, { access: 'private' });

    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: 'Ebook file is temporarily unavailable.' }, { status: 404 });
    }

    return new NextResponse(blob.stream, {
      headers: {
        'Content-Type': blob.blob.contentType || 'application/pdf',
        'Content-Disposition': 'attachment; filename="Trappin-on-Wall-Street-Premium-Edition.pdf"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Secure ebook download failed:', error);
    return NextResponse.json({ error: 'Unable to verify this purchase.' }, { status: 500 });
  }
}
