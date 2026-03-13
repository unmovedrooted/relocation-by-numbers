import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FireCalculator from "@/components/FireCalculator";

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
    description: `Estimate your financial independence timeline with a ${label} salary using this FIRE calculator.`,
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
    <a href="/about" className="transition hover:text-white">
      About
    </a>
    <span>•</span>
    <a href="/disclaimer" className="transition hover:text-white">
      Disclaimer
    </a>
    <span>•</span>
    <a href="/privacy" className="transition hover:text-white">
      Privacy
    </a>
    <span>•</span>
    <a href="/terms" className="transition hover:text-white">
      Terms
    </a>
  </div>

          <p className="max-w-2xl text-sm text-slate-300 leading-relaxed">
            Reaching financial independence with a {label} salary depends on your
            savings rate, expenses, taxes, and cost of living. Lower expenses and
            higher savings rates can dramatically shorten the path to FIRE.
          </p>
        </header>

    <FireCalculator initialIncome={income} />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Example starting point</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            <p>
              A person earning <span className="font-semibold text-white">{label}</span> might test:
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
      </div>
    </main>
  );
}