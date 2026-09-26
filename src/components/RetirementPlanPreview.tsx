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
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Beta preview</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">Assumptions updated: September 2026</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Complete Retirement Plan</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Model your household’s full retirement timeline in one place: pre-retirement income and savings, Social Security and pensions,
        required minimum distributions, IRA and Roth basis, ESPP sales, and the taxes and withdrawals that settle each year’s cash flow —
        projected year by year across your household’s modeled horizon, for one or two people with independent retirement dates.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">Beta preview. Uses a fictional example scenario. Florida, Texas, Alaska, Nevada, South Dakota, Tennessee, Wyoming, New Hampshire, restricted New York, restricted Maryland, restricted Indiana, restricted DC, restricted Illinois, restricted New Jersey, restricted Pennsylvania, restricted Colorado, restricted New Mexico, restricted Minnesota, restricted Utah, restricted Connecticut, restricted Vermont, restricted Montana, restricted Rhode Island, restricted California, restricted Virginia, restricted Arizona, restricted Georgia, restricted North Carolina, restricted South Carolina, restricted Ohio, restricted Massachusetts, restricted Iowa, restricted Mississippi, restricted Missouri, restricted Washington, restricted Alabama, restricted Arkansas, restricted Delaware, restricted Kansas, restricted Kentucky, restricted Nebraska, restricted West Virginia, restricted Idaho, restricted Louisiana, restricted Michigan, restricted Oklahoma, restricted Wisconsin, restricted Hawaii, restricted Maine, restricted North Dakota and restricted Oregon resident scenarios are enabled. See “How this preview works” below for full limitations.</p>
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
          <p id="plan-location-help" className="mb-4 text-sm">Assumes full-year residence throughout the projection and no income taxable by another state or city. Florida, Texas, Alaska, Nevada, South Dakota, Tennessee, Wyoming, New Hampshire, restricted New York, restricted Maryland, restricted Indiana, restricted DC, restricted Illinois, restricted New Jersey, restricted Pennsylvania, restricted Colorado, restricted New Mexico, restricted Minnesota, restricted Utah, restricted Connecticut, restricted Vermont, restricted Montana, restricted Rhode Island, restricted California, restricted Virginia, restricted Arizona, restricted Georgia, restricted North Carolina, restricted South Carolina, restricted Ohio, restricted Massachusetts, restricted Iowa, restricted Mississippi, restricted Missouri, restricted Washington, restricted Alabama, restricted Arkansas, restricted Delaware, restricted Kansas, restricted Kentucky, restricted Nebraska, restricted West Virginia, restricted Idaho, restricted Louisiana, restricted Michigan, restricted Oklahoma, restricted Wisconsin, restricted Hawaii, restricted Maine, restricted North Dakota and restricted Oregon only. Location does not change your spending assumptions.</p>
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
          {values.state === "mt" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-mt-contract">
            <input id="plan-mt-contract" type="checkbox" checked={values.mtContract === "confirmed"} onChange={event => change("mtContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Montana pre-credit estimate using the enacted 2026 two-bracket schedule (4.7%/5.65%), not a prediction of future legislation, including the already-enacted, lower 2027 schedule. Montana starts from federal taxable income (federal AGI less the federal standard/itemized deduction and Schedule 1-A additional deductions), since it has no separate state standard deduction or personal exemption; it does have a $5,660 subtraction for each spouse 65 or older by year end. Social Security is fully taxable in Montana with no state-level exemption or credit. Montana&apos;s preferential net long-term capital gains rate (3%/4.1%, below the ordinary rates) is not modeled, so all taxable income is taxed at ordinary rates, overstating tax for a household with taxable net long-term capital gains. The working-military-retiree and survivor-benefit subtraction is not modeled, since this planner cannot verify its specific residency-history eligibility. Montana has no local income tax. Only single and married-filing-jointly are supported. No credits are modeled.</span>
          </label>}
          {values.state === "ri" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ri-contract">
            <input id="plan-ri-contract" type="checkbox" checked={values.riContract === "confirmed"} onChange={event => change("riContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Rhode Island pre-credit estimate using the enacted 2026 bracket schedule (3.75%/4.75%/5.99%, the same thresholds for every filing status), not a prediction of future legislation. Rhode Island has no local income tax. Its own standard deduction and $5,250-per-person exemption phase out by 25% per $7,450 of modified federal AGI over $261,000, a mechanic inferred from the published range rather than read from the phase-out worksheet directly. Social Security and pension/401(k)/annuity income (entered as annual pension, capped at $50,000 per owner) are each excluded only for a spouse who has reached SSA full retirement age (computed from birth year, not day-precise) while household federal AGI stays under $107,000 (single/MFS/HOH) or $133,750 (married-joint) &mdash; Rhode Island&apos;s most recently published (2025) figures, since 2026 figures were not yet published as of this review. All entered tax-exempt interest is added back as Rhode Island-taxable, since this planner cannot identify Rhode Island-specific municipal bonds. Railroad retirement and the separate military service pension modification are not modeled. Only single and married-filing-jointly are supported. No credits are modeled.</span>
          </label>}
          {values.state === "ca" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ca-contract">
            <input id="plan-ca-contract" type="checkbox" checked={values.caContract === "confirmed"} onChange={event => change("caContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a California pre-credit estimate using the enacted 2025 nine-bracket schedule (1%-12.3%) plus the additional 1% Mental Health Services Act tax on taxable income over $1,000,000 (a single threshold, not doubled for married filers), not a prediction of future legislation. California has no local income tax. It uses its own standard deduction ($5,706 single/$11,412 married) and a $153 personal/blind/senior exemption CREDIT per qualifying person (subtracted from computed tax, not income), phased out above $252,203 (single) or $504,411 (married) federal AGI. Social Security is fully excluded, but California gives NO special exclusion for pension, 401(k), IRA or annuity income at any owner age &mdash; that income is fully taxable, unlike most other states in this planner. Only single and married-filing-jointly are supported. Itemized deductions and all other credits are excluded.</span>
          </label>}
          {values.state === "va" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-va-contract">
            <input id="plan-va-contract" type="checkbox" checked={values.vaContract === "confirmed"} onChange={event => change("vaContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Virginia pre-credit estimate using the enacted four-bracket schedule (2%/3%/5%/5.75%, identical for every filing status &mdash; Virginia does not double thresholds for married filers), not a prediction of future legislation. Virginia has no local income tax. It uses its own standard deduction ($8,750 single/$17,500 married) and an Age Deduction for a spouse 65 or older by year end: up to $12,000 each, reduced dollar-for-dollar once household federal AGI less taxable Social Security exceeds $50,000 (single) or $75,000 (married); a spouse born on or before January 1, 1939 keeps the full $12,000 regardless of income. Social Security is fully excluded. Virginia&apos;s growing military retirement pay subtraction is not modeled, since this planner cannot identify military retirement income. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "az" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-az-contract">
            <input id="plan-az-contract" type="checkbox" checked={values.azContract === "confirmed"} onChange={event => change("azContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Arizona pre-credit estimate using the enacted flat 2.5% rate, not a prediction of future legislation. Arizona has no local income tax and no separate personal exemption, only its own standard deduction ($15,750 single/$31,500 married). Social Security is fully excluded. Up to $2,500 per owner of income entered as annual pension with a federal-government or other-government pension type is excluded; a private or unspecified pension, and this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, remain fully taxable. Arizona&apos;s separate, uncapped military retirement pay subtraction is not modeled, since this planner cannot identify military retirement income. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "ga" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ga-contract">
            <input id="plan-ga-contract" type="checkbox" checked={values.gaContract === "confirmed"} onChange={event => change("gaContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Georgia pre-credit estimate using the enacted flat 5.19% rate, not a prediction of future legislation. Georgia has no local income tax and no personal exemption for the taxpayer or spouse, only its own standard deduction ($12,000 single/$24,000 married). Social Security is fully excluded. The Retirement Income Exclusion gives each spouse who is 62-64 up to $35,000, or 65 or older up to $65,000, of their own income entered as &quot;pension,&quot; up to $5,000 of their own wages, and a 50/50 share of this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure; taxable interest, dividends, capital gains and rental income are not included in this exclusion, since this planner does not track them per owner, understating the exclusion for a household with meaningful taxable investment income. The disability-based under-62 exclusion and Georgia&apos;s separate military retirement income exclusion are not modeled. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "nc" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-nc-contract">
            <input id="plan-nc-contract" type="checkbox" checked={values.ncContract === "confirmed"} onChange={event => change("ncContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a North Carolina pre-credit estimate using the enacted flat 4.25% rate, not a prediction of future legislation. North Carolina has no local income tax, no additional standard deduction for age 65 or blindness, and only its own standard deduction ($12,750 single/$25,500 married). Social Security is fully excluded. North Carolina&apos;s Bailey settlement exclusion (full exemption for certain NC/federal government retirement benefits, but only for a retiree vested with 5+ years of service as of August 12, 1989) and its separate Uniformed Services retirement deduction are not modeled, since this planner cannot verify a modeled owner&apos;s years of service as of a historical date or whether a pension is a military retirement; all pension income and this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure are treated as fully taxable, understating the benefit for a household that would actually qualify. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "sc" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-sc-contract">
            <input id="plan-sc-contract" type="checkbox" checked={values.scContract === "confirmed"} onChange={event => change("scContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a South Carolina pre-credit estimate using Act 110 of 2026&apos;s enacted two-bracket schedule (1.99% to $29,999; 5.21% times taxable income minus $966 above that, computed on federal AGI directly), not a prediction of future legislation. South Carolina has no local income tax. Its new Income Adjusted Deduction ($15,000 single/$30,000 married) phases out on a fraction of federal AGI over $40,000/$80,000, reaching $0 at $95,000/$190,000. Social Security is fully excluded. The General Retirement Income Deduction gives each owner up to $3,000 (under 65) or $10,000 (65+) of their own income entered as &quot;pension&quot; plus a 50/50 share of this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, and the Age 65 and Older Deduction adds up to $15,000 per spouse 65 or older against any income. South Carolina&apos;s separate, more generous military retirement deductions are not modeled, since this planner cannot identify military retirement income, understating the benefit for a household that would qualify. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "oh" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-oh-contract">
            <input id="plan-oh-contract" type="checkbox" checked={values.ohContract === "confirmed"} onChange={event => change("ohContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Ohio pre-credit estimate using the enacted flat 2.75% rate on Ohio taxable nonbusiness income above $26,050 (income up to $26,050 stays at 0%), not a prediction of future legislation. Ohio has no standard deduction, instead a Personal and Dependent Exemption of $2,400/$2,150/$1,900/$0 per person tiered by modified adjusted gross income. Social Security is fully excluded. The Retirement Income Credit (up to $200 per return) and the $50 Senior Citizen Credit both require modified adjusted gross income less exemptions under $100,000. The Joint Filing Credit and the alternative lump-sum retirement and distribution credits are not modeled, understating the benefit for a two-earner household or one taking a one-time total distribution. Ohio&apos;s own municipal and school district income taxes are separate, address-specific levies not modeled here. Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded.</span>
          </label>}
          {values.state === "ma" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ma-contract">
            <input id="plan-ma-contract" type="checkbox" checked={values.maContract === "confirmed"} onChange={event => change("maContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Massachusetts pre-credit estimate using the enacted flat 5% rate plus the additional 4% Fair Share surtax on taxable income over $1,107,750 (a single threshold, not doubled for married filers), not a prediction of future legislation. Massachusetts has no local income tax and no standard deduction, only personal exemptions ($4,400 single/$8,800 married), plus $700 per owner 65 or older and $2,200 per legally blind owner. Social Security is fully excluded. Pension income entered for an owner with a federal-government or other-government pension type is treated as a fully exempt contributory government pension; a private or unspecified pension, and this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, remain fully taxable. Massachusetts also exempts an out-of-state government pension under a state-by-state reciprocity test this planner cannot evaluate, so treating &quot;other-government&quot; as exempt may overstate the benefit for an out-of-state pension without reciprocity. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "ia" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ia-contract">
            <input id="plan-ia-contract" type="checkbox" checked={values.iaContract === "confirmed"} onChange={event => change("iaContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Iowa pre-credit estimate using the enacted flat 3.8% rate applied to federal taxable income (after the federal standard/itemized deduction), not a prediction of future legislation. Iowa has no separate state standard deduction. Social Security is fully excluded. A $40 Personal Credit ($80 married filing jointly) plus $20 per taxpayer 65 or older and a separate $20 per taxpayer legally blind (both can apply to the same taxpayer) applies against computed tax. Income entered as annual pension, and this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure (split evenly between spouses), is excluded for each owner 55 or older by year end; a younger owner&apos;s retirement income remains fully taxable, including Iowa&apos;s separate military retirement pay and disability-based exclusions, neither of which this planner can identify. Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded.</span>
          </label>}
          {values.state === "ms" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ms-contract">
            <input id="plan-ms-contract" type="checkbox" checked={values.msContract === "confirmed"} onChange={event => change("msContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Mississippi pre-credit estimate using the enacted, unconditionally scheduled rate on taxable income above a $10,000 exempt bracket per spouse ($20,000 married filing jointly) -- 4.0% for 2026, stepping down to 3.75% (2027), 3.5% (2028), 3.25% (2029) and 3.0% (2030 and later) -- not a prediction of future legislation; further post-2030 cuts are contingent on state revenue-growth triggers and are not modeled. Mississippi&apos;s own standard deduction ($2,300 single/$4,600 married) and personal exemption ($6,000 single/$12,000 married) apply before that exempt bracket. Social Security is fully exempt. Income entered as annual pension is fully exempt, and this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure is excluded except for the portion that triggers the federal early-distribution penalty, used as a proxy for Mississippi&apos;s own retirement-requirements test. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "mo" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-mo-contract">
            <input id="plan-mo-contract" type="checkbox" checked={values.moContract === "confirmed"} onChange={event => change("moContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Missouri pre-credit estimate using the enacted graduated schedule (0% to 4.7% in $1,348 taxable-income steps, the same brackets for every filing status) applied after Missouri&apos;s own standard deduction, which equals the federal standard deduction ($16,100 single/$32,200 married filing jointly), not a prediction of future legislation. Social Security is fully deducted for an owner 62 or older. Income entered as annual pension with a federal-government, other-government or ny-government pension type is a public pension, capped at $47,633 per owner (the latest published maximum Social Security benefit) and reduced by that owner&apos;s own Social Security deduction; a private or unspecified pension, and this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure (split evenly between spouses), is a private pension, capped at $6,000 per owner and phased out as household income rises. Missouri&apos;s separate military retirement pay exemption is not modeled. Only single and married-filing-jointly are supported. Itemized deductions and credits, including the refundable Property Tax Credit, are excluded.</span>
          </label>}
          {values.state === "wa" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-wa-contract">
            <input id="plan-wa-contract" type="checkbox" checked={values.waContract === "confirmed"} onChange={event => change("waContract", event.target.checked ? "confirmed" : "")} />
            <span>Washington has no individual income tax, but I accept a pre-credit estimate of its 7% excise tax on long-term capital gains above a $278,000 standard deduction (the latest published figure, for 2025, held here pending Washington&apos;s 2026 inflation adjustment, shared by a married couple rather than doubled), plus an additional 2.9% above $1,000,000 of taxable gain, not a prediction of future legislation. Retirement account distributions and real estate sales are never capital gains in this planner and are excluded exactly as Washington law requires; wages, pensions, Social Security, interest, dividends and short-term capital gains are not taxed at all. Washington&apos;s small-business, timber, livestock, condemnation, commercial-fishing and charitable-gift adjustments are not modeled.</span>
          </label>}
          {values.state === "al" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-al-contract">
            <input id="plan-al-contract" type="checkbox" checked={values.alContract === "confirmed"} onChange={event => change("alContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Alabama pre-credit estimate using the enacted graduated schedule (2% to $500 single/$1,000 married, 4% to $3,000/$6,000, 5% above), applied after Alabama&apos;s own income-tested standard deduction (phasing from $3,000/$8,500 down to a $2,500/$5,000 floor as Alabama AGI rises), a $1,500/$3,000 personal exemption, and Alabama&apos;s uncapped deduction for federal income tax paid, not a prediction of future legislation. Social Security is fully excluded. Income entered as annual pension is treated as a qualifying defined-benefit pension and fully excluded regardless of pensionType; this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure remains fully taxable. Alabama&apos;s local occupational and municipal income taxes, levied in some cities, are not modeled. Only single and married-filing-jointly are supported. Itemized deductions, the dependent exemption and other credits are excluded.</span>
          </label>}
          {values.state === "ar" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ar-contract">
            <input id="plan-ar-contract" type="checkbox" checked={values.arContract === "confirmed"} onChange={event => change("arContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Arkansas pre-credit estimate using the enacted graduated schedule (0% to $5,600, 2%/3%/3.4% through $26,400, 3.7% above, the same brackets for every filing status) applied after the $2,470 single/$4,940 married standard deduction, not a prediction of future legislation. A $29 personal credit per taxpayer and spouse, plus $29 per taxpayer or spouse legally blind, applies against computed tax. Social Security is fully exempt. Income entered as annual pension, and this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure (split evenly between spouses), is excluded up to $6,000 per owner, except the portion proxied by the federal early-distribution penalty. Arkansas&apos;s separate, unlimited military retirement pay exemption, its small age-65 credit, and its own net-capital-gain exclusion are not modeled. Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded.</span>
          </label>}
          {values.state === "de" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-de-contract">
            <input id="plan-de-contract" type="checkbox" checked={values.deContract === "confirmed"} onChange={event => change("deContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Delaware pre-credit estimate using the enacted graduated schedule (0% to $2,000, then 2.2%/3.9%/4.8%/5.2%/5.55% through $60,000, 6.6% above, the same brackets for every filing status) applied after Delaware&apos;s standard deduction ($3,250 single/$6,500 married, plus $2,500 per taxpayer or spouse 65 or older and a separate $2,500 per taxpayer or spouse legally blind), not a prediction of future legislation. A $110 personal credit per taxpayer and spouse, plus a separate $110 per taxpayer or spouse 60 or older, applies against computed tax. Social Security is fully excluded. For an owner 60 or older, that owner&apos;s own pension income plus a share of this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure is excluded up to $12,500 (unused capacity not shared with a spouse, and not including Delaware&apos;s broader interest/dividend/capital-gain/rental &quot;eligible retirement income&quot;); for an owner under 60, only that owner&apos;s own pension income is excluded, capped at $2,000. Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded.</span>
          </label>}
          {values.state === "ks" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ks-contract">
            <input id="plan-ks-contract" type="checkbox" checked={values.ksContract === "confirmed"} onChange={event => change("ksContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Kansas pre-credit estimate using the enacted graduated schedule (5.2% to $23,000 single/$46,000 married, 5.58% above) applied after the Kansas standard deduction ($3,605 single/$8,240 married, plus $850 per condition -- 65 or older or blind -- for single filers and $700 per condition for married filers) and the consolidated exemption allowance ($9,160 single/$18,320 married), not a prediction of future legislation. Social Security is fully exempt. Income entered as annual pension with a federal-government, other-government or ny-government pensionType is treated as a specifically-exempt retirement benefit and fully excluded; a private or unspecified pension, and this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, remain fully taxable. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "ky" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ky-contract">
            <input id="plan-ky-contract" type="checkbox" checked={values.kyContract === "confirmed"} onChange={event => change("kyContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Kentucky pre-credit estimate using the enacted, unconditionally scheduled flat 3.5% rate for 2026, applied after a $3,360 standard deduction per taxpayer, not a prediction of future legislation. Social Security is fully exempt. Each owner&apos;s own pension income plus a share of this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure is excluded up to $31,110 per owner, but Kentucky&apos;s separate, larger exclusion for qualifying government pension service credit earned before January 1, 1998 is not modeled. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "ne" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ne-contract">
            <input id="plan-ne-contract" type="checkbox" checked={values.neContract === "confirmed"} onChange={event => change("neContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Nebraska pre-credit estimate using the latest published (2025) graduated schedule (2.46%/3.51%/4.40% at $3,990/$23,930, doubled for married filing jointly) topped by the enacted, unconditionally scheduled 4.55% top rate for 2026, held pending Nebraska&apos;s 2026 inflation-adjustment publication for the lower breakpoints. Applied after the latest published (2025) standard deduction ($8,600 single/$17,200 married, plus $2,000 per condition -- 65 or older or blind -- for single filers and $1,650 per condition for married filers) and a $171 personal exemption credit per person, not a prediction of future legislation. Social Security is fully exempt; income entered as annual pension and this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure remain fully taxable, since this planner cannot identify military retirement pay or distinguish CSRS from FERS federal civil service annuities. Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded.</span>
          </label>}
          {values.state === "wv" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-wv-contract">
            <input id="plan-wv-contract" type="checkbox" checked={values.wvContract === "confirmed"} onChange={event => change("wvContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a West Virginia pre-credit estimate using the enacted 2026 rate schedule (2.11%/2.81%/3.16%/4.22%/4.58% at $10,000/$25,000/$40,000/$60,000, the same brackets for every supported filing status) applied after a $2,000 personal exemption per person; West Virginia has no standard deduction. Social Security is fully excluded when federal AGI does not exceed $50,000 single/$100,000 married filing jointly, and 65% excluded above that threshold. Income entered as annual pension with a federal-government, other-government or ny-government pensionType is excluded up to $2,000 per owner, but West Virginia&apos;s separate, uncapped exemptions for police, firefighter, federal law enforcement and military retirement systems are not modeled. An owner 65 or older further excludes up to $8,000 of that owner&apos;s own wages, private pension income and a share of this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, net of that owner&apos;s own Social Security and government-pension exclusions; investment income is not attributed per owner and is excluded from that base. West Virginia&apos;s disability deduction, Family Tax Credit and property-tax credits are not modeled. Only single and married-filing-jointly are supported.</span>
          </label>}
          {values.state === "id" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-id-contract">
            <input id="plan-id-contract" type="checkbox" checked={values.idContract === "confirmed"} onChange={event => change("idContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Idaho pre-credit estimate using the enacted, ongoing flat 5.3% rate above the latest published (2025) 0%-taxed threshold ($4,811 single/$9,622 married filing jointly, indexed annually and held pending Idaho&apos;s 2026 publication), applied after Idaho&apos;s federal-conformity standard deduction. Social Security and Railroad Retirement benefits are fully exempt. A household-level Retirement Benefits Deduction (the latest published, 2025, $48,216 single/$72,324 married filing jointly cap, reduced by gross Social Security and Railroad Retirement benefits received) is limited to pension income with a federal-government pensionType for an owner 65 or older, approximating pre-1984 Civil Service Retirement System benefits; Idaho&apos;s separate exclusions for its own firefighter and police pension funds, military retired pay, and the retired-service-member age/disability test are not modeled. This planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, and a private or unspecified pension, remain fully taxable. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "la" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-la-contract">
            <input id="plan-la-contract" type="checkbox" checked={values.laContract === "confirmed"} onChange={event => change("laContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Louisiana pre-credit estimate using the enacted flat 3% rate applied after the latest published (2025) standard deduction ($12,500 single/$25,000 married filing jointly, held pending Louisiana&apos;s 2026 inflation adjustment), not a prediction of future legislation; Louisiana has no personal exemption. Social Security is fully exempt. Income entered as annual pension with a federal-government, other-government or ny-government pensionType is treated as an exempt state, local or federal retirement system benefit and fully excluded at any age; a private or unspecified pension, and a share of this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, are excluded up to $12,000 per owner 65 or older only. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "mi" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-mi-contract">
            <input id="plan-mi-contract" type="checkbox" checked={values.miContract === "confirmed"} onChange={event => change("miContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Michigan pre-credit estimate using the enacted, ongoing flat 4.25% rate applied after a $5,600 personal exemption per person (a widely-reported, not independently primary-source-confirmed, 2026 figure). Social Security is fully exempt at any income level. Pension income of any pensionType, plus this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, are excluded up to a combined household cap of $67,610 single/married filing separately or $135,220 married filing jointly (2026&apos;s fully phased-in, age-independent retirement and pension subtraction; the exact inflation-adjusted cap is likewise not independently primary-source-confirmed for 2026). Michigan&apos;s separate, income-tested standard-deduction alternative for a taxpayer 67 or older is not modeled. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "ok" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-ok-contract">
            <input id="plan-ok-contract" type="checkbox" checked={values.okContract === "confirmed"} onChange={event => change("okContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Oklahoma pre-credit estimate using the enacted graduated schedule (0.25% to 4.75% at $1,000/$2,500/$3,750/$4,900/$7,200 single, doubled for married filing jointly) applied after the standard deduction ($6,350 single/$12,700 married filing jointly) and a $1,000 personal exemption per person, plus a further $1,000 per person 65 or older when household Federal AGI is $15,000 or less (single) or $25,000 or less (married filing jointly). Social Security is fully exempt. Each owner&apos;s own pension income of any pensionType, plus a share of this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, is excluded up to a combined $10,000 per owner, but Oklahoma&apos;s separate, uncapped exclusions for military retired pay and CSRS-in-lieu-of-Social-Security federal annuities are not modeled. Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded.</span>
          </label>}
          {values.state === "wi" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-wi-contract">
            <input id="plan-wi-contract" type="checkbox" checked={values.wiContract === "confirmed"} onChange={event => change("wiContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Wisconsin pre-credit estimate using the enacted graduated schedule (3.50% to 7.65% at $14,680/$50,480/$323,290 single, $19,580/$67,300/$431,060 married filing jointly) applied after a linear reconstruction of Wisconsin&apos;s own income-phased standard deduction table (which may differ from the official table by a small amount in some income ranges) and a $700 personal exemption per person plus $250 per person 65 or older. Social Security and military retirement pay are fully exempt. An owner 67 or older excludes up to $24,000 of that owner&apos;s own pension income plus a share of this planner&apos;s aggregate 401(k)/IRA/annuity distribution figure, but Wisconsin&apos;s separate low-income age-65 $5,000 subtraction and its exemption for pre-1964 government pension accounts are not modeled. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "hi" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-hi-contract">
            <input id="plan-hi-contract" type="checkbox" checked={values.hiContract === "confirmed"} onChange={event => change("hiContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Hawaii pre-credit estimate using the 2026 brackets and Act 24 (2026) brackets effective in 2027 and 2029 (top rate 13% from 2027). Act 46 standard deductions are $8,000 single in 2026, $9,000 in 2028, $10,000 in 2030, and $12,000 from 2031, doubled for married filing jointly, with no additional inflation indexing, and a $1,144 personal exemption per person. Social Security and Railroad Retirement Tier 1 benefits are fully exempt. Entered pensions require confirmed fully-exempt or fully-taxable Hawaii treatment; mixed or unknown treatment is blocked. Account distributions remain fully taxable under this restricted assumption; employer-funded account portions and rollover-source exemptions are not modeled and may cause overstated tax. Only single and married-filing-jointly are supported. Itemized deductions and credits are excluded.</span>
          </label>}
          {values.state === "me" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-me-contract">
            <input id="plan-me-contract" type="checkbox" checked={values.meContract === "confirmed"} onChange={event => change("meContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a Maine planning estimate with owner-specific eligible retirement income. Income subject to federal early-distribution tax and personally purchased annuities do not qualify for the pension deduction. Unsupported younger pension and workplace-plan cases are blocked pending payment and exception details. The pension phaseout temporarily uses 2025 federal-AGI thresholds ($125,000 single/$250,000 married), NOT verified 2026 thresholds, over a fixed $100,000 range. Future indexed tax parameters use the editable tax-growth assumption, rounded down to $50; phaseout widths stay fixed. The SSA-linked pension cap is projected from $49,824 using that same assumption, not a published future SSA maximum. Federal Social Security taxability thresholds remain fixed. Military pension exemptions, itemized deductions and credits are not modeled.</span>
          </label>}
          {values.state === "nd" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-nd-contract">
            <input id="plan-nd-contract" type="checkbox" checked={values.ndContract === "confirmed"} onChange={event => change("ndContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept a North Dakota pre-credit estimate using the enacted, ongoing three-tier schedule (0%/1.95%/2.5% at $48,475/$244,825 single, $80,975/$298,075 married filing jointly) applied to federal taxable income directly, since North Dakota has no separate state standard deduction or personal exemption. Social Security and Tier 1 Railroad Retirement Board benefits are fully exempt. The 40% exclusions use eligible net long-term gains and qualified dividends before the federal taxable-income cap. State brackets remain frozen at 2025 values, not verified 2026 or future indexed amounts. North Dakota&apos;s military pay exclusion, licensed peace officer retirement exclusion, Native American exempt income, ND College SAVE deduction and Marriage Penalty Credit are not modeled. Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded.</span>
          </label>}
          {values.state === "or" && <label className="mb-4 flex items-start gap-2 text-sm" htmlFor="plan-or-contract">
            <input id="plan-or-contract" type="checkbox" checked={values.orContract === "confirmed"} onChange={event => change("orContract", event.target.checked ? "confirmed" : "")} />
            <span>I accept an Oregon pre-credit estimate using the enacted graduated schedule (4.75% to 9.9% at $4,400/$11,050/$125,000 single, doubled for married filing jointly) applied after the 2025 standard deduction ($2,835 single/$5,670 married filing jointly, plus $1,200 single or $1,000 married per person per age-65-or-blind condition) and a $256-per-exemption credit that phases to $0 above $100,000 (single) or $200,000 (married filing jointly) federal AGI. Social Security and tier 1 Railroad Retirement Board benefits are fully exempt. The federal tax liability subtraction follows the exact 2025 stepped caps ($5,000 single AGI bands; $10,000 married bands). Oregon parameters remain frozen at 2025 values, not verified 2026 or future indexed amounts. Federal liability uses modeled regular income tax rather than the full Oregon worksheet with federal credits and other adjustments. Oregon&apos;s federal pension income subtraction for service before October 1, 1991, Retirement Income Credit and one-time kicker credit are not modeled. Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded.</span>
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
              {values.state === "hi" && <div className="min-w-0">
                <label htmlFor={`plan-${id}-hawaii-pension`} className="mb-1 block text-xs font-medium">Hawaii pension treatment</label>
                <select id={`plan-${id}-hawaii-pension`} className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  value={values[`${id}-hawaiiPensionTreatment`] ?? "unknown"} onChange={event => change(`${id}-hawaiiPensionTreatment`, event.target.value)}
                  aria-describedby={`plan-${id}-hawaii-pension-help`}>
                  <option value="unknown">Mixed or unknown — not supported</option>
                  <option value="exempt">Confirmed fully exempt in Hawaii</option>
                  <option value="taxable">Confirmed fully taxable in Hawaii</option>
                </select>
                <p id={`plan-${id}-hawaii-pension-help`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">Required for nonzero pensions. Confirm treatment with your plan administrator or tax adviser; employer name or pension type alone is insufficient. Applies to the federally taxable pension entered above, not IRA withdrawals or rollovers. Mixed funding needs a separate exclusion-ratio calculation.</p>
              </div>}
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
              <p className="mt-1">This screen models Florida, Texas, Alaska, Nevada, South Dakota, Tennessee, Wyoming, New Hampshire, restricted New York, restricted Maryland, restricted Indiana, restricted DC, restricted Illinois, restricted New Jersey, restricted Pennsylvania, restricted Colorado, restricted New Mexico, restricted Minnesota, restricted Utah, restricted Connecticut, restricted Vermont, restricted Montana, restricted Rhode Island, restricted California, restricted Virginia, restricted Arizona, restricted Georgia, restricted North Carolina, restricted South Carolina, restricted Ohio, restricted Massachusetts, restricted Iowa, restricted Mississippi, restricted Missouri, restricted Washington, restricted Alabama, restricted Arkansas, restricted Delaware, restricted Kansas, restricted Kentucky, restricted Nebraska, restricted West Virginia, restricted Idaho, restricted Louisiana, restricted Michigan, restricted Oklahoma, restricted Wisconsin, restricted Hawaii, restricted Maine, restricted North Dakota or restricted Oregon scenarios and the supported account contracts described in the account editor. New York, Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania, Colorado, New Mexico, Minnesota, Utah, Connecticut, Vermont, Montana, Rhode Island, California, Virginia, Arizona, Georgia, North Carolina, South Carolina, Ohio, Massachusetts, Iowa, Mississippi, Missouri, Washington, Alabama, Arkansas, Delaware, Kansas, Kentucky, Nebraska, West Virginia, Idaho, Louisiana, Michigan, Oklahoma, Wisconsin, Hawaii, Maine, North Dakota and Oregon each require explicit acceptance of an enacted-law pre-credit scenario, including New York’s scheduled 2027 and 2033 changes, Montana’s already-enacted, lower 2027 bracket schedule, Mississippi’s already-enacted 2027-2030 rate step-downs, Washington’s already-enacted 2025 tiered-rate change, Kentucky and Nebraska’s already-enacted rate step-downs, and Maine’s already-enacted 2026 surcharge; future legislation is not predicted for any of the forty-three. Alaska, Nevada, South Dakota and Wyoming have no individual income tax at all. Tennessee&apos;s only tax on individual income, the Hall Tax on interest and dividends, was fully repealed starting tax year 2021, and New Hampshire&apos;s only tax on individual income, its Interest and Dividends Tax, was fully repealed starting tax year 2025; neither state has ever taxed wages, pensions or retirement-account distributions. Maryland rates only Baltimore City, Frederick County and Montgomery County, and its pension exclusion covers only entered pension income for owners 65 or older. Indiana rates only Marion, Allen and Vanderburgh counties, and its civil service annuity deduction covers only entered pension income for owners 62 or older. DC has no local income tax and no working pension exclusion (its $3,000 exclusion expired before 2015), so entered pension income is fully taxable there. Illinois has no local income tax and fully exempts pension income at any owner age, plus this planner’s combined 401(k)/IRA/annuity distribution figure, but its exemption allowance disappears entirely above $250,000/$500,000 federal AGI. New Jersey has no local income tax and excludes pension/IRA/annuity income only when an owner is 62 or older and household income is $150,000 or less, capped and phased down by filing status. Pennsylvania has no standard deduction or exemption at all, but fully excludes pension and normal retirement-account income from state tax; its local Earned Income Tax (Philadelphia, Pittsburgh or Allentown only) applies only to wages, never to retirement income. Colorado applies its flat rate to federal taxable income directly (no separate state standard deduction), fully excludes Social Security for an owner 65+ (or 55-64 under an income limit), and separately excludes pension income up to $20,000-$24,000 per owner depending on age, sharing the cap with that owner’s own Social Security when the general cap applies. New Mexico has no local income tax and starts from federal AGI less the federal standard deduction, layering an income-tested Social Security exemption, a graduated age-65-or-blind exemption and a Low- and Middle-Income Tax Exemption on top. Minnesota has no local income tax, uses its own (non-federal) standard deduction, and excludes pension income only through a narrow public-pension subtraction this planner cannot verify, so pension income is otherwise fully taxable there. Utah has no local income tax and no standard deduction at all; Social Security instead gets an income-phased nonrefundable credit, and Utah’s general Taxpayer Tax Credit (unrelated to retirement) is not modeled, so Utah tax is overstated here for most households. Connecticut has no local income tax and uses its own step-down personal exemption; Social Security uses a worksheet-based partial exclusion above $75,000/$100,000 federal AGI whose federal input is approximated, and pension/retirement-account income shares a single phase-out that overstates the exclusion for IRA distributions and does not carve out military, Railroad Retirement or teachers’ retirement pay. Vermont has no local income tax and uses its own standard deduction and personal exemption; the household is assumed to elect whichever gives the larger subtraction between excluding Social Security or up to $10,000 of federal/other-government pension income, tax-exempt interest is added back as fully Vermont-taxable, and Vermont’s separate Military Retirement Income Exemption is not modeled. Montana has no local income tax and no separate state standard deduction or personal exemption, starting instead from federal taxable income plus a $5,660-per-spouse age-65 subtraction; Social Security is fully taxable, Montana’s preferential net long-term capital gains rate is not modeled (overstating tax for households with taxable gains), and its working-military-retiree subtraction is not modeled. Rhode Island has no local income tax and uses the same bracket thresholds for every filing status; its standard deduction and exemption phase out above $261,000 modified AGI, and Social Security and pension income are each excluded only for a spouse who has reached SSA full retirement age while household AGI stays under a threshold still sourced from 2025 figures pending Rhode Island’s 2026 publication. California has no local income tax, excludes Social Security, but gives no special exclusion for any other retirement income at any age; its personal/blind/senior exemptions are tax credits rather than income deductions, and an additional 1% surtax applies above $1,000,000 taxable income. Virginia has no local income tax and uses the same brackets for every filing status; it excludes Social Security and gives an Age Deduction of up to $12,000 per spouse 65 or older, phased down once household AGI exceeds $50,000/$75,000, while its growing military retirement pay subtraction is not modeled. Arizona has no local income tax and a flat 2.5% rate; it excludes Social Security and up to $2,500 per owner of federal/state/local government pension income, while private pension income and this planner&apos;s 401(k)/IRA/annuity figure remain fully taxable, and the separate, uncapped military retirement subtraction is not modeled. Georgia has no local income tax and a flat 5.19% rate; it excludes Social Security and gives each spouse 62+ a Retirement Income Exclusion (up to $35,000, or $65,000 at 65+) covering their own pension income, up to $5,000 of their own wages, and a 50/50 share of this planner&apos;s 401(k)/IRA/annuity figure, but not taxable interest, dividends, capital gains or rental income, which this planner cannot track per owner. North Carolina has no local income tax and a flat 4.25% rate; it excludes Social Security, but its Bailey settlement exclusion for certain vested NC/federal government pensions and its separate Uniformed Services retirement deduction are not modeled, since this planner cannot verify a modeled owner&apos;s years of service as of a historical date or whether a pension is a military retirement, so all pension and this planner&apos;s 401(k)/IRA/annuity income remain fully taxable there. South Carolina has no local income tax and, under its 2026 restructuring, a two-bracket schedule (1.99%/5.21%) on federal AGI less a phased-out Income Adjusted Deduction; it excludes Social Security and gives each owner up to $3,000-$10,000 of general retirement deduction plus an Age 65 Deduction of up to $15,000 per spouse, while its more generous military retirement deductions are not modeled. Ohio has a flat 2.75% rate above $26,050 of taxable nonbusiness income, a MAGI-tiered exemption instead of a standard deduction, and excludes Social Security; its small Retirement Income and Senior Citizen credits are modeled, but the Joint Filing Credit, lump-sum credits and Ohio&apos;s separate municipal/school-district income taxes are not. Massachusetts has no local income tax and a flat 5% rate plus an additional 4% Fair Share surtax above $1,107,750 taxable income; it has no standard deduction, only personal exemptions plus age-65 and blindness add-ons, and excludes Social Security and government contributory pension income (federal or other-government), while private/unspecified pension income and this planner&apos;s 401(k)/IRA/annuity figure remain fully taxable, and its state-by-state out-of-state government pension reciprocity test is not modeled. Iowa applies its flat 3.8% rate to federal taxable income with no separate state standard deduction, plus a small $40/$80 Personal Credit and $20 per owner 65+ or blind against tax; it excludes Social Security and, for each owner 55 or older, that owner&apos;s own pension income and share of this planner&apos;s 401(k)/IRA/annuity figure, but not Iowa&apos;s separate military retirement and disability exclusions, which this planner cannot identify. Mississippi exempts the first $10,000 of taxable income per spouse, taxing the remainder at its enacted, unconditionally scheduled rate (4.0% for 2026, stepping to 3.0% by 2030); it fully exempts Social Security and pension income, and this planner&apos;s 401(k)/IRA/annuity figure except the portion proxied by the federal early-distribution penalty. Missouri taxes income above its federal-conforming standard deduction under a shared graduated schedule topping out at 4.7%; it fully deducts Social Security for an owner 62+, exempts public pension income up to a per-owner cap tied to the maximum Social Security benefit, and separately exempts up to $6,000 per owner of private pension and this planner&apos;s 401(k)/IRA/annuity figure, phased out at higher household income; Missouri&apos;s separate military retirement exemption is not modeled. Washington has no individual income tax, but imposes a 7% excise tax (9.9% above $1,000,000 of taxable gain) on long-term capital gains over a $278,000 deduction shared by a married couple; retirement-account distributions and real estate sales are never capital gains here, and wages, pensions, Social Security and short-term gains are untaxed. Alabama has graduated 2%/4%/5% brackets, an income-tested standard deduction, and an uncapped deduction for federal income tax paid; it excludes Social Security and treats income entered as annual pension as an exempt defined-benefit pension regardless of pensionType, while this planner&apos;s 401(k)/IRA/annuity figure remains fully taxable, and Alabama&apos;s local occupational taxes are not modeled. Arkansas has graduated brackets from 0% to 3.7% and a small standard deduction; it excludes Social Security and gives each owner up to $6,000 of combined pension and 401(k)/IRA/annuity exclusion, but not Arkansas&apos;s separate unlimited military retirement exemption or its net-capital-gain exclusion. Delaware has graduated brackets from 0% to 6.6%; it excludes Social Security and gives an owner 60 or older up to $12,500 of pension plus retirement-account income (not shared with a spouse, and excluding Delaware&apos;s broader investment-income eligible-income test), or up to $2,000 for a younger owner&apos;s pension only. Kansas has graduated brackets from 5.2% to 5.58%, a standard deduction, and a consolidated exemption allowance; it excludes Social Security and treats income entered as annual pension with a government pensionType as a specifically-exempt retirement benefit, while this planner&apos;s 401(k)/IRA/annuity figure remains fully taxable. Kentucky has a flat 3.5% rate and a $3,360 per-taxpayer standard deduction; it excludes Social Security and gives each owner up to $31,110 of combined pension and 401(k)/IRA/annuity exclusion, but not Kentucky&apos;s separate, larger pre-1998 government-service exemption. Nebraska has graduated brackets from 2.46% to 4.55% (2026&apos;s enacted top rate; lower breakpoints held at 2025&apos;s published figures pending Nebraska&apos;s 2026 update) and a $171 per-person exemption credit; it excludes Social Security, but not military retirement pay or CSRS federal civil service annuities, which this planner cannot identify. West Virginia has graduated brackets from 2.11% to 4.58%, the same for every supported filing status, no standard deduction, and a $2,000 per-person exemption; it excludes Social Security in full below $50,000 single/$100,000 married AGI (65% above), gives each owner up to $2,000 of government-pension exclusion, and gives an owner 65 or older up to $8,000 of further exclusion against that owner&apos;s other income, but not its separate uncapped police, firefighter or military retirement exemptions. Idaho has a flat 5.3% rate above a 0%-taxed threshold and a federal-conformity standard deduction; it excludes Social Security and Railroad Retirement in full and gives a household-level Retirement Benefits Deduction for pension income with a federal-government pensionType for an owner 65 or older, reduced by gross Social Security received, but not Idaho&apos;s separate firefighter, police or military retirement exclusions. Louisiana has a flat 3% rate and a standard deduction with no personal exemption; it excludes Social Security and any state/local/federal government pension in full at any age, and gives each owner 65 or older up to $12,000 of further exclusion covering private pension and this planner&apos;s 401(k)/IRA/annuity figure. Michigan has a flat 4.25% rate and a per-person personal exemption; it excludes Social Security in full at any income and, under its 2026 fully-phased-in rules, excludes pension income of any pensionType plus this planner&apos;s 401(k)/IRA/annuity figure up to a combined household cap, with no age restriction, but not its separate age-67 standard-deduction alternative. Oklahoma has graduated brackets from 0.25% to 4.75%, a standard deduction, a per-person exemption and a further $1,000 per-person exemption for an owner 65 or older under a low household-AGI test; it excludes Social Security in full and gives each owner up to $10,000 of combined pension and 401(k)/IRA/annuity exclusion at any age, but not its separate, uncapped military retirement and CSRS-in-lieu-of-Social-Security exemptions. Wisconsin has graduated brackets from 3.5% to 7.65%, a linearly-approximated income-phased standard deduction and a per-person exemption with an add-on for an owner 65 or older; it excludes Social Security and military retirement pay in full and gives an owner 67 or older up to $24,000 of combined pension and 401(k)/IRA/annuity exclusion, but not its separate low-income age-65 subtraction or pre-1964 government pension exemption. Hawaii uses enacted year-specific brackets (1.4% to 11% in 2026, up to 13% from 2027), scheduled standard deduction increases through 2031, and a per-person personal exemption; it excludes Social Security and Railroad Retirement Tier 1 benefits in full and requires explicit Hawaii pension treatment, blocking mixed or unknown classifications. Account distributions remain fully taxable under a restricted assumption; employer-funded portions and rollover-source exemptions are not modeled, potentially overstating tax. Maine uses owner-attributed eligible retirement income, source-level early-distribution exclusions, and income-tested deductions. The pension phaseout temporarily uses 2025 federal-AGI thresholds, not verified 2026 amounts. Future indexed parameters use the editable tax-growth assumption; unsupported early pension/workplace eligibility is blocked. See the Maine confirmation for full limitations. North Dakota starts from federal taxable income directly, with no separate state standard deduction or personal exemption, under graduated brackets from 0% to 2.5%; it excludes Social Security and Tier 1 Railroad Retirement Board benefits in full and applies its 40% exclusions to eligible net long-term gains and qualified dividends before the federal taxable-income cap, using state brackets frozen at 2025 values, but not its military pay, licensed peace officer retirement, Native American income or Marriage Penalty Credit provisions. Oregon has graduated brackets from 4.75% to 9.9%, a standard deduction with an age-65-or-blind add-on and a $256-per-exemption credit phased out at higher federal AGI; it excludes Social Security and Tier 1 Railroad Retirement Board benefits in full and uses the exact 2025 stepped federal tax liability subtraction caps (up to $8,500), with Oregon parameters frozen at 2025 values and federal liability limited to modeled regular income tax, but not its federal pension income subtraction for pre-October-1991 service, Retirement Income Credit or one-time kicker credit. Workplace contributions use verified scenario limits. IRA contributions use the restricted annual eligibility model with explicit coverage and deduction choices. Unsupported account or tax cases are blocked rather than approximated. Do not use these results to make financial decisions.</p>
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
