import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/ThemeToggle";
// @ts-ignore: allow importing global CSS in Next.js app
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

const NAV_LINKS = [
  { href: "/explore",               label: "Explore" },
  { href: "/fire-calculator",       label: "FIRE Calculator" },
  { href: "/mortgage-calculator",   label: "Mortgage" },
  { href: "/international-relocation", label: "International" },
  { href: "/one-income-relocation-calculator",  label: "Income Calculator" },
  { href: "/blog", label: "Blogs" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
            strategy="beforeInteractive"
          />

          <div className="flex min-h-screen flex-col">
            <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
                <Link href="/" className="flex min-w-0 items-center">
                  <Image
                    src="/logo.svg"
                    alt="Relocation by Numbers"
                    width={160}
                    height={48}
                    className="h-auto w-[132px] sm:w-[160px]"
                    priority
                  />
                </Link>

                <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                  <nav aria-label="Primary navigation" className="hidden items-center gap-4 text-sm text-slate-600 dark:text-slate-300 lg:flex">
                    {NAV_LINKS.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className="transition hover:text-slate-900 dark:hover:text-white"
                      >
                        {label}
                      </Link>
                    ))}
                  </nav>
                  <ThemeToggle />
                  <details className="group relative lg:hidden">
                    <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 text-slate-700 marker:content-none dark:border-slate-700 dark:text-slate-200" aria-label="Open navigation menu">
                      <span className="text-xl leading-none" aria-hidden="true">☰</span>
                    </summary>
                    <nav aria-label="Mobile navigation" className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                      {NAV_LINKS.map(({ href, label }) => (
                        <Link key={href} href={href} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                          {label}
                        </Link>
                      ))}
                    </nav>
                  </details>
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
