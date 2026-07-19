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

const PRIMARY_NAV_LINKS = [
  { href: "/explore",               label: "Explore" },
  { href: "/fire-calculator",       label: "FIRE Calculator" },
  { href: "/international-relocation", label: "International" },
  { href: "/blog", label: "Blogs" },
];

const TOOLS_NAV_LINKS = [
  { href: "/mortgage-calculator",   label: "Mortgage" },
  { href: "/housing-affordability-calculator", label: "Affordability" },
  { href: "/compare-cities", label: "Compare Cities" },
  { href: "/one-income-relocation-calculator",  label: "Income Calculator" },
];

// Flat list for mobile — the dropdown is a desktop-only affordance.
const NAV_LINKS = [...PRIMARY_NAV_LINKS, ...TOOLS_NAV_LINKS];

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
                    {PRIMARY_NAV_LINKS.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className="transition hover:text-slate-900 dark:hover:text-white"
                      >
                        {label}
                      </Link>
                    ))}
                    <NavToolsDropdown label="Tools" links={TOOLS_NAV_LINKS} />
                  </nav>
                  <ThemeToggle />
                  <MobileNavigation links={NAV_LINKS} />
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
