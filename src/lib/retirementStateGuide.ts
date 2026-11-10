import { STATES, type StateCode } from "./states";
import { STATE_CONTRACT_FIELD } from "./retirementPlan/stateContracts";
import { STATE_SS_CLASSIFICATION } from "./retirementPlan/stateSocialSecurityCoverage";
import { DEFAULT_PROFILE, MATERIAL, stateRetirementTax, treatment, type RetireeProfile, type SourceKey, type SourceTreatment } from "./retirementStateView";
import { STATE_TAX_SOURCES, type SourceRef } from "./calculatorSources";
import { getStateRuleNote, type StateRuleNote } from "./taxRuleNotes";

/**
 * Per-state retirement tax guide data.
 *
 * Everything numeric here is computed by the same per-state modules the Complete Retirement Plan uses, on fixed example
 * households, so the guide pages cannot drift from the planner. Nothing is typed in by hand except wording.
 * Results are pre-credit, state income tax only (no local, property or sales tax), for the 2026 tax year.
 */

export type GuideState = Readonly<{ code: StateCode; name: string; slug: string }>;

export const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const hasModule = (code: StateCode) => code in STATE_CONTRACT_FIELD;

/** The 42 states and DC that have a dedicated tax module. */
export const GUIDE_STATES: readonly GuideState[] = STATES.filter((s) => hasModule(s.code)).map((s) => ({ ...s, slug: slugify(s.name) }));

/** States with no broad personal income tax, which have no module. */
export const NO_INCOME_TAX_STATES: readonly GuideState[] = STATES.filter((s) => !hasModule(s.code)).map((s) => ({ ...s, slug: slugify(s.name) }));

export function guideStateBySlug(slug: string): GuideState | undefined {
  return GUIDE_STATES.find((s) => s.slug === slug);
}

/** The example retiree shown first on every page. */
export const EXAMPLE: RetireeProfile = DEFAULT_PROFILE;

/** Same pension and withdrawals at different ages, with no Social Security, to show age-based exclusions. */
export const AGE_BASE: RetireeProfile = { filing: "single", age: 67, socialSecurity: 0, pension: 25000, withdrawals: 35000 };
export const AGES = [60, 62, 65, 70] as const;

/** Social Security plus IRA withdrawals of increasing size. */
export const SINGLE_BASE: RetireeProfile = { filing: "single", age: 67, socialSecurity: 30000, pension: 0, withdrawals: 0 };
export const SINGLE_WITHDRAWALS = [20000, 50000, 100000, 150000] as const;
export const MARRIED_BASE: RetireeProfile = { filing: "married", age: 67, socialSecurity: 50000, pension: 0, withdrawals: 0 };
export const MARRIED_WITHDRAWALS = [40000, 80000, 150000, 250000] as const;

export type IncomeRow = Readonly<{ withdrawals: number; cashIncome: number; tax: number; ratePct: number }>;
export type AgeRow = Readonly<{ age: number; tax: number }>;

export type StateGuide = Readonly<{
  state: GuideState;
  ssClass: (typeof STATE_SS_CLASSIFICATION)[StateCode];
  total: number;
  added: Readonly<Record<SourceKey, number>>;
  treatments: Readonly<Record<SourceKey, SourceTreatment>>;
  ageRows: readonly AgeRow[];
  single: readonly IncomeRow[];
  married: readonly IncomeRow[];
  ruleNote: StateRuleNote | null;
  sources: readonly SourceRef[];
}>;

function incomeRows(base: RetireeProfile, code: StateCode, levels: readonly number[]): IncomeRow[] {
  return levels.map((withdrawals) => {
    const r = stateRetirementTax(code, { ...base, withdrawals });
    if (r.error) throw new Error(`${code}: ${r.error}`);
    const cashIncome = base.socialSecurity + base.pension + withdrawals;
    return { withdrawals, cashIncome, tax: r.stateTax, ratePct: cashIncome > 0 ? (r.stateTax / cashIncome) * 100 : 0 };
  });
}

const cache = new Map<StateCode, StateGuide>();

export function buildStateGuide(code: StateCode): StateGuide {
  const hit = cache.get(code);
  if (hit) return hit;
  const state = GUIDE_STATES.find((s) => s.code === code);
  if (!state) throw new RangeError(`No retirement tax module for ${code}.`);
  const base = stateRetirementTax(code, EXAMPLE);
  if (base.error) throw new Error(`${code}: ${base.error}`);
  const keys: SourceKey[] = ["socialSecurity", "pension", "withdrawals"];
  const treatments = Object.fromEntries(keys.map((k) => [k, treatment(base, EXAMPLE, k)])) as Record<SourceKey, SourceTreatment>;
  const ageRows = AGES.map((age) => {
    const r = stateRetirementTax(code, { ...AGE_BASE, age });
    if (r.error) throw new Error(`${code}: ${r.error}`);
    return { age, tax: r.stateTax };
  });
  const guide: StateGuide = {
    state,
    ssClass: STATE_SS_CLASSIFICATION[code],
    total: base.stateTax,
    added: base.added,
    treatments,
    ageRows,
    single: incomeRows(SINGLE_BASE, code, SINGLE_WITHDRAWALS),
    married: incomeRows(MARRIED_BASE, code, MARRIED_WITHDRAWALS),
    ruleNote: getStateRuleNote(code),
    sources: STATE_TAX_SOURCES[code] ?? [],
  };
  cache.set(code, guide);
  return guide;
}

export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** A sentence about how age changes the tax on the age-sweep household, or null when it does not. */
export function ageSentence(g: StateGuide): string | null {
  const rows = g.ageRows;
  const lo = Math.min(...rows.map((r) => r.tax));
  const hi = Math.max(...rows.map((r) => r.tax));
  if (hi - lo < MATERIAL) return null;
  const parts = rows.map((r) => `${usd(r.tax)} at ${r.age}`).join(", ");
  const first = rows[0];
  const last = rows[rows.length - 1];
  const dir = last.tax < first.tax ? "falls" : "rises";
  return `The same $25,000 pension and $35,000 of IRA withdrawals, with no Social Security, produce ${parts}. The tax ${dir} with age because ${g.state.name} treats income differently by age, for example through senior deductions or retirement-income exclusions.`;
}

const sourcePhrase: Record<SourceKey, string> = {
  socialSecurity: "$30,000 of Social Security",
  pension: "$25,000 private pension",
  withdrawals: "$35,000 of IRA withdrawals",
};

/** What each source added on the example household, in plain words. */
export function treatmentSentence(g: StateGuide, key: SourceKey): string {
  const amount = g.added[key];
  if (g.treatments[key] === "adds-none") return `On the example retiree, ${g.state.name} adds no income tax for the ${sourcePhrase[key]}.`;
  return `On the example retiree, the ${sourcePhrase[key]} adds about ${usd(amount)} of ${g.state.name} income tax.`;
}

/** One sentence on how the state treats Social Security, for the page introduction. */
export function ssSummary(g: StateGuide): string {
  const n = g.state.name;
  if (g.ssClass === "exempt") return `${n} fully exempts Social Security benefits from state income tax, in the planner's review of 2026 law. Federal tax on benefits still applies.`;
  if (g.ssClass === "conditional") return `${n} exempts Social Security benefits only under conditions such as age or income limits, so the result depends on the household.`;
  return `${n} starts from the federal taxable amount of Social Security.`;
}

/** The three question-and-answer pairs used as visible FAQ and as FAQPage markup. */
export function guideFaq(g: StateGuide): { q: string; a: string }[] {
  const n = g.state.name;
  const ss =
    g.ssClass === "exempt"
      ? `No. In the planner's review of 2026 state law, ${n} fully exempts Social Security benefits from state income tax. Federal tax on benefits still applies. ${treatmentSentence(g, "socialSecurity")}`
      : g.ssClass === "conditional"
        ? `Only in part. ${n} exempts Social Security benefits only under conditions such as age or income limits, so the answer depends on your household. ${treatmentSentence(g, "socialSecurity")}`
        : `Yes, to the extent the benefits are taxable federally. ${n} starts from the federal taxable amount of Social Security. ${treatmentSentence(g, "socialSecurity")}`;
  return [
    { q: `Does ${n} tax Social Security benefits?`, a: ss },
    { q: `Does ${n} tax pension income?`, a: `${treatmentSentence(g, "pension")} Pension rules often depend on the type of pension (private, federal, state or local government), your age and your total income, so your result can differ.` },
    { q: `Does ${n} tax 401(k) and IRA withdrawals?`, a: `${treatmentSentence(g, "withdrawals")} Many states give partial relief to older taxpayers, and some tax withdrawals as ordinary income with no relief. Your age and total income decide the amount.` },
  ];
}
