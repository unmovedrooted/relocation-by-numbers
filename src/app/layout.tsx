import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Salary vs Cost of Living Calculator | Relocation Affordability Tool",
  description:
    "Compare take-home pay and housing affordability across all 50 states. Buy vs rent, taxes, PMI, and real relocation cost analysis.",
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
        <div className="flex min-h-screen flex-col">
          <div className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 py-3 text-sm text-slate-500 sm:px-6 lg:px-8">
              <a href="/about" className="transition hover:text-slate-900">
                About
              </a>
              <span>•</span>
              <a href="/disclaimer" className="transition hover:text-slate-900">
                Disclaimer
              </a>
              <span>•</span>
              <a href="/privacy" className="transition hover:text-slate-900">
                Privacy
              </a>
              <span>•</span>
              <a href="/terms" className="transition hover:text-slate-900">
                Terms
              </a>
            </div>
          </div>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}