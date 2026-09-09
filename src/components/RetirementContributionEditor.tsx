"use client";

import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import InfoTip from "@/components/calculator-form/InfoTip";
import type { AccountEditorState } from "@/lib/retirementPlan/previewAccounts";
import type { ContributionEditorState, ContributionOwnerDraft } from "@/lib/retirementPlan/previewContributions";

const control = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
type Props = { accounts: AccountEditorState; value: ContributionEditorState; onChange: (value: ContributionEditorState) => void; married: boolean };
export default function RetirementContributionEditor({ accounts, value, onChange, married }: Props) {
  return <section aria-labelledby="plan-contributions-heading" className="min-w-0 space-y-4">
    <h2 id="plan-contributions-heading" className="text-xl font-semibold">Contributions &amp; employer match</h2>
    <p className="text-sm text-slate-600 dark:text-slate-400">Traditional and Roth 401(k) employee saving only in this section. Amounts are full-year nominal USD, held fixed across future years and prorated through each owner’s retirement date. Spending and taxes are funded first; actual saving and matching can be lower. IRA contributions have a separate section below; workplace catch-up, ESPP and other account contributions are not modeled here.</p>
    {(married ? ["one", "two"] as const : ["one"] as const).map((ownerId, index) => {
      const plans = accounts.accounts.filter(account => account.ownerId === ownerId && ["401k", "roth-401k"].includes(account.kind));
      const owner = value.owners[ownerId];
      const change = (patch: Partial<ContributionOwnerDraft>) => onChange({ ...value, owners: { ...value.owners, [ownerId]: { ...owner, ...patch } } });
      const active = plans.some(account => Number(value.amounts[account.id] ?? "0") > 0);
      const numeric = (key: "employeeLimit" | "additionsLimit" | "compensationCap" | "matchRate" | "matchThrough", label: string, max = 1e9) =>
        <NumberField id={`saving-${ownerId}-${key}`} label={label} value={owner[key]} onChange={raw => change({ [key]: raw })}
          required min={0} max={max} step="any" className={control} wrapperClassName="min-w-0" />;
      return <fieldset key={ownerId} className="min-w-0 rounded-2xl border border-slate-200 p-4 sm:p-6 dark:border-slate-800">
        <legend className="sr-only">Person {index + 1} · workplace saving</legend>
        <h3 className="mb-4 font-semibold">Person {index + 1} · workplace saving</h3>
        {!plans.length ? <p className="text-sm text-slate-500">Add a traditional or Roth 401(k) account above to enter contributions.</p> : <div className="min-w-0 space-y-4">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">{plans.map(account => <NumberField key={account.id}
            id={`saving-${account.id}-annual`} label={`${account.name || "Unnamed account"} · annual employee contribution (USD)`}
            info={<InfoTip text={account.kind === "401k" ? "Pretax employee deferral; not an employer contribution." : "After-tax Roth employee deferral; not an employer contribution."} />}
            value={value.amounts[account.id] ?? "0"} onChange={raw => onChange({ ...value, amounts: { ...value.amounts, [account.id]: raw } })}
            required min={0} max={1e9} step="any" className={control} wrapperClassName="min-w-0" />)}</div>
          {active && <>
            <p id={`saving-${ownerId}-terms`} className="text-sm text-amber-700 dark:text-amber-300">Enter verified first-year regular limits, excluding catch-up. Future limits grow at the household threshold-growth rate in category-specific increments—not forecasts of future law. One employer-plan group per person only; no outside contributions, forfeitures or other employer additions.</p>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {numeric("employeeLimit", "Combined regular employee limit (USD/year)")}
              {numeric("additionsLimit", "Combined employee + employer additions limit (USD/year)")}
              {numeric("compensationCap", "Eligible compensation cap (USD/year)")}
            </div>
            <div className="flex items-start gap-2"><input id={`saving-${ownerId}-verified`} type="checkbox" checked={owner.verified} onChange={event => change({ verified: event.target.checked })} aria-describedby={`saving-${ownerId}-terms`} className="mt-1 shrink-0" />
              <label htmlFor={`saving-${ownerId}-verified`} className="text-sm">I verified eligibility and these plan limits. This scenario excludes catch-up and outside additions; any match uses annual true-up, full vesting and traditional pretax employer deposits.</label></div>
            <div className="flex items-center gap-2"><input id={`saving-${ownerId}-match`} type="checkbox" checked={owner.matchEnabled} onChange={event => change({ matchEnabled: event.target.checked })} />
              <label htmlFor={`saving-${ownerId}-match`}>Include employer match</label></div>
            {owner.matchEnabled && <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {numeric("matchRate", "Employer match (% of employee contribution)", 1000)}
              {numeric("matchThrough", "Match contributions up to (% of eligible salary)", 100)}
              <div className="min-w-0"><label htmlFor={`saving-${ownerId}-destination`} className="mb-1 block text-xs font-medium">Employer match destination</label>
                <select id={`saving-${ownerId}-destination`} value={owner.destination} required onChange={event => change({ destination: event.target.value })} className={control}>
                  <option value="">Choose traditional 401(k)</option>{plans.filter(account => account.kind === "401k").map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select><p className="mt-1 text-xs text-slate-500">Add a traditional 401(k) above if needed, even when employee deferrals go to Roth. A 50% match through 6% of salary means at most 3% of eligible salary before combined limits.</p>
              </div>
            </div>}
          </>}
        </div>}
      </fieldset>;
    })}
  </section>;
}
