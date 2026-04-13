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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">

        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Can You Reach FIRE on a {label} Salary?
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            FIRE Number, Timeline &amp; Strategy for a {label} Income
          </p>

          <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
            Reaching financial independence on a {label} salary depends on your
            spending, savings rate, taxes, investment returns, and where you live.
            A lower-cost city or lower-tax state can shorten the timeline significantly,
            while high housing costs can push FIRE much further out even at this income level.
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

        {/* FIRE number estimates */}
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

        {/* Is FIRE realistic */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Is FIRE realistic on a {label} salary?
          </h2>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Yes — FIRE is achievable on a {label} salary, but the answer depends far
              more on spending than income alone. At this pay level, housing costs, taxes,
              and savings consistency matter more than trying to optimize minor details.
            </p>
            <p>
              Someone living in a high-cost city where rent consumes a large share of
              take-home pay may find the path to FIRE very slow even at {label}. Someone
              earning the same amount in a lower-cost location with lower state taxes can
              often save a much larger percentage and reach financial independence years sooner.
            </p>
            <p>
              This page is less about a single yes-or-no answer and more about helping you
              test the real tradeoffs. If your expenses stay under control and your savings
              rate remains strong over time, a {label} salary can support a realistic path
              to FIRE.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <FireCalculator initialIncome={income} hideFAQ />

        {/* What matters most */}
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

        {/* FAQ */}
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
                roughly ${conservative?.annualExpenses?.toLocaleString() ?? "—"}, giving a FIRE
number of ~${conservative?.fireTarget?.toLocaleString() ?? "—"}. At a 50%
savings rate, annual expenses drop to ~${
  aggressive?.annualExpenses?.toLocaleString() ?? "—"
}, with a FIRE number of ~${aggressive?.fireTarget?.toLocaleString() ?? "—"}.. These are pre-tax estimates
                — the calculator above applies state-specific tax adjustments.
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

        {/* Why location matters */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Why location changes the FIRE answer on a {label} salary
          </h2>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Location can be one of the most powerful levers for FIRE on a {label} salary.
              Moving to a lower-cost city or lower-tax state simultaneously reduces your FIRE
              number and increases how much you can save each month — a compounding effect that
              can shift your timeline by years.
            </p>
            <p>
              That does not mean every lower-cost city is automatically better. Salary
              opportunities, lifestyle fit, and housing quality still matter. But if your goal
              is to make a {label} salary stretch further toward financial independence, geography
              is worth modeling explicitly.
            </p>
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

        {/* Related tools */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Related FIRE tools
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/fire-calculator" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30">FIRE Calculator</Link>
            <Link href="/lean-fire-calculator" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30">Lean FIRE Calculator</Link>
            <Link href="/barista-fire-calculator" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30">Barista FIRE Calculator</Link>
            <Link href="/coast-fire-calculator" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30">Coast FIRE Calculator</Link>
            <Link href="/savings-rate-for-fire" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30">Savings Rate for FIRE</Link>
            <Link href="/best-states-for-fire" className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-black/30">Best States for FIRE</Link>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400 pt-2">
          <Link href="/about" className="transition hover:text-white">About</Link>
          <span>•</span>
          <Link href="/disclaimer" className="transition hover:text-white">Disclaimer</Link>
          <span>•</span>
          <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
          <span>•</span>
          <Link href="/terms" className="transition hover:text-white">Terms</Link>
        </div>

      </div>
    </main>
  );
}
