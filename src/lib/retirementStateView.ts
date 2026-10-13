import { STATES, type StateCode } from "./states";
import type { FilingStatus } from "./tax";
import { taxCharacter } from "./retirementPlan/accountTax";
import { estimateHouseholdTax, type HouseholdIncome, type HouseholdTaxInput, type RetirementIncomeItem } from "./retirementPlan/householdTax";
import { CONTRACTS, NEUTRAL_CITY, oregonLocalFor } from "./wageTax";

/**
 * What a state's income tax does to a retiree's Social Security, pension and 401(k) or IRA withdrawals.
 *
 * This runs the planner's per-state modules (src/lib/retirementPlan), which were read against each state's own 2026
 * publications, on a standard retiree household. For each income source it reports the state income tax that source
 * adds: the state's tax on the whole household minus its tax with that source removed. Local income taxes are left out.
 */

export type RetireeProfile = Readonly<{
  filing: FilingStatus;
  /** Age of each person in 2026; both spouses are the same age. */
  age: number;
  /** Household totals for the year, in dollars. */
  socialSecurity: number;
  pension: number;
  withdrawals: number;
}>;

export type SourceKey = "socialSecurity" | "pension" | "withdrawals";

export type StateRetirementTax = Readonly<{
  state: StateCode;
  /** State income tax on the whole household. */
  stateTax: number;
  /** Tax each source adds, by leaving it out. These do not add up to stateTax, because deductions are shared. */
  added: Readonly<Record<SourceKey, number>>;
  /** Set when a state module could not run; the other fields are then zero. */
  error?: string;
}>;

export const DEFAULT_PROFILE: RetireeProfile = { filing: "single", age: 67, socialSecurity: 30000, pension: 25000, withdrawals: 35000 };

const WITHDRAWAL_DATE = "2026-07-01";

function buildInput(state: StateCode, p: RetireeProfile): HouseholdTaxInput {
  const married = p.filing === "married";
  const owners = married ? ["one", "two"] : ["one"];
  const birthDate = `${2026 - p.age}-06-30`;
  const share = (total: number) => total / owners.length;

  const income: HouseholdIncome[] = [];
  if (p.socialSecurity > 0) for (const id of owners) income.push({ ownerId: id, kind: "social-security", amount: share(p.socialSecurity) });
  if (p.pension > 0) {
    // A pension from a private employer, paid to the first spouse; Hawaii exempts employer-funded pensions.
    income.push({ ownerId: "one", kind: "pension", amount: p.pension, pensionType: "private", hawaiiPensionTreatment: "exempt", pensionAfter59Half: p.pension });
  }
  const retirementIncome: RetirementIncomeItem[] = p.withdrawals > 0
    // Modeled as traditional IRA withdrawals: New York's module declines workplace-plan distributions without more detail.
    ? owners.map((id) => ({ ownerId: id, source: "traditional-ira" as const, date: WITHDRAWAL_DATE, amount: share(p.withdrawals) }))
    : [];
  const cityId = NEUTRAL_CITY[state];

  return {
    year: 2026,
    filing: p.filing,
    people: owners.map((id) => ({ id, birthDate, blind: false, eligibleForSeniorDeduction: true })),
    income,
    retirementIncome,
    accountIncome: taxCharacter({ retirementOrdinary: p.withdrawals }),
    lossCarryover: { shortTerm: 0, longTerm: 0 },
    state,
    stateTreatment: "verified-resident-location",
    ...(cityId ? { cityId } : {}),
    ...CONTRACTS,
    ...(state === "or" ? { oregonLocal: oregonLocalFor(cityId) } : {}),
  } as HouseholdTaxInput;
}

function stateTaxFor(state: StateCode, p: RetireeProfile): number {
  return estimateHouseholdTax(buildInput(state, p)).stateTax;
}

export function stateRetirementTax(state: StateCode, p: RetireeProfile = DEFAULT_PROFILE): StateRetirementTax {
  const zero = { socialSecurity: 0, pension: 0, withdrawals: 0 };
  try {
    const whole = stateTaxFor(state, p);
    const added = { ...zero };
    for (const key of Object.keys(zero) as SourceKey[]) {
      if (p[key] > 0) added[key] = Math.max(0, whole - stateTaxFor(state, { ...p, [key]: 0 }));
    }
    return { state, stateTax: whole, added };
  } catch (e) {
    return { state, stateTax: 0, added: zero, error: e instanceof Error ? e.message : "This state could not be calculated." };
  }
}

/** Every state, lowest total state tax first (states that could not be calculated last). */
export function retirementTaxByState(p: RetireeProfile = DEFAULT_PROFILE): StateRetirementTax[] {
  return STATES.map((s) => stateRetirementTax(s.code, p)).sort((a, b) => {
    if (!!a.error !== !!b.error) return a.error ? 1 : -1;
    return a.stateTax - b.stateTax;
  });
}

/** Tax added below this many dollars counts as none: shared deductions can move a few dollars (Arizona's senior deduction follows federal AGI). */
export const MATERIAL = 50;

export type SourceTreatment = "adds-none" | "adds-tax" | "none";

/** Whether a source adds state tax at this profile (directly, or by shrinking another deduction). "none" when the household has none of that income. */
export function treatment(row: StateRetirementTax, p: RetireeProfile, key: SourceKey): SourceTreatment {
  if (p[key] <= 0) return "none";
  return row.added[key] >= MATERIAL ? "adds-tax" : "adds-none";
}
