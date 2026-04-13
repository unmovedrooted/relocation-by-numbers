import type { Metadata } from "next";
import Script from "next/script";
import AdSlot from "@/components/AdSlot";
import MortgageCalculator from "@/components/MortgageCalculator";

// ─────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────

const SITE_URL = "https://www.relocationbynumbers.com"; // update to your actual domain
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
    images: [
      {
        url: `${SITE_URL}/og/mortgage-calculator.png`,
        width: 1200,
        height: 630,
        alt: "Mortgage Calculator — US & International Home Buying",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mortgage Calculator — US & International | Rent vs Buy & Affordability",
    description:
      "Monthly payments, cash to close, rent vs buy break-even, DTI, refinance savings — for US and international buyers. Free planning tool.",
    images: [`${SITE_URL}/og/mortgage-calculator.png`],
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
        text: "It depends heavily on the country, your residency status, income documentation, and the individual lender. Some countries (like Germany and the Netherlands) are relatively accessible to foreign buyers, while others (like Thailand and Vietnam) do not permit foreigners to own land at all. Rates for non-residents are typically higher than those for residents, and down payment requirements are usually 25–40%. The international tab provides country-specific guidance, but all figures are planning estimates — always consult a local mortgage broker and property lawyer before committing.",
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
        text: "Debt-to-income ratio (DTI) measures your monthly debt obligations as a percentage of gross monthly income. Front-end DTI includes only housing costs (mortgage, tax, insurance, HOA); lenders typically want this at or below 28%. Back-end DTI includes all monthly debts (housing plus car loans, student loans, credit cards); conventional lenders typically want this at or below 36–43%. These are guidelines, not hard limits — lenders may approve higher DTIs for strong credit profiles.",
      },
    },
    {
      "@type": "Question",
      name: "How do bi-weekly payments save money?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Making half your monthly payment every two weeks results in 26 half-payments per year — equivalent to 13 full monthly payments instead of 12. The extra payment goes directly to principal, reducing the balance faster and saving significant interest over the life of the loan. On a $400,000 loan at 6.75% over 30 years, bi-weekly payments typically save over $60,000 in interest and shorten the loan by several years.",
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

// ─────────────────────────────────────────────────────────────
// FAQ COMPONENT
// ─────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "How is the monthly payment calculated?",
    a: "Your principal and interest uses the standard amortization formula. The calculator adds property tax, homeowners insurance, HOA, and PMI (auto-estimated when down payment is under 20%) to arrive at the full monthly payment.",
  },
  {
    q: "What's included in cash to close?",
    a: "Down payment + estimated closing costs (adjustable, default 2.5% of loan) + a 3-month planning buffer. The buffer reflects common post-closing reserve targets — it's a planning guideline, not a universal lender requirement. Your official Loan Estimate will show the exact closing figure.",
  },
  {
    q: "How does rent vs buy break-even work?",
    a: "Each month, cumulative ownership costs are compared to cumulative rent. Equity gains (principal repayment + appreciation) are credited to the buyer, and the opportunity cost of your down payment is modelled as an investment. The break-even is when net ownership cost falls below total rent paid.",
  },
  {
    q: "When does PMI go away?",
    a: "Once your loan balance reaches 80% of the original purchase price, you can request cancellation — it's not removed automatically. The calculator shows the estimated month this occurs at your current payment level.",
  },
  {
    q: "Can foreigners get a mortgage abroad?",
    a: "It depends heavily on the country, residency status, and lender. Down payments of 25–40% are typical for non-residents. Some countries don't permit foreign ownership at all. The international tab provides per-country guidance, but all figures are planning estimates — consult a local mortgage broker before committing.",
  },
  {
    q: "How do bi-weekly payments save money?",
    a: "26 half-payments per year equals 13 full monthly payments — one extra payment per year goes straight to principal. On a $400k loan at 6.75% over 30 years, this typically saves over $60,000 in interest and cuts several years off the loan.",
  },
  {
    q: "What DTI do lenders want?",
    a: "Most conventional lenders target a front-end DTI (housing costs only) ≤28% and a back-end DTI (all debts) ≤36–43%. These are guidelines — lenders may approve higher ratios for strong credit profiles or specific loan programs.",
  },
  {
    q: "How does the refinance calculator work?",
    a: "Enter your remaining balance, current rate, and months left; then set your new rate and term. The calculator shows monthly savings, break-even months (closing costs ÷ monthly savings), and net lifetime savings — accounting for any term extension.",
  },
];

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <>
      {/* Structured data */}
      <Script id="sd-webapp" type="application/ld+json" strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <Script id="sd-faq" type="application/ld+json" strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="sd-breadcrumb" type="application/ld+json" strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* ── HEADER ── */}
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

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                "Cash to close",
                "Rent vs buy",
                "Refinance",
                "Buying abroad",
              ].map((f) => (
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

        {/* ── CALCULATOR + CONTENT ── */}
        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <MortgageCalculator />

          {/* ── WHAT'S INCLUDED ── */}
          <section
            aria-labelledby="what-included-heading"
            className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 id="what-included-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  What this mortgage calculator includes
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    This is a full home buying decision tool — not just a payment estimator. It
                    covers every number that matters before you sign: the monthly cost, the upfront
                    cash required, how long until buying beats renting, whether your income supports
                    the loan, and what happens if rates move.
                  </p>
                  <p>
                    The <strong className="text-slate-800 dark:text-slate-200">US tab</strong> is
                    built for domestic purchases with auto-estimated PMI, closing costs, property
                    tax, and mortgage interest deduction. The{" "}
                    <strong className="text-slate-800 dark:text-slate-200">International tab</strong>{" "}
                    covers 26 countries with foreign buyer notes, indicative rates, and higher
                    down payment defaults. The{" "}
                    <strong className="text-slate-800 dark:text-slate-200">Refinance tab</strong>{" "}
                    shows your break-even, monthly savings, and lifetime savings on any refi scenario.
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      title: "Monthly payment breakdown",
                      body: "P&I, property tax, insurance, HOA, and auto-estimated PMI with cancellation date.",
                    },
                    {
                      title: "Cash to close",
                      body: "Down payment + closing costs + 3-month planning buffer — all in one number.",
                    },
                    {
                      title: "Rent vs buy break-even",
                      body: "Accounts for equity paydown, appreciation, maintenance, tax deduction, and opportunity cost.",
                    },
                    {
                      title: "Affordability check",
                      body: "Front-end and back-end DTI vs standard lender guidelines, with a PASS / CAUTION / STRETCH verdict.",
                    },
                    {
                      title: "Rate sensitivity",
                      body: "See how your monthly P&I changes if rates move ±1% from your current quote.",
                    },
                    {
                      title: "Amortization schedule",
                      body: "Year-by-year principal, interest, and balance — with a visual chart.",
                    },
                  ].map(item => (
                    <div key={item.title}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-violet-200/70 bg-violet-50 p-5 dark:border-violet-900/60 dark:bg-violet-950/30">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Good to know before you use it</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <p>
                    All results are estimates. Actual rates, tax treatment, insurance costs, and
                    lender requirements vary by location, credit profile, loan type, and individual
                    circumstance.
                  </p>
                  <p>
                    The international tab is for post-relocation planning. Country rates are
                    indicative benchmarks — your actual rate as a foreign buyer will depend on
                    residency status, income documentation, and the specific lender. Always get
                    quotes from local banks before committing.
                  </p>
                  <p>
                    The rent vs buy model makes assumptions about rent growth, appreciation, and
                    investment returns. Small changes to these inputs can shift the break-even by
                    years. Use the "How this is calculated" section under the result to understand
                    each assumption.
                  </p>
                  <p>
                    This calculator is not financial, tax, or legal advice. Consult qualified
                    professionals before making any home purchase decision.
                  </p>
                </div>

                {/* Trust signals */}
                <div className="mt-5 space-y-2">
                  {[
                    "No account or sign-up required",
                    "All calculations run in your browser — no data sent to a server",
                    "Share any scenario with a link — all inputs encoded in the URL",
                  ].map(t => (
                    <div key={t} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="mt-0.5 flex-shrink-0 text-violet-500">✓</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── HOW TO USE ── */}
          <section aria-labelledby="how-to-use-heading"
            className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 shadow-[0_6px_20px_rgba(15,23,42,0.07)] dark:bg-slate-900 dark:ring-slate-800">
            <h2 id="how-to-use-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              How to use this mortgage calculator
            </h2>
            <ol className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              {[
                {
                  step: "1. Enter your home price and down payment",
                  detail: "Start with the purchase price and how much you plan to put down. The calculator auto-estimates PMI if your down payment is below 20%, and shows the closing cost estimate next to the down payment.",
                },
                {
                  step: "2. Set your rate and term",
                  detail: "Enter the interest rate you've been quoted (or use a placeholder to explore scenarios). Choose your loan term — 30 years minimises monthly cost; 15 years saves significantly on total interest.",
                },
                {
                  step: "3. Add monthly costs",
                  detail: "Fill in property tax rate, insurance, HOA, and a maintenance reserve. These don't affect the loan math, but they complete the real monthly picture — and feed the rent vs buy calculation.",
                },
                {
                  step: "4. Check your affordability",
                  detail: "Enter your gross income and other debts. The calculator shows front-end and back-end DTI, a PASS/CAUTION/STRETCH verdict, and the income needed to stay within the 28% front-end guideline.",
                },
                {
                  step: "5. Review rent vs buy",
                  detail: "Enter your current rent, expected appreciation, and rent growth. The break-even section shows how long until buying beats renting — with a full methodology note you can expand.",
                },
                {
                  step: "6. Share or save your scenario",
                  detail: "Use the Share link button to copy a URL with all your inputs encoded. Send it to a partner, advisor, or save it to revisit later.",
                },
              ].map(({ step, detail }) => (
                <li key={step} className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-[11px] font-bold text-violet-700 dark:text-violet-300">
                    {step[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{step.slice(3)}</div>
                    <p className="mt-0.5">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── FAQ ── */}
          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="mb-5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
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

          {/* ── CROSS-SELL: Relocation ── */}
          <section
            aria-labelledby="relocation-crosssell-heading"
            className="rounded-2xl border border-violet-200/60 bg-violet-50 p-5 dark:border-violet-900/40 dark:bg-violet-950/20"
          >
            <h2 id="relocation-crosssell-heading" className="text-sm font-semibold text-slate-900 dark:text-white">
              Planning to buy abroad after relocating?
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Check your monthly budget in your target country first — then come back and run the mortgage numbers.
            </p>
            <nav aria-label="Relocation calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Europe", href: "/europe-relocation-calculator" },
                { label: "Asia", href: "/asia-relocation-calculator" },
                { label: "Caribbean", href: "/caribbean-relocation-calculator" },
                { label: "South America", href: "/south-america-relocation-calculator" },
              ].map(({ label, href }, i) => (
                <a key={href} href={href}
                  className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    i === 0
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}>
                  {label}
                </a>
              ))}
            </nav>
          </section>

          {/* ── CROSS-SELL: Explore ── */}
          <section
            aria-labelledby="explore-heading"
            className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          >
            <h2 id="explore-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              More planning tools
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Keep planning with relocation, budgeting, and FIRE tools from Relocation by Numbers.
            </p>
            <nav aria-label="Planning tools" className="mt-4 flex flex-wrap gap-3">
              {[
                { label: "Explore all tools", href: "/explore", primary: true },
                { label: "FIRE Calculator", href: "/fire-calculator" },
                { label: "International Relocation", href: "/international-relocation-calculator" },
                { label: "Best Cities for FIRE", href: "/best-cities-for-fire" },
              ].map(({ label, href, primary }) => (
                <a key={href} href={href}
                  className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    primary
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}>
                  {label}
                </a>
              ))}
            </nav>
          </section>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <a href="/about"      className="transition hover:text-slate-900 dark:hover:text-white">About</a>
              <span aria-hidden="true">•</span>
              <a href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</a>
              <span aria-hidden="true">•</span>
              <a href="/privacy"    className="transition hover:text-slate-900 dark:hover:text-white">Privacy</a>
              <span aria-hidden="true">•</span>
              <a href="/terms"      className="transition hover:text-slate-900 dark:hover:text-white">Terms</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
