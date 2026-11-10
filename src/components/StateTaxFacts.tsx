import Link from "next/link";
import type { StateCode } from "@/lib/states";
import { EXAMPLE, slugify, stateTaxFacts, usd } from "@/lib/retirementStateGuide";
import { PAYCHECK_SALARIES } from "@/lib/calculatorTables";
import { PLANNER_NOTICE } from "@/lib/retirementPlan/plannerNotice";

/**
 * Two computed facts for a state landing page: what a worker keeps at three salaries, and what a retiree pays in state
 * income tax, each ranked against all 50 states and DC. Both come from the same engines as the calculators.
 */
export default function StateTaxFacts({ code, tone = "light" }: { code: StateCode; tone?: "light" | "dark" }) {
  const f = stateTaxFacts(code);
  const dark = tone === "dark";
  const card = dark
    ? "rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4"
    : "rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 space-y-4";
  const heading = dark ? "text-xl font-semibold" : "text-lg font-semibold tracking-tight text-slate-900 dark:text-white";
  const body = dark ? "text-sm leading-7 text-slate-300" : "text-sm leading-7 text-slate-600 dark:text-slate-300";
  const cell = dark ? "rounded-xl border border-white/10 bg-black/20 px-4 py-3" : "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60";
  const label = dark ? "text-xs text-slate-400" : "text-xs text-slate-500 dark:text-slate-400";
  const value = dark ? "mt-1 text-lg font-semibold text-white" : "mt-1 text-lg font-semibold text-slate-900 dark:text-white";
  const link = "font-semibold underline underline-offset-4 hover:no-underline";

  const vsMedianWorker = f.net[1] - f.netMedian;
  const workerCompare =
    Math.abs(vsMedianWorker) < 50
      ? "about the same as the typical state"
      : vsMedianWorker > 0
        ? `${usd(vsMedianWorker)} more than the typical state`
        : `${usd(-vsMedianWorker)} less than the typical state`;
  const vsMedianRetiree = f.retireeTax - f.retireeMedian;
  const retireeCompare =
    f.retireeTax < 50
      ? "essentially none"
      : Math.abs(vsMedianRetiree) < 50
        ? "about the same as the typical state"
        : vsMedianRetiree < 0
          ? `${usd(-vsMedianRetiree)} less than the typical state`
          : `${usd(vsMedianRetiree)} more than the typical state`;

  return (
    <section aria-labelledby={`tax-facts-${code}`} className={card}>
      <h2 id={`tax-facts-${code}`} className={heading}>{f.name} taxes: what workers keep and what retirees pay (2026)</h2>

      <div className="space-y-2">
        <h3 className={dark ? "text-base font-semibold text-white" : "text-base font-semibold text-slate-900 dark:text-white"}>If you work in {f.name}</h3>
        <p className={body}>
          A single worker earning {usd(PAYCHECK_SALARIES[1])} keeps <strong>{usd(f.net[1])}</strong> after federal income tax, Social Security and Medicare, and any {f.name} income tax and
          employee-paid state payroll programs. That is {workerCompare} ({usd(f.netMedian)} median across all {f.total} states and DC) and ranks {f.netRank} of {f.total}{f.netTies > 0 ? ` (tied with ${f.netTies} other ${f.netTies === 1 ? "state" : "states"})` : ""}, where 1 is the most take-home pay.
          State income tax and payroll programs take {usd(f.workerStateTax)} of that salary.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PAYCHECK_SALARIES.map((s, i) => (
            <div key={s} className={cell}>
              <div className={label}>Take-home on {usd(s)}</div>
              <div className={value}>{usd(f.net[i])}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className={dark ? "text-base font-semibold text-white" : "text-base font-semibold text-slate-900 dark:text-white"}>If you retire in {f.name}</h3>
        <p className={body}>
          A single retiree, age {EXAMPLE.age}, with {usd(EXAMPLE.socialSecurity)} of Social Security, a {usd(EXAMPLE.pension)} private pension and {usd(EXAMPLE.withdrawals)} of IRA
          withdrawals owes about <strong>{usd(f.retireeTax)}</strong> of {f.name} income tax for 2026 before credits: {retireeCompare} ({usd(f.retireeMedian)} median), ranking {f.retireeRank} of {f.total}{f.retireeTies > 0 ? ` (tied with ${f.retireeTies} other ${f.retireeTies === 1 ? "state" : "states"})` : ""} where 1 is the lowest tax.
          {f.retireeTax < 50 && f.retireeAdded.withdrawals < 50 && f.retireeAdded.pension < 50 && f.retireeAdded.socialSecurity < 50
            ? ` On this example, ${f.name} adds no income tax for Social Security, the pension or the IRA withdrawals.`
            : ` Social Security adds ${usd(f.retireeAdded.socialSecurity)}, the pension ${usd(f.retireeAdded.pension)} and the IRA withdrawals ${usd(f.retireeAdded.withdrawals)}, each measured by leaving that income out.`}
          {" "}
          {f.hasGuidePage ? (
            <>See how age and income change it in the <Link className={link} href={`/retirement-state-tax/${slugify(f.name)}`}>{f.name} retirement tax guide</Link>.</>
          ) : (
            <>Try your own numbers in the <Link className={link} href="/retirement-state-tax">retirement tax tool</Link>.</>
          )}
        </p>
      </div>

      <p className={dark ? "text-xs leading-5 text-slate-400" : "text-xs leading-5 text-slate-500 dark:text-slate-400"}>
        Single filer, standard deduction, no local income tax, before credits. Computed with the same tax engines as the calculators on this site. {PLANNER_NOTICE}
      </p>
    </section>
  );
}
