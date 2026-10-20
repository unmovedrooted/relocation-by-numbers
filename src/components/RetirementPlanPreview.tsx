"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./RetirementPlanPreview.module.css";
import { STATES } from "@/lib/states";
import { VERIFIED_RETIREMENT_STATES } from "@/lib/retirementPlan/verifiedLocation";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import InfoTip from "@/components/calculator-form/InfoTip";
import RetirementPlanError from "./RetirementPlanError";
import RetirementMoveResults from "./RetirementMoveResults";
import { decodeScenario, encodeScenario } from "@/lib/retirementPlan/shareState";
import { RetirementStateConsents, OregonLocalFields, LocalTaxNote, retirementCityChoices, control } from "./RetirementStateFields";
import { buildPreviewInput, calculatePreview, PREVIEW_DEFAULTS } from "@/lib/retirementPlan/preview";
import { STATE_CONTRACT_FIELD } from "@/lib/retirementPlan/stateContracts";
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
import { downloadCsv } from "@/lib/csvExport";
import { projectionCsvRows, withPlannerNotice } from "@/lib/retirementPlan/previewCsv";
import { PLANNER_NOTICE } from "@/lib/retirementPlan/plannerNotice";
import { CITY_FIELD_STATES, OPTIONAL_CITY_STATES, locationLabel } from "@/lib/retirementPlan/locationLabel";
import { downloadPdfReport, type PdfRow } from "@/lib/pdfExport";

const panel = "min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50";
const resultCard = "min-w-0 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800";
const primaryAction = "inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200";
const secondaryAction = "inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-950";
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const pensionTypeHelp = "Required for nonzero New York pensions. Enter the federally taxable pension amount above. Do not classify IRA withdrawals or rollovers here.";
// Only show locations with implemented local-tax contracts.
// Omitted local taxes do not imply exemption: Ohio school districts and
// Michigan resident cities can tax income beyond wages.

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
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "saved" | "error">("idle");
  const [stayResult, setStayResult] = useState<ReturnType<typeof calculatePreview> | null>(null);
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
  // Runs a scenario and shows its results; throws if the inputs are not accepted, leaving the screen unchanged.
  const runScenario = (v: typeof values, a: typeof accounts, s: typeof saving, m: typeof medicare, c: typeof conversions) => {
    const next = comparePreviewConversions(buildPreviewInput(v, a, s, m), c);
    const stay = v.moveOn === "yes" ? comparePreviewConversions(buildPreviewInput({ ...v, moveOn: "" }, a, s, m), c).result : null;
    setResult(next.result);
    setStayResult(stay);
    setConversionBaseline(next.baseline);
    setDirty(false);
    setError("");
    setRunVersion(version => version + 1);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      runScenario(values, accounts, saving, medicare, conversions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please check the scenario inputs.");
    }
  };

  // A shared link carries the whole scenario in its fragment. Only a scenario the planner accepts is restored.
  useEffect(() => {
    const shared = decodeScenario(window.location.hash);
    if (!shared) return;
    try {
      const nextValues = { ...PREVIEW_DEFAULTS, ...shared.values };
      const nextAccounts = shared.accounts as typeof accounts;
      const nextSaving = shared.saving as typeof saving;
      const nextMedicare = shared.medicare as typeof medicare;
      const nextConversions = shared.conversions as typeof conversions;
      runScenario(nextValues, nextAccounts, nextSaving, nextMedicare, nextConversions);
      setValues(nextValues);
      setAccounts(nextAccounts);
      setSaving(nextSaving);
      setMedicare(nextMedicare);
      setConversions(nextConversions);
      setStrategyReset(v => v + 1);
    } catch {
      setError("This link's scenario could not be restored, so the example is shown instead.");
    }
    // Runs once on load; runScenario only calls state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scenarioLink = () => window.location.origin + window.location.pathname + encodeScenario({ values, accounts, saving, medicare, conversions });
  const flashShare = (status: typeof shareStatus) => { setShareStatus(status); setTimeout(() => setShareStatus("idle"), 2500); };
  const handleShare = async () => {
    const url = scenarioLink();
    try {
      if (typeof navigator.share === "function") { await navigator.share({ title: "My retirement plan scenario", url }); flashShare("shared"); }
      else { await navigator.clipboard.writeText(url); flashShare("copied"); }
    } catch {
      try { await navigator.clipboard.writeText(url); flashShare("copied"); } catch { flashShare("error"); }
    }
  };
  const handleSave = () => {
    window.history.replaceState(null, "", scenarioLink());
    flashShare("saved");
  };
  const resetExample = () => {
    const fresh = initialAccountEditor();
    const freshSaving = initialContributionEditor();
    setSaving(freshSaving);
    setMedicare(initialMedicareEditor());
    setConversions(initialConversionEditor());
    setConversionBaseline(null);
    setStayResult(null);
    setStrategyReset(v=>v+1);
    setValues({ ...PREVIEW_DEFAULTS });
    setAccounts(fresh);
    setResult(calculatePreview(PREVIEW_DEFAULTS, fresh));
    setDirty(false);
    setError("");
    setRunVersion(v => v + 1);
  };
  const moving = values.moveOn === "yes";
  const hawaiiRelevant = values.state === "hi" || (moving && values.moveState === "hi");
  const last = result?.years.at(-1);
  const rmdStartYear = result?.years.find(row => row.result.cash.requiredWithdrawals > 0)?.year ?? null;
  const lifetimeTaxes = result ? result.years.reduce((sum, row) => sum + row.result.tax.total, 0) : 0;
  const lifetimeRmds = result ? result.years.reduce((sum, row) => sum + row.result.cash.requiredWithdrawals, 0) : 0;
  const fundedYearsPct = result && result.years.length ? result.years.filter(row => row.result.cash.shortfall <= 0).length / result.years.length : 0;
  const vs = result?.allYearsFunded ? VERDICT_STYLES.funded : VERDICT_STYLES.shortfall;

  const handleExportCsv = () => {
    if (!result || dirty || error) return;
    const location = locationLabel(values.state, values.cityId);
    const rows = projectionCsvRows(result, values.state, location);
    downloadCsv("complete-retirement-plan-projection", withPlannerNotice(rows));
  };
  const handleExportPdf = () => {
    if (!result || !last || dirty || error) return;
    const rows: PdfRow[] = [
      { Metric: "Household", Value: values.household === "married" ? "Two people" : "One person" },
      { Metric: "Resident location", Value: [values.state.toUpperCase(), locationLabel(values.state, values.cityId)].filter(Boolean).join(" / ") },
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
      footerNote: `${PLANNER_NOTICE} relocationbynumbers.com`,
    });
  };

  return <div className={`${styles.planner} min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100`}>
  <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-8 sm:py-12">
    <header className="mx-auto max-w-3xl space-y-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Beta</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">Assumptions updated: October 2026</p>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Complete Retirement Plan</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Model your household’s full retirement timeline in one place: pre-retirement income and savings, Social Security and pensions,
        required minimum distributions, IRA and Roth basis, ESPP sales, and the taxes and withdrawals that settle each year’s cash flow —
        projected year by year across your household’s modeled horizon, for one or two people with independent retirement dates.
      </p>
      <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">{PLANNER_NOTICE}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">Example scenario shown. Replace it with your own numbers.</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Still deciding where to retire? <a className="font-semibold underline underline-offset-4 hover:no-underline" href="/compare">Compare cities</a> or{" "}
        <a className="font-semibold underline underline-offset-4 hover:no-underline" href="/fire-calculator">check your FIRE timeline</a> first.
      </p>
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
            {CITY_FIELD_STATES.includes(values.state) && <div className="min-w-0"><label htmlFor="plan-city" className="mb-1 block text-sm">{values.state === "ny" || values.state === "pa" || OPTIONAL_CITY_STATES.includes(values.state) ? "Resident city" : "Resident county"}{OPTIONAL_CITY_STATES.includes(values.state) ? " (optional)" : ""}</label>
              <select id="plan-city" className={control} value={values.cityId} aria-describedby="plan-location-help" onChange={event => change("cityId", event.target.value)}>
                <option value="">{OPTIONAL_CITY_STATES.includes(values.state) ? "No listed city (no city income tax modeled)" : values.state === "ny" ? "Choose a New York location" : values.state === "md" ? "Choose a Maryland location" : values.state === "in" ? "Choose an Indiana location" : "Choose a Pennsylvania location"}</option>
                {values.state === "ny" && <option value="ny-outside-nyc-yonkers">Outside NYC and Yonkers</option>}
                {retirementCityChoices(values.state).map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select></div>}
          </div>
          {values.state === "or" && <OregonLocalFields values={values} change={change} />}
          <LocalTaxNote state={values.state} />
          <p id="plan-location-help" className="mb-4 text-sm">Assumes full-year residence throughout the projection and no income taxable by another state or city. Florida, Texas, Alaska, Nevada, South Dakota, Tennessee, Wyoming and New Hampshire have no tax on wages or retirement income. The other 42 states and DC are modeled under restricted rules, and each one&apos;s limits are listed under Limitations below. Location does not change your spending assumptions.</p>
          <RetirementStateConsents state={values.state} values={values} change={change} />
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
        <section className={panel} aria-labelledby="plan-move-heading">
          <h2 id="plan-move-heading" className="mb-2 text-lg font-semibold">Planned move (optional)</h2>
          <label htmlFor="plan-move-on" className="mb-4 flex items-start gap-2 text-sm">
            <input id="plan-move-on" type="checkbox" checked={moving} onChange={event => change("moveOn", event.target.checked ? "yes" : "")} />
            <span>Plan a move to another state during the projection. From January 1 of the move year the household is a full-year resident of the new state, and that state&apos;s income tax applies from then on.</span>
          </label>
          {moving && <>
            <div className="mb-4 grid min-w-0 gap-4 sm:grid-cols-2">
              {numeric("moveYear", "Move year (first full year as a resident)", { min: Number(values.startYear) || 2026, max: Number(values.endYear) || 2126, step: "1" })}
              <div className="min-w-0"><label htmlFor="plan-move-state" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Destination state</label>
                <select id="plan-move-state" className={control} value={values.moveState} onChange={event => { setValues(previous => ({ ...previous, moveState: event.target.value, moveCityId: "" })); setDirty(true); }}>
                  <option value="">Choose a state</option>
                  {STATES.filter(state => state.code !== values.state && VERIFIED_RETIREMENT_STATES.includes(state.code)).map(state => <option key={state.code} value={state.code}>{state.name}</option>)}
                </select></div>
              {CITY_FIELD_STATES.includes(values.moveState) && <div className="min-w-0"><label htmlFor="plan-move-city" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{values.moveState === "ny" || values.moveState === "pa" || OPTIONAL_CITY_STATES.includes(values.moveState) ? "Destination city" : "Destination county"}{OPTIONAL_CITY_STATES.includes(values.moveState) ? " (optional)" : ""}</label>
                <select id="plan-move-city" className={control} value={values.moveCityId} onChange={event => change("moveCityId", event.target.value)}>
                  <option value="">{OPTIONAL_CITY_STATES.includes(values.moveState) ? "No listed city (no city income tax modeled)" : "Choose a location"}</option>
                  {values.moveState === "ny" && <option value="ny-outside-nyc-yonkers">Outside NYC and Yonkers</option>}
                  {retirementCityChoices(values.moveState).map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select></div>}
            </div>
            {values.moveState === "or" && values.state !== "or" && <OregonLocalFields values={values} change={change} />}
            <LocalTaxNote state={values.moveState} />
            {values.moveState in STATE_CONTRACT_FIELD && <RetirementStateConsents state={values.moveState} values={values} change={change} />}
            <p className="text-xs text-slate-500 dark:text-slate-400">Moving costs, housing costs and spending changes are not part of the planner; the comparison covers income tax only. The account list, pensions and Social Security stay as entered.</p>
          </>}
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
              {hawaiiRelevant && <div className="min-w-0">
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
        <RetirementAccountEditor value={accounts} onChange={changeAccounts} married={values.household === "married"} startYear={Number(values.startYear) || 2026} hawaii={hawaiiRelevant} />
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
          {stayResult && moving && values.moveState && <div className="mb-4"><RetirementMoveResults withMove={result} stay={stayResult} from={values.state} to={values.moveState} moveYear={Number(values.moveYear)} /></div>}
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
            <p role="note" className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{PLANNER_NOTICE}</p>
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
              <button type="button" onClick={handleShare} className={secondaryAction} title="Copy a link that reopens this scenario">{shareStatus === "copied" ? "Link copied" : shareStatus === "shared" ? "Shared" : shareStatus === "error" ? "Could not copy" : "Share"}</button>
              <button type="button" onClick={handleSave} className={secondaryAction} title="Put this scenario in the address bar so you can bookmark it">{shareStatus === "saved" ? "Saved to address bar" : "Save"}</button>
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
          <ResponsiveContainer initialDimension={{ width: 480, height: 280 }} width="100%" height={280} minWidth={0}>
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
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Limitations</h3>
              <p className="mt-1">This screen models Florida, Texas, Alaska, Nevada, South Dakota, Tennessee, Wyoming and New Hampshire, plus the other 42 states and DC as restricted scenarios, with the supported account contracts described in the account editor. The restricted states each require explicit acceptance of an enacted-law pre-credit scenario, including New York’s scheduled 2027 and 2033 changes, Montana’s already-enacted, lower 2027 bracket schedule, Mississippi’s already-enacted 2027-2030 rate step-downs, Washington’s already-enacted 2025 tiered-rate change, Kentucky and Nebraska’s already-enacted rate step-downs, and Maine’s already-enacted 2026 surcharge; future legislation is not predicted for any of the forty-three.</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Alaska, Nevada, South Dakota and Wyoming have no individual income tax at all.</li>
                <li>Tennessee&apos;s only tax on individual income, the Hall Tax on interest and dividends, was fully repealed starting tax year 2021, and New Hampshire&apos;s only tax on individual income, its Interest and Dividends Tax, was fully repealed starting tax year 2025; neither state has ever taxed wages, pensions or retirement-account distributions.</li>
                <li>Maryland rates only Baltimore City, Frederick County and Montgomery County, and its pension exclusion covers only entered pension income for owners 65 or older.</li>
                <li>Indiana rates only Marion, Allen and Vanderburgh counties, and its civil service annuity deduction covers only entered pension income for owners 62 or older.</li>
                <li>DC has no local income tax and no working pension exclusion (its $3,000 exclusion expired before 2015), so entered pension income is fully taxable there.</li>
                <li>Illinois has no local income tax and fully exempts pension income at any owner age, plus this planner’s combined 401(k)/IRA/annuity distribution figure, but its exemption allowance disappears entirely above $250,000/$500,000 federal AGI.</li>
                <li>New Jersey has no local income tax and excludes pension/IRA/annuity income only when an owner is 62 or older and household income is $150,000 or less, capped and phased down by filing status.</li>
                <li>Pennsylvania has no standard deduction or exemption at all, but fully excludes pension and normal retirement-account income from state tax; its local Earned Income Tax (Philadelphia, Pittsburgh or Allentown only) applies only to wages, never to retirement income.</li>
                <li>Colorado applies its flat rate to federal taxable income directly (no separate state standard deduction), fully excludes Social Security for an owner 65+ (or 55-64 under an income limit), and separately excludes pension income up to $20,000-$24,000 per owner depending on age, sharing the cap with that owner’s own Social Security when the general cap applies.</li>
                <li>New Mexico has no local income tax and starts from federal AGI less the federal standard deduction, layering an income-tested Social Security exemption, a graduated age-65-or-blind exemption and a Low- and Middle-Income Tax Exemption on top.</li>
                <li>Minnesota has no local income tax, uses its own (non-federal) standard deduction, and excludes pension income only through a narrow public-pension subtraction this planner cannot verify, so pension income is otherwise fully taxable there.</li>
                <li>Utah has no local income tax and no standard deduction at all; Social Security instead gets an income-phased nonrefundable credit, and Utah’s general Taxpayer Tax Credit is applied before its Social Security credit, assuming no dependents and using held 2025 phaseout base amounts; its separate birth-year-gated Retirement Credit is not modeled.</li>
                <li>Connecticut has no local income tax and uses its own step-down personal exemption; Social Security uses a worksheet-based partial exclusion above $75,000/$100,000 federal AGI whose federal input is approximated, and pension/retirement-account income shares a single phase-out that overstates the exclusion for IRA distributions and does not carve out military, Railroad Retirement or teachers’ retirement pay.</li>
                <li>Vermont has no local income tax and uses its own standard deduction and personal exemption; the household is assumed to elect whichever gives the larger subtraction between excluding Social Security or up to $10,000 of federal/other-government pension income, tax-exempt interest is added back as fully Vermont-taxable, and Vermont’s separate Military Retirement Income Exemption is not modeled.</li>
                <li>Montana has no local income tax and no separate state standard deduction or personal exemption, starting instead from federal taxable income plus a $5,810-per-spouse age-65 subtraction (statute-derived for 2026); Social Security is fully taxable, Montana’s separate 3%/4.1% rates on net long-term capital gains are applied, and its working-military-retiree subtraction is not modeled.</li>
                <li>Rhode Island has no local income tax and uses the same bracket thresholds for every filing status; its standard deduction and exemption phase out above $261,000 modified AGI, and Social Security and pension income are each excluded only for a spouse who has reached SSA full retirement age while household AGI stays under a threshold still sourced from 2025 figures pending Rhode Island’s 2026 publication.</li>
                <li>California has no local income tax, excludes Social Security, but gives no special exclusion for any other retirement income at any age; its personal/blind/senior exemptions are tax credits rather than income deductions, and an additional 1% surtax applies above $1,000,000 taxable income.</li>
                <li>Virginia has no local income tax and uses the same brackets for every filing status; it excludes Social Security and gives an Age Deduction of up to $12,000 per spouse 65 or older, phased down once household AGI exceeds $50,000/$75,000, while its growing military retirement pay subtraction is not modeled.</li>
                <li>Arizona has no local income tax and a flat 2.5% rate; it excludes Social Security and up to $2,500 per owner of federal/state/local government pension income, while private pension income and this planner&apos;s 401(k)/IRA/annuity figure remain fully taxable, and the separate, uncapped military retirement subtraction is not modeled.</li>
                <li>Georgia has no local income tax and a flat 5.19% rate; it excludes Social Security and gives each spouse 62+ a Retirement Income Exclusion (up to $35,000, or $65,000 at 65+) covering their own pension income, up to $5,000 of their own wages, and that owner&apos;s own attributed 401(k)/IRA/annuity distributions, but not taxable interest, dividends, capital gains or rental income, which this planner cannot track per owner.</li>
                <li>North Carolina has no local income tax and a flat 3.99% rate; it excludes Social Security, but its Bailey settlement exclusion for certain vested NC/federal government pensions and its separate Uniformed Services retirement deduction are not modeled, since this planner cannot verify a modeled owner&apos;s years of service as of a historical date or whether a pension is a military retirement, so all pension and this planner&apos;s 401(k)/IRA/annuity income remain fully taxable there.</li>
                <li>South Carolina has no local income tax and, under its 2026 restructuring, a two-bracket schedule (1.99%/5.21%) on federal AGI less a phased-out Income Adjusted Deduction; it excludes Social Security and gives each owner up to $3,000-$10,000 of general retirement deduction plus an Age 65 Deduction of up to $15,000 per spouse, while its more generous military retirement deductions are not modeled.</li>
                <li>Ohio has a flat 2.75% rate above $26,050 of taxable nonbusiness income, a MAGI-tiered exemption instead of a standard deduction, and excludes Social Security; its small Retirement Income and Senior Citizen credits are modeled, but the Joint Filing Credit, lump-sum credits and Ohio&apos;s separate municipal/school-district income taxes are not.</li>
                <li>Massachusetts has no local income tax and a flat 5% rate plus an additional 4% Fair Share surtax above $1,107,750 taxable income; it has no standard deduction, only personal exemptions plus age-65 and blindness add-ons, and excludes Social Security and government contributory pension income (federal or other-government), while private/unspecified pension income and this planner&apos;s 401(k)/IRA/annuity figure remain fully taxable, and its state-by-state out-of-state government pension reciprocity test is not modeled.</li>
                <li>Iowa applies its flat 3.8% rate to federal taxable income with no separate state standard deduction, plus a small $40/$80 Personal Credit and $20 per owner 65+ or blind against tax; it excludes Social Security and, for each owner 55 or older, that owner&apos;s qualifying pension and actual taxable IRA/workplace distributions, including Roth conversions. Nonqualified annuities are not excluded, and unreconciled owner attribution is blocked. Military, disability and survivor-specific eligibility are not modeled.</li>
                <li>Mississippi exempts the first $10,000 of taxable income per spouse, taxing the remainder at its enacted, unconditionally scheduled rate (4.0% for 2026, stepping to 3.0% by 2030); it fully exempts Social Security and pension income, and this planner&apos;s 401(k)/IRA/annuity figure except the portion proxied by the federal early-distribution penalty.</li>
                <li>Missouri taxes income above its federal-conforming standard deduction under a shared graduated schedule topping out at 4.7%; it fully deducts Social Security for an owner 62+, exempts public pension income up to a per-owner cap tied to the maximum Social Security benefit, and separately exempts up to $6,000 per owner of private pension and this planner&apos;s 401(k)/IRA/annuity figure, phased out at higher household income; Missouri&apos;s separate military retirement exemption is not modeled.</li>
                <li>Washington has no individual income tax, but imposes a 7% excise tax (9.9% above $1,000,000 of taxable gain) on long-term capital gains over a $278,000 deduction shared by a married couple; retirement-account distributions and real estate sales are never capital gains here, and wages, pensions, Social Security and short-term gains are untaxed.</li>
                <li>Alabama has graduated 2%/4%/5% brackets, an income-tested standard deduction, and an uncapped deduction for federal income tax paid; it excludes Social Security and treats income entered as annual pension as an exempt defined-benefit pension regardless of pensionType, while this planner&apos;s 401(k)/IRA/annuity figure remains fully taxable, and Alabama&apos;s local occupational taxes are not modeled.</li>
                <li>Arkansas has graduated brackets from 0% to 3.7% and a small standard deduction; it excludes Social Security and gives each owner up to $6,000 of combined pension and 401(k)/IRA/annuity exclusion, but not Arkansas&apos;s separate unlimited military retirement exemption or its net-capital-gain exclusion.</li>
                <li>Delaware has graduated brackets from 0% to 6.6%; it excludes Social Security and gives an owner 60 or older up to $12,500 of pension plus retirement-account income (not shared with a spouse, and excluding Delaware&apos;s broader investment-income eligible-income test), or up to $2,000 for a younger owner&apos;s pension only.</li>
                <li>Kansas has graduated brackets from 5.2% to 5.58%, a standard deduction, and a consolidated exemption allowance; it excludes Social Security and treats income entered as annual pension with a government pensionType as a specifically-exempt retirement benefit, while this planner&apos;s 401(k)/IRA/annuity figure remains fully taxable.</li>
                <li>Kentucky has a flat 3.5% rate and a $3,360 per-taxpayer standard deduction; it excludes Social Security and gives each owner up to $31,110 of combined pension and 401(k)/IRA/annuity exclusion, but not Kentucky&apos;s separate, larger pre-1998 government-service exemption.</li>
                <li>Nebraska uses the published draft 2026 schedule (2.46%/3.51%/4.55%), $8,850/$17,700 standard deductions and $176 per-person credit, then the draft 2027 schedule (2.46%/3.51%/3.99%), $9,100/$18,200 deductions and $181 credit, held for later years. Its 2026 age/blind addition still uses 2025 amounts; it excludes Social Security, but not military retirement pay or CSRS federal civil service annuities, which this planner cannot identify.</li>
                <li>West Virginia has graduated brackets from 2.11% to 4.58%, the same for every supported filing status, no standard deduction, and a $2,000 per-person exemption; it excludes Social Security in full below $50,000 single/$100,000 married AGI (65% above), gives each owner up to $2,000 of government-pension exclusion, and gives an owner 65 or older up to $8,000 of further exclusion against that owner&apos;s other income, but not its separate uncapped police, firefighter or military retirement exemptions.</li>
                <li>Idaho has a flat 5.3% rate above a 0%-taxed threshold and a federal-conformity standard deduction; it excludes Social Security and Railroad Retirement in full and gives a household-level Retirement Benefits Deduction for pension income with a federal-government pensionType for an owner 65 or older, reduced by gross Social Security received, but not Idaho&apos;s separate firefighter, police or military retirement exclusions.</li>
                <li>Louisiana has a flat 3% rate and a standard deduction with no personal exemption; it excludes Social Security and any state/local/federal government pension in full at any age, and gives each owner 65 or older up to $12,000 of further exclusion covering private pension and this planner&apos;s 401(k)/IRA/annuity figure.</li>
                <li>Michigan has a flat 4.25% rate and a per-person personal exemption; it excludes Social Security in full at any income and, under its 2026 fully-phased-in rules, excludes pension income of any pensionType plus this planner&apos;s 401(k)/IRA/annuity figure up to a combined household cap, with no age restriction, but not its separate age-67 standard-deduction alternative.</li>
                <li>Oklahoma uses the enacted 2026 brackets of 0%/2.5%/3.5%/4.5%, a standard deduction, a per-person exemption and a further $1,000 per-person exemption for an owner 65 or older under a low household-AGI test; it excludes Social Security in full and gives each owner up to $10,000 of combined pension and 401(k)/IRA/annuity exclusion at any age, but not its separate, uncapped military retirement and CSRS-in-lieu-of-Social-Security exemptions.</li>
                <li>Wisconsin has graduated brackets from 3.5% to 7.65%, a linearly-approximated income-phased standard deduction and a per-person exemption with an add-on for an owner 65 or older; it excludes Social Security and military retirement pay in full and gives an owner 67 or older up to $24,000 of combined pension and 401(k)/IRA/annuity exclusion, but not its separate low-income age-65 subtraction or pre-1964 government pension exemption.</li>
                <li>Hawaii uses enacted year-specific brackets (1.4% to 11% in 2026, up to 13% from 2027), scheduled standard deduction increases through 2031, and a per-person personal exemption; it excludes Social Security and Railroad Retirement Tier 1 benefits in full and requires explicit Hawaii pension treatment, blocking mixed or unknown classifications. Traditional IRA/401(k) sources require explicit taxable or single-source exempt employer/rollover confirmation. Mixed sources and exempt-account basis/contributions/conversions are unsupported.</li>
                <li>Maine uses owner-attributed eligible retirement income, source-level early-distribution exclusions, and income-tested deductions. The pension phaseout temporarily uses 2025 federal-AGI thresholds, not verified 2026 amounts. Future indexed parameters use the editable tax-growth assumption; unsupported early pension/workplace eligibility is blocked. See the Maine confirmation for full limitations.</li>
                <li>North Dakota starts from federal taxable income directly, with no separate state standard deduction or personal exemption, under graduated brackets from 0% to 2.5%; it excludes Social Security and Tier 1 Railroad Retirement Board benefits in full and applies its 40% exclusions to eligible net long-term gains and qualified dividends before the federal taxable-income cap, using published 2026 ND-1ES brackets held fixed for future years, but not its military pay, licensed peace officer retirement, Native American income or Marriage Penalty Credit provisions.</li>
                <li>Oregon has graduated brackets from 4.75% to 9.9%, a standard deduction with an age-65-or-blind add-on and a $263-per-exemption credit phased out at higher federal AGI; it excludes Social Security and Tier 1 Railroad Retirement Board benefits in full and uses published 2026 DOR parameters (including the updated $2,910/$5,820 standard deduction) and stepped federal tax subtraction caps (up to $8,750), with age/blind additions confirmed in 2026 guidance and age 65 tested as of January 1 following the tax year, freezing future parameters, and limiting federal liability to modeled regular income tax, but not its federal pension income subtraction for pre-October-1991 service, Retirement Income Credit or one-time kicker credit.</li>
                <li>Oregon SHS/PFA use the separate explicit jurisdiction and no-special-adjustments contract; SHS ends after 2030, PFA includes the scheduled 2028 rate increase, and Portland Arts Tax is omitted.</li>
              </ul>
              <p className="mt-3">Workplace contributions use verified scenario limits. IRA contributions use the restricted annual eligibility model with explicit coverage and deduction choices. Unsupported account or tax cases are blocked rather than approximated. Do not use these results to make financial decisions.</p>
              <p className="mt-2">Your inputs stay in your browser and are not sent to any server. Reloading the page restores the example scenario. If you use Share or Save, the whole scenario is written into the link after the # sign: your browser does not send that part to this site, but anyone you give the link to can read the scenario.</p>
              <p className="mt-2">Some federal deductions that mainly help working years are not modeled: the 2025-2028 deductions for qualified tips, overtime premium pay and vehicle loan interest, because this planner has no inputs for those items, so federal and state tax can be overstated for a household that has them. The enhanced senior deduction ($6,000 per qualifying person through 2028) is modeled.</p>
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
