import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.relocationbynumbers.com"),
  title: "Salary vs Cost of Living Calculator | Relocation Affordability Tool",
  description:
    "Compare take-home pay and housing affordability across all 50 states. Buy vs rent, taxes, PMI, and real relocation cost analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-slate-900">
        {children}

        <footer className="text-xs text-slate-500 mt-12 text-center pb-8">
          <Link href="/about">About</Link> •{" "}
  <Link href="/disclaimer">Disclaimer</Link> •{" "}
  <Link href="/privacy">Privacy</Link> •{" "}
  <Link href="/terms">Terms</Link>
        </footer>

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CMC28W825G"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CMC28W825G');
          `}
        </Script>

      </body>
    </html>
  );
}