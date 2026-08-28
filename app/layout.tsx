import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trappin' on Wall Street — Premium Edition",
  description: "Secure ebook delivery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
