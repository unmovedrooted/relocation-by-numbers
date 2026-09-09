"use client";
import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import type { AccountEditorState } from "@/lib/retirementPlan/previewAccounts";
import type { ConversionEditorState } from "@/lib/retirementPlan/previewConversions";

export default function RetirementConversionEditor({ value, onChange, accounts, married }: {
  value: ConversionEditorState; onChange: (next: ConversionEditorState) => void; accounts: AccountEditorState; married: boolean;
}) {
  const control = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
  const change = (key: keyof ConversionEditorState, next: string) => onChange({ ...value, [key]: next });
  const select = (key: "ownerId" | "sourceId" | "destinationId", label: string, options: [string, string][]) => <div className="min-w-0">
    <label htmlFor={`conversion-${key}`} className="mb-1 block text-sm">{label}</label>
    <select id={`conversion-${key}`} value={value[key]} required className={control} onChange={e => change(key, e.target.value)}>
      <option value="">Choose…</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select>
  </div>;
  return <details className="min-w-0 rounded-2xl border border-slate-200 p-4 sm:p-6 dark:border-slate-800">
    <summary className="mb-4 cursor-pointer text-lg font-semibold">Manual Roth conversions</summary>
    <label htmlFor="conversion-enabled" className="flex items-start gap-2"><input id="conversion-enabled" type="checkbox" checked={value.enabled} onChange={e => onChange({ ...value, enabled: e.target.checked })} />Compare a fixed conversion schedule</label>
    {value.enabled && <div className="mt-4 space-y-4">
      <p id="conversion-help" className="text-sm text-slate-500">One schedule, in fixed nominal USD each year—not inflation-adjusted or optimized. Add a traditional IRA and Roth IRA in Accounts first. The engine takes RMDs before conversions and applies owner-level nondeductible basis. Spending and taxes must remain funded; excessive requests are rejected, not silently reduced. IRA contribution eligibility with conversions remains unsupported. Existing withdrawal order determines tax funding.</p>
      {select("ownerId", "Conversion owner", married ? [["one", "Person 1"], ["two", "Person 2"]] : [["one", "Person 1"]])}
      {select("sourceId", "Source traditional IRA", accounts.accounts.filter(a => a.ownerId === value.ownerId && a.kind === "traditional-ira").map(a => [a.id, a.name]))}
      {select("destinationId", "Destination Roth IRA", accounts.accounts.filter(a => a.ownerId === value.ownerId && a.kind === "roth-ira").map(a => [a.id, a.name]))}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">{([['startYear', 'First conversion year'], ['endYear', 'Last conversion year']] as const).map(([key, label]) => <NumberField key={key} id={`conversion-${key}`} label={label} value={value[key]} onChange={v => change(key, v)} min={2026} max={2126} step="1" required className={control} wrapperClassName="min-w-0" />)}</div>
      <NumberField id="conversion-amount" label="Annual conversion amount (USD)" value={value.amount} onChange={v => change("amount", v)} min={0} max={1e9} step="any" required className={control} wrapperClassName="min-w-0" aria-describedby="conversion-help" />
    </div>}
  </details>;
}
