"use client";

import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import InfoTip from "@/components/calculator-form/InfoTip";
import type { AccountEditorState } from "@/lib/retirementPlan/previewAccounts";
import type { IraContributionEditorState, IraOwnerDraft } from "@/lib/retirementPlan/previewIraContributions";

const control = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
type Props = { accounts: AccountEditorState; value: IraContributionEditorState; onChange: (value: IraContributionEditorState) => void; married: boolean };
export default function RetirementIraContributionEditor({ accounts, value, onChange, married }: Props) {
  const ids = married ? ["one", "two"] as const : ["one"] as const;
  const iras = accounts.accounts.filter(account => ids.some(id => id === account.ownerId) && ["traditional-ira", "roth-ira"].includes(account.kind));
  const anyActive = iras.some(account => Number(value.amounts[account.id] ?? "0") > 0);
  return <section aria-labelledby="plan-ira-contributions-heading" className="min-w-0 space-y-4">
    <h2 id="plan-ira-contributions-heading" className="text-xl font-semibold">IRA contributions</h2>
    <p className="text-sm text-slate-600 dark:text-slate-400">Enter new deposits per year here, not your existing account balance or lifetime contribution basis. Enter 0 when no new deposits are planned. The bracket-strategy comparison currently does not support active contributions.</p>
    <p className="text-sm text-slate-600 dark:text-slate-400">Annual amounts are nominal USD, held fixed and prorated through each person’s retirement date. Traditional IRA requests are allocated first; Roth requests use the remaining combined room and their own income limit. Spending and taxes take priority. Eligibility, deductions and funded amounts are recalculated each year.</p>
    <p id="plan-ira-supported" className="text-sm text-amber-700 dark:text-amber-300">Supported contributing years: wages/pensions only, no investment income, Social Security, conversions or account withdrawals to fund spending. Brokerage/ESPP accounts and interest-bearing cash are currently blocked with IRA contributions. One contributing traditional IRA and one contributing Roth IRA per person; no outside IRA contributions or spousal compensation. Unsupported scenarios show an error rather than an estimated answer.</p>
    {ids.map((id, index) => {
      const owned = iras.filter(account => account.ownerId === id);
      const draft = value.owners[id];
      const active = owned.some(account => Number(value.amounts[account.id] ?? "0") > 0);
      const traditionalActive = owned.some(account => account.kind === "traditional-ira" && Number(value.amounts[account.id] ?? "0") > 0);
      const change = (patch: Partial<IraOwnerDraft>) => onChange({ ...value, owners: { ...value.owners, [id]: { ...draft, ...patch } } });
      return <fieldset key={id} className="min-w-0 space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-6 dark:border-slate-800">
        <legend className="sr-only">Person {index + 1} · IRA saving</legend>
        <h3 className="font-semibold">Person {index + 1} · IRA saving</h3>
        {!owned.length ? <p className="text-sm text-slate-500">Add a traditional or Roth IRA account above to enter contributions.</p> :
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">{owned.map(account => <NumberField key={account.id}
            id={`ira-saving-${account.id}-annual`} label={`${account.name || "Unnamed account"} · annual IRA contribution (USD)`}
            value={value.amounts[account.id] ?? "0"} onChange={raw => onChange({ ...value, amounts: { ...value.amounts, [account.id]: raw } })}
            info={<InfoTip text={account.kind === "traditional-ira" ? "Traditional IRA deposit; deductibility is calculated separately. Enter 0 for none." : "After-tax Roth IRA deposit, subject to income eligibility. Enter 0 for none."} />}
            required min={0} max={1e9} step="any" className={control} wrapperClassName="min-w-0" />)}</div>}
        {anyActive && <div className="min-w-0">
          <label htmlFor={`ira-saving-${id}-coverage`} className="mb-1 block text-xs font-medium">Person {index + 1} · workplace retirement-plan coverage</label>
          <select id={`ira-saving-${id}-coverage`} value={draft.coverage} required aria-describedby={`ira-saving-${id}-coverage-help`}
            onChange={event => change({ coverage: event.target.value as IraOwnerDraft["coverage"] })} className={control}>
            <option value="">Choose coverage</option><option value="yes">Covered while working</option><option value="no">Not covered while working</option>
          </select>
          <p id={`ira-saving-${id}-coverage-help`} className="mt-1 text-xs text-slate-500">Assumes this status in every year with employment, including a partial retirement year; no coverage in later years. An old 401(k) balance alone does not establish coverage. Joint filing needs both people’s status, even if only one contributes.</p>
        </div>}
        {traditionalActive && <div className="min-w-0">
          <label htmlFor={`ira-saving-${id}-deduction`} className="mb-1 block text-xs font-medium">Person {index + 1} · traditional IRA deduction treatment</label>
          <select id={`ira-saving-${id}-deduction`} value={draft.deduction} required aria-describedby={`ira-saving-${id}-deduction-help`}
            onChange={event => change({ deduction: event.target.value as IraOwnerDraft["deduction"] })} className={control}>
            <option value="">Choose treatment</option><option value="deduct-eligible">Deduct eligible portion</option><option value="nondeductible">Fully nondeductible</option>
          </select>
          <p id={`ira-saving-${id}-deduction-help`} className="mt-1 text-xs text-slate-500">The funded portion not deducted adds to traditional IRA basis. This choice applies throughout the scenario; it does not change Roth contributions.</p>
        </div>}
        {active && <div className="flex items-start gap-2">
          <input id={`ira-saving-${id}-confirmed`} type="checkbox" checked={draft.confirmed} aria-describedby="plan-ira-supported"
            onChange={event => change({ confirmed: event.target.checked })} className="mt-1 shrink-0" />
          <label htmlFor={`ira-saving-${id}-confirmed`} className="text-sm">Person {index + 1}: I confirm these are all my planned IRA contributions and the supported income, coverage and account assumptions above apply.</label>
        </div>}
      </fieldset>;
    })}
  </section>;
}
