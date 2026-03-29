import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    return {
      title: "Page Not Found",
    };
  }

  const salary = slugToSalary(salarySlug);
  const label = salary ? salaryLabel(salary) : "Salary";

  return {
    title: `Can You Reach FIRE With a ${label} Salary?`,
    description: `Estimate your financial independence timeline with a ${label} salary and see how savings rate, expenses, taxes, and location affect your path to FIRE.`,
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Can You Reach FIRE With a {label} Salary?
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
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

          <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
            Reaching financial independence with a {label} salary depends on your
            spending, savings rate, taxes, investment returns, and where you live.
            A lower-cost city can shorten the timeline, while high housing costs can
            push FIRE much further out.
          </p>
        </header>

        <p className="text-sm text-slate-400">Assumptions updated: March 2026</p>

        <section>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold text-white">Example starting point</h2>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/lean-fire-calculator"
                  className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Lean FIRE
                </Link>
                <Link
                  href="/barista-fire-calculator"
                  className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Barista FIRE
                </Link>
                <Link
                  href="/coast-fire-calculator"
                  className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Coast FIRE
                </Link>
                <Link
                  href="/compare"
                  className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3.5 py-1.5 text-sm font-medium text-emerald-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/15 hover:text-emerald-100"
                >
                  Compare Cities →
                </Link>
              </div>
            </div>

            <p className="mt-4">
              Here’s one sample setup for a{" "}
              <span className="font-semibold text-white">{label}</span> salary:
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div>
                Annual income:{" "}
                <span className="font-semibold text-white">${income.toLocaleString()}</span>
              </div>
              <div>
                Monthly expenses:{" "}
                <span className="font-semibold text-white">$3,000–$4,500</span>
              </div>
              <div>
                Savings goal: <span className="font-semibold text-white">20%–40%</span>
              </div>
              <div>
                Return assumption: <span className="font-semibold text-white">7%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Is FIRE realistic on a {label} salary?
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Yes, FIRE can be realistic on a {label} salary, but the answer depends
              much more on spending than income alone. At this pay level, housing
              costs, taxes, and consistency matter more than trying to optimize tiny
              details.
            </p>

            <p>
              Someone living in a high-cost city with rent taking a large share of
              take-home pay may find the path to FIRE very slow. Someone earning the
              same amount in a lower-cost location may be able to save a much larger
              percentage of income and reach financial independence meaningfully sooner.
            </p>

            <p>
              That is why this page is less about a single yes-or-no answer and more
              about helping you test the real tradeoffs. If your expenses stay under
              control and your savings rate remains strong over time, a {label} salary
              can support a workable path to FIRE.
            </p>
          </div>
        </section>

        <FireCalculator initialIncome={income} />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            What matters most at this income level
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Housing cost</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Housing is often the biggest variable. A lower rent or mortgage burden
                can create more room for saving and investing without changing your salary.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Savings rate</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The percentage of income you save usually matters more than the income
                number by itself. A strong savings rate can dramatically shorten the FIRE timeline.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Taxes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                State taxes and take-home pay can materially change how far a salary
                actually goes. Two people earning the same amount may have very different outcomes.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Time horizon</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A longer runway gives compound growth more time to work. Starting
                earlier and staying consistent can matter just as much as income growth.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Why location changes the answer
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              This is where relocation can change the math. If you can lower your
              monthly spending by moving to a cheaper city or lower-tax state, your
              FIRE target may fall and your timeline may improve.
            </p>

            <p>
              That does not mean every lower-cost city is automatically a better choice.
              Salary opportunities, lifestyle fit, transportation, and housing quality
              all still matter. But if your goal is to make a {label} salary stretch
              further, location can be one of the most powerful levers you have.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
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

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Related FIRE tools
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
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
          </div>
        </section>
      </div>
    </main>
  );
}