import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import PaycheckCalculator from "@/components/PaycheckCalculator";

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/paycheck-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Paycheck Calculator — Take-Home Pay by State (2025)",
  description:
    "Free take-home pay calculator. Enter your salary or hourly wage and state to see your paycheck after federal, Social Security, Medicare, and state taxes — plus a full breakdown and 401(k) impact.",
  keywords: [
    "paycheck calculator",
    "take home pay calculator",
    "salary calculator after taxes",
    "net pay calculator by state",
    "hourly paycheck calculator",
    "how much will my paycheck be",
    "2025 paycheck calculator",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Paycheck Calculator — Take-Home Pay by State (2025)",
    description: "See your paycheck after federal, FICA, and state taxes, with a full breakdown and 401(k) impact.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Paycheck Calculator — Take-Home Pay by State (2025)",
    description: "Your take-home pay after federal, FICA, and state taxes, with a full breakdown.",
    site: "@relocationbynumbers",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Paycheck Calculator",
  url: CANONICAL,
  description:
    "Free take-home pay calculator that estimates your paycheck after federal income tax, Social Security, Medicare, and state income tax, with a full breakdown and 401(k) impact.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Salary or hourly pay input",
    "Federal, Social Security, Medicare, and state tax breakdown",
    "Take-home pay per paycheck and per year",
    "401(k) contribution impact",
    "PDF and CSV export, shareable links",
  ],
  author: { "@type": "Organization", name: "Relocation by Numbers", url: SITE_URL },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is take-home pay calculated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Take-home pay is your gross pay minus federal income tax, Social Security and Medicare (FICA), state and any local income tax, and pre-tax deductions like a 401(k). This calculator applies 2025 federal brackets, the standard deduction, and state income tax to estimate your net paycheck.",
      },
    },
    {
      "@type": "Question",
      name: "Does a 401(k) contribution increase my take-home pay?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A pre-tax 401(k) lowers your taxable income, so it reduces federal (and usually state) income tax — but it still reduces your net paycheck, because the contributed money goes into your retirement account. It does not reduce Social Security or Medicare taxes.",
      },
    },
    {
      "@type": "Question",
      name: "Which states have no income tax?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming have no state income tax, so paychecks there are only reduced by federal tax and FICA.",
      },
    },
    {
      "@type": "Question",
      name: "What is FICA on my paycheck?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FICA is the combination of Social Security tax (6.2% up to an annual wage base) and Medicare tax (1.45%, plus an extra 0.9% above higher-income thresholds). It funds Social Security and Medicare and is separate from federal income tax.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Calculators", item: `${SITE_URL}/explore` },
    { "@type": "ListItem", position: 3, name: "Paycheck Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  { q: "How is take-home pay calculated?", a: "Gross pay minus federal income tax, Social Security and Medicare (FICA), state/local income tax, and pre-tax deductions like a 401(k). This tool uses 2025 federal brackets, the standard deduction, and state income tax." },
  { q: "Does a 401(k) increase my take-home pay?", a: "No — it lowers your taxable income (reducing federal and usually state tax), but the contribution still leaves your paycheck and goes to your retirement account. It doesn't reduce Social Security or Medicare." },
  { q: "Which states have no income tax?", a: "Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming. Paychecks there are reduced only by federal tax and FICA." },
  { q: "What is FICA?", a: "Social Security (6.2% up to a wage base) plus Medicare (1.45%, plus 0.9% above higher-income thresholds). It's separate from federal income tax." },
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Paycheck Calculator</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              See your take-home pay after federal, Social Security, Medicare, and state taxes — with a full breakdown
              of where every dollar of your paycheck goes.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Salary or hourly, any state, with 401(k) impact — 2025 tax rules.
            </p>
            <div className="mt-3">
              <Link href="/methodology" className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Federal + FICA + state", "Salary or hourly", "By state", "401(k) impact"].map((f) => (
                <span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{f}</span>
              ))}
            </div>
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-cyan-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <PaycheckCalculator />

          <section aria-labelledby="how-heading" className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 id="how-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">How this calculator works</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    Enter your salary (or hourly rate and hours), your state, and filing status. The calculator applies
                    2025 federal tax brackets and the standard deduction, Social Security and Medicare (FICA), and your
                    state&rsquo;s income tax — the same verified tax engine used across the rest of this site.
                  </p>
                  <p>
                    It then splits your pay into take-home, federal tax, FICA, state and local tax, and any 401(k)
                    contribution, and shows the totals both per paycheck and per year so you can see exactly where your
                    money goes.
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Salary or hourly", body: "Works for annual salaries or an hourly rate and weekly hours." },
                    { title: "Every state", body: "State income tax (or none) applied automatically." },
                    { title: "401(k) impact", body: "See how pre-tax contributions change your paycheck." },
                    { title: "Per paycheck & annual", body: "Weekly, biweekly, semimonthly, or monthly." },
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
                  <p>These are estimates for planning and comparison, using the standard deduction and typical withholding rules.</p>
                  <p>They don&apos;t include pre-tax health or HSA deductions, extra withholding, tax credits, or non-standard local taxes, which can shift your actual paycheck.</p>
                  <p>Comparing a job offer in another city? Pair this with the relocation and compare-cities tools to see the full picture.</p>
                  <p>This calculator is not tax advice.</p>
                </div>
                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "2025 federal, FICA, and state rules", "Results per paycheck and per year"].map((t) => (
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
            <h2 id="crosssell-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Keep planning</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">See how your take-home pay stretches in a new city or toward your goals.</p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Compare Cities", href: "/compare-cities" },
                { label: "Housing Affordability", href: "/housing-affordability-calculator" },
                { label: "FIRE Calculator", href: "/fire-calculator" },
                { label: "Retirement Calculator", href: "/retirement-calculator" },
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
