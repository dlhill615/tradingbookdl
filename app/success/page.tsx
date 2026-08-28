import Link from 'next/link';

export default function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  return <SuccessContent searchParams={searchParams} />;
}

async function SuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <main className="wrap">
        <section className="card">
          <h1>Purchase not found</h1>
          <p>Please return to your Stripe receipt and use the delivery link from your completed checkout.</p>
          <Link className="btn" href="/">Return</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="wrap">
      <section className="card">
        <h1>Thank You.</h1>
        <p>Your payment has been received. Click below to download your Premium Edition ebook.</p>
        <a className="btn" href={`/api/download?session_id=${encodeURIComponent(session_id)}`}>
          DOWNLOAD PREMIUM EDITION
        </a>
        <p className="small">Your download is verified against your Stripe purchase before the file is delivered.</p>
      </section>
    </main>
  );
}
