import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import CompareCitiesCalculator from "@/components/CompareCitiesCalculator";

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/compare-cities";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Compare Cities Side by Side, Take-Home Pay, Housing & Monthly Flexibility",
  description:
    "Compare up to 3 destinations side by side, US, Caribbean, Asia, Europe, South America, or worldwide. See net monthly income, effective tax rate, housing costs, and monthly flexibility for each, all from one income and one form.",
  keywords: [
    "compare cities cost of living",
    "compare cities side by side",
    "relocation comparison tool",
    "which city should I move to",
    "compare take home pay cities",
    "multi city comparison calculator",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Compare Cities Side by Side, Take-Home Pay, Housing & Monthly Flexibility",
    description:
      "Compare up to 3 US cities side by side: net income, taxes, housing costs, and monthly flexibility, from a single income entry.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Compare Cities Side by Side",
    description: "See net income, taxes, housing, and monthly flexibility for up to 3 cities at once.",
    site: "@relocationbynumbers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Compare Cities Side by Side",
  url: CANONICAL,
  description:
    "Compare up to 3 US cities side by side for net income, effective tax rate, housing costs, and monthly flexibility.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Organization", name: "Relocation by Numbers", url: SITE_URL },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Calculators", item: `${SITE_URL}/explore` },
    { "@type": "ListItem", position: 3, name: "Compare Cities", item: CANONICAL },
  ],
};

export default function Page() {
  return (
    <>
      <Script id="sd-webapp" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <Script id="sd-breadcrumb" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
        <header className="py-10 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Compare Cities Side by Side
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              One income, up to three destinations. See net income, taxes, housing costs, and monthly flexibility
              for each city at once.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              US, Caribbean, Asia, Europe, South America, or worldwide, pick a region and compare.
            </p>
            <div className="mt-3">
              <Link href="/methodology" className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">
                See methodology
              </Link>
            </div>
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-fuchsia-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <CompareCitiesCalculator />

          <section
            aria-labelledby="how-it-works-heading"
            className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800"
          >
            <h2 id="how-it-works-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              How this comparison works
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              <p>
                Enter your income once, pick a region, then add up to three target destinations. For US cities, take-home
                pay uses the same federal, state, and city tax engine as the main relocation calculator, and you can
                switch between renting and buying. For international and Caribbean destinations, tax uses each region&apos;s
                simplified estimator and housing reflects typical monthly living costs for that destination.
              </p>
              <p>
                For an exact scenario with your own rent, home price, savings, or country-specific tax follow-up
                questions, use the <Link href="/" className="font-medium text-fuchsia-700 underline underline-offset-4 hover:no-underline dark:text-fuchsia-300">full relocation calculator</Link> for
                US moves, or the matching <Link href="/international-relocation" className="font-medium text-fuchsia-700 underline underline-offset-4 hover:no-underline dark:text-fuchsia-300">regional calculator</Link> for
                a single international destination.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="crosssell-heading"
            className="rounded-2xl border border-fuchsia-200/60 bg-fuchsia-50 p-5 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/20"
          >
            <h2 id="crosssell-heading" className="text-sm font-semibold text-slate-900 dark:text-white">
              Keep exploring
            </h2>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Full Relocation Calculator", href: "/" },
                { label: "Housing Affordability", href: "/housing-affordability-calculator" },
                { label: "Mortgage Calculator", href: "/mortgage-calculator" },
                { label: "Explore all tools", href: "/explore" },
              ].map(({ label, href }, i) => (
                <a
                  key={href}
                  href={href}
                  className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    i === 0
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {label}
                </a>
              ))}
            </nav>
          </section>
        </section>

        <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <a href="/about" className="transition hover:text-slate-900 dark:hover:text-white">About</a>
              <span aria-hidden="true">•</span>
              <a href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</a>
              <span aria-hidden="true">•</span>
              <a href="/privacy" className="transition hover:text-slate-900 dark:hover:text-white">Privacy</a>
              <span aria-hidden="true">•</span>
              <a href="/terms" className="transition hover:text-slate-900 dark:hover:text-white">Terms</a>
              <span aria-hidden="true">•</span>
              <a href="/methodology" className="transition hover:text-slate-900 dark:hover:text-white">Methodology</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
