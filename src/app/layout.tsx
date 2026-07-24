import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/ThemeToggle";
import PwaRegistration from "@/components/PwaRegistration";
import MobileNavigation from "@/components/MobileNavigation";
import NavToolsDropdown from "@/components/NavToolsDropdown";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.relocationbynumbers.com",
  ),
  title: {
    default: "Relocation by Numbers",
    template: "%s | Relocation by Numbers",
  },
  description:
    "Compare cost of living, take-home pay, housing, and FIRE impact before you move.",
  applicationName: "Relocation by Numbers",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Relocation",
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "google-adsense-account": "ca-pub-5257549146198249",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const EXPLORE_LINK = { href: "/explore", label: "Explore" };
const BLOG_LINK = { href: "/blog", label: "Blogs" };

const FIRE_NAV_LINKS = [
  { href: "/barista-fire-calculator", label: "Barista FIRE" },
  { href: "/chubby-fire-calculator", label: "Chubby FIRE" },
  { href: "/coast-fire-calculator",  label: "Coast FIRE" },
  { href: "/fat-fire-calculator",    label: "Fat FIRE" },
  { href: "/fire-calculator",        label: "FIRE Calculator" },
  { href: "/lean-fire-calculator",   label: "Lean FIRE" },
];

const INTERNATIONAL_NAV_LINKS = [
  { href: "/asia-relocation-calculator", label: "Asia" },
  { href: "/caribbean-relocation-calculator", label: "Caribbean" },
  { href: "/europe-relocation-calculator", label: "Europe" },
  { href: "/international-relocation", label: "International (All)" },
  { href: "/south-america-relocation-calculator", label: "South America" },
];

const TOOLS_NAV_LINKS = [
  { href: "/housing-affordability-calculator", label: "Affordability" },
  { href: "/compare-cities", label: "Compare Cities" },
  { href: "/one-income-relocation-calculator",  label: "Income Calculator" },
  { href: "/income-tax-calculator", label: "Income Tax" },
  { href: "/investment-calculator", label: "Investment" },
  { href: "/mortgage-calculator",   label: "Mortgage" },
  { href: "/paycheck-calculator", label: "Paycheck" },
  { href: "/rent-vs-buy-calculator", label: "Rent vs. Buy" },
];

const RETIREMENT_NAV_LINKS = [
  { href: "/401k-calculator", label: "401(k) Calculator" },
  { href: "/hsa-calculator", label: "HSA Calculator" },
  { href: "/retirement-calculator", label: "Retirement Calculator" },
  { href: "/rmd-calculator", label: "RMD Calculator" },
  { href: "/roth-conversion-calculator", label: "Roth Conversion" },
  { href: "/retirement-withdrawal-calculator", label: "Withdrawal Calculator" },
];

const CALCULATOR_NAV_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/compare", label: "City Pair Comparisons" },
];

// Flat list for mobile, dropdowns are a desktop-only affordance.
const NAV_LINKS = [
  EXPLORE_LINK,
  ...CALCULATOR_NAV_LINKS,
  ...FIRE_NAV_LINKS,
  ...INTERNATIONAL_NAV_LINKS,
  ...TOOLS_NAV_LINKS,
  ...RETIREMENT_NAV_LINKS,
  BLOG_LINK,
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
          <PwaRegistration />
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
            <header className="relative z-[60] border-b border-slate-200 bg-white backdrop-blur dark:border-slate-800 dark:bg-slate-950">
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
                    <Link href="/explore" className="transition hover:text-slate-900 dark:hover:text-white">
                      Explore
                    </Link>
                    <NavToolsDropdown label="Calculator" links={CALCULATOR_NAV_LINKS} />
                    <NavToolsDropdown label="FIRE" links={FIRE_NAV_LINKS} />
                    <NavToolsDropdown label="International" links={INTERNATIONAL_NAV_LINKS} />
                    <NavToolsDropdown label="Tools" links={TOOLS_NAV_LINKS} />
                    <NavToolsDropdown label="Retirement" links={RETIREMENT_NAV_LINKS} />
                    <Link href="/blog" className="transition hover:text-slate-900 dark:hover:text-white">
                      Blogs
                    </Link>
                  </nav>
                  <ThemeToggle />
                  <MobileNavigation links={NAV_LINKS} />
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              Private by design: your calculator inputs are processed in your browser and are never sent to or stored on our servers.
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
