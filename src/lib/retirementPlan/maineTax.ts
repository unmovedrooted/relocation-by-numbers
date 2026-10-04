import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";
import { pensionEligibilityDate } from "./pensionEligibilityDate";

/** Restricted Maine planning estimate, assumptions reviewed September 2026.
 * 2026 published amounts: https://www.maine.gov/revenue/tax-return-forms/individual-income-tax-2026
 * Eligibility/phaseout: https://legislature.maine.gov/statutes/36/title36sec5122.html
 * Indexing: https://legislature.maine.gov/statutes/36/title36sec5403.html
 * Verified against Maine Revenue Services 2026 Individual Income Tax Rates (revised
 * 2026-05-20) and the 2026 Form 1040ES-ME worksheet (revised July 2026): brackets,
 * standard deduction, personal exemption, surcharge thresholds, the $49,824 pension
 * cap and the $102,250/$341,000 deduction and exemption phaseout starts.
 *
 * Pension-deduction phaseout start (36 MRSA 5122(2)(M-3)): the statutory applicable
 * amounts are $125,000 single, $187,500 head of household and $250,000 married joint
 * (RR 2025 c.1 Pt.A s.55), indexed from 2025 under 36 MRSA 5403(11) by the ratio of the
 * 12-month average Chained CPI-U ending June 30 of the preceding year to the 12-month
 * average ending June 30, 2024, rounded down to a multiple of $50. Maine Revenue
 * Services had not published the 2026 amounts in any document available on
 * 2026-10-04, so the 2026 values below are computed from that statutory formula with
 * BLS Chained CPI-U (series SUUR0000SA0): July 2024-June 2025 average 176.4166 over
 * July 2023-June 2024 average 172.3449 = 1.02363, giving $127,950 single and $255,900
 * married (head of household $191,900, unsupported). Replace with the published figures
 * when Maine releases the 2026 pension worksheet. Future parameters are explicit
 * projections, not tax tables.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 15700, married: 31400 };
const AGE_OR_BLIND_ADDITION: Record<FilingStatus, number> = { single: 2050, married: 1650 };
const PERSONAL_EXEMPTION_PER_PERSON = 5300;
const PENSION_DEDUCTION_CAP = 49824;
const SURCHARGE_THRESHOLD: Record<FilingStatus, number> = { single: 1000000, married: 1500000 };
const SURCHARGE_RATE = .02;
const BRACKET_CEILINGS: Record<FilingStatus, number[]> = {
  single: [27400, 64850, Infinity],
  married: [54850, 129750, Infinity],
};
const BRACKET_RATES = [.058, .0675, .0715];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function maineTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.maineContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Maine planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Maine projection year.");
  const growth = input.projection?.annualBracketGrowth;
  if (input.year > 2026 && growth === undefined) throw new RangeError("Maine future years require explicit tax growth.");
  if (growth !== undefined && (!Number.isFinite(growth) || growth < 0 || growth > .2)) throw new RangeError("Invalid Maine tax growth.");
  const factor = (1 + (growth ?? 0)) ** (input.year - 2026);
  // Future parameters are estimates, not published tables. Maine indexes
  // these dollar amounts down to $50; phaseout widths remain statutory.
  const indexed = (value: number) => input.year === 2026 ? value : Math.floor((value * factor + 1e-8) / 50) * 50;
  // 36 MRS 5122(2)(M-3): federal AGI; $100,000 width for both supported statuses. 2026 start is
  // statute-derived (see header), not yet a published Maine Revenue Services figure.
  const pensionPhaseoutStart = indexed(input.filing === "married" ? 255900 : 127950);
  const pensionFraction = 1 - Math.min(1, Math.max(0, (federalAgi - pensionPhaseoutStart) / 100000));
  const retirementByOwner = new Map(input.people.map(person => [person.id, 0]));
  let attributed = 0;
  for (const item of input.retirementIncome ?? []) {
    if (!retirementByOwner.has(item.ownerId) || !Number.isFinite(item.amount) || item.amount < 0) {
      throw new RangeError("Invalid Maine retirement income attribution.");
    }
    attributed += item.amount;
    const person = input.people.find(person => person.id === item.ownerId)!;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !item.date.startsWith(`${input.year}-`)
      || !Number.isFinite(Date.parse(item.date)) || new Date(item.date).toISOString().slice(0, 10) !== item.date) {
      throw new RangeError("Invalid Maine distribution date.");
    }
    const early = item.earlyDistributionTaxable ?? (
      item.date >= pensionEligibilityDate(person.birthDate) || item.source === "ira-conversion" || item.source === "plan-conversion" ? 0 : undefined);
    if (early === undefined || !Number.isFinite(early) || early < 0 || early > item.amount) {
      throw new RangeError("Maine requires source-level early-distribution tax detail.");
    }
    // Personally purchased deferred annuities are not employee-plan benefits.
    let eligible = item.source === "annuity" ? 0 : item.amount - early;
    const age55 = `${Number(person.birthDate.slice(0, 4)) + 55}${person.birthDate.slice(4)}`;
    if (["401k", "roth-401k", "plan-conversion"].includes(item.source) && item.date < age55 && eligible > 0) {
      throw new RangeError("Maine workplace distributions before age 55 require verified periodic-payment eligibility; unsupported.");
    }
    eligible = Math.max(0, eligible);
    retirementByOwner.set(item.ownerId, retirementByOwner.get(item.ownerId)! + eligible);
  }
  if (!Number.isFinite(retirementOrdinary) || retirementOrdinary < 0
    || Math.abs(attributed - retirementOrdinary) > 1e-5) {
    throw new RangeError("Maine requires reconciled owner-level retirement income.");
  }
  let pensionDeduction = 0;
  let ageOrBlindConditions = 0;
  for (const person of input.people) {
    const ownPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
    if (ownPension > 0 && pensionEligibilityDate(person.birthDate) > `${input.year}-01-01`) {
      throw new RangeError("Maine pension income before age 59½ requires verified payment and penalty-exception detail; unsupported.");
    }
    const ownGrossSocialSecurity = input.income.filter(item => item.ownerId === person.id && item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0);
    // This SSA-linked cap is forecast with the same explicit growth assumption,
    // not represented as a published SSA maximum or rounded to a $50 tax band.
    const cap = Math.max(0, PENSION_DEDUCTION_CAP * factor - ownGrossSocialSecurity);
    pensionDeduction += Math.min(cap, ownPension + retirementByOwner.get(person.id)!);
    ageOrBlindConditions += (ageAtYearEnd(person.birthDate, input.year) >= 65 ? 1 : 0) + (person.blind ? 1 : 0);
  }
  pensionDeduction *= pensionFraction;
  const meAgi = Math.max(0, federalAgi - taxableBenefits - pensionDeduction);
  // 2026 MRS estimated-tax worksheets, lines 6a and 6b. Use Maine AGI
  // after income subtractions, not federal AGI. Preserve unrounded model dollars.
  // https://www.maine.gov/revenue/tax-return-forms/individual-income-tax-2026
  const remainingFraction = (start: number, width: number) =>
    1 - Math.min(1, Math.max(0, (meAgi - start) / width));
  const married = input.filing === "married";
  const standardDeduction = (indexed(STANDARD_DEDUCTION[input.filing]) + ageOrBlindConditions * indexed(AGE_OR_BLIND_ADDITION[input.filing]))
    * remainingFraction(indexed(married ? 204550 : 102250), married ? 150000 : 75000);
  const exemption = indexed(PERSONAL_EXEMPTION_PER_PERSON) * input.people.length
    * remainingFraction(indexed(married ? 409150 : 341000), 125000);
  const taxable = Math.max(0, meAgi - standardDeduction - exemption);
  const baseTax = marginal(taxable, BRACKET_CEILINGS[input.filing].map(value => Number.isFinite(value) ? indexed(value) : value), BRACKET_RATES);
  const surcharge = Math.max(0, taxable - indexed(SURCHARGE_THRESHOLD[input.filing])) * SURCHARGE_RATE;
  const stateTax = baseTax + surcharge;
  return {
    stateTax, localTax: 0, meAgi, pensionDeduction, standardDeduction, exemption, pensionPhaseoutStart, projectionFactor: factor,
    warning: "Maine planning estimate: 2026 rates and deductions, with owner-specific eligible retirement income. Federal early-distribution-tax-subject income and personally purchased annuities do not qualify. Workplace income before age 55 without verified periodic-payment eligibility and pensions before age 59½ without payment/exception detail are unsupported and blocked. The pension-deduction phaseout starts at federal AGI of $127,950 single/$255,900 married for 2026, computed from the 36 MRSA 5403(11) inflation formula and BLS Chained CPI-U because Maine Revenue Services had not yet published the 2026 amounts (the statutory 2025 amounts were $125,000/$250,000), over a fixed $100,000 range. Future indexed tax parameters use the editable tax-growth assumption, rounded down to $50; phaseout widths stay fixed. The SSA-linked pension cap is projected from $49,824 with that same growth assumption, not a published future SSA maximum. Social Security taxability thresholds remain fixed. Military pension exemptions, itemized deductions and credits are not modeled.",
  };
}
