import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import MortgageCalculator from "@/components/MortgageCalculator";

// ─────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/mortgage-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Mortgage Calculator — US & International | Rent vs Buy, Affordability & Cash to Close",
  description:
    "Free mortgage calculator for US and international home buyers. Estimate monthly payments, total interest, cash to close, rent vs buy break-even, DTI ratios, and refinance savings. Includes 26 countries.",
  keywords: [
    "mortgage calculator",
    "rent vs buy calculator",
    "home affordability calculator",
    "international mortgage calculator",
    "cash to close calculator",
    "refinance calculator",
    "debt to income ratio",
    "buying abroad",
    "foreign buyer mortgage",
    "mortgage break even",
    "down payment calculator",
    "PMI calculator",
    "amortization schedule",
    "expat mortgage",
  ],
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Mortgage Calculator — US & International | Rent vs Buy & Affordability",
    description:
      "Estimate monthly payments, cash to close, rent vs buy break-even, and DTI for US and international home purchases. Built for anyone planning to buy at home or abroad.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Mortgage Calculator — US & International | Rent vs Buy & Affordability",
    description:
      "Monthly payments, cash to close, rent vs buy break-even, DTI, refinance savings — for US and international buyers. Free planning tool.",
    site: "@relocationbynumbers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

// ─────────────────────────────────────────────────────────────
// STRUCTURED DATA
// ─────────────────────────────────────────────────────────────

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Mortgage Calculator — US & International",
  url: CANONICAL,
  description:
    "Free mortgage calculator for US and international home buyers covering monthly payments, total interest, cash to close, rent vs buy break-even, DTI ratios, PMI, bi-weekly savings, rate sensitivity, and refinance analysis.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Monthly payment breakdown (P&I, tax, insurance, HOA, PMI)",
    "Cash to close estimate with down payment and closing costs",
    "Rent vs buy break-even with opportunity cost modeling",
    "Front-end and back-end DTI affordability check",
    "Rate sensitivity table",
    "Bi-weekly payment savings calculator",
    "Amortization schedule and chart",
    "Refinance break-even and lifetime savings",
    "International mortgage planning for 26 countries",
    "Shareable URL with all inputs encoded",
  ],
  author: {
    "@type": "Organization",
    name: "Relocation by Numbers",
    url: SITE_URL,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is the monthly mortgage payment calculated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The monthly principal and interest payment uses the standard amortization formula: M = P × [r(1+r)ⁿ] / [(1+r)ⁿ−1], where P is the loan principal, r is the monthly interest rate (annual rate ÷ 12), and n is the number of payments (term in years × 12). The calculator adds property tax, homeowners insurance, HOA fees, and PMI (if applicable) to arrive at the total monthly payment.",
      },
    },
    {
      "@type": "Question",
      name: "What is included in the cash to close estimate?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The cash to close estimate includes: (1) your down payment, (2) estimated closing costs (typically 2–5% of the loan for US purchases — you can adjust this percentage), and (3) a 3-month planning buffer representing common post-closing reserve targets. The 3-month buffer is a planning guideline, not a universal lender requirement. Your official Loan Estimate will show the exact closing figure.",
      },
    },
    {
      "@type": "Question",
      name: "How does the rent vs buy break-even calculation work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Each month, the calculator compares cumulative ownership costs (mortgage payment, tax, insurance, HOA, and maintenance reserve) against cumulative rent. It credits equity gains (principal repayment plus home appreciation) back to the buyer and models the opportunity cost of your down payment and closing costs as if they were invested at your chosen rate of return. It also optionally applies a mortgage interest tax deduction. The break-even is the month when net ownership costs fall below cumulative rent paid.",
      },
    },
    {
      "@type": "Question",
      name: "What is PMI and when is it removed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Private Mortgage Insurance (PMI) is required by most conventional lenders when your down payment is less than 20% of the purchase price. The calculator auto-estimates PMI at 0.7–1.5% of the loan annually, depending on your loan-to-value ratio. Once your outstanding loan balance falls to 80% of the original purchase price, you can request PMI cancellation — it is not removed automatically. The calculator shows approximately when this month will occur at current payment levels.",
      },
    },
    {
      "@type": "Question",
      name: "Can foreigners get a mortgage abroad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends heavily on the country, your residency status, income documentation, and the individual lender. Some countries are relatively accessible to foreign buyers, while others restrict foreign ownership heavily. Rates for non-residents are typically higher than those for residents, and down payment requirements are usually 25–40%. The international tab provides country-specific guidance, but all figures are planning estimates — always consult a local mortgage broker and property lawyer before committing.",
      },
    },
    {
      "@type": "Question",
      name: "How does the refinance calculator work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The refinance tab compares your current remaining loan against a new loan at a different rate or term. It calculates: (1) the monthly payment difference, (2) the break-even point in months — how long until closing costs are recouped through lower payments, and (3) net lifetime savings, accounting for any extension of the loan term. A lower monthly payment does not always mean net savings if the new term is significantly longer.",
      },
    },
    {
      "@type": "Question",
      name: "What is DTI and what are the guidelines?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Debt-to-income ratio (DTI) measures your monthly debt obligations as a percentage of gross monthly income. Front-end DTI includes only housing costs; lenders typically want this at or below 28%. Back-end DTI includes all monthly debts; conventional lenders typically want this at or below 36–43%. These are guidelines, not hard limits.",
      },
    },
    {
      "@type": "Question",
      name: "How do bi-weekly payments save money?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Making half your monthly payment every two weeks results in 26 half-payments per year — equivalent to 13 full monthly payments instead of 12. The extra payment goes directly to principal, reducing the balance faster and saving significant interest over the life of the loan.",
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
    { "@type": "ListItem", position: 3, name: "Mortgage Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  {
    q: "How is the monthly payment calculated?",
    a: "Your principal and interest uses the standard amortization formula. The calculator adds property tax, homeowners insurance, HOA, and PMI when applicable to arrive at the full monthly payment.",
  },
  {
    q: "What's included in cash to close?",
    a: "Down payment, estimated closing costs, and a 3-month planning buffer. The buffer is a planning guideline, not a universal lender requirement.",
  },
  {
    q: "How does rent vs buy break-even work?",
    a: "The tool compares cumulative ownership costs against cumulative rent while crediting equity gains and accounting for the opportunity cost of your down payment.",
  },
  {
    q: "When does PMI go away?",
    a: "Once your loan balance reaches 80% of the original purchase price, you can usually request cancellation. The calculator estimates when that point is reached.",
  },
  {
    q: "Can foreigners get a mortgage abroad?",
    a: "Sometimes, yes, but rules vary widely by country, lender, and residency status. The international tab is for planning estimates, not guaranteed loan availability.",
  },
  {
    q: "How do bi-weekly payments save money?",
    a: "They create one extra full payment per year, which reduces principal faster and saves interest over time.",
  },
  {
    q: "What DTI do lenders want?",
    a: "Many conventional lenders prefer front-end DTI at or below 28% and back-end DTI at or below 36–43%, though exceptions exist.",
  },
  {
    q: "How does the refinance calculator work?",
    a: "It compares your current remaining loan against a new loan and shows monthly savings, break-even months, and estimated lifetime savings.",
  },
];

export default function Page() {
  return (
    <>
      <Script
        id="sd-webapp"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <Script
        id="sd-faq"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="sd-breadcrumb"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
        <header className="py-10 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Mortgage Calculator for US &amp; International Buyers
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Monthly payments, cash to close, rent vs buy break-even, and affordability — for US
              and international home buyers.
            </p>

            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Planning estimates for monthly payment, cash to close, affordability, and rent vs buy.
            </p>

            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Assumptions updated: March 2026
            </div>

            <div className="mt-3">
              <Link
                href="/methodology"
                className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300"
              >
                See methodology
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Cash to close", "Rent vs buy", "Refinance", "Buying abroad"].map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {f}
                </span>
              ))}
            </div>

            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-violet-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
            <section className="">
              
            </section>
          ) : null}

          <MortgageCalculator />

          {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <AdSlot
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
                className="min-h-[100px]"
              />
            </section>
          ) : null}

          <section
            aria-labelledby="what-included-heading"
            className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2
                  id="what-included-heading"
                  className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl"
                >
                  What this mortgage calculator includes
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    This is a full home buying decision tool, not just a payment estimator.
                    It covers monthly cost, upfront cash required, rent vs buy break-even,
                    affordability, and refinance analysis.
                  </p>
                  <p>
                    The <strong className="text-slate-800 dark:text-slate-200">US tab</strong> is
                    built for domestic purchases with PMI, closing costs, property tax, and
                    mortgage-interest deduction assumptions. The{" "}
                    <strong className="text-slate-800 dark:text-slate-200">International tab</strong>{" "}
                    adds country-specific planning guidance for foreign buyers.
                  </p>
                  <p>
                    Don&apos;t have a specific price in mind yet? Start with the{" "}
                    <Link href="/housing-affordability-calculator" className="font-medium text-violet-700 underline underline-offset-4 hover:no-underline dark:text-violet-300">
                      Housing Affordability Calculator
                    </Link>{" "}
                    to see your price range first.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      title: "Monthly payment breakdown",
                      body: "P&I, property tax, insurance, HOA, and PMI when applicable.",
                    },
                    {
                      title: "Cash to close",
                      body: "Down payment, closing costs, and a planning buffer in one number.",
                    },
                    {
                      title: "Rent vs buy break-even",
                      body: "Includes equity paydown, appreciation, maintenance, and opportunity cost.",
                    },
                    {
                      title: "Affordability check",
                      body: "Front-end and back-end DTI with lender-style guideline ranges.",
                    },
                    {
                      title: "Rate sensitivity",
                      body: "See how payment changes if rates move around your assumption.",
                    },
                    {
                      title: "Amortization schedule",
                      body: "Year-by-year principal, interest, and remaining balance.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-200/70 bg-violet-50 p-5 dark:border-violet-900/60 dark:bg-violet-950/30">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Good to know before you use it
                </h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <p>
                    All results are estimates. Actual rates, tax treatment, insurance costs,
                    and lender requirements vary by location, credit profile, loan type, and
                    individual circumstance.
                  </p>
                  <p>
                    The international tab is for planning. Country rates are indicative benchmarks,
                    not guaranteed loan offers for foreign buyers.
                  </p>
                  <p>
                    The rent vs buy model depends on appreciation, rent growth, and opportunity-cost
                    assumptions. Small input changes can move the break-even by years.
                  </p>
                  <p>
                    This calculator is not financial, tax, or legal advice.
                  </p>
                </div>

                <div className="mt-5 space-y-2">
                  {[
                    "No account or sign-up required",
                    "Scenario sharing via URL",
                    "Planning-focused for both domestic and international buyers",
                  ].map((t) => (
                    <div
                      key={t}
                      className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                    >
                      <span className="mt-0.5 flex-shrink-0 text-violet-500">✓</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="how-to-use-heading"
            className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 shadow-[0_6px_20px_rgba(15,23,42,0.07)] dark:bg-slate-900 dark:ring-slate-800"
          >
            <h2
              id="how-to-use-heading"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
            >
              How to use this mortgage calculator
            </h2>
            <ol className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              {[
                {
                  n: "1",
                  title: "Enter your home price and down payment",
                  detail:
                    "Start with the purchase price and how much you plan to put down. The calculator will estimate PMI when applicable.",
                },
                {
                  n: "2",
                  title: "Set your rate and term",
                  detail:
                    "Use the rate you were quoted or a placeholder assumption to model different scenarios.",
                },
                {
                  n: "3",
                  title: "Add monthly ownership costs",
                  detail:
                    "Include tax, insurance, HOA, and maintenance to complete the real monthly picture.",
                },
                {
                  n: "4",
                  title: "Check affordability",
                  detail:
                    "Enter your income and debts to review front-end and back-end DTI against common lender guidelines.",
                },
                {
                  n: "5",
                  title: "Review rent vs buy",
                  detail:
                    "Compare ownership against rent with appreciation, rent growth, and opportunity cost assumptions.",
                },
                {
                  n: "6",
                  title: "Save or share your scenario",
                  detail:
                    "Use the encoded URL to revisit the same inputs or share them with someone else.",
                },
              ].map(({ n, title, detail }) => (
                <li key={title} className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-[11px] font-bold text-violet-700 dark:text-violet-300">
                    {n}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {title}
                    </div>
                    <p className="mt-0.5">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="mb-5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl"
            >
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                    {q}
                    <span className="flex-shrink-0 text-slate-400 transition-transform group-open:rotate-45 dark:text-slate-500 select-none">
                      +
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="relocation-crosssell-heading"
            className="rounded-2xl border border-violet-200/60 bg-violet-50 p-5 dark:border-violet-900/40 dark:bg-violet-950/20"
          >
            <h2
              id="relocation-crosssell-heading"
              className="text-sm font-semibold text-slate-900 dark:text-white"
            >
              Planning to buy abroad after relocating?
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Check your destination budget first, then come back and run the mortgage numbers.
            </p>
            <nav aria-label="Relocation calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Europe", href: "/europe-relocation-calculator" },
                { label: "Asia", href: "/asia-relocation-calculator" },
                { label: "Caribbean", href: "/caribbean-relocation-calculator" },
                { label: "South America", href: "/south-america-relocation-calculator" },
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
