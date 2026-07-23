import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import RentVsBuyCalculator from "@/components/RentVsBuyCalculator";

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/rent-vs-buy-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Rent vs. Buy Calculator — Which Is Cheaper Over Time?",
  description:
    "Free rent vs. buy calculator. Compare the net worth of buying a home against renting and investing the difference, with a break-even year, mortgage, appreciation, and closing/selling costs built in.",
  keywords: [
    "rent vs buy calculator",
    "should i rent or buy",
    "buy vs rent break even",
    "renting vs buying a house",
    "is it cheaper to rent or buy",
    "rent or buy calculator with investment",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Rent vs. Buy Calculator — Which Is Cheaper Over Time?",
    description: "Compare buying vs. renting-and-investing by net worth, with a break-even year and all the real costs built in.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Rent vs. Buy Calculator — Which Is Cheaper Over Time?",
    description: "Buy vs. rent-and-invest, compared by net worth with a break-even year.",
    site: "@relocationbynumbers",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Rent vs. Buy Calculator",
  url: CANONICAL,
  description:
    "Free rent vs. buy calculator that compares the net worth of buying a home against renting and investing the difference, including mortgage, taxes, maintenance, appreciation, closing and selling costs, and a break-even year.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Net-worth comparison of buying vs. renting-and-investing",
    "Break-even year and crossover chart",
    "Mortgage, property tax, maintenance, HOA, appreciation",
    "Closing and selling costs, rent growth, investment return",
    "PDF and CSV export, shareable links",
  ],
  author: { "@type": "Organization", name: "Relocation by Numbers", url: SITE_URL },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "How does a rent vs. buy calculator work?", acceptedAnswer: { "@type": "Answer", text: "It compares net worth over time. The buyer's net worth is their home equity (value minus mortgage balance, net of selling costs). The renter invests the same upfront cash a buyer would tie up, plus whatever they save each month, at an assumed investment return. Whichever ends with more net worth 'wins,' and the break-even is when buying catches up to renting." } },
    { "@type": "Question", name: "Is it cheaper to rent or buy?", acceptedAnswer: { "@type": "Answer", text: "It depends on price-to-rent ratio, how long you stay, mortgage rate, home appreciation, and what you'd otherwise earn investing. Buying usually wins the longer you stay, because purchase and sale costs are spread over more years and you build equity; renting often wins over short horizons or when investment returns beat home appreciation." } },
    { "@type": "Question", name: "What is the break-even point for buying?", acceptedAnswer: { "@type": "Answer", text: "It's the number of years you'd need to stay for buying to leave you with as much net worth as renting and investing. Before that point renting is ahead; after it, buying is." } },
    { "@type": "Question", name: "Does this include tax benefits of owning?", acceptedAnswer: { "@type": "Answer", text: "No. This calculator focuses on cash flows, equity, and investment returns. It doesn't model the mortgage-interest or property-tax deductions, PMI, or investment taxes, which vary a lot by situation." } },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Calculators", item: `${SITE_URL}/explore` },
    { "@type": "ListItem", position: 3, name: "Rent vs. Buy Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  { q: "How does this calculator work?", a: "It compares net worth: the buyer's home equity (net of selling costs) vs. the renter investing the same upfront cash plus monthly savings. Whoever ends with more wins, and the break-even is when buying catches renting." },
  { q: "Is it cheaper to rent or buy?", a: "It depends on price-to-rent, how long you stay, your mortgage rate, appreciation, and investment returns. Buying tends to win the longer you stay; renting often wins over short horizons or when investments beat appreciation." },
  { q: "What's the break-even point?", a: "The number of years you'd need to stay for buying to match renting-and-investing. Before it, renting is ahead; after it, buying is." },
  { q: "Does it include tax benefits of owning?", a: "No — it focuses on cash flow, equity, and investment returns, and doesn't model mortgage-interest/property-tax deductions, PMI, or investment taxes." },
];

export default function Page() {
  return (
    <>
      <Script id="sd-webapp" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <Script id="sd-faq" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="sd-breadcrumb" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
        <header className="py-10 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Rent vs. Buy Calculator</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Compare the real cost of buying a home against renting and investing the difference — see which builds
              more net worth, and the year buying breaks even.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Mortgage, taxes, maintenance, appreciation, and closing/selling costs all included.
            </p>
            <div className="mt-3">
              <Link href="/methodology" className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Net-worth comparison", "Break-even year", "Crossover chart", "All real costs"].map((f) => (
                <span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{f}</span>
              ))}
            </div>
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-cyan-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <RentVsBuyCalculator />

          <section aria-labelledby="how-heading" className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 id="how-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">How this calculator works</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    The honest way to compare renting and buying isn&apos;t monthly payment vs. rent — it&apos;s net
                    worth. This tool runs a month-by-month simulation of both paths. The buyer builds equity as they pay
                    down the mortgage and the home appreciates; the renter invests the cash a buyer would tie up (down
                    payment and closing costs), plus whatever they save whenever renting costs less than owning.
                  </p>
                  <p>
                    At the end, it compares what each person could walk away with — the buyer&apos;s home equity net of
                    selling costs vs. the renter&apos;s investment portfolio — and finds the year the two cross, your
                    break-even point.
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Net worth, not payments", body: "Equity + appreciation vs. invested savings." },
                    { title: "Break-even year", body: "How long you'd need to stay for buying to win." },
                    { title: "Real costs", body: "Taxes, maintenance, HOA, closing and selling costs." },
                    { title: "Opportunity cost", body: "What the renter earns investing instead." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50 p-5 dark:border-cyan-900/60 dark:bg-cyan-950/30">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Good to know</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <p>Results are very sensitive to two guesses: home appreciation and investment return. Try a range for both.</p>
                  <p>The biggest driver is usually how long you&apos;ll stay — transaction costs make short stays favor renting.</p>
                  <p>This doesn&apos;t model income-tax effects (mortgage-interest/SALT deductions, investment taxes), PMI, or moving costs.</p>
                  <p>It&apos;s a planning comparison, not financial advice.</p>
                </div>
                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "Month-by-month net-worth simulation", "Shareable, exportable results"].map((t) => (
                    <div key={t} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"><span className="mt-0.5 flex-shrink-0 text-cyan-500">✓</span><span>{t}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="mb-5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">Frequently asked questions</h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                    {q}
                    <span className="flex-shrink-0 text-slate-400 transition-transform group-open:rotate-45 dark:text-slate-500 select-none">+</span>
                  </summary>
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">{a}</div>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="crosssell-heading" className="rounded-2xl border border-cyan-200/60 bg-cyan-50 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
            <h2 id="crosssell-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Keep planning your home purchase</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Once you&apos;ve decided, size up the payment and what you can afford.</p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Mortgage Calculator", href: "/mortgage-calculator" },
                { label: "Housing Affordability", href: "/housing-affordability-calculator" },
                { label: "Paycheck Calculator", href: "/paycheck-calculator" },
                { label: "Compare Cities", href: "/compare-cities" },
              ].map(({ label, href }, i) => (
                <a key={href} href={href} className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${i === 0 ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{label}</a>
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
