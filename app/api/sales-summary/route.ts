import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const reportingToken = process.env.REPORTING_TOKEN;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePriceId = process.env.STRIPE_PRICE_ID;

  if (!reportingToken || !stripeSecretKey || !stripePriceId) {
    return NextResponse.json({ error: 'Sales reporting service is not configured.' }, { status: 500 });
  }

  const authorization = request.headers.get('authorization');
  if (authorization !== `Bearer ${reportingToken}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const sessions: Stripe.Checkout.Session[] = [];
    let startingAfter: string | undefined;

    // Pull complete Checkout Sessions and keep only paid sessions for the ebook price.
    // Pagination keeps the endpoint useful as sales grow beyond 100 sessions.
    for (let page = 0; page < 20; page += 1) {
      const response = await stripe.checkout.sessions.list({
        limit: 100,
        status: 'complete',
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      sessions.push(...response.data);

      if (!response.has_more || response.data.length === 0) break;
      startingAfter = response.data[response.data.length - 1].id;
    }

    const sales = [];

    for (const session of sessions) {
      if (session.payment_status !== 'paid' || session.mode !== 'payment') continue;

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
        expand: ['data.price'],
      });

      const ebookItem = lineItems.data.find((item) => {
        const priceId = typeof item.price === 'string' ? item.price : item.price?.id;
        return priceId === stripePriceId;
      });

      if (!ebookItem) continue;

      sales.push({
        saleId: sales.length + 1,
        date: new Date(session.created * 1000).toISOString(),
        checkoutSessionId: session.id,
        amount: (session.amount_total ?? 0) / 100,
        discount: (session.total_details?.amount_discount ?? 0) / 100,
        currency: (session.currency ?? 'usd').toUpperCase(),
        couponUsed: (session.total_details?.amount_discount ?? 0) > 0 ? 'FIRST100' : '',
        paymentLink: session.payment_link ?? '',
        status: 'Paid',
      });
    }

    sales.sort((a, b) => b.date.localeCompare(a.date));

    const grossRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const discountRedemptions = sales.filter((sale) => sale.couponUsed === 'FIRST100').length;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totalSales: sales.length,
      grossRevenue,
      discountRedemptions,
      first100Remaining: Math.max(0, 100 - discountRedemptions),
      sales,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Automated sales reporting failed:', error);
    return NextResponse.json({ error: 'Unable to retrieve sales.' }, { status: 500 });
  }
}
