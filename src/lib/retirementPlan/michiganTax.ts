import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/**
 * Restricted, verified Michigan resident annual settlement.
 *
 * Verified against the Michigan Department of Treasury's own "Retirement
 * and Pension Benefits" guidance page, which confirms that the Lowering
 * MI Costs Plan's (Public Act 4 of 2023) phase-in of the retirement and
 * pension subtraction reaches 100% for tax year 2026 and beyond, with no
 * birth-year restriction -- unlike the tiered rules that applied for
 * 2023-2025. https://www.michigan.gov/taxes/iit/tax-guidance/tax-situations/retirement-and-pension-benefits
 * The flat 4.25% tax rate is Michigan's ongoing statutory rate (the
 * 2023-only 4.05% reduction expired after one year). The subtraction cap
 * itself -- the annually-inflation-adjusted "private pension limit,"
 * reported by secondary sources at $67,610 single/married filing
 * separately and $135,220 married filing jointly for 2026 -- is held here
 * pending Michigan's own official publication of the exact 2026 figure.
 * The $5,600 per-exemption personal exemption for 2026 is likewise a
 * widely-reported, not yet independently primary-source-confirmed,
 * figure.
 *
 * Social Security is fully exempt at any income level. The retirement
 * and pension subtraction covers "most income reported on Form 1099-R,"
 * explicitly including defined benefit pensions, IRA distributions and
 * most defined-contribution-plan payments, so this planner applies the
 * combined household cap to pension income of any pensionType plus this
 * planner's aggregate 401(k)/IRA/annuity distribution figure, with no
 * age restriction. Michigan's separate, income-tested standard-deduction
 * alternative for a taxpayer 67 or older (available instead of the
 * retirement subtraction) is not modeled, since this planner cannot
 * determine which of the two options is more favorable for a given
 * household without also modeling that alternative in full.
 */

const FLAT_RATE = .0425;
const RETIREMENT_SUBTRACTION_CAP: Record<FilingStatus, number> = { single: 67610, married: 135220 };
const PERSONAL_EXEMPTION_PER_PERSON = 5600;

export function michiganTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.michiganContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Michigan planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Michigan projection year.");
  const pensionIncome = input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
  const retirementSubtraction = Math.min(RETIREMENT_SUBTRACTION_CAP[input.filing], pensionIncome + retirementOrdinary);
  const personalExemption = PERSONAL_EXEMPTION_PER_PERSON * input.people.length;
  const miAgi = Math.max(0, federalAgi - taxableBenefits - retirementSubtraction);
  const taxable = Math.max(0, miAgi - personalExemption);
  const stateTax = taxable * FLAT_RATE;
  return {
    stateTax, localTax: 0, miAgi, retirementSubtraction,
    warning: "Michigan pre-credit estimate using the enacted, ongoing flat 4.25% rate applied after a $5,600 personal "
      + "exemption per person (a widely-reported, not independently primary-source-confirmed, 2026 figure). Social "
      + "Security is fully exempt at any income level. Pension income of any pensionType, plus this planner's "
      + "aggregate 401(k)/IRA/annuity distribution figure, are excluded up to a combined household cap of $67,610 "
      + "single/married filing separately or $135,220 married filing jointly (2026's fully phased-in, age-independent "
      + "retirement and pension subtraction; the exact inflation-adjusted cap is likewise not independently "
      + "primary-source-confirmed for 2026). Michigan's separate, income-tested standard-deduction alternative for a "
      + "taxpayer 67 or older is not modeled. Only single and married-filing-jointly are supported. Itemized "
      + "deductions and credits are excluded.",
  };
}
