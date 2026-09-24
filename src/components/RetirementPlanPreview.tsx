"use client";

import { useState, type FormEvent } from "react";
import styles from "./RetirementPlanPreview.module.css";
import { STATES } from "@/lib/states";
import { CITIES } from "@/lib/cities";
import { VERIFIED_RETIREMENT_STATES } from "@/lib/retirementPlan/verifiedLocation";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import InfoTip from "@/components/calculator-form/InfoTip";
import RetirementPlanError from "./RetirementPlanError";
import { buildPreviewInput, calculatePreview, PREVIEW_DEFAULTS } from "@/lib/retirementPlan/preview";
import { addPreviewConversions, comparePreviewConversions, initialConversionEditor } from "@/lib/retirementPlan/previewConversions";
import RetirementSimulation from "./RetirementSimulation";
import RetirementConversionEditor from "@/components/RetirementConversionEditor";
import RetirementConversionResults from "@/components/RetirementConversionResults";
import RetirementStrategyComparison from "@/components/RetirementStrategyComparison";
import RetirementSpendingSearch from "@/components/RetirementSpendingSearch";
import { initialAccountEditor, type AccountEditorState } from "@/lib/retirementPlan/previewAccounts";
import RetirementAccountEditor from "@/components/RetirementAccountEditor";
import RetirementContributionEditor from "@/components/RetirementContributionEditor";
import RetirementIraContributionEditor from "@/components/RetirementIraContributionEditor";
import RetirementIraContributionResults from "@/components/RetirementIraContributionResults";
import RetirementMedicareEditor from "@/components/RetirementMedicareEditor";
import RetirementMedicareResults from "@/components/RetirementMedicareResults";
import { initialMedicareEditor } from "@/lib/retirementPlan/previewMedicare";
import { initialIraContributionEditor, previewIraRows } from "@/lib/retirementPlan/previewIraContributions";
import { initialContributionEditor } from "@/lib/retirementPlan/previewContributions";
import { downloadCsv, type CsvRow } from "@/lib/csvExport";
import { downloadPdfReport, type PdfRow } from "@/lib/pdfExport";

const control = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const panel = "min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50";
const resultCard = "min-w-0 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800";
const primaryAction = "inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200";
const secondaryAction = "inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-950";
const stubAction = "inline-flex cursor-not-allowed items-center justify-center whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-400 opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500";
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const pensionTypeHelp = "Required for nonzero New York pensions. Enter the federally taxable pension amount above. Do not classify IRA withdrawals or rollovers here.";
// States where local tax could vary by city/county, so the location field is worth showing.
// Maryland and Indiana levy their local tax as a share of the state's own tax base (like NYC),
// unlike Ohio/Pennsylvania/Michigan/Missouri's earned-income-only local taxes, which simply
// exclude Social Security regardless of city.
const CITY_FIELD_STATES = ["ny", "md", "in", "pa"];

const VERDICT_STYLES = {
  funded: {
    border: "border-emerald-300 dark:border-emerald-900/60",
    bg: "bg-emerald-100/70 dark:bg-emerald-950/30",
    tag: "text-emerald-700 ring-emerald-300 dark:text-emerald-300 dark:ring-emerald-800",
    label: "text-emerald-700 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  shortfall: {
    border: "border-rose-300 dark:border-rose-900/60",
    bg: "bg-rose-100/70 dark:bg-rose-950/20",
    tag: "text-rose-700 ring-rose-300 dark:text-rose-300 dark:ring-rose-800",
    label: "text-rose-700 dark:text-rose-400",
    value: "text-rose-700 dark:text-rose-400",
    bar: "bg-rose-500",
  },
} as const;

export default function RetirementPlanPreview() {
  const [values, setValues] = useState({ ...PREVIEW_DEFAULTS });
  const [accounts, setAccounts] = useState(initialAccountEditor);
  const [saving, setSaving] = useState(initialContributionEditor);
  const [medicare, setMedicare] = useState(initialMedicareEditor);
  const [conversions, setConversions] = useState(initialConversionEditor);
  const [conversionBaseline, setConversionBaseline] = useState<ReturnType<typeof calculatePreview> | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculatePreview> | null>(() => calculatePreview(PREVIEW_DEFAULTS, initialAccountEditor()));
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [runVersion, setRunVersion] = useState(0);
  const [strategyReset, setStrategyReset] = useState(0);
  const change = (key: string, value: string) => { setValues(previous => ({ ...previous, [key]: value })); setDirty(true); };
  const changeAccounts = (value: AccountEditorState) => { setAccounts(value); setDirty(true); };
  const changeSaving = (value: typeof saving) => { setSaving(value); setDirty(true); };
  const numeric = (key: string, label: string, options: { min?: number; max?: number; step?: string; helpText?: string } = {}) => (
    <NumberField key={key} id={`plan-${key}`} label={label} value={values[key]} onChange={value => change(key, value)}
      className={control} wrapperClassName="min-w-0" required min={options.min ?? 0} max={options.max ?? 1e9} step={options.step ?? "any"}
      info={options.helpText ? <InfoTip text={options.helpText} /> : undefined} />
  );
  const date = (key: string, label: string, info?: string) => <div key={key} className="min-w-0">
    <label htmlFor={`plan-${key}`} className="mb-1 flex items-center text-xs font-medium text-slate-600 dark:text-slate-400">{label}{info ? <InfoTip text={info} /> : null}</label>
    <input id={`plan-${key}`} type="date" required value={values[key]} onChange={event => change(key, event.target.value)} className={control} />
  </div>;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const next = comparePreviewConversions(buildPreviewInput(values, accounts, saving, medicare), conversions);
      setResult(next.result);
      setConversionBaseline(next.baseline);
      setDirty(false);
      setError("");
      setRunVersion(v => v + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please check the scenario inputs.");
    }
  };
  const resetExample = () => {
    const fresh = initialAccountEditor();
    const freshSaving = initialContributionEditor();
    setSaving(freshSaving);
    setMedicare(initialMedicareEditor());
    setConversions(initialConversionEditor());
    setConversionBaseline(null);
    setStrategyReset(v=>v+1);
    setValues({ ...PREVIEW_DEFAULTS });
    setAccounts(fresh);
    setResult(calculatePreview(PREVIEW_DEFAULTS, fresh));
    setDirty(false);
    setError("");
    setRunVersion(v => v + 1);
  };
  const last = result?.years.at(-1);
  const rmdStartYear = result?.years.find(row => row.result.cash.requiredWithdrawals > 0)?.year ?? null;
  const lifetimeTaxes = result ? result.years.reduce((sum, row) => sum + row.result.tax.total, 0) : 0;
  const lifetimeRmds = result ? result.years.reduce((sum, row) => sum + row.result.cash.requiredWithdrawals, 0) : 0;
  const fundedYearsPct = result && result.years.length ? result.years.filter(row => row.result.cash.shortfall <= 0).length / result.years.length : 0;
  const vs = result?.allYearsFunded ? VERDICT_STYLES.funded : VERDICT_STYLES.shortfall;

  const handleExportCsv = () => {
    if (!result || dirty || error) return;
    const rows: CsvRow[] = result.years.map(row => ({
      Year: row.year,
      State: values.state,
      City: values.cityId || "Outside listed cities",
      "Age(s)": row.people.map(person => person.ageAtYearEnd).join(" / "),
      Income: row.result.cash.income,
      Spending: row.spending,
      "Tax estimate": row.result.tax.total,
      RMDs: row.result.cash.requiredWithdrawals,
      "Other withdrawals": row.result.cash.voluntaryWithdrawals,
      Shortfall: row.result.cash.shortfall,
      "Ending assets": row.endingPortfolio,
    }));
    downloadCsv("complete-retirement-plan-projection", rows);
  };
  const handleExportPdf = () => {
    if (!result || !last || dirty || error) return;
    const rows: PdfRow[] = [
      { Metric: "Household", Value: values.household === "married" ? "Two people" : "One person" },
      { Metric: "Resident location", Value: `${values.state.toUpperCase()} / ${values.cityId === "ny-outside-nyc-yonkers" ? "Outside NYC and Yonkers" : CITIES.find(city => city.id === values.cityId)?.name ?? "Outside listed cities"}` },
      { Metric: "Modeled years", Value: `${result.years[0].year}–${last.year}` },
      { Metric: "Spending & tax funding", Value: result.allYearsFunded ? "Funded in every modeled year" : `First shortfall: ${result.firstUnfundedYear}` },
      { Metric: "Ending assets · nominal", Value: money(last.endingPortfolio) },
      { Metric: "Ending assets · today's dollars", Value: money(last.endingPortfolioInStartYearDollars) },
      { Metric: "Lifetime taxes paid (modeled)", Value: money(lifetimeTaxes) },
      { Metric: "Lifetime RMDs withdrawn (modeled)", Value: money(lifetimeRmds) },
    ];
    downloadPdfReport({
      filename: "complete-retirement-plan-summary",
      title: "Complete Retirement Plan — Projection Summary",
      subtitle: result.allYearsFunded ? "Funded in every modeled year" : `First shortfall in ${result.firstUnfundedYear}`,
      rows,
      footerNote: "Development preview. Fictional example scenario. Planning estimate, not financial advice. relocationbynumbers.com",
    });
  };

  return <div className={`${styles.planner} min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100`}>
  <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-8 sm:py-12">
    <header className="mx-auto max-w-3xl space-y-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Local development preview</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Complete Retirement Plan</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Model your household’s full retirement timeline in one place: pre-retirement income and savings, Social Security and pensions,
        required minimum distributions, IRA and Roth basis, ESPP sales, and the taxes and withdrawals that settle each year’s cash flow —
        projected year by year across your household’s modeled horizon, for one or two people with independent retirement dates.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">Unreleased development preview. Uses a fictional example scenario. Florida, Texas, restricted New York, restricted Maryland, restricted Indiana, restricted DC, restricted Illinois, restricted New Jersey, restricted Pennsylvania, restricted Colorado, restricted New Mexico, restricted Minnesota, restricted Utah, restricted Connecticut and restricted Vermont resident scenarios are enabled. See “How this preview works” below for full limitations.</p>
    </header>

    <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_440px] lg:items-start">
      {/* ══════════════════════════ INPUTS ══════════════════════════ */}
      <div className="min-w-0 space-y-6">
        <section className={panel} aria-labelledby="plan-household-heading">
          <h2 id="plan-household-heading" className="mb-4 text-lg font-semibold">Household &amp; assumptions</h2>
          <div className="mb-4 grid min-w-0 gap-4 sm:grid-cols-2">
            <div className={`min-w-0 ${CITY_FIELD_STATES.includes(values.state) ? "" : "sm:col-span-2"}`}><label htmlFor="plan-state" className="mb-1 block text-sm">Resident state</label>
              <select id="plan-state" className={control} value={values.state} aria-describedby="plan-location-help" onChange={event => { setValues(previous => ({ ...previous, state: event.target.value, cityId: "" })); setDirty(true); }}>
                {STATES.map(state => <option key={state.code} value={state.code}>{state.name}{VERIFIED_RETIREMENT_STATES.includes(state.code) ? "" : " — not yet supported"}</option>)}
              </select></div>
            {CITY_FIELD_STATES.includes(values.state) && <div className="min-w-0"><label htmlFor="plan-city" className="mb-1 block text-sm">{values.state === "ny" || values.state === "pa" ? "Resident city" : "Resident county"}</label>
              <select id="plan-city" className={control} value={values.cityId} aria-describedby="plan-location-help" onChange={event => change("cityId", event.target.value)}>
                <option value="">{values.state === "ny" ? "Choose a New York location" : values.state === "md" ? "Choose a Maryland location" : values.state === "in" ? "Choose an Indiana location" : "Choose a Pennsylvania location"}</option>
                {values.state === "ny" && <option value="ny-outside-nyc-yonkers">Outside NYC and Yonkers</option>}
                {CITIES.filter(city => values.state === "ny" ? city.id === "nyc-ny"
                    : values.state === "md" ? ["baltimore-md", "frederick-md", "rockville-md"].includes(city.id)
                    : values.state === "in" ? ["indianapolis-in", "fort-wayne-in", "evansville-in"].includes(city.id)
                    : values.state === "pa" ? ["philadelphia-pa", "pittsburgh-pa", "allentown-pa"].includes(city.id)
                    : city.state === values.state)
                  .sort((a, b) => a.name.localeCompare(b.name)).map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select></div>}
          </div>
          <p id="plan-location-help" className="mb-4 text-sm">Assumes full-year residence throughout the projection and no income taxable by another state or city. Florida, Texas, restricted New York, restricted Maryland, restricted Indiana, restricted DC, restricted Illinois, restricted New Jersey, restricted Pennsylvania, restricted Colorado, restricted New Mexico, restricted Minnesota, restricted Utah, restricted Connecticut and restricted Vermont only. Location does not change your spending assumptions.</p>
          {values.state === "ny" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ny-contract">
            <input id="plan-ny-contract" type="checkbox" checked={values.nyContract === "confirmed"} onChange={event => change("nyContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a New York/NYC pre-credit estimate using enacted schedules for 2026, 2027–2032 and 2033 onward, not a prediction of future legislation. NY thresholds and exclusions are not grown with inflation. It excludes credits, itemization and other NY adjustments. My IRA funds were contributed before retirement; private pensions are qualifying periodic pensions; government pensions are fully eligible for the selected exemption; investment income is fully NY taxable. Yonkers, inherited funds and cross-border income are not supported. Workplace-plan/nonqualified Roth distributions may block calculation. Pension eligibility in the year of turning 59½ is estimated by calendar-day proration; actual eligible payments received on or after that date may differ.</span>
          </label>}
          {values.state === "md" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-md-contract">
            <input id="plan-md-contract" type="checkbox" checked={values.mdContract === "confirmed"} onChange={event => change("mdContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Maryland pre-credit estimate using enacted 2026 state brackets and local rates, not a prediction of future legislation. Maryland thresholds, the pension exclusion cap and standard deduction are not grown with inflation. Only Baltimore City, Frederick County and Montgomery County are rated; every other Maryland county is unsupported. Social Security is fully excluded. The pension exclusion applies only to income entered as annual pension for an owner 65 or older by year end, capped and reduced by that owner’s own Social Security; disability-based eligibility and 401(k)/IRA account withdrawals do not qualify here. The 2% net-capital-gains surtax above $350,000 FAGI, itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "in" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-in-contract">
            <input id="plan-in-contract" type="checkbox" checked={values.inContract === "confirmed"} onChange={event => change("inContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Indiana pre-credit estimate using the enacted 2026 flat 2.95% state rate and flat county rates, not a prediction of future legislation. Indiana exemption amounts and the civil service annuity deduction cap are not grown with inflation. Only Marion, Allen and Vanderburgh counties are rated; every other Indiana county is unsupported. Social Security is fully excluded. The civil service annuity deduction applies only to income entered as annual pension for an owner 62 or older, capped at $16,000 and reduced by that owner’s own Social Security; this planner cannot verify the pension is actually a nonmilitary civil service annuity, and Indiana’s separate, fully-excluding military retirement pay deduction is not modeled. Dependent exemptions, itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "dc" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-dc-contract">
            <input id="plan-dc-contract" type="checkbox" checked={values.dcContract === "confirmed"} onChange={event => change("dcContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a DC pre-credit estimate using the enacted tax brackets (unchanged for 2026), not a prediction of future legislation. DC’s standard deduction and bracket thresholds are not grown with inflation. DC has no local income tax. Social Security is fully excluded. DC’s $3,000 government pension exclusion expired before 2015 and is correctly not applied here, so pension, IRA and annuity income are fully taxable. DC’s separate, uncapped exclusion for a DC/federal government survivor age 62 or older is not modeled, since this planner cannot distinguish a survivor annuity from an owner’s own pension. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "il" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-il-contract">
            <input id="plan-il-contract" type="checkbox" checked={values.ilContract === "confirmed"} onChange={event => change("ilContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Illinois pre-credit estimate using the enacted flat 4.95% rate, not a prediction of future legislation. Illinois has no local income tax. The exemption allowance and its age/blind additions are not grown with inflation, and the entire allowance is eliminated above $250,000 (single) or $500,000 (married) federal AGI. Social Security is fully excluded, as is any income entered as annual pension at any owner age, and this planner’s combined 401(k)/IRA/annuity distribution figure, which cannot be separated from a nonqualified annuity withdrawal that would not actually qualify. Government pension income reported as wages and deferred-compensation plans are not modeled. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "nj" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-nj-contract">
            <input id="plan-nj-contract" type="checkbox" checked={values.njContract === "confirmed"} onChange={event => change("njContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a New Jersey pre-credit estimate using enacted graduated brackets, not a prediction of future legislation. New Jersey has no local income tax. Exemptions and exclusion thresholds are not grown with inflation. Social Security is fully excluded. The Pension, Annuity and IRA Withdrawal Exclusion applies only if an owner is 62 or older by year end (disability-based eligibility is unsupported), only when household total income is $150,000 or less, and combines income entered as annual pension with this planner’s combined 401(k)/IRA/annuity distribution figure, capped and phased down by filing status; that figure cannot be separated from a nonqualified annuity withdrawal that may not actually qualify. Only single and married-filing-jointly are supported. Itemized deductions, credits and dependent exemptions are excluded.</span>
          </label>}
          {values.state === "pa" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-pa-contract">
            <input id="plan-pa-contract" type="checkbox" checked={values.paContract === "confirmed"} onChange={event => change("paContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Pennsylvania pre-credit estimate using the enacted flat 3.07% state rate, not a prediction of future legislation. Pennsylvania has NO standard deduction or personal exemption of any kind. Social Security and income entered as annual pension are fully excluded from state tax. This planner’s combined 401(k)/IRA/annuity distribution figure is excluded except for the portion that triggered the federal early-distribution penalty, used as a proxy for Pennsylvania’s own age-59½ test, which can be wrong for a penalty exception unrelated to age. Only Philadelphia, Pittsburgh and Allentown are rated for the separate local Earned Income Tax, which applies only to wages, never to retirement income; Pittsburgh’s rate is corroborated from secondary sources, not the city’s own primary bulletin. Tax Forgiveness and other credits are excluded.</span>
          </label>}
          {values.state === "co" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-co-contract">
            <input id="plan-co-contract" type="checkbox" checked={values.coContract === "confirmed"} onChange={event => change("coContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Colorado pre-credit estimate using the enacted flat 4.40% rate applied to federal taxable income, not a prediction of future legislation. Colorado has no local income tax and no separate Colorado standard deduction. Social Security is fully excluded for an owner 65 or older, or for an owner 55-64 when household federal AGI is at or below $75,000 (single) or $95,000 (married); otherwise up to $20,000 per owner 55-64. Pension income (entered as annual pension) is separately excluded up to $24,000 per owner 65 or older, or up to $20,000 per owner 55-64, shared with that owner’s own Social Security exclusion when the general (non income-tested) cap applies — this planner assumes, without independent confirmation, that the income-tested Social Security exemption leaves that same owner’s pension cap untouched. A household with an owner under 55 receiving Social Security is unsupported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "nm" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-nm-contract">
            <input id="plan-nm-contract" type="checkbox" checked={values.nmContract === "confirmed"} onChange={event => change("nmContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a New Mexico pre-credit estimate using the enacted 2025-and-after graduated brackets, not a prediction of future legislation. New Mexico has no local income tax. Taxable income starts from federal AGI less the household’s own federal standard deduction; New Mexico’s own personal exemption remains $0. Social Security is excluded per the income-tested exemption. A graduated age-65-or-blind exemption (up to $8,000 per qualifying person) and a Low- and Middle-Income Tax Exemption (up to $2,500 per person, phased and income-limited) are also applied. The armed forces retirement exemption, dependent deduction, medical care expense exemption and net capital gains deduction are not modeled. Only single and married-filing-jointly are supported.</span>
          </label>}
          {values.state === "mn" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-mn-contract">
            <input id="plan-mn-contract" type="checkbox" checked={values.mnContract === "confirmed"} onChange={event => change("mnContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Minnesota pre-credit estimate using the enacted 2026 brackets, not a prediction of future legislation. Minnesota has no local income tax and uses its own standard deduction ($15,300 single/$30,600 married, plus $1,850/$1,450 per age-65-or-blind condition), not the federal figure. Social Security uses the larger of Minnesota’s simplified or alternate-method subtraction. The Qualified Public Pension Subtraction is not modeled, since it applies only to specific public pension plans not coordinated with Social Security that this planner cannot identify; all pension income is fully taxable here. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "ut" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ut-contract">
            <input id="plan-ut-contract" type="checkbox" checked={values.utContract === "confirmed"} onChange={event => change("utContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Utah pre-credit estimate using the enacted flat 4.45% rate, not a prediction of future legislation. Utah has no local income tax and NO separate standard deduction: the rate applies directly to federal AGI. Social Security instead receives a nonrefundable credit equal to 4.45% of taxable benefits, phased out above $54,000 (single) or $90,000 (married) modified AGI. Utah’s general Taxpayer Tax Credit, available to nearly all filers regardless of retirement status, is not modeled, so this estimate overstates Utah tax for most households. The separate birth-year-gated Retirement Credit is also not modeled. Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded.</span>
          </label>}
          {values.state === "ct" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ct-contract">
            <input id="plan-ct-contract" type="checkbox" checked={values.ctContract === "confirmed"} onChange={event => change("ctContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Connecticut pre-credit estimate using the enacted graduated brackets (2%-6.99%), not a prediction of future legislation. Connecticut has no local income tax. The married-filing-jointly bracket schedule is the well-corroborated doubling of the single thresholds, not independently read from a primary return-instructions table. Connecticut&apos;s own step-down personal exemption applies, phased out by $44,001 (single) or $71,001 (married) federal AGI. Social Security is fully excluded below $75,000 (single) or $100,000 (married) federal AGI; above it, a worksheet-based partial exclusion applies whose federal input this planner approximates rather than reads directly. Pension income (entered as annual pension) and this planner&apos;s combined 401(k)/IRA/annuity distribution figure share a single phase-out by federal AGI (100% below $75,000/$100,000, 0% at $100,000/$150,000); real law caps IRA distributions at 75% of that percentage and separately excludes military retired pay, Railroad Retirement and Connecticut teachers&apos; retirement pay, none of which this planner can identify, so the subtraction is overstated for such income. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "vt" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-vt-contract">
            <input id="plan-vt-contract" type="checkbox" checked={values.vtContract === "confirmed"} onChange={event => change("vtContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Vermont pre-credit estimate using the enacted 2025 graduated brackets (3.35%-8.75%), not a prediction of future legislation. Vermont has no local income tax. It uses Vermont&apos;s own standard deduction ($7,650 single/$15,300 married, plus $1,250 per age-65-or-blind condition) and a $5,300-per-person personal exemption, not federal figures. Once federal AGI exceeds $150,000, tax is the greater of the bracket calculation or 3% of federal AGI. The household is assumed to elect whichever gives the larger subtraction between excluding Social Security benefits or up to $10,000 of federal/other-government pension income, both phased out between $55,000-$65,000 (single) or $70,000-$80,000 (married) federal AGI. All entered tax-exempt interest is added back as Vermont-taxable, since this planner cannot identify Vermont-specific municipal bonds, and interest from U.S. obligations is not separately tracked or subtracted. Vermont&apos;s separate, uncapped Military Retirement Income Exemption is not modeled, since this planner cannot identify military retirement pay. Only single and married-filing-jointly are supported. No credits are modeled.</span>
          </label>}
          {!VERIFIED_RETIREMENT_STATES.includes(values.state) && <p role="status" className="mb-4 text-sm text-red-700 dark:text-red-300">This location is not yet supported. No retirement tax estimate will be generated.</p>}
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0"><label htmlFor="plan-household" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Household / filing status</label>
              <select id="plan-household" value={values.household} onChange={event => change("household", event.target.value)} className={control}>
                <option value="single">One person / Single</option><option value="married">Two people / Married filing jointly</option>
              </select></div>
            {numeric("startYear", "First full calendar year", { min: 2026, max: 2126, step: "1" })}
            {numeric("endYear", "Last calendar year", { min: Number(values.startYear) || 2026, max: 2126, step: "1" })}
            {numeric("spending", "Annual household spending (USD)", { helpText: "First-year dollars; excludes income tax and includes healthcare. Applies before and after retirement." })}
            {numeric("cash", "Household cash reserve (USD)", { helpText: "Zero-interest cash; used before IRA withdrawals." })}
            {numeric("inflation", "Spending / salary / benefit growth (%)", { max: 20 })}
            <div className="min-w-0"><label htmlFor="plan-threshold-growth-mode" className="mb-1 block text-xs font-medium">Tax &amp; contribution threshold growth</label>
              <select id="plan-threshold-growth-mode" value={values.thresholdGrowthMode} onChange={event => change("thresholdGrowthMode", event.target.value)} className={control}>
                <option value="linked">Use spending inflation</option><option value="separate">Advanced: separate growth rate</option>
              </select></div>
            {values.thresholdGrowthMode === "separate" && numeric("taxGrowth", "Tax & contribution threshold growth (%)", { max: 20,
              helpText: "Scenario rate for indexed federal thresholds, payroll wage cap and workplace limits. Not future published rules." })}
          </div>
        </section>
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          {(values.household === "married" ? ["one", "two"] : ["one"]).map((id, index) => <fieldset key={id} className={panel}>
            <legend className="sr-only">Person {index + 1}</legend>
            <h3 className="mb-4 text-lg font-semibold">Person {index + 1}</h3>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {date(`${id}-birth`, "Date of birth")}{date(`${id}-retirement`, "Retirement date", "This is when wages stop for this person.")}
              {numeric(`${id}-salary`, "Gross annual salary (USD)")}
              {numeric(`${id}-pension`, "Taxable pension (USD)")}{date(`${id}-pensionStart`, "Pension starts")}
              <div className="min-w-0">
                <div className="mb-1 flex items-center">
                  <label htmlFor={`plan-${id}-pension-type`} className="text-sm font-medium">Pension type</label>
                  <InfoTip text={pensionTypeHelp} />
                </div>
                <select id={`plan-${id}-pension-type`} className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  value={values[`${id}-pensionType`] ?? "unspecified"} onChange={event => change(`${id}-pensionType`, event.target.value)}
                  aria-describedby={`plan-${id}-pension-type-help`}>
                  <option value="unspecified">Not specified</option>
                  <option value="private">Private employer pension</option>
                  <option value="ny-government">New York state/local government pension</option>
                  <option value="federal-government">Federal government pension</option>
                  <option value="other-government">Other government pension</option>
                </select>
                <span id={`plan-${id}-pension-type-help`} className="sr-only">{pensionTypeHelp}</span>
              </div>
              {numeric(`${id}-benefit`, "Social Security (USD)")}{date(`${id}-benefitStart`, "Social Security starts")}
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Income amounts are full-year amounts in the first modeled year’s dollars, even when starting later. Enter expected payable Social Security; this preview does not calculate claiming benefits or the earnings test.</p>
          </fieldset>)}
        </div>
        <RetirementAccountEditor value={accounts} onChange={changeAccounts} married={values.household === "married"} startYear={Number(values.startYear) || 2026} />
        <RetirementContributionEditor accounts={accounts} value={saving} married={values.household === "married"} onChange={changeSaving} />
        <RetirementIraContributionEditor accounts={accounts} value={saving.ira ?? initialIraContributionEditor()} married={values.household === "married"}
          onChange={ira => changeSaving({ ...saving, ira })} />
        <RetirementMedicareEditor value={medicare} onChange={next => { setMedicare(next); setDirty(true); }} married={values.household === "married"}
          startYear={Number(values.startYear)} endYear={Number(values.endYear)} />
        <RetirementConversionEditor value={conversions} onChange={next => { setConversions(next); setDirty(true); }} accounts={accounts} married={values.household === "married"} />
        <RetirementStrategyComparison key={strategyReset} accounts={accounts} married={values.household === "married"} scenarioKey={JSON.stringify([values,accounts,saving,medicare])} buildInput={()=>buildPreviewInput(values,accounts,saving,medicare)} />
        <RetirementSpendingSearch
          investedAccounts={accounts.accounts.filter(a => (a.ownerId === "one" || values.household === "married") && a.kind !== "cash" && a.kind !== "annuity").map(a => ({ id: a.id, name: a.name }))}
          scenarioKey={JSON.stringify([values, accounts, saving, medicare, conversions])}
          buildInput={() => addPreviewConversions(buildPreviewInput(values, accounts, saving, medicare), conversions)} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">Run projection</button>
          <button type="button" onClick={resetExample} className="rounded-xl border border-slate-300 px-5 py-3 text-sm dark:border-slate-700">Reset example</button>
          {dirty && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">Inputs changed. Run the projection to refresh results.</p>}
        </div>
        {error && <RetirementPlanError message={error} />}
      </div>

      {/* ══════════════════════════ RESULTS ══════════════════════════ */}
      {result && last && (
        <div className="min-w-0 lg:sticky lg:top-6">
          {/* ── HERO VERDICT ── */}
          <div key={runVersion} className={`animate-result-update rounded-2xl border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-opacity ${vs.border} ${vs.bg} ${dirty ? "opacity-70" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${vs.label}`}>{dirty || error ? "Previous projection — not current inputs" : "Projected outcome"}</div>
                <div className={`mt-1.5 text-4xl font-bold tabular-nums sm:text-5xl ${vs.value}`}>{money(last.endingPortfolio)}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ending assets, nominal · {last.year}</div>
              </div>
              <div className={`shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 dark:bg-slate-800 ${vs.tag}`}>
                {dirty || error ? "Out of date" : result.allYearsFunded ? "Funded" : `Shortfall · ${result.firstUnfundedYear}`}
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-slate-200/50 dark:bg-slate-800/70 dark:ring-slate-700/50">
              <div className={`h-full rounded-full transition-all ${vs.bar}`} style={{ width: `${Math.round(fundedYearsPct * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{Math.round(fundedYearsPct * 100)}% of modeled years fully funded · planning estimate, not financial advice.</p>
            {dirty && <p role="status" className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">Inputs changed — run the projection to refresh these results.</p>}

            <div className="mt-4 grid gap-2 rounded-xl bg-white/90 p-3 text-sm dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Ending assets · nominal</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{money(last.endingPortfolio)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Ending assets · today’s dollars</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{money(last.endingPortfolioInStartYearDollars)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Lifetime taxes paid</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{money(lifetimeTaxes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Lifetime RMDs withdrawn</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{money(lifetimeRmds)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={dirty || Boolean(error)} onClick={handleExportCsv} className={primaryAction} title="Export CSV">CSV</button>
              <button type="button" disabled={dirty || Boolean(error)} onClick={handleExportPdf} className={secondaryAction} title="Export PDF">PDF</button>
              <button type="button" disabled title="Share scenario — coming soon, needs shareable URL-fragment state" className={stubAction}>Share</button>
              <button type="button" disabled title="Save scenario — coming soon, needs shareable URL-fragment state" className={stubAction}>Save</button>
            </div>
          </div>
        </div>
      )}
    </form>

    {/* ══════════════════════════ BALANCE OVER TIME ══════════════════════════ */}
    <RetirementSimulation key={JSON.stringify([values, accounts, saving, medicare, conversions, runVersion])}
      getInput={() => addPreviewConversions(buildPreviewInput(values, accounts, saving, medicare), conversions)}
      investedAccounts={accounts.accounts.filter(a => (a.ownerId === "one" || values.household === "married") && a.kind !== "cash" && a.kind !== "annuity").map(a => ({ id: a.id, name: a.name }))}>
    {result && last && (
      <section className={resultCard}>
        <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Balance over time</div>
        <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Nominal ending assets, {result.years[0].year}–{last.year}</div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.years} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="currentColor" />
              <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 11 }} width={48} stroke="currentColor" />
              <Tooltip formatter={(value: number) => [money(Number(value)), "Ending assets"]} labelFormatter={(year) => `Year ${year}`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Area dataKey="endingPortfolio" name="Ending assets" stroke={result.allYearsFunded ? "#059669" : "#e11d48"} fill={result.allYearsFunded ? "#10b981" : "#f43f5e"} fillOpacity={0.22} strokeWidth={2} isAnimationActive />
              {rmdStartYear != null && <ReferenceLine x={rmdStartYear} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "RMDs begin", position: "insideTopRight", fontSize: 10, fill: "#64748b" }} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    )}
    </RetirementSimulation>

    {/* ══════════════════════════ YEAR-BY-YEAR TABLE ══════════════════════════ */}
    {result && last && (
      <section className={resultCard}>
        <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Year-by-year · fixed-return projection</div>
        <p id="plan-table-help" className="mb-2 text-xs text-slate-500 dark:text-slate-400">Scroll sideways on small screens. Shaded bands mark 5-year spans; the flagged row is the first year RMDs are required.</p>
        <div role="region" aria-label="Year-by-year results" aria-describedby="plan-table-help" tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border border-slate-200 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-slate-800">
          <table className="w-full min-w-[56rem] text-right text-sm">
            <caption className="sr-only">Annual household income, spending, tax, required distributions, withdrawals and ending assets</caption>
            <thead className="bg-slate-100 dark:bg-slate-950"><tr>
              {["Year", "Age(s)", "Income", "Spending", "Tax estimate", "RMDs", "Other withdrawals", "Shortfall", "Ending assets"].map((label, index) => (
                <th key={label} scope="col" className={`whitespace-nowrap px-4 py-3 font-semibold ${index < 2 ? "text-left" : ""}`}>{label}</th>
              ))}
            </tr></thead>
            <tbody>{result.years.map((row, index) => {
              const band = Math.floor(index / 5) % 2 === 1;
              const isRmdStart = rmdStartYear === row.year;
              return <tr key={row.year} className={`border-t border-slate-200 dark:border-slate-800 ${band ? "bg-slate-50 dark:bg-slate-950/60" : ""} ${isRmdStart ? "border-l-4 border-l-emerald-500" : ""}`}>
                <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  {row.year}
                  {isRmdStart && <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">RMDs begin</span>}
                </th>
                <td className="whitespace-nowrap px-4 py-3 text-left tabular-nums">{row.people.map(person => person.ageAtYearEnd).join(" / ")}</td>
                {[row.result.cash.income, row.spending, row.result.tax.total, row.result.cash.requiredWithdrawals, row.result.cash.voluntaryWithdrawals, row.result.cash.shortfall, row.endingPortfolio].map((amount, cellIndex) => (
                  <td key={cellIndex} className={`whitespace-nowrap px-4 py-3 tabular-nums ${cellIndex === 5 && amount > 0 ? "font-semibold text-rose-600 dark:text-rose-400" : ""}`}>{money(amount)}</td>
                ))}
              </tr>;
            })}</tbody>
          </table>
        </div>
      </section>
    )}

    {/* ══════════════════════════ DETAIL & METHODOLOGY ══════════════════════════ */}
    {result && last && (
      <section className="min-w-0 space-y-4" aria-labelledby="plan-detail-heading">
        <h2 id="plan-detail-heading" className="sr-only">Additional detail and methodology</h2>
        <details className={panel}>
          <summary className="cursor-pointer text-lg font-semibold">How this preview works</summary>
          <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Preview limitations</h3>
              <p className="mt-1">This screen models Florida, Texas, restricted New York, restricted Maryland, restricted Indiana, restricted DC, restricted Illinois, restricted New Jersey, restricted Pennsylvania, restricted Colorado, restricted New Mexico, restricted Minnesota, restricted Utah, restricted Connecticut or restricted Vermont scenarios and the supported account contracts described in the account editor. New York, Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania, Colorado, New Mexico, Minnesota, Utah, Connecticut and Vermont each require explicit acceptance of an enacted-law pre-credit scenario, including New York’s scheduled 2027 and 2033 changes; future legislation is not predicted for any of the thirteen. Maryland rates only Baltimore City, Frederick County and Montgomery County, and its pension exclusion covers only entered pension income for owners 65 or older. Indiana rates only Marion, Allen and Vanderburgh counties, and its civil service annuity deduction covers only entered pension income for owners 62 or older. DC has no local income tax and no working pension exclusion (its $3,000 exclusion expired before 2015), so entered pension income is fully taxable there. Illinois has no local income tax and fully exempts pension income at any owner age, plus this planner’s combined 401(k)/IRA/annuity distribution figure, but its exemption allowance disappears entirely above $250,000/$500,000 federal AGI. New Jersey has no local income tax and excludes pension/IRA/annuity income only when an owner is 62 or older and household income is $150,000 or less, capped and phased down by filing status. Pennsylvania has no standard deduction or exemption at all, but fully excludes pension and normal retirement-account income from state tax; its local Earned Income Tax (Philadelphia, Pittsburgh or Allentown only) applies only to wages, never to retirement income. Colorado applies its flat rate to federal taxable income directly (no separate state standard deduction), fully excludes Social Security for an owner 65+ (or 55-64 under an income limit), and separately excludes pension income up to $20,000-$24,000 per owner depending on age, sharing the cap with that owner’s own Social Security when the general cap applies. New Mexico has no local income tax and starts from federal AGI less the federal standard deduction, layering an income-tested Social Security exemption, a graduated age-65-or-blind exemption and a Low- and Middle-Income Tax Exemption on top. Minnesota has no local income tax, uses its own (non-federal) standard deduction, and excludes pension income only through a narrow public-pension subtraction this planner cannot verify, so pension income is otherwise fully taxable there. Utah has no local income tax and no standard deduction at all; Social Security instead gets an income-phased nonrefundable credit, and Utah’s general Taxpayer Tax Credit (unrelated to retirement) is not modeled, so Utah tax is overstated here for most households. Connecticut has no local income tax and uses its own step-down personal exemption; Social Security uses a worksheet-based partial exclusion above $75,000/$100,000 federal AGI whose federal input is approximated, and pension/retirement-account income shares a single phase-out that overstates the exclusion for IRA distributions and does not carve out military, Railroad Retirement or teachers’ retirement pay. Vermont has no local income tax and uses its own standard deduction and personal exemption; the household is assumed to elect whichever gives the larger subtraction between excluding Social Security or up to $10,000 of federal/other-government pension income, tax-exempt interest is added back as fully Vermont-taxable, and Vermont’s separate Military Retirement Income Exemption is not modeled. Workplace contributions use verified scenario limits. IRA contributions use the restricted annual eligibility model with explicit coverage and deduction choices. Unsupported account or tax cases are blocked rather than approximated. Do not use these results to make financial decisions.</p>
              <p className="mt-2">Inputs stay in this tab’s memory only. This preview does not save them, put them in the URL, or submit them to an API. Reloading the page restores the fictional example.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Growth &amp; threshold assumptions</h3>
              <p className="mt-1">Growth rates are editable scenario assumptions, not forecasts. Indexed federal thresholds and workplace limits follow spending inflation unless overridden. Social Security taxability thresholds stay fixed at $25,000/$34,000 single and $32,000/$44,000 married filing jointly, since they’ve never been inflation-indexed by law. Other non-indexed thresholds also remain fixed. Contribution limits use category-specific increments; annual saving requests and pensions remain fixed nominal amounts. Optional IRMAA uses the household threshold-growth rate and a separate surcharge-cost growth assumption. Base Medicare premiums remain in spending. State retirement-tax accuracy is unfinished.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Results &amp; table notes</h3>
              <p className="mt-1">Results are estimates only. No information entered is stored or shared. Tax estimates include federal income tax, FICA, state income tax, and supported local city income taxes where applicable. Table amounts are nominal USD, rounded for display only; dates are prorated, but the engine uses annual — not monthly — growth.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Model assumptions &amp; unfinished features</h3>
              <ul className="mt-1 list-disc space-y-2 pl-5">{result.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
            </div>
          </div>
        </details>
        <details className={panel}>
          <summary className="cursor-pointer font-semibold">Annual contributions &amp; employer match</summary>
          <p className="mt-2 text-sm text-slate-500">Requested saving is prorated through retirement. Eligible saving reflects entered workplace limits and calculated IRA eligibility; funded saving reflects available household cash. Employer deposits are separate from household income.</p>
          <div className="mt-3 max-w-full overflow-x-auto" role="region" aria-label="Annual contribution results" tabIndex={0}>
            <table className="w-full text-right text-sm"><thead><tr>{["Year", "Requested", "Eligible", "Funded", "Employer match"].map((label, index) => <th key={label} scope="col" className={`whitespace-nowrap px-3 py-2 ${index === 0 ? "text-left" : ""}`}>{label}</th>)}</tr></thead>
              <tbody>{result.years.map(row => <tr key={row.year}><th scope="row" className="whitespace-nowrap px-3 py-2 text-left">{row.year}</th>{[
                row.contributions.reduce((sum, item) => sum + item.requested, 0), row.contributions.reduce((sum, item) => sum + item.eligible, 0),
                row.result.cash.contributions, row.result.employerContributions].map((amount, index) => <td key={index} className="whitespace-nowrap px-3 py-2 tabular-nums">{money(amount)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </details>
        <RetirementIraContributionResults rows={previewIraRows(result)} stale={dirty || Boolean(error)} />
        <RetirementMedicareResults result={result} stale={dirty || Boolean(error)} />
        {conversionBaseline && <RetirementConversionResults baseline={conversionBaseline} result={result} stale={dirty || Boolean(error)} />}
        <details className={panel}>
          <summary className="cursor-pointer font-semibold">Ending balance by account · {last.year}</summary>
          <dl className="mt-3 space-y-2 text-sm">{result.nextState.accounts.filter(account => !account.id.startsWith("owner-placeholder-")).map(account => <div key={account.id} className="flex min-w-0 flex-wrap justify-between gap-2 border-b border-slate-200 py-2 dark:border-slate-800">
            <dt className="min-w-0 break-words">{account.id === "cash" ? "Household settlement cash" : accounts.accounts.find(item => item.id === account.id)?.name ?? account.id} · Person {account.ownerId === "one" ? 1 : 2}</dt>
            <dd className="font-medium tabular-nums">{money(account.balance)}</dd>
          </div>)}</dl>
        </details>
      </section>
    )}
  </div>
  </div>;
}
