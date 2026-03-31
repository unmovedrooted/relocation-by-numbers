import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: {
    default: "Relocation by Numbers",
    template: "%s | Relocation by Numbers",
  },
  description:
    "Compare cost of living, take-home pay, housing, and FIRE impact before you move.",
  other: {
    "google-adsense-account": "ca-pub-5257549146198249",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-white text-slate-900 antialiased`}
      >
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        ) : null}

        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5257549146198249"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
                Relocation by Numbers
              </Link>

              <nav className="flex items-center gap-4 text-sm text-slate-600">
                <Link href="/explore" className="transition hover:text-slate-900">
                  Explore
                </Link>
                <Link href="/fire-calculator" className="transition hover:text-slate-900">
                  FIRE Calculator
                </Link>
                <Link href="/international-relocation" className="transition hover:text-slate-900">
                  International
                </Link>
                <Link href="/best-cities-for-fire" className="transition hover:text-slate-900">
                  Best Cities for FIRE
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}