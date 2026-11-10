import Link from "next/link";
import { STATES } from "@/lib/states";
import { STATE_SS_CLASSIFICATION, STATE_SS_COVERAGE_SOURCE } from "@/lib/retirementPlan/stateSocialSecurityCoverage";
import { STATE_CONTRACT_FIELD } from "@/lib/retirementPlan/stateContracts";
import { PLANNER_NOTICE } from "@/lib/retirementPlan/plannerNotice";

const nameOf = (code: string) => STATES.find((s) => s.code === code)?.name ?? code.toUpperCase();
const codesWhere = (kind: string) => Object.entries(STATE_SS_CLASSIFICATION).filter(([, v]) => v === kind).map(([c]) => c);

export const PLANNER_FAQ = [
  {
    q: "What does the Complete Retirement Plan calculate?",
    a: "It projects one or two people year by year: pre-retirement income and savings, Social Security and pensions, required minimum distributions, IRA and Roth basis, ESPP sales, Medicare premiums with IRMAA surcharges, and the federal and state taxes and withdrawals that settle each year's cash flow. You can also add a planned move to another state.",
  },
  {
    q: "Which states does it cover?",
    a: `All 50 states and DC. Eight states have no broad personal income tax, and the other ${Object.keys(STATE_CONTRACT_FIELD).length} jurisdictions (42 states and DC) each have a dedicated tax module for the 2026 tax year, checked against that state's own statutes and forms.`,
  },
  {
    q: "How does it treat Social Security in each state?",
    a: `It follows each state's own rule. In the planner's review of 2026 law, ${codesWhere("exempt").length} of 51 jurisdictions fully exempt Social Security benefits, ${codesWhere("conditional").length} exempt them only under conditions such as age or income limits, and Montana starts from the federal taxable amount. The federal tax on benefits is calculated separately.`,
  },
  {
    q: "What tax law does it use for years after 2026?",
    a: "It holds the 2026 rules fixed and does not forecast future legislation or inflation adjustments. If a state law is already enacted with a future effective date, the assumption is stated in the notes for that state.",
  },
  {
    q: "Is this tax advice?",
    a: "No. It is a planning estimate. Tax rules vary by person and change often, and it does not file or replace a return. Confirm any decision with a CPA or enrolled agent.",
  },
] as const;

export default function PlannerExplainer() {
  const conditional = codesWhere("conditional").map(nameOf);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PLANNER_FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Complete Retirement Plan",
    url: "https://www.relocationbynumbers.com/complete-retirement-plan",
    description:
      "Household retirement planner with year-by-year projections of Social Security, pensions, RMDs, Roth and IRA basis, Medicare IRMAA and federal and state income taxes. A planning estimate, not tax advice.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <section aria-labelledby="planner-explainer-heading" className="mx-auto max-w-4xl space-y-8 px-4 pb-10 text-slate-700 dark:text-slate-300">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div>
        <h2 id="planner-explainer-heading" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          What this retirement planner models
        </h2>
        <p className="mt-3 text-sm leading-relaxed sm:text-base">
          Most retirement calculators treat taxes as one flat percentage. This one settles each year&apos;s cash flow the way a return would:
          it works out how much of your Social Security is taxable, how much of each IRA or 401(k) withdrawal is ordinary income, what
          your state does with each of those, and how much you have to withdraw to cover spending after tax. It runs year by year for one
          or two people with independent retirement dates.
        </p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 sm:text-base">
          {[
            "Pre-retirement income, savings and employer match",
            "Social Security and pension start dates and amounts",
            "Required minimum distributions by birth year (age 73 or 75)",
            "Traditional, Roth and after-tax (basis) accounts, and the order you draw them",
            "Roth conversions and ESPP stock sales",
            "Medicare premiums and income-related (IRMAA) surcharges",
            "Federal brackets, the tax on Social Security benefits and state income tax",
            "A planned move to another state, using the new state's rules after the move",
          ].map((t) => (
            <li key={t} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <span aria-hidden="true" className="text-emerald-600 dark:text-emerald-400">✓</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">How states tax retirement income</h2>
        <p className="mt-3 text-sm leading-relaxed sm:text-base">
          States disagree on almost every piece of retirement income, which is why the same pension or IRA withdrawal can cost very
          different amounts depending on where you live. In the planner&apos;s review of 2026 state law, {codesWhere("exempt").length} of 51
          jurisdictions (50 states and DC) fully exempt Social Security benefits. {conditional.length} more exempt them only under conditions
          such as age or income limits ({conditional.join(", ")}), and Montana starts from the federal taxable amount. Pensions, IRA and
          401(k) withdrawals and capital gains each have their own exclusions, age thresholds and caps, and those are modeled state by state.
        </p>
        <p className="mt-3 text-sm leading-relaxed sm:text-base">
          Eight states levy no broad personal income tax. The other 42 states and DC each have their own module, built from that state&apos;s
          statutes and forms and tested against hand-calculated examples. Where a rule is not modeled, the planner says so in the notes
          for that state instead of guessing. You can read the result for any state on its own page in the{" "}
          <Link className="font-semibold underline underline-offset-4" href="/retirement-state-tax">retirement tax by state guide</Link>.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm dark:border-amber-700 dark:bg-amber-950/40 sm:text-base">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">What it does not do</h2>
        <p className="mt-2 text-amber-900 dark:text-amber-200">
          {PLANNER_NOTICE} It does not prepare or file a tax return, and it does not model every credit, local tax or special rule.
          The tax law is held at 2026 for later years. Use the results to understand tradeoffs, then take the plan to a CPA or enrolled agent
          before you act on it. How the numbers are built is in the <Link className="font-semibold underline underline-offset-4" href="/methodology">methodology</Link>.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Frequently asked questions</h2>
        <div className="mt-4 space-y-3">
          {PLANNER_FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">{q}</summary>
              <div className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed dark:border-slate-800">{a}</div>
            </details>
          ))}
        </div>
      </div>

      <div className="text-sm">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Sources</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><a className="underline underline-offset-4" href="https://www.irs.gov/publications/p590b" rel="noopener noreferrer">IRS Publication 590-B: distributions from IRAs, including the Uniform Lifetime Table</a></li>
          <li><a className="underline underline-offset-4" href="https://www.irs.gov/publications/p915" rel="noopener noreferrer">IRS Publication 915: Social Security and equivalent railroad retirement benefits</a></li>
          <li><a className="underline underline-offset-4" href={STATE_SS_COVERAGE_SOURCE} rel="noopener noreferrer">Connecticut General Assembly Office of Legislative Research: state taxation of Social Security benefits (2026 report)</a></li>
          <li>State statutes, forms and instructions are cited in each state&apos;s notes inside the planner.</li>
        </ul>
      </div>
    </section>
  );
}
