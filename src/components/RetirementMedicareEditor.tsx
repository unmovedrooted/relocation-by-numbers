"use client";
import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import InfoTip from "@/components/calculator-form/InfoTip";
import { requiredMedicareHistory, type MedicareEditorState, type MedicareOwnerDraft } from "@/lib/retirementPlan/previewMedicare";

const control = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
type Props = { value: MedicareEditorState; onChange: (value: MedicareEditorState) => void; married: boolean; startYear: number; endYear: number };
export default function RetirementMedicareEditor({ value, onChange, married, startYear, endYear }: Props) {
  const years = requiredMedicareHistory(startYear, endYear, married, value);
  return <details className="min-w-0 space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-6 dark:border-slate-800">
    <summary className="cursor-pointer text-xl font-semibold">Medicare / IRMAA</summary>
    <div className="flex items-start gap-2"><input id="medicare-enabled" type="checkbox" checked={value.enabled} onChange={e => onChange({ ...value, enabled: e.target.checked })} className="mt-1 shrink-0" />
      <label htmlFor="medicare-enabled">Include income-related Part B/D surcharges</label></div>
    {value.enabled && <>
      <p id="medicare-budget-help" className="text-sm text-amber-700 dark:text-amber-300">Keep standard Part B premiums, your Part D plan premium and other healthcare in annual household spending. Exclude IRMAA from that budget: this option adds only the income-related surcharges. It does not determine enrollment eligibility or model late penalties, appeals, coverage gaps or special Medicare programs.</p>
      <NumberField id="medicare-surcharge-growth" label="Future Medicare surcharge growth (%)" value={value.surchargeGrowth}
        onChange={raw => onChange({ ...value, surchargeGrowth: raw })} required min={0} max={20} step="any" className={control} wrapperClassName="min-w-0"
        info={<InfoTip text="Explicit cost-growth scenario from the 2026 surcharge table; 0 holds surcharge dollars fixed. Separate from the household rate used to project income thresholds. Not future published Medicare premiums." />} />
      {(married ? ["one", "two"] as const : ["one"] as const).map((id, index) => {
        const owner = value.owners[id];
        const change = (patch: Partial<MedicareOwnerDraft>) => onChange({ ...value, owners: { ...value.owners, [id]: { ...owner, ...patch } } });
        return <fieldset key={id} className="min-w-0 space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <legend className="px-1 text-sm font-semibold">Person {index + 1} · Medicare coverage</legend>
          <p className="text-xs text-slate-500">Enter the first covered month, including existing enrollment. Coverage continues through the horizon. Nothing is inferred from age, retirement or Social Security benefits.</p>
          {(["partB", "partD"] as const).map(part => <div key={part} className="min-w-0 space-y-2">
            <div className="flex items-center gap-2"><input id={`medicare-${id}-${part}`} type="checkbox" checked={owner[part]} onChange={e => change({ [part]: e.target.checked })} />
              <label htmlFor={`medicare-${id}-${part}`}>Person {index + 1} · {part === "partB" ? "Part B" : "Part D"} enrolled</label></div>
            {owner[part] && <div className="min-w-0"><label htmlFor={`medicare-${id}-${part}-start`} className="mb-1 block text-xs font-medium">Person {index + 1} · {part === "partB" ? "Part B" : "Part D"} first covered month</label>
              <input id={`medicare-${id}-${part}-start`} type="month" min="1900-01" max="2126-12" required value={owner[`${part}Start`]}
                onChange={e => change({ [`${part}Start`]: e.target.value })} className={control} /></div>}
          </div>)}
        </fieldset>;
      })}
      {years.length > 0 ? <div className="min-w-0 space-y-3">
        <h3 className="font-semibold">Historical income for the two-year lookback</h3>
        <p className="text-xs text-slate-500">IRMAA MAGI is the tax return’s adjusted gross income plus tax-exempt interest, not gross salary or today’s income. Enter 0 only if it is the actual amount. Later lookback years come from the projection. Joint scenarios require both people to have shared the indicated joint return.</p>
        {years.map(year => {
          const record = value.history[year] ?? { magi: "", filing: "" };
          const change = (patch: Partial<typeof record>) => onChange({ ...value, history: { ...value.history, [year]: { ...record, ...patch } } });
          return <div key={year} className="grid min-w-0 gap-3 sm:grid-cols-2">
            <NumberField id={`medicare-magi-${year}`} label={`${year} historical IRMAA MAGI (USD)`} value={record.magi} onChange={magi => change({ magi })}
              required min={-1e12} max={1e12} step="any" className={control} wrapperClassName="min-w-0" />
            <div className="min-w-0"><label htmlFor={`medicare-filing-${year}`} className="mb-1 block text-xs font-medium">{year} return filing status</label>
              <select id={`medicare-filing-${year}`} required value={record.filing} onChange={e => change({ filing: e.target.value as typeof record.filing })} className={control}>
                <option value="">Choose filing status</option>{!married && <option value="single">Single</option>}<option value="married">Married filing jointly</option>
              </select></div>
          </div>;
        })}
      </div> : <p className="text-xs text-slate-500">After valid enrollment months are entered, historical income fields appear only if needed. Enrollment beginning in the third modeled year or later uses projected lookback income.</p>}
      <div className="flex items-start gap-2"><input id="medicare-confirmed" type="checkbox" checked={value.confirmed} aria-describedby="medicare-budget-help" onChange={e => onChange({ ...value, confirmed: e.target.checked })} className="mt-1 shrink-0" />
        <label htmlFor="medicare-confirmed" className="text-sm">I confirm base premiums are in spending, IRMAA is excluded from that budget, and the continuous-coverage and historical-return assumptions apply.</label></div>
    </>}
  </details>;
}
