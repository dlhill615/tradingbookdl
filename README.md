# Trappin' on Wall Street — Secure Delivery

This project is the Vercel delivery portal for the Premium Edition ebook.

## Required Vercel environment variables

- `STRIPE_SECRET_KEY` — Stripe secret key for the account that owns the ebook checkout.
- `STRIPE_PRICE_ID` — the Stripe Price ID for the ebook product.
- `BLOB_READ_WRITE_TOKEN` — automatically supplied when a private Vercel Blob store is connected to the project.
- `BOOK_BLOB_PATHNAME` — the exact pathname of the private Blob containing the PDF.

## Stripe success redirect

Configure the existing Stripe Payment Link to redirect customers after payment to:

`https://trappin-on-wall-street-fixed.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`

The `{CHECKOUT_SESSION_ID}` placeholder is supplied by Stripe after a successful Checkout Session.

## Security model

The PDF is not stored in this repository. It should be uploaded to a **private** Vercel Blob store. The download route retrieves the Stripe Checkout Session server-side, requires `payment_status=paid`, and verifies the purchased Price ID before streaming the private PDF.

Never commit `STRIPE_SECRET_KEY` or `BLOB_READ_WRITE_TOKEN` to GitHub.
