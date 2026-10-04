import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { cityIncomeTax, type CityIncomeBase } from "./cityIncomeTax";

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
 * 2023-only 4.05% reduction expired after one year). Michigan Treasury's 2026
 * Income Tax Withholding Guide (Form 446, Rev. 02-26, read 2026-10-04) states the
 * 2026 personal exemption is $5,900 and that qualifying private pension and
 * retirement benefits may be subtracted up to $67,610 single/married filing
 * separately or $135,220 married filing jointly. Earlier versions of this module
 * used $5,600 from a secondary source; the guide corrects it. Both amounts are
 * indexed and held at their 2026 values for later years.
 * https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/SUW/TY2026/446_Withholding-Guide_2026.pdf
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
 *
 * City income taxes: Detroit and Grand Rapids residents pay a city tax (see cityIncomeTax.ts), modeled when
 * the city is selected; no other Michigan city is modeled.
 */

const FLAT_RATE = .0425;
const RETIREMENT_SUBTRACTION_CAP: Record<FilingStatus, number> = { single: 67610, married: 135220 };
const PERSONAL_EXEMPTION_PER_PERSON = 5900;

export function michiganTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number, cityBase?: CityIncomeBase) {
  if (input.michiganContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Michigan planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Michigan projection year.");
  const pensionIncome = input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
  const retirementSubtraction = Math.min(RETIREMENT_SUBTRACTION_CAP[input.filing], pensionIncome + retirementOrdinary);
  const personalExemption = PERSONAL_EXEMPTION_PER_PERSON * input.people.length;
  const miAgi = Math.max(0, federalAgi - taxableBenefits - retirementSubtraction);
  const taxable = Math.max(0, miAgi - personalExemption);
  const stateTax = taxable * FLAT_RATE;
  return {
    stateTax, localTax: cityBase ? cityIncomeTax("mi", input.cityId ?? "", cityBase, input.people.length) : 0, miAgi, retirementSubtraction,
    warning: "Michigan pre-credit estimate using the enacted, ongoing flat 4.25% rate applied after a $5,900 personal "
      + "exemption per person (Michigan Treasury's 2026 figure, held for later years). Social "
      + "Security is fully exempt at any income level. Pension income of any pensionType, plus this planner's "
      + "aggregate 401(k)/IRA/annuity distribution figure, are excluded up to a combined household cap of $67,610 "
      + "single/married filing separately or $135,220 married filing jointly (2026's fully phased-in, age-independent "
      + "retirement and pension subtraction, from Michigan Treasury's 2026 withholding guide and held for later years). Michigan's separate, income-tested standard-deduction alternative for a "
      + "taxpayer 67 or older is not modeled. Michigan city income tax is modeled for Detroit (2.4% resident) and Grand Rapids (1.5% resident), each with $600 exemptions, when one is selected: it taxes a full-year resident's wages, interest, dividends, capital gains and early retirement distributions and exempts Social Security and normal pension and retirement distributions; interest on U.S. obligations, which both cities exempt, is not tracked, and no other Michigan city is modeled (Ann Arbor has no city income tax). Only single and married-filing-jointly are supported. Itemized "
      + "deductions and credits are excluded.",
  };
}
