import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { stateSocialSecurityInclusion } from "./stateSocialSecurityCoverage";
import { ageAtYearEnd } from "./rules";

/** Restricted, federal-standard-deduction-based, PRE-CREDIT planning estimate.
 * Rates and thresholds reviewed 2026-09-23 against:
 * - Tax Foundation's published New Mexico 2025 bracket table (enacted by
 *   HB252 for tax years beginning on or after Jan. 1, 2025, so also
 *   controlling 2026): six brackets from 1.5% to 5.9%. Direct extraction of
 *   the equivalent table from the NM PIT-1 instructions' own rate-table
 *   pages was not achieved this review; this is a secondary citation, not a
 *   directly read primary table.
 *   https://taxfoundation.org/data/all/state/state-income-tax-rates/
 * - NM Taxation and Revenue Department, Instructions for 2025 PIT-1: New
 *   Mexico taxable income starts from federal AGI (PIT-1 line 9) minus the
 *   FEDERAL standard deduction amount (line 12, taken verbatim from the
 *   federal return) minus PIT-ADJ exemptions; personal exemption dollar
 *   amounts remain suspended (zero) matching the federal Section 151
 *   suspension. Confirms the New Mexico Low- and Middle-Income Tax
 *   Exemption (PIT-1 line 14) worksheet: up to $2,500 per exemption
 *   (taxpayer + spouse; this planner has no dependents), reduced by 15%
 *   (single)/10% (married) of federal AGI over $20,000 (single)/$30,000
 *   (married), available only when federal AGI is $36,667 (single) or
 *   $55,000 (married) or less.
 *   https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/2d774fd0-be97-4b57-8dae-68aed999da0f/2025pit-1-ins.pdf
 * - NM Instructions for 2025 PIT-ADJ, Table 1: the age-65-or-older-or-blind
 *   exemption, up to $8,000 per qualifying person, stepping down by $1,000
 *   per $3,000 (married) or $1,500 (single) of federal AGI above $30,000
 *   (married) / $18,000 (single), reaching zero above $51,000 (married) /
 *   $28,500 (single). Only one such exemption per person (not both age and
 *   blind).
 *   https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/61f8c5b0-b391-49b5-9d66-6605ef1f0c13/2025pit-adj-ins.pdf
 * - The same instructions confirm the Social Security income exemption
 *   (PIT-1 line 25 / PIT-ADJ line 25) thresholds already verified and coded
 *   in stateSocialSecurityInclusion, reused unchanged here.
 *
 * Uses enacted law, not a prediction of future legislation. New Mexico has
 * no local income tax; localTax is always zero. Only single and married-
 * filing-jointly are supported. The armed forces retirement pay exemption,
 * the dependent deduction, the medical care expense exemption and the net
 * capital gains deduction are not modeled: this planner has no military-
 * pension, dependent, itemized-medical or capital-gains-specific income
 * kinds distinct enough to support them. New Mexico parameters are not
 * inflation-indexed in this model, matching the restricted New York,
 * Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania and Colorado
 * estimates' convention.
 */

const STATE_BRACKETS: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [
    { upTo: 5500, rate: .015 }, { upTo: 16500, rate: .032 }, { upTo: 33500, rate: .043 },
    { upTo: 66500, rate: .047 }, { upTo: 210000, rate: .049 }, { upTo: Infinity, rate: .059 },
  ],
  married: [
    { upTo: 8000, rate: .015 }, { upTo: 25000, rate: .032 }, { upTo: 50000, rate: .043 },
    { upTo: 100000, rate: .047 }, { upTo: 315000, rate: .049 }, { upTo: Infinity, rate: .059 },
  ],
};

const AGE_BLIND_TABLE: Record<FilingStatus, { upTo: number; amount: number }[]> = {
  single: [
    { upTo: 18000, amount: 8000 }, { upTo: 19500, amount: 7000 }, { upTo: 21000, amount: 6000 }, { upTo: 22500, amount: 5000 },
    { upTo: 24000, amount: 4000 }, { upTo: 25500, amount: 3000 }, { upTo: 27000, amount: 2000 }, { upTo: 28500, amount: 1000 },
    { upTo: Infinity, amount: 0 },
  ],
  married: [
    { upTo: 30000, amount: 8000 }, { upTo: 33000, amount: 7000 }, { upTo: 36000, amount: 6000 }, { upTo: 39000, amount: 5000 },
    { upTo: 42000, amount: 4000 }, { upTo: 45000, amount: 3000 }, { upTo: 48000, amount: 2000 }, { upTo: 51000, amount: 1000 },
    { upTo: Infinity, amount: 0 },
  ],
};

const LOW_MIDDLE_ELIGIBLE_AGI: Record<FilingStatus, number> = { single: 36667, married: 55000 };
const LOW_MIDDLE_SUBTRACT: Record<FilingStatus, number> = { single: 20000, married: 30000 };
const LOW_MIDDLE_RATE: Record<FilingStatus, number> = { single: .15, married: .10 };

function ageBlindExemption(input: HouseholdTaxInput, federalAgi: number) {
  const amount = AGE_BLIND_TABLE[input.filing].find(row => federalAgi <= row.upTo)!.amount;
  const eligible = input.people.filter(person => ageAtYearEnd(person.birthDate, input.year) >= 65 || person.blind).length;
  return amount * eligible;
}

function lowMiddleIncomeExemption(input: HouseholdTaxInput, federalAgi: number) {
  if (federalAgi > LOW_MIDDLE_ELIGIBLE_AGI[input.filing]) return 0;
  const reduction = Math.max(0, federalAgi - LOW_MIDDLE_SUBTRACT[input.filing]) * LOW_MIDDLE_RATE[input.filing];
  const perExemption = Math.max(0, 2500 - reduction);
  return perExemption * input.people.length;
}

export function newMexicoTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, federalStandardDeduction: number) {
  if (input.newMexicoContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted New Mexico planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported New Mexico projection year.");
  const ssResult = stateSocialSecurityInclusion({
    state: "nm", year: input.year, futurePolicy: input.year > 2026 ? "hold-2026-law" : undefined,
    filing: input.filing === "married" ? "married-joint" : "single", federalAgi,
    grossBenefits: input.income.filter(item => item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0),
    federallyTaxableBenefits: taxableBenefits,
  });
  const socialSecurityExemption = taxableBenefits - ssResult.taxableBenefits!;
  const ageBlind = ageBlindExemption(input, federalAgi);
  const lowMiddleIncome = lowMiddleIncomeExemption(input, federalAgi);
  const taxable = Math.max(0, federalAgi - federalStandardDeduction - socialSecurityExemption - ageBlind - lowMiddleIncome);
  const stateTax = sumBrackets(taxable, STATE_BRACKETS[input.filing]);
  return {
    stateTax, localTax: 0, socialSecurityExemption, ageBlindExemption: ageBlind, lowMiddleIncomeExemption: lowMiddleIncome,
    warning: "New Mexico pre-credit estimate: enacted 2025-and-after brackets (six brackets, 1.5% to 5.9%; not independently "
      + "confirmed from a fetched primary rate table this review), starting from federal AGI less the household's own "
      + "federal standard deduction (New Mexico's personal exemption remains at $0, matching the federal suspension). "
      + "Social Security is excluded per the income-tested exemption; a graduated age-65-or-blind exemption (up to $8,000 "
      + "per qualifying person) and a Low- and Middle-Income Tax Exemption (up to $2,500 per person, phased and "
      + "income-limited) are also applied. The armed forces retirement exemption, dependent deduction, medical care "
      + "expense exemption and net capital gains deduction are not modeled. New Mexico has no local income tax. Only "
      + "single and married-filing-jointly are supported. New Mexico parameters are not inflation-indexed in this model. "
      + "Future legislation is not predicted. Not a tax return.",
  };
}
