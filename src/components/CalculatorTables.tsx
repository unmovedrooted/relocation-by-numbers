import type { ReactNode } from "react";
import {
  PAYCHECK_SALARIES,
  RMD_BALANCES,
  REAL_RETURNS,
  WITHDRAWAL_HORIZON_YEARS,
  WITHDRAWAL_RATES,
  federalBracketRows,
  getFederalStandardDeduction,
  paycheckStateRows,
  rmdRows,
  rmdStartAgeRows,
  rothRows,
  yearsMoneyLasts,
} from "@/lib/calculatorTables";
import { TAX_YEAR } from "@/lib/taxYear2026";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
const td = "px-3 py-2 text-sm text-slate-800 dark:text-slate-200";
const box = "rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800";

function Section({ id, title, intro, children }: { id: string; title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={box}>
      <h2 id={id} className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">{intro}</div>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Table({ caption, head, children, note }: { caption: string; head: ReactNode[]; children: ReactNode; note?: ReactNode }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[26rem] border-collapse">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>{head.map((h, i) => <th key={i} scope="col" className={th}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
        </table>
      </div>
      {note && <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{note}</p>}
    </div>
  );
}

// ─── RMD ─────────────────────────────────────────────────────────────────────

export function RmdTables() {
  const rows = rmdRows();
  return (
    <Section
      id="rmd-tables-heading"
      title="RMD table: how much you must withdraw at each age"
      intro={<p>Your RMD is the prior December 31 balance divided by the distribution period for your age. These are the IRS Uniform Lifetime Table periods (2022 update) with the resulting RMD on three example balances.</p>}
    >
      <Table caption="Age you must start required minimum distributions, by birth year" head={["Born", "RMDs start at age"]}>
        {rmdStartAgeRows().map((r) => (
          <tr key={r.group}><td className={td}>{r.group}</td><td className={`${td} font-semibold`}>{r.age}</td></tr>
        ))}
      </Table>
      <Table
        caption="IRS Uniform Lifetime Table with example required minimum distributions"
        head={["Age", "Distribution period", "Share of balance", ...RMD_BALANCES.map((b) => `RMD on ${usd(b)}`)]}
        note={<>Source: IRS Publication 590-B, Table III (Uniform Lifetime). A different table (Table II, joint life) applies if your sole beneficiary is a spouse more than 10 years younger; the calculator above uses it when you enter your spouse&apos;s age. Amounts are the balance divided by the period, before tax.</>}
      >
        {rows.map((r) => (
          <tr key={r.age}>
            <td className={`${td} font-semibold`}>{r.age}</td>
            <td className={td}>{r.divisor.toFixed(1)}</td>
            <td className={td}>{pct(r.pctOfBalance, 2)}</td>
            {r.amounts.map((a, i) => <td key={i} className={td}>{usd(a)}</td>)}
          </tr>
        ))}
      </Table>
    </Section>
  );
}

// ─── Paycheck ────────────────────────────────────────────────────────────────

export function PaycheckStateTable() {
  const rows = paycheckStateRows();
  const byMid = [...rows].sort((a, b) => b.net[1] - a.net[1]);
  const top = byMid[0];
  const bottom = byMid[byMid.length - 1];
  return (
    <Section
      id="paycheck-table-heading"
      title={`Take-home pay by state (${TAX_YEAR})`}
      intro={
        <p>
          What a single filer keeps in every state and DC after federal income tax, Social Security and Medicare, state income tax and employee-paid state payroll programs. At a {usd(PAYCHECK_SALARIES[1])} salary,
          take-home pay runs from {usd(bottom.net[1])} in {bottom.name} to {usd(top.net[1])} in {top.name}, a gap of {usd(top.net[1] - bottom.net[1])} a year.
        </p>
      }
    >
      <Table
        caption={`Annual take-home pay by state for a single filer, ${TAX_YEAR}`}
        head={["State", ...PAYCHECK_SALARIES.map((s) => `Take-home on ${usd(s)}`), `State tax and payroll programs on ${usd(PAYCHECK_SALARIES[1])}`]}
        note={<>Single filer, standard deduction, no 401(k) deferral, no local income tax, before credits. Computed with the same tax engine as the calculator above. A planning estimate, not tax advice; confirm any decision with a CPA or enrolled agent.</>}
      >
        {rows.map((r) => (
          <tr key={r.code}>
            <td className={`${td} font-semibold`}>{r.name}</td>
            {r.net.map((n, i) => <td key={i} className={td}>{usd(n)}</td>)}
            <td className={td}>{usd(r.stateTaxAt100k)}</td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}

// ─── Roth conversion ─────────────────────────────────────────────────────────

export function RothTables() {
  const single = federalBracketRows("single");
  const married = federalBracketRows("married");
  const rows = rothRows("single");
  return (
    <Section
      id="roth-tables-heading"
      title={`Roth conversion tax: ${TAX_YEAR} brackets and what a conversion costs`}
      intro={<p>A conversion is taxed as ordinary income on top of your other income, so the cost depends on which brackets it fills. These tables use the {TAX_YEAR} federal brackets (IRS Rev. Proc. 2025-32).</p>}
    >
      <Table
        caption={`${TAX_YEAR} federal income tax brackets`}
        head={["Rate", "Single: taxable income", "Married filing jointly: taxable income"]}
        note={<>Taxable income is after deductions. The {TAX_YEAR} standard deduction is {usd(getFederalStandardDeduction("single"))} single and {usd(getFederalStandardDeduction("married"))} married filing jointly.</>}
      >
        {single.map((s, i) => (
          <tr key={s.rate}>
            <td className={`${td} font-semibold`}>{pct(s.rate, 0)}</td>
            <td className={td}>{Number.isFinite(s.upTo) ? `${usd(s.from)} to ${usd(s.upTo)}` : `Over ${usd(s.from)}`}</td>
            <td className={td}>{Number.isFinite(married[i].upTo) ? `${usd(married[i].from)} to ${usd(married[i].upTo)}` : `Over ${usd(married[i].from)}`}</td>
          </tr>
        ))}
      </Table>
      <Table
        caption="Federal tax on a Roth conversion for a single filer"
        head={["Other taxable income", "Amount converted", "Federal tax on the conversion", "Average rate", "Top bracket reached"]}
        note={<>Single filer, federal income tax only. It leaves out state tax, the effect on Social Security taxation, Medicare IRMAA surcharges, the net investment income tax and the loss of credits, any of which can raise the real cost. Other taxable income is measured after the standard deduction.</>}
      >
        {rows.map((r) => (
          <tr key={`${r.baseIncome}-${r.conversion}`}>
            <td className={td}>{usd(r.baseIncome)}</td>
            <td className={td}>{usd(r.conversion)}</td>
            <td className={`${td} font-semibold`}>{usd(r.tax)}</td>
            <td className={td}>{pct(r.averageRatePct)}</td>
            <td className={td}>{pct(r.topRatePct, 0)}</td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

export function WithdrawalTable() {
  return (
    <Section
      id="withdrawal-table-heading"
      title="How long your savings last at different withdrawal rates"
      intro={
        <p>
          Years a portfolio lasts when the first withdrawal is a set percentage of the starting balance and later withdrawals rise with inflation. Returns are shown after inflation. The more your investments earn
          above inflation, the longer the money lasts, and when the real return matches or beats the withdrawal rate it is not used up within {WITHDRAWAL_HORIZON_YEARS} years.
        </p>
      }
    >
      <Table
        caption="Years savings last by first-year withdrawal rate and real return"
        head={["First-year withdrawal", ...REAL_RETURNS.map((r) => `${r}% real return`)]}
        note={<>Simple model: constant real return, withdrawals taken at the end of each year, no taxes, fees or changes in spending. Real results vary with market returns and the order they arrive in, which this table ignores. A planning illustration, not a guarantee.</>}
      >
        {WITHDRAWAL_RATES.map((rate) => (
          <tr key={rate}>
            <td className={`${td} font-semibold`}>{rate}%</td>
            {REAL_RETURNS.map((ret) => {
              const years = yearsMoneyLasts(rate, ret);
              return <td key={ret} className={td}>{years === null ? `${WITHDRAWAL_HORIZON_YEARS}+ years` : `${years} years`}</td>;
            })}
          </tr>
        ))}
      </Table>
    </Section>
  );
}
