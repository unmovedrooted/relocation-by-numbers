import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified West Virginia resident annual settlement.
 *
 * Verified against the West Virginia Tax Division's 2025 Personal Income
 * Tax Forms & Instructions booklet and its own "2026 Income Tax Rate Cut"
 * page: Senate Bill 392 (2026) cuts every 2025 bracket rate by 5% for tax
 * year 2026, keeping the same dollar thresholds, and -- unlike most
 * states -- West Virginia's Rate Schedule I brackets are identical for
 * single, head of household and married filing jointly; only married
 * filing separately uses halved thresholds, which this planner does not
 * support. https://tax.wv.gov/Individuals/Pages/PersonalIncomeTaxReductionBill.aspx
 * https://tax.wv.gov/Documents/PIT/2025/it140.PersonalIncomeTaxFormsAndInstructions.2025.pdf
 *
 * West Virginia has no standard deduction; taxable income is federal AGI
 * plus/minus Schedule M modifications, less a $2,000 personal exemption
 * per exemption claimed (self and spouse; this planner has no dependents).
 *
 * Social Security is excluded in full when federal AGI does not exceed
 * $50,000 single/$100,000 married filing jointly; above that threshold,
 * the enacted 2025 phase-in excludes 65% (not a prediction of West
 * Virginia's further scheduled increase toward full exemption). The
 * modification for West Virginia Teachers' Retirement, West Virginia
 * Public Employees' Retirement and Federal Retirement is combined and
 * capped at $2,000 per owner; this planner maps that to any pension
 * income with a federal-government, other-government or ny-government
 * pensionType. West Virginia's separate, uncapped exemptions for state
 * or local police/deputy sheriff/firefighter retirement, federal law
 * enforcement retirement and military retirement are not modeled, since
 * this planner cannot distinguish those systems from other government
 * pensions, understating the exclusion for such a retiree. A private or
 * unspecified pensionType, and this planner's aggregate 401(k)/IRA/
 * annuity distribution figure, are fully taxable.
 *
 * An owner who is 65 or older by year end may claim a further deduction
 * of up to $8,000 of income not already excluded above (this planner
 * counts that owner's own wages, non-government pension income and a
 * share of the aggregate 401(k)/IRA/annuity distribution figure), net of
 * that owner's own Social Security and government-pension exclusions
 * already claimed; interest, dividends and capital gains are not
 * attributed per owner in this planner and are excluded from that base,
 * understating the deduction for a household with such income. West
 * Virginia's disability-based alternative to the age-65 deduction, and
 * its Family Tax Credit and property-tax credits, are not modeled.
 */

const BRACKET_CEILINGS = [10000, 25000, 40000, 60000, Infinity];
const BRACKET_RATES = [.0211, .0281, .0316, .0422, .0458];
const PERSONAL_EXEMPTION_PER_PERSON = 2000;
const GOVERNMENT_PENSION_CAP = 2000;
const SENIOR_DEDUCTION_CAP = 8000;
const SS_FULL_EXEMPTION_THRESHOLD_SINGLE = 50000;
const SS_FULL_EXEMPTION_THRESHOLD_MARRIED = 100000;
const SS_PARTIAL_EXEMPTION_RATE = .65;

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

function isGovernmentPension(pensionType: HouseholdTaxInput["income"][number]["pensionType"]) {
  return pensionType === "federal-government" || pensionType === "other-government" || pensionType === "ny-government";
}

export function westVirginiaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.westVirginiaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted West Virginia planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported West Virginia projection year.");
  const ssThreshold = input.filing === "married" ? SS_FULL_EXEMPTION_THRESHOLD_MARRIED : SS_FULL_EXEMPTION_THRESHOLD_SINGLE;
  const ssExemptionRate = federalAgi <= ssThreshold ? 1 : SS_PARTIAL_EXEMPTION_RATE;
  const ssExemption = taxableBenefits * ssExemptionRate;
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  let governmentPensionExclusion = 0;
  let seniorDeduction = 0;
  for (const person of input.people) {
    const ownIncome = input.income.filter(item => item.ownerId === person.id);
    const ownGovernmentPension = ownIncome.filter(item => item.kind === "pension" && isGovernmentPension(item.pensionType)).reduce((sum, item) => sum + item.amount, 0);
    const ownGovernmentPensionExcluded = Math.min(GOVERNMENT_PENSION_CAP, ownGovernmentPension);
    governmentPensionExclusion += ownGovernmentPensionExcluded;
    if (ageAtYearEnd(person.birthDate, input.year) >= 65) {
      const ownWages = ownIncome.filter(item => item.kind === "wages").reduce((sum, item) => sum + item.amount, 0);
      const ownPrivatePension = ownIncome.filter(item => item.kind === "pension" && !isGovernmentPension(item.pensionType)).reduce((sum, item) => sum + item.amount, 0);
      const ownSocialSecurity = ownIncome.filter(item => item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0);
      const ownOtherIncome = ownWages + ownPrivatePension + perOwnerOrdinary;
      const ownExcludedSoFar = ownSocialSecurity * ssExemptionRate + ownGovernmentPensionExcluded;
      seniorDeduction += Math.max(0, Math.min(SENIOR_DEDUCTION_CAP, ownOtherIncome) - ownExcludedSoFar);
    }
  }
  const wvAgi = Math.max(0, federalAgi - ssExemption - governmentPensionExclusion - seniorDeduction);
  const exemptionAllowance = PERSONAL_EXEMPTION_PER_PERSON * input.people.length;
  const taxable = Math.max(0, wvAgi - exemptionAllowance);
  const stateTax = marginal(taxable, BRACKET_CEILINGS, BRACKET_RATES);
  return {
    stateTax, localTax: 0, wvAgi, governmentPensionExclusion, seniorDeduction,
    warning: "West Virginia pre-credit estimate using the enacted 2026 rate schedule (2.11%/2.81%/3.16%/4.22%/4.58% at "
      + "$10,000/$25,000/$40,000/$60,000, the same brackets for every supported filing status) applied after a $2,000 "
      + "personal exemption per person; West Virginia has no standard deduction. Social Security is fully excluded when "
      + "federal AGI does not exceed $50,000 single/$100,000 married filing jointly, and 65% excluded above that "
      + "threshold (West Virginia's own enacted, but not yet finalized for 2026, phase-in). Income entered as annual "
      + "pension with a federal-government, other-government or ny-government pensionType is excluded up to $2,000 per "
      + "owner, but West Virginia's separate, uncapped exemptions for police, firefighter, federal law enforcement and "
      + "military retirement systems are not modeled. An owner 65 or older further excludes up to $8,000 of that owner's "
      + "own wages, private pension income and a share of this planner's aggregate 401(k)/IRA/annuity distribution "
      + "figure, net of that owner's own Social Security and government-pension exclusions; investment income is not "
      + "attributed per owner and is excluded from that base. West Virginia's disability deduction, Family Tax Credit "
      + "and property-tax credits are not modeled. Only single and married-filing-jointly are supported.",
  };
}
