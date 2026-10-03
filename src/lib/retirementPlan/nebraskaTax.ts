import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Nebraska resident annual settlement.
 *
 * Tax year 2026, read from the Nebraska Department of Revenue's draft 2026
 * Form 1040N and 2026 Nebraska Tax Table (both "DRAFT AS OF 8/17/2026",
 * the latest published): standard deduction $8,850 single/married filing
 * separately, $17,700 married filing jointly/qualifying surviving spouse
 * (Form 1040N line 6), $176 personal exemption credit per exemption (line
 * 18), and the schedule 2.46% / 3.51% / 4.55% with breakpoints $4,130 and
 * $24,760 single, $8,260 and $49,520 married filing jointly. The Tax
 * Table's own worksheet (tax of $3,333 single and $3,032 married at
 * $79,860, then 4.55%) reconciles exactly to those breakpoints. The 4.55%
 * top rate applies to both of the former third and fourth brackets in 2026
 * (Neb. Rev. Stat. 77-2715.03).
 * https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/drafts/2026_tax_tables.pdf
 *
 * Tax year 2027 and later (enacted by LB 754 and now published), read from
 * the draft 2027 Form 1040N-ES (Rev. 9-2026, "DRAFT AS OF 9/25/2026"):
 * standard deduction $9,100 single/$18,200 married filing jointly, $181
 * personal exemption credit, the additional 65-or-older/blind deduction
 * ($2,150 per condition unmarried, $1,750 per condition married), and the
 * schedule 2.46% / 3.51% / 3.99% with breakpoints $4,270 and $25,570
 * single, $8,520 and $51,150 married filing jointly (third and fourth
 * brackets both 3.99% under 77-2715.03(2)(c)(v)). Nebraska indexes these
 * amounts annually; this planner holds the 2027 amounts for later years
 * rather than predicting the inflation adjustment.
 * https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/drafts/f_1040n-es.pdf
 *
 * The additional 65-or-older/blind deduction for tax year 2026 ($2,000
 * per condition single, $1,650 married) is the 2025 booklet figure: the
 * 2026 amount is not shown on the 2026 Form 1040N draft and is not yet
 * verified, so it is disclosed as a 2025 value.
 * https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_Individual_Income_Tax_Booklet.pdf
 *
 * Social Security is fully excluded from federal AGI for Nebraska
 * purposes for all filers, with no income threshold (Schedule I, line
 * 31). Nebraska's only broad retirement-income exclusions are for
 * military retirement benefits and Civil Service Retirement System
 * (CSRS, but not FERS) federal annuities; this planner cannot identify
 * either a modeled pension as military or distinguish CSRS from FERS
 * federal civil service benefits, so all pension income and this
 * planner's aggregate 401(k)/IRA/annuity distribution figure remain
 * fully taxable, understating the exclusion for such a retiree.
 */

interface NebraskaYearParameters {
  standardDeduction: Record<FilingStatus, number>;
  standardDeductionStep: Record<FilingStatus, number>;
  personalExemptionCredit: number;
  ceilings: Record<FilingStatus, number[]>;
  rates: number[];
}

const PARAMETERS_2026: NebraskaYearParameters = {
  standardDeduction: { single: 8850, married: 17700 },
  standardDeductionStep: { single: 2000, married: 1650 },
  personalExemptionCredit: 176,
  ceilings: { single: [4130, 24760, Infinity], married: [8260, 49520, Infinity] },
  rates: [.0246, .0351, .0455],
};
const PARAMETERS_2027: NebraskaYearParameters = {
  standardDeduction: { single: 9100, married: 18200 },
  standardDeductionStep: { single: 2150, married: 1750 },
  personalExemptionCredit: 181,
  ceilings: { single: [4270, 25570, Infinity], married: [8520, 51150, Infinity] },
  rates: [.0246, .0351, .0399],
};

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function nebraskaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.nebraskaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Nebraska planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Nebraska projection year.");
  const parameters = input.year >= 2027 ? PARAMETERS_2027 : PARAMETERS_2026;
  let standardDeduction = parameters.standardDeduction[input.filing];
  let personalCredit = 0;
  for (const person of input.people) {
    standardDeduction += ((ageAtYearEnd(person.birthDate, input.year) >= 65 ? 1 : 0) + (person.blind ? 1 : 0)) * parameters.standardDeductionStep[input.filing];
    personalCredit += parameters.personalExemptionCredit;
  }
  const neAgi = Math.max(0, federalAgi - taxableBenefits);
  const taxable = Math.max(0, neAgi - standardDeduction);
  const grossTax = marginal(taxable, parameters.ceilings[input.filing], parameters.rates);
  const stateTax = Math.max(0, grossTax - personalCredit);
  return {
    stateTax, localTax: 0, neAgi, standardDeduction, personalCredit,
    warning: "Nebraska pre-credit estimate using the Department of Revenue's published 2026 schedule (2.46%/3.51%/"
      + "4.55% at $4,130/$24,760 single, $8,260/$49,520 married filing jointly), standard deduction ($8,850 single/"
      + "$17,700 married) and $176 personal exemption credit per person; from 2027 the published 2027 schedule "
      + "(2.46%/3.51%/3.99% at $4,270/$25,570 single, $8,520/$51,150 married), standard deduction ($9,100/$18,200) "
      + "and $181 credit, held for later years without predicting Nebraska's annual inflation adjustment. The 2026 "
      + "additional deduction for age 65 or older or blind ($2,000 per condition single, $1,650 married) is the 2025 "
      + "value because the 2026 amount is not yet published; from 2027 it is $2,150/$1,750. Both schedules come from "
      + "draft Department of Revenue forms that may still change. Social Security is fully exempt; income entered as "
      + "annual pension and this planner's aggregate 401(k)/IRA/annuity distribution figure remain fully taxable, "
      + "since this planner cannot identify military retirement pay or distinguish CSRS from FERS federal civil "
      + "service annuities. Only single and married-filing-jointly are supported. Itemized deductions and other "
      + "credits are excluded.",
  };
}
