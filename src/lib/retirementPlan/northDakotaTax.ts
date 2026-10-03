import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/**
 * Restricted, verified North Dakota resident annual settlement.
 *
 * Verified against the North Dakota Office of State Tax Commissioner's own
 * 2026 Form ND-1ES tax rate schedules (SFN 28709) and the 2025 Form ND-1 instructions booklet: North Dakota starts from FEDERAL
 * TAXABLE INCOME (not federal AGI), so no separate state standard deduction
 * or personal exemption applies -- it's already embedded in the federal
 * figure this planner computes. The enacted three-tier schedule (0%/1.95%/
 * 2.5% at $49,575/$250,400 single, $82,800/
 * $304,850 married filing jointly) is North Dakota's current, ongoing rate,
 * not a one-year cut.
 * https://www.tax.nd.gov/sites/www/files/documents/forms/software-developer/individual-income-forms/28709-form-nd-1es-2026%20final.pdf
 *
 * Social Security and Tier 1 Railroad Retirement Board benefits included in
 * federal taxable income are fully subtracted (Form ND-1, line 15). North
 * Dakota also excludes 40% of net long-term capital gain (line 6) and,
 * separately, 40% of qualified dividend income (line 13); this planner
 * applies the common 40% rate to qualified dividends plus eligible net
 * long-term gain, before the federal taxable-income cap. The latter is
 * max(0, min(net long-term gain, net total gain)), matching the worksheet.
 * The 2026 indexed brackets are held constant for later years, not forecast.
 * https://www.tax.nd.gov/sites/www/files/documents/forms/software-developer/individual-income-forms/2025-iit-instructions.pdf
 * North Dakota's separate military
 * pay exclusion, licensed peace officer retirement benefit exclusion,
 * Native American exempt income, ND College SAVE deduction and Marriage
 * Penalty Credit are not modeled, since this planner cannot identify any of
 * them.
 */

const BRACKET_CEILINGS: Record<FilingStatus, number[]> = {
  single: [49575, 250400, Infinity],
  married: [82800, 304850, Infinity],
};
const BRACKET_RATES = [0, .0195, .025];
const PREFERENTIAL_EXCLUSION_RATE = .4;

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function northDakotaTax(input: HouseholdTaxInput, taxableIncome: number, taxableBenefits: number, eligibleInvestmentIncome: number) {
  if (input.northDakotaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted North Dakota planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported North Dakota projection year.");
  const preferentialExclusion = eligibleInvestmentIncome * PREFERENTIAL_EXCLUSION_RATE;
  const ndTaxableIncome = Math.max(0, taxableIncome - taxableBenefits - preferentialExclusion);
  const stateTax = marginal(ndTaxableIncome, BRACKET_CEILINGS[input.filing], BRACKET_RATES);
  return {
    stateTax, localTax: 0, ndTaxableIncome, preferentialExclusion,
    warning: "North Dakota pre-credit estimate using the enacted, ongoing three-tier schedule (0%/1.95%/2.5% at "
      + "$49,575/$250,400 single, $82,800/$304,850 married filing jointly) applied to federal taxable income directly, "
      + "since North Dakota has no separate state standard deduction or personal exemption. Social Security and Tier 1 "
      + "Railroad Retirement Board benefits are fully exempt. The 40% exclusions use eligible net long-term gains "
      + "and qualified dividends before the federal taxable-income cap. State brackets use the published 2026 "
      + "indexed amounts and are held constant for later years, not forecast. North Dakota's military pay exclusion, licensed peace officer "
      + "retirement exclusion, Native American exempt income, ND College SAVE deduction and Marriage Penalty Credit "
      + "are not modeled. Only single and married-filing-jointly are supported. Itemized deductions and other "
      + "credits are excluded.",
  };
}
