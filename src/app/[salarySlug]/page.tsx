import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import FireCalculator from "@/components/FireCalculator";
import Link from "next/link";

const ALLOWED_SLUGS = [
  "fire-with-50k-salary",
  "fire-with-60k-salary",
  "fire-with-70k-salary",
  "fire-with-80k-salary",
  "fire-with-90k-salary",
  "fire-with-100k-salary",
  "fire-with-120k-salary",
  "fire-with-150k-salary",
  "fire-with-200k-salary",
  "fire-with-220k-salary",
  "fire-with-250k-salary",
  "fire-with-300k-salary",
  "fire-with-320k-salary",
  "fire-with-350k-salary",
  "fire-with-400k-salary",
  "fire-with-420k-salary",
  "fire-with-450k-salary",
  "fire-with-500k-salary",
] as const;

function slugToSalary(slug: string) {
  const match = slug.match(/^fire-with-(\d+)k-salary$/i);
  if (!match) return null;
  return `${match[1]}k`;
}

function salaryLabel(salary: string) {
  return `$${salary.toUpperCase()}`;
}

function salaryNumber(salary: string) {
  const n = Number(salary.toLowerCase().replace("k", ""));
  return Number.isFinite(n) ? n * 1000 : 0;
}

function fireNumber(income: number, savingsRatePct: number, expensesPct: number) {
  const annualExpenses = Math.round(income * expensesPct);
  const fireTarget = annualExpenses * 25;
  return { annualExpenses, fireTarget };
}

function salaryBand(income: number) {
  if (income <= 80000) return "lower";
  if (income <= 150000) return "middle";
  return "higher";
}

function getSalaryPageCopy(label: string, income: number) {
  const band = salaryBand(income);

  if (band === "lower") {
    return {
      subheading: `FIRE Number, Timeline & Strategy for a ${label} Income`,
      intro: `Reaching financial independence on a ${label} salary is possible, but this income leaves less room for error than higher salaries do. Housing, taxes, and everyday fixed costs can take up a large share of take-home pay, which means your path to FIRE depends heavily on keeping expenses low and protecting your savings rate. On a ${label} income, location is not a small optimization — it can completely change whether early financial independence feels realistic or distant.`,
      realisticTitle: `Is FIRE realistic on a ${label} salary?`,
      realisticParagraphs: [
        `Yes — FIRE can be realistic on a ${label} salary, but usually only if your spending stays disciplined. At this income level, there is not much slack in the math. A rent payment that is a few hundred dollars too high, a high-tax location, or inconsistent saving can delay FIRE by many years.`,
        `That is why the answer at ${label} is less about earning more and more about avoiding cost traps. Someone earning ${label} in an expensive city may struggle to save enough for meaningful momentum, while someone with the same income in a cheaper area may be able to build a solid savings rate and make steady progress.`,
        `In other words, FIRE on ${label} is usually not about perfection. It is about keeping core expenses under control, staying consistent, and being realistic about where your income can stretch the furthest.`,
      ],
      locationTitle: `Why location changes the FIRE answer on a ${label} salary`,
      locationParagraphs: [
        `On a ${label} salary, location is often the deciding factor. In a high-cost city, too much of your income can disappear into rent, transportation, and taxes before you ever get a real chance to save. In a lower-cost city or lower-tax state, that same salary can leave enough breathing room to invest consistently and lower the amount you need for FIRE.`,
        `That does not mean the cheapest place is always the best move. Job stability, quality of life, and long-term fit still matter. But at ${label}, geography has a bigger impact than most people think, and it is often one of the few levers that can materially improve the timeline.`,
      ],
    };
  }

  if (band === "middle") {
    return {
      subheading: `FIRE Number, Timeline & Strategy for a ${label} Income`,
      intro: `A ${label} salary can put FIRE within reach for many people, but it is not high enough to ignore the basics. Housing costs, state taxes, and lifestyle inflation still have the power to slow progress if too much income gets absorbed before it is invested. At this level, the opportunity is real: done well, a ${label} income can build strong momentum toward financial independence, but bad cost decisions can still push the timeline out much further than expected.`,
      realisticTitle: `Is FIRE realistic on a ${label} salary?`,
      realisticParagraphs: [
        `Yes — FIRE is realistic on a ${label} salary for many households, especially if saving is intentional. This income usually provides enough room to make steady progress, but not enough to fully absorb expensive housing, rising lifestyle expectations, or weak saving habits.`,
        `That makes ${label} a middle ground income for FIRE. In a lower-cost area, it can support a strong savings rate and a meaningful long-term investing plan. In a more expensive market, the same salary can feel surprisingly average once rent, taxes, and everyday spending start stacking up.`,
        `At this level, success usually comes from directing income efficiently rather than chasing tiny optimizations. A solid savings rate, controlled lifestyle inflation, and a location that does not consume too much of your paycheck can make FIRE much more achievable.`,
      ],
      locationTitle: `Why location changes the FIRE answer on a ${label} salary`,
      locationParagraphs: [
        `Location still matters a lot on a ${label} salary because this is the range where housing and taxes can either preserve your momentum or quietly drain it. In a lower-cost city, more of your income can go toward investing. In a high-cost area, the same salary may look strong on paper but leave less room to save than expected.`,
        `That is why geography is not just a side variable at ${label}. It affects how much of your raise you actually keep, how aggressive your savings rate can be, and how quickly your FIRE timeline starts to move.`,
      ],
    };
  }

  return {
    subheading: `FIRE Number, Timeline & Strategy for a ${label} Income`,
    intro: `A ${label} salary gives you real power to accelerate FIRE, but high income alone does not guarantee a fast timeline. At this level, the biggest threats are usually taxes, housing choices, and lifestyle inflation rather than simple affordability. A strong income can create major investing capacity, but only if enough of it is preserved. On a ${label} salary, FIRE becomes less about whether it is possible and more about how efficiently you convert income into long-term wealth.`,
    realisticTitle: `Is FIRE realistic on a ${label} salary?`,
    realisticParagraphs: [
      `Yes — FIRE is highly realistic on a ${label} salary in many scenarios, but the timeline still depends on execution. The main risk at this income level is usually not earning too little. It is allowing fixed costs, tax drag, and lifestyle creep to absorb income that could have been compounding instead.`,
      `Someone earning ${label} while keeping housing and recurring spending controlled can often build wealth much faster than lower income households. Someone earning the same amount while scaling up every part of their lifestyle may still make progress, but far more slowly than the salary suggests.`,
      `At this level, FIRE is often a question of discipline, tax awareness, and intentional spending. The upside is large — but so is the ability to waste it.`,
    ],
    locationTitle: `Why location changes the FIRE answer on a ${label} salary`,
    locationParagraphs: [
      `Location still matters on a ${label} salary because high earners are often exposed to expensive housing markets and heavier state tax drag. Moving to a lower-cost or lower-tax area can preserve far more income for investing without reducing earnings by the same amount.`,
      `That does not mean every move is worth making. Career upside, business opportunity, and quality of life still matter. But on ${label}, geography can be the difference between simply earning well and actually converting that income into faster financial independence.`,
    ],
  };
}

export async function generateStaticParams() {
  return ALLOWED_SLUGS.map((salarySlug) => ({ salarySlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ salarySlug: string }>;
}): Promise<Metadata> {
  const { salarySlug } = await params;

  if (!ALLOWED_SLUGS.includes(salarySlug as (typeof ALLOWED_SLUGS)[number])) {
    return { title: "Page Not Found" };
  }

  const salary = slugToSalary(salarySlug);
  const label = salary ? salaryLabel(salary) : "Salary";
  const income = salary ? salaryNumber(salary) : 0;
  const { fireTarget } = fireNumber(income, 0.3, 0.7);

  const title = `Can You Reach FIRE on a ${label} Salary? | FIRE Number & Timeline`;
  const description = `Calculate your FIRE number and timeline on a ${label} salary. At typical spending levels your target is around $${fireTarget.toLocaleString()}. See how savings rate, taxes, expenses, and location affect your path to financial independence.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/${salarySlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/${salarySlug}`,
      siteName: "Relocation by Numbers",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function FireWithSalaryPage({
  params,
}: {
  params: Promise<{ salarySlug: string }>;
}) {
  const { salarySlug } = await params;

  if (!ALLOWED_SLUGS.includes(salarySlug as (typeof ALLOWED_SLUGS)[number])) {
    notFound();
  }

  const salary = slugToSalary(salarySlug);
  if (!salary) notFound();

  const label = salaryLabel(salary);
  const income = salaryNumber(salary);

  const conservative = fireNumber(income, 0.3, 0.7);
  const moderate = fireNumber(income, 0.4, 0.6);
  const aggressive = fireNumber(income, 0.5, 0.5);

  const pageCopy = getSalaryPageCopy(label, income);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Can You Reach FIRE on a {label} Salary?
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            {pageCopy.subheading}
          </p>

          <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
            {pageCopy.intro}
          </p>

          <p className="text-xs text-slate-400">Assumptions updated: March 2026</p>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/lean-fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Lean FIRE
            </Link>
            <Link
              href="/barista-fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Barista FIRE
            </Link>
            <Link
              href="/coast-fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Coast FIRE
            </Link>
            <Link
              href="/compare"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3.5 py-1.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/15"
            >
              Compare Cities →
            </Link>
          </div>
        </header>

        <AdSlot />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-xl font-semibold">
            Your estimated FIRE number on a {label} salary
          </h2>
          <p className="text-sm text-slate-400">
            These estimates use the 4% rule (25× annual expenses) at different savings rates.
            Lower spending = lower FIRE number = faster timeline.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Conservative (30% saved)", data: conservative },
              { label: "Moderate (40% saved)", data: moderate },
              { label: "Aggressive (50% saved)", data: aggressive },
            ].map((scenario) => (
              <div
                key={scenario.label}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="text-xs text-slate-400">{scenario.label}</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  ${scenario.data.fireTarget.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  ~${scenario.data.annualExpenses.toLocaleString()}/yr expenses
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Gross income of ${income.toLocaleString()}. Does not account for taxes, which
            reduce take-home pay and actual savings capacity. Use the calculator below for
            a tax-adjusted estimate.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {pageCopy.realisticTitle}
          </h2>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            {pageCopy.realisticParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <FireCalculator initialIncome={income} hideFAQ />

        <AdSlot />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            What matters most on a {label} salary for FIRE
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Housing cost</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Housing is the biggest variable. Lower rent or mortgage burden creates more
                room for saving without changing your salary at all.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Savings rate</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The percentage of income you save matters more than the income number itself.
                A strong savings rate can dramatically shorten the timeline to FIRE.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">State income taxes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                State taxes affect how much of a {label} salary you actually keep. Two
                people earning the same gross income in different states can have very
                different savings capacity.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Time horizon</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A longer runway gives compound growth more time to work. Starting earlier
                and staying consistent often matters as much as income growth.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Frequently asked questions about FIRE on a {label} salary
          </h2>
          <dl className="space-y-5 text-sm text-slate-300">
            <div>
              <dt className="font-semibold text-white">
                What is the FIRE number for a {label} salary?
              </dt>
              <dd className="mt-1">
                It depends on your spending. At a 30% savings rate, annual expenses would be
                roughly ${conservative.annualExpenses.toLocaleString()}, giving a FIRE number
                of about ${conservative.fireTarget.toLocaleString()}. At a 50% savings rate,
                annual expenses drop to about ${aggressive.annualExpenses.toLocaleString()},
                with a FIRE number of about ${aggressive.fireTarget.toLocaleString()}. These
                are pre-tax estimates — the calculator above applies state-specific tax adjustments.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How long does it take to reach FIRE on a {label} salary?
              </dt>
              <dd className="mt-1">
                At a 30% savings rate from a {label} salary, most models project 25–35 years
                to FIRE depending on starting portfolio, returns, and expenses. At a 50%
                savings rate, that can drop to 15–20 years. Lower-cost cities and no-income-tax
                states can shave additional years off by increasing effective savings capacity.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                Can you reach FIRE faster by moving to a cheaper city on a {label} salary?
              </dt>
              <dd className="mt-1">
                Yes — and for remote workers this is often the highest-impact move available.
                Moving from a high-cost city to a lower-cost one while keeping a {label} salary
                simultaneously increases your monthly savings and reduces your FIRE number. Use
                the Move Impact tab in the calculator above to model this for your situation.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How do taxes affect FIRE planning on a {label} salary?
              </dt>
              <dd className="mt-1">
                State income tax can make a significant difference. On a {label} salary,
                moving from a high-tax state like California or New York to a no-income-tax
                state like Texas or Florida can add thousands to your annual savings rate.
                The calculator applies state-specific tax estimates so you can see the real
                take-home difference.
              </dd>
            </div>
          </dl>
        </section>

        <AdSlot />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {pageCopy.locationTitle}
          </h2>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            {pageCopy.locationParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/compare/nyc-ny/charlotte-nc"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              NYC vs Charlotte
            </Link>
            <Link
              href="/compare/la-ca/austin-tx"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              LA vs Austin
            </Link>
            <Link
              href="/fire-in/charlotte-nc"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              FIRE in Charlotte
            </Link>
            <Link
              href="/cost-of-living/austin-tx"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              Cost of Living in Austin
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Related FIRE tools
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/fire-calculator"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              FIRE Calculator
            </Link>
            <Link
              href="/lean-fire-calculator"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              Lean FIRE Calculator
            </Link>
            <Link
              href="/barista-fire-calculator"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              Barista FIRE Calculator
            </Link>
            <Link
              href="/coast-fire-calculator"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              Coast FIRE Calculator
            </Link>
            <Link
              href="/savings-rate-for-fire"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              Savings Rate for FIRE
            </Link>
            <Link
              href="/best-states-for-fire"
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30"
            >
              Best States for FIRE
            </Link>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 pt-2 text-sm text-slate-400">
          <Link href="/about" className="transition hover:text-white">
            About
          </Link>
          <span>•</span>
          <Link href="/disclaimer" className="transition hover:text-white">
            Disclaimer
          </Link>
          <span>•</span>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy
          </Link>
          <span>•</span>
          <Link href="/terms" className="transition hover:text-white">
            Terms
          </Link>
        </div>
      </div>
    </main>
  );
}