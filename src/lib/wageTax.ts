import type { FilingStatus } from "./tax";
import { sumBrackets } from "./tax";
import type { StateCode } from "./states";
import { CONTRIBUTION_LIMITS_2026, FEDERAL_2026, PAYROLL_2026, TAX_YEAR } from "./taxYear2026";
import type { CityIncomeBase } from "./retirementPlan/cityIncomeTax";
import type { HouseholdTaxInput } from "./retirementPlan/householdTax";
import { alabamaTax } from "./retirementPlan/alabamaTax";
import { arizonaTax } from "./retirementPlan/arizonaTax";
import { arkansasTax } from "./retirementPlan/arkansasTax";
import { californiaTax } from "./retirementPlan/californiaTax";
import { coloradoTax } from "./retirementPlan/coloradoTax";
import { connecticutTax } from "./retirementPlan/connecticutTax";
import { dcTax } from "./retirementPlan/dcTax";
import { delawareTax } from "./retirementPlan/delawareTax";
import { georgiaTax } from "./retirementPlan/georgiaTax";
import { hawaiiTax } from "./retirementPlan/hawaiiTax";
import { idahoTax } from "./retirementPlan/idahoTax";
import { illinoisTax } from "./retirementPlan/illinoisTax";
import { indianaTax } from "./retirementPlan/indianaTax";
import { iowaTax } from "./retirementPlan/iowaTax";
import { kansasTax } from "./retirementPlan/kansasTax";
import { kentuckyTax } from "./retirementPlan/kentuckyTax";
import { louisianaTax } from "./retirementPlan/louisianaTax";
import { maineTax } from "./retirementPlan/maineTax";
import { marylandTax } from "./retirementPlan/marylandTax";
import { massachusettsTax } from "./retirementPlan/massachusettsTax";
import { michiganTax } from "./retirementPlan/michiganTax";
import { minnesotaTax } from "./retirementPlan/minnesotaTax";
import { mississippiTax } from "./retirementPlan/mississippiTax";
import { missouriTax } from "./retirementPlan/missouriTax";
import { montanaTax } from "./retirementPlan/montanaTax";
import { nebraskaTax } from "./retirementPlan/nebraskaTax";
import { newJerseyTax } from "./retirementPlan/newJerseyTax";
import { newMexicoTax } from "./retirementPlan/newMexicoTax";
import { newYorkTax } from "./retirementPlan/newYorkTax";
import { northCarolinaTax } from "./retirementPlan/northCarolinaTax";
import { northDakotaTax } from "./retirementPlan/northDakotaTax";
import { ohioTax } from "./retirementPlan/ohioTax";
import { oklahomaTax } from "./retirementPlan/oklahomaTax";
import { oregonTax } from "./retirementPlan/oregonTax";
import { pennsylvaniaTax } from "./retirementPlan/pennsylvaniaTax";
import { rhodeIslandTax } from "./retirementPlan/rhodeIslandTax";
import { southCarolinaTax } from "./retirementPlan/southCarolinaTax";
import { utahTax } from "./retirementPlan/utahTax";
import { vermontTax } from "./retirementPlan/vermontTax";
import { virginiaTax } from "./retirementPlan/virginiaTax";
import { washingtonTax } from "./retirementPlan/washingtonTax";
import { westVirginiaTax } from "./retirementPlan/westVirginiaTax";
import { wisconsinTax } from "./retirementPlan/wisconsinTax";

export { TAX_YEAR };
export const EMPLOYEE_401K_LIMIT = CONTRIBUTION_LIMITS_2026.employee401k;

/**
 * Wage-income tax engine for the relocation, paycheck, HSA and 401(k) calculators.
 *
 * Federal income tax and payroll tax use the 2026 IRS figures in taxYear2026.ts.
 * State income tax calls the per-state functions in src/lib/retirementPlan, which were read against
 * each state's own 2026 publications. Those functions are called with a wage-only household
 * (two taxpayers for a joint return, aged 40, standard deductions, no dependents or credits beyond
 * what each function applies). Local income taxes come from the same functions where they model
 * them, plus the explicit rules below for cities they do not cover.
 *
 * Annual liability, not paycheck withholding: results estimate the tax owed for the year.
 */

export type TaxBreakdown = {
  gross: number;
  k401: number;
  after401k: number;
  taxableFederal: number;
  federal: number;
  fica: number;
  state: number;
  local: number;
  totalTax: number;
  net: number;
};

export type TaxOpts = {
  grossAnnual: number;
  state: StateCode;
  filing: FilingStatus;
  k401Pct: number;
  cityId?: string;
  /**
   * Optional pre-computed 401(k) dollar amount, used instead of deriving it from k401Pct.
   * The IRS elective deferral limit applies per person, so a couple who each max out a 401(k)
   * can jointly exclude up to twice the single limit. Callers that combine two incomes into one
   * grossAnnual should add each spouse's capped amount and pass the sum here.
   */
  k401Dollar?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** 2026 federal standard deduction for the given filing status. */
export function getFederalStandardDeduction(filing: FilingStatus): number {
  return FEDERAL_2026.standardDeduction[filing];
}

/** 2026 federal income-tax brackets ({ upTo, rate }) for the given filing status. */
export function getFederalBrackets(filing: FilingStatus): { upTo: number; rate: number }[] {
  return FEDERAL_2026.brackets[filing].map((b) => ({ upTo: b.upTo, rate: b.rate }));
}

/**
 * Social Security and Medicare on combined wages, treated as one worker's pay (the wage base applies once).
 * Callers that need two earners compute each earner separately and add the results.
 */
function ficaTax(grossWages: number, filing: FilingStatus): number {
  const wages = Math.max(0, grossWages);
  const ss = Math.min(wages, PAYROLL_2026.socialSecurityWageBase) * PAYROLL_2026.socialSecurityRate;
  const medicare = wages * PAYROLL_2026.medicareRate;
  const addl = Math.max(0, wages - PAYROLL_2026.additionalMedicareThreshold[filing]) * PAYROLL_2026.additionalMedicareRate;
  return ss + medicare + addl;
}

// ─── State and local income tax ──────────────────────────────────────────────

const VERIFIED = "verified-law-precredit" as const;
const BIRTH_DATE = "1986-06-30"; // age 40 in 2026: no age-based additions apply
// The state functions require a location they can rate (a county or city) and reject others. The state tax
// does not depend on it, so a neutral location is used when the real city is not one they rate, and the local
// tax from that neutral run is discarded.
const NEUTRAL_CITY: Partial<Record<StateCode, string>> = {
  pa: "allentown-pa", in: "indianapolis-in", md: "baltimore-md", ny: "ny-outside-nyc-yonkers",
};

const CONTRACTS = {
  newYorkContract: "enacted-law-precredit",
  marylandContract: VERIFIED, indianaContract: VERIFIED, dcContract: VERIFIED, illinoisContract: VERIFIED,
  newJerseyContract: VERIFIED, coloradoContract: VERIFIED, newMexicoContract: VERIFIED, minnesotaContract: VERIFIED,
  utahContract: VERIFIED, pennsylvaniaContract: VERIFIED, connecticutContract: VERIFIED, vermontContract: VERIFIED,
  montanaContract: VERIFIED, rhodeIslandContract: VERIFIED, californiaContract: VERIFIED, virginiaContract: VERIFIED,
  arizonaContract: VERIFIED, georgiaContract: VERIFIED, northCarolinaContract: VERIFIED, southCarolinaContract: VERIFIED,
  ohioContract: VERIFIED, massachusettsContract: VERIFIED, iowaContract: VERIFIED, mississippiContract: VERIFIED,
  missouriContract: VERIFIED, washingtonContract: VERIFIED, alabamaContract: VERIFIED, arkansasContract: VERIFIED,
  delawareContract: VERIFIED, kansasContract: VERIFIED, kentuckyContract: VERIFIED, nebraskaContract: VERIFIED,
  westVirginiaContract: VERIFIED, idahoContract: VERIFIED, louisianaContract: VERIFIED, michiganContract: VERIFIED,
  oklahomaContract: VERIFIED, wisconsinContract: VERIFIED, hawaiiContract: VERIFIED, maineContract: VERIFIED,
  northDakotaContract: VERIFIED, oregonContract: VERIFIED,
} as const;

const ZERO_ACCOUNT_INCOME = Object.freeze({
  retirementOrdinary: 0, investmentOrdinary: 0, esppCompensation: 0, qualifiedDividends: 0,
  shortTermGain: 0, longTermGain: 0, additionalTaxBase: 0,
});

type StateResult = { stateTax: number; localTax?: number };

type WageContext = {
  filing: FilingStatus;
  gross: number;
  deferrals: number;
  agi: number;
  standardDeduction: number;
  federalTaxableIncome: number;
  regularFederal: number;
};

function oregonLocalFor(cityId: string | undefined) {
  // Portland sits inside both Metro and Multnomah County; Eugene, Salem and the rest of Oregon sit in neither.
  const inside = cityId === "portland-or";
  const where = inside ? "resident" : "outside-no-source";
  return { metro: where, multnomah: where, adjustments: "none-confirmed" } as const;
}

/** Exported only so tests can cross-check this engine against the planner's own household engine. */
export function buildWageHouseholdInput(state: StateCode, filing: FilingStatus, gross: number, deferrals: number, cityId?: string): HouseholdTaxInput {
  const ctx: WageContext = { filing, gross, deferrals, agi: gross - deferrals, standardDeduction: 0, federalTaxableIncome: 0, regularFederal: 0 };
  return buildInput(state, ctx, cityId);
}

function buildInput(state: StateCode, ctx: WageContext, cityId: string | undefined): HouseholdTaxInput {
  const people = (ctx.filing === "married" ? ["one", "two"] : ["one"]).map((id) => ({
    id, birthDate: BIRTH_DATE, blind: false, eligibleForSeniorDeduction: false,
  }));
  return {
    year: 2026,
    filing: ctx.filing,
    people,
    income: [{ ownerId: "one", kind: "wages", amount: ctx.gross }],
    accountIncome: ZERO_ACCOUNT_INCOME,
    lossCarryover: { shortTerm: 0, longTerm: 0 },
    state,
    stateTreatment: "verified-resident-location",
    ...(cityId ? { cityId } : {}),
    ...CONTRACTS,
    ...(state === "or" ? { oregonLocal: oregonLocalFor(cityId) } : {}),
    pretax401k: ctx.deferrals > 0 ? [{ ownerId: "one", amount: ctx.deferrals }] : [],
  } as HouseholdTaxInput;
}

function runStateModule(state: StateCode, ctx: WageContext, input: HouseholdTaxInput): StateResult {
  const { agi, standardDeduction: std, federalTaxableIncome: fti, regularFederal: fed } = ctx;
  const cityBase: CityIncomeBase = {
    qualifyingWages: ctx.gross,
    residentIncome: Math.max(0, ctx.gross - ctx.deferrals),
  };
  switch (state) {
    case "al": return alabamaTax(input, agi, 0, fed, 0, 0, cityBase);
    case "az": return arizonaTax(input, agi, 0, 0);
    case "ar": return arkansasTax(input, agi, 0, 0, 0, 0);
    case "ca": return californiaTax(input, agi, 0);
    case "co": return coloradoTax(input, agi, 0, fti, 0, 0);
    case "ct": return connecticutTax(input, agi, 0, 0, 0);
    case "dc": return dcTax(input, agi, 0);
    case "de": return delawareTax(input, agi, 0, 0);
    case "ga": return georgiaTax(input, agi, 0, 0);
    case "hi": return hawaiiTax(input, agi, 0, 0);
    case "id": return idahoTax(input, agi, 0, std);
    case "il": return illinoisTax(input, agi, 0, 0);
    case "in": return indianaTax(input, agi, 0);
    case "ia": return iowaTax(input, agi, 0, fti, 0);
    case "ks": return kansasTax(input, agi, 0);
    case "ky": return kentuckyTax(input, agi, 0, 0);
    case "la": return louisianaTax(input, agi, 0, 0);
    case "me": return maineTax(input, agi, 0, 0);
    case "md": return marylandTax(input, agi, 0, 0);
    case "ma": return massachusettsTax(input, agi, 0, 0, 0, 0, 0, 0);
    case "mi": return michiganTax(input, agi, 0, 0, cityBase);
    case "mn": return minnesotaTax(input, agi, 0, 0);
    case "ms": return mississippiTax(input, agi, 0, 0, 0);
    case "mo": return missouriTax(input, agi, 0, std, 0, 0);
    case "mt": return montanaTax(input, agi, std, 0, 0);
    case "ne": return nebraskaTax(input, agi, 0);
    case "nj": return newJerseyTax(input, agi, 0, 0, 0);
    case "nm": return newMexicoTax(input, agi, 0, std, 0);
    case "ny": return newYorkTax(input, agi, 0);
    case "nc": return northCarolinaTax(input, agi, 0);
    case "nd": return northDakotaTax(input, fti, 0, 0);
    case "oh": return ohioTax(input, agi, 0, 0, cityBase);
    case "ok": return oklahomaTax(input, agi, 0, 0);
    case "or": return oregonTax(input, agi, 0, fed);
    case "pa": return pennsylvaniaTax(input, agi, 0, 0, 0, ctx.gross, ctx.deferrals);
    case "ri": return rhodeIslandTax(input, agi, 0, 0, 0);
    case "sc": return southCarolinaTax(input, agi, 0, 0, 0);
    case "ut": return utahTax(input, agi, 0, 0, std);
    case "vt": return vermontTax(input, agi, 0, 0, 0, fti);
    case "va": return virginiaTax(input, agi, 0);
    case "wa": return washingtonTax(input, 0, agi, 0, 0);
    case "wv": return westVirginiaTax(input, agi, 0, 0);
    case "wi": return wisconsinTax(input, agi, 0, 0, 0);
    default: return { stateTax: 0, localTax: 0 }; // ak, fl, nv, nh, sd, tn, tx, wy: no tax on wages
  }
}

/** State tax (and the local tax the state function itself models for this city). */
function stateAndModelLocal(state: StateCode, ctx: WageContext, cityId: string | undefined) {
  // New York: only New York City is a local income tax here; every other New York city is outside NYC and Yonkers.
  const primary = state === "ny" ? (cityId === "nyc-ny" ? "nyc-ny" : "ny-outside-nyc-yonkers") : cityId;
  const attempts: Array<string | undefined> = [primary, undefined, NEUTRAL_CITY[state]];
  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    if (i > 0 && attempts[i] === attempts[i - 1]) continue;
    try {
      const r = runStateModule(state, ctx, buildInput(state, ctx, attempts[i]));
      // A fallback attempt (no matching city) must not report a local tax for a city it did not model.
      const modeledCity = i === 0;
      return { stateTax: Math.max(0, r.stateTax), localTax: modeledCity ? Math.max(0, r.localTax ?? 0) : 0 };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/**
 * Local income taxes not modeled by the state functions. Both are earnings taxes on wages after
 * pre-tax deferrals and cafeteria-plan amounts (no state standard deduction):
 * - Kansas City, MO: 1% of gross compensation less contributions to cafeteria and qualified deferred
 *   compensation plans, "similar to ... Box 1" (kcmo.gov Tax FAQs, verified 2026-10-13).
 * - St. Louis, MO: 1%; the Collector's list of individual non-taxable items includes deferred
 *   compensation (IRC 401, 403, 414, 457) and cafeteria plans (stlouis-mo.gov, verified 2026-10-13).
 * Yonkers residents pay 16.75% of the New York State tax (IT-201-I worksheet).
 */
function extraLocalTax(state: StateCode, cityId: string | undefined, ctx: WageContext, stateTax: number): number {
  if (!cityId) return 0;
  const city = cityId.toLowerCase();
  if (state === "mo" && (city === "kansas-city-mo" || city === "st-louis-mo")) {
    return Math.max(0, ctx.gross - ctx.deferrals) * 0.01;
  }
  if (state === "ny" && city === "yonkers-ny") return stateTax * 0.1675;
  return 0;
}

// ─── Public API ──────────────────────────────────────────────────────────────

function compute(opts: TaxOpts): TaxBreakdown {
  const gross = Math.max(0, Number(opts.grossAnnual) || 0);
  const k401Pct = clamp(Number(opts.k401Pct) || 0, 0, 60);
  const hasDollarOverride = typeof opts.k401Dollar === "number" && Number.isFinite(opts.k401Dollar);
  const k401 = hasDollarOverride
    ? clamp(opts.k401Dollar as number, 0, gross)
    : Math.min(gross * (k401Pct / 100), EMPLOYEE_401K_LIMIT);
  const after401k = Math.max(0, gross - k401);

  const standardDeduction = getFederalStandardDeduction(opts.filing);
  const taxableFederal = Math.max(0, after401k - standardDeduction);
  const federal = sumBrackets(taxableFederal, FEDERAL_2026.brackets[opts.filing]);
  const fica = ficaTax(gross, opts.filing);

  const ctx: WageContext = {
    filing: opts.filing,
    gross,
    deferrals: k401,
    agi: after401k,
    standardDeduction,
    federalTaxableIncome: taxableFederal,
    regularFederal: federal,
  };
  const { stateTax, localTax } = gross > 0
    ? stateAndModelLocal(opts.state, ctx, opts.cityId)
    : { stateTax: 0, localTax: 0 };
  const local = localTax + (gross > 0 ? extraLocalTax(opts.state, opts.cityId, ctx, stateTax) : 0);

  const totalTax = federal + fica + stateTax + local;
  const net = Math.max(0, after401k - totalTax);
  return { gross, k401, after401k, taxableFederal, federal, fica, state: stateTax, local, totalTax, net };
}

/** Annual net take-home only. */
export function estimateNetAnnual(opts: TaxOpts): number {
  return compute(opts).net;
}

/** Full annual tax breakdown. */
export function estimateNetBreakdown(opts: TaxOpts): TaxBreakdown {
  return compute(opts);
}

export function effectiveTaxRatePct(netAnnual: number, grossAnnual: number) {
  const g = Math.max(0, Number(grossAnnual) || 0);
  const n = Math.max(0, Number(netAnnual) || 0);
  if (g <= 0) return 0;
  return clamp((1 - n / g) * 100, 0, 99.9);
}
