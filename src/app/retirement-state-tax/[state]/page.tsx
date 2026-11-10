import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AGES,
  EXAMPLE,
  MARRIED_BASE,
  SINGLE_BASE,
  GUIDE_STATES,
  NO_INCOME_TAX_STATES,
  ageSentence,
  ssSummary,
  buildStateGuide,
  guideFaq,
  guideStateBySlug,
  usd,
  type IncomeRow,
} from "@/lib/retirementStateGuide";
import { ALLOWED_STATE_CODES } from "@/lib/seo-allowlists";
import { PLANNER_NOTICE } from "@/lib/retirementPlan/plannerNotice";
import FeedbackBox from "@/components/FeedbackBox";

const SITE = "https://www.relocationbynumbers.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_STATES.map((s) => ({ state: s.slug }));
}

type Props = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: slug } = await params;
  const s = guideStateBySlug(slug);
  if (!s) return { title: "State not found" };
  const url = `${SITE}/retirement-state-tax/${s.slug}`;
  const title = `${s.name} Retirement Taxes (2026): Social Security, Pensions and 401(k)/IRA`;
  const description = `Does ${s.name} tax Social Security, pensions and 401(k) or IRA withdrawals? See the 2026 state income tax on an example retiree, how age and income change it, and the official sources.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, siteName: "Relocation by Numbers", title, description, locale: "en_US" },
    robots: { index: true, follow: true },
  };
}

const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
const td = "px-3 py-2 text-sm text-slate-800 dark:text-slate-200";

function IncomeTable({ caption, base, rows }: { caption: string; base: typeof SINGLE_BASE; rows: readonly IncomeRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[28rem] border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            <th className={th}>IRA withdrawals</th>
            <th className={th}>Total cash income</th>
            <th className={th}>State income tax</th>
            <th className={th}>Share of income</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r) => (
            <tr key={r.withdrawals}>
              <td className={td}>{usd(r.withdrawals)}</td>
              <td className={td}>{usd(r.cashIncome)}</td>
              <td className={`${td} font-semibold`}>{usd(r.tax)}</td>
              <td className={td}>{r.ratePct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
              Includes {usd(base.socialSecurity)} of Social Security, ages {base.age}, {base.filing === "married" ? "married filing jointly" : "single"}.
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default async function Page({ params }: Props) {
  const { state: slug } = await params;
  const s = guideStateBySlug(slug);
  if (!s) notFound();
  const g = buildStateGuide(s.code);
  const faq = guideFaq(g);
  const age = ageSentence(g);
  const url = `${SITE}/retirement-state-tax/${s.slug}`;
  const showBestStates = (ALLOWED_STATE_CODES as readonly string[]).includes(s.code);
  const waNote =
    s.code === "wa"
      ? "Washington has no tax on wages, pensions or retirement account withdrawals. The planner's Washington module covers the state's tax on large long-term capital gains."
      : null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Retirement tax by state", item: `${SITE}/retirement-state-tax` },
      { "@type": "ListItem", position: 3, name: s.name, item: url },
    ],
  };

  const rows = [
    { label: "Social Security", amount: "$30,000", add: g.added.socialSecurity, t: g.treatments.socialSecurity },
    { label: "Private pension", amount: "$25,000", add: g.added.pension, t: g.treatments.pension },
    { label: "IRA withdrawals", amount: "$35,000", add: g.added.withdrawals, t: g.treatments.withdrawals },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-slate-800 dark:text-slate-200 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
        <Link href="/retirement-state-tax" className="underline underline-offset-4 hover:no-underline">Retirement tax by state</Link>
        <span aria-hidden="true"> / </span>
        <span>{s.name}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{s.name} retirement taxes in 2026</h1>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Assumptions updated: October 2026 · 2026 tax year · state income tax only</p>
        <p className="mt-4 text-base leading-7">
          On an example single retiree, age {EXAMPLE.age}, with {usd(EXAMPLE.socialSecurity)} of Social Security, a {usd(EXAMPLE.pension)} private pension and{" "}
          {usd(EXAMPLE.withdrawals)} of IRA withdrawals, the Complete Retirement Plan engine estimates <strong>{usd(g.total)}</strong> of {s.name} income tax for 2026
          before credits. {ssSummary(g)}
        </p>
        <p role="note" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          {PLANNER_NOTICE}
        </p>
      </header>

      <section aria-labelledby="sources-heading" className="mt-10">
        <h2 id="sources-heading" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">What each kind of income adds in {s.name}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Each row leaves that income out and measures how much the {s.name} tax falls. The rows do not add up to the total, because deductions and
          income thresholds are shared, and where a state has an income cliff, removing any one source can remove most of the tax.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[28rem] border-collapse">
            <caption className="sr-only">State income tax added by each kind of retirement income in {s.name}</caption>
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr><th className={th}>Income</th><th className={th}>Amount</th><th className={th}>{s.name} tax it adds</th><th className={th}>Result</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className={td}>{r.label}</td>
                  <td className={td}>{r.amount}</td>
                  <td className={`${td} font-semibold`}>{r.t === "adds-none" ? "$0" : usd(r.add)}</td>
                  <td className={td}>{r.t === "adds-none" ? "Not taxed on this example" : "Taxed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {waNote && <p className="mt-3 text-sm leading-6">{waNote}</p>}
      </section>

      <section aria-labelledby="age-heading" className="mt-10">
        <h2 id="age-heading" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Does age change the {s.name} tax?</h2>
        {age ? (
          <>
            <p className="mt-2 text-sm leading-6">{age}</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full border-collapse">
                <caption className="sr-only">State income tax on a $25,000 pension and $35,000 of IRA withdrawals by age in {s.name}</caption>
                <thead className="bg-slate-50 dark:bg-slate-900"><tr>{AGES.map((a) => <th key={a} className={th}>Age {a}</th>)}</tr></thead>
                <tbody><tr>{g.ageRows.map((r) => <td key={r.age} className={`${td} font-semibold`}>{usd(r.tax)}</td>)}</tr></tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm leading-6">
            Not on this example. The same $25,000 pension and $35,000 of IRA withdrawals, with no Social Security, produce the same {s.name} tax at ages{" "}
            {AGES.join(", ")} ({usd(g.ageRows[0].tax)}). Your own result can still differ if you have other income that the state treats by age.
          </p>
        )}
      </section>

      <section aria-labelledby="income-heading" className="mt-10">
        <h2 id="income-heading" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">How {s.name} tax grows with retirement income</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Social Security stays fixed while the IRA withdrawals rise. Tax is the 2026 {s.name} income tax before credits.
        </p>
        <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">Single</h3>
        <div className="mt-2"><IncomeTable caption={`${s.name} state income tax for a single retiree`} base={SINGLE_BASE} rows={g.single} /></div>
        <h3 className="mt-6 text-base font-semibold text-slate-900 dark:text-white">Married filing jointly</h3>
        <div className="mt-2"><IncomeTable caption={`${s.name} state income tax for a married couple`} base={MARRIED_BASE} rows={g.married} /></div>
      </section>

      {g.ruleNote && (
        <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 dark:border-slate-800 dark:bg-slate-900" aria-label="Status of this state's figures">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Status of the {s.name} figures</h2>
          <p className="mt-1">{g.ruleNote.note}</p>
        </section>
      )}

      <section aria-labelledby="not-heading" className="mt-10">
        <h2 id="not-heading" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">What these numbers leave out</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Credits (property tax, low-income, other-state and similar). These are pre-credit estimates.</li>
          <li>Local income taxes, property tax and sales tax.</li>
          <li>Government pensions (federal, military, state and local), which many states treat differently from the private pension used here.</li>
          <li>Anything in your own return that is not in the example: other income, itemized deductions, capital gains or a part-year move.</li>
          <li>Rules enacted after the date above. The planner holds 2026 law and does not forecast changes.</li>
        </ul>
      </section>

      <section aria-labelledby="faq-heading" className="mt-10">
        <h2 id="faq-heading" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Frequently asked questions about {s.name} retirement taxes</h2>
        <div className="mt-4 space-y-3">
          {faq.map(({ q, a }) => (
            <details key={q} className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">{q}</summary>
              <div className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed dark:border-slate-800">{a}</div>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="official-heading" className="mt-10">
        <h2 id="official-heading" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Official sources for {s.name}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          {g.sources.map((src) => (
            <li key={src.url}>
              <a className="underline underline-offset-4" href={src.url} rel="noopener noreferrer">{src.label}</a>
            </li>
          ))}
          <li>
            <a className="underline underline-offset-4" href="https://www.irs.gov/publications/p590b" rel="noopener noreferrer">IRS Publication 590-B: distributions from IRAs</a>
            {" "}and <a className="underline underline-offset-4" href="https://www.irs.gov/publications/p915" rel="noopener noreferrer">Publication 915: tax on Social Security benefits</a>
          </li>
        </ul>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          The method is described on the <Link className="underline underline-offset-4" href="/methodology">methodology page</Link>. Found a mistake? Tell us in the box below.
        </p>
      </section>

      <section aria-labelledby="next-heading" className="mt-10 rounded-2xl border border-cyan-200/70 bg-cyan-50 p-5 dark:border-cyan-900/60 dark:bg-cyan-950/30">
        <h2 id="next-heading" className="text-lg font-semibold text-slate-900 dark:text-white">Run your own numbers</h2>
        <p className="mt-1 text-sm leading-6">
          Enter your own Social Security, pension and withdrawals in the <Link className="font-semibold underline underline-offset-4" href="/retirement-state-tax">retirement tax tool</Link>, or
          model the whole timeline in the <Link className="font-semibold underline underline-offset-4" href="/complete-retirement-plan">Complete Retirement Plan</Link>.
          {showBestStates && (<> See also <Link className="font-semibold underline underline-offset-4" href={`/best-states-for-fire/${s.slug}`}>{s.name} for FIRE</Link>.</>)}
        </p>
      </section>

      <div className="mt-10"><FeedbackBox path={`/retirement-state-tax/${s.slug}`} name={`${s.name} retirement taxes`} /></div>

      <nav aria-label="Other states" className="mt-10">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Retirement taxes in other states</h2>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {GUIDE_STATES.filter((o) => o.code !== s.code).map((o) => (
            <li key={o.code}><Link className="underline underline-offset-4 hover:no-underline" href={`/retirement-state-tax/${o.slug}`}>{o.name}</Link></li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          No state income tax on wages: {NO_INCOME_TAX_STATES.map((o) => o.name).join(", ")}.
        </p>
      </nav>
    </main>
  );
}
