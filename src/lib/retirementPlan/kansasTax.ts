import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Kansas resident annual settlement.
 *
 * Verified against the Kansas Department of Revenue's own 2025 Individual
 * Income Tax Booklet (ip25.pdf, rev. 9-26-25): the two-bracket schedule
 * (5.2% up to $23,000 single/$46,000 married filing jointly, 5.58% above,
 * confirmed by reconciling the booklet's Tax Computation Worksheet
 * subtraction constants -- $87 single/$175 married -- against the
 * threshold times the rate spread), the standard deduction ($3,605
 * single/$8,240 married, plus $850 per condition -- 65+ or blind -- for
 * single filers and $700 per condition for married filers), and the
 * consolidated exemption allowance ($9,160 single/$18,320 married).
 * https://www.ksrevenue.gov/pdf/ip25.pdf (2025 booklet; 2026 figures not
 * yet published, so 2025's are held here).
 *
 * Social Security is fully exempt for all filers regardless of income
 * (line A10 of Schedule S: only the federally taxable amount is
 * subtracted, since a benefit not subject to federal tax was never in
 * federal AGI to begin with). Retirement benefits specifically exempt
 * from Kansas income tax (line A14) cover KPERS, the state's other named
 * government retirement systems, and federal civil service/military
 * retirement; this planner maps that to any pension income with a
 * federal-government, other-government or ny-government pensionType.
 * A private or unspecified pensionType, and this planner's aggregate
 * 401(k)/IRA/annuity distribution figure, are fully taxable in Kansas --
 * neither qualifies for the "specifically exempt" retirement-benefit
 * subtraction. Itemized deductions and credits are excluded.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 3605, married: 8240 };
const STANDARD_DEDUCTION_STEP: Record<FilingStatus, number> = { single: 850, married: 700 };
const EXEMPTION: Record<FilingStatus, number> = { single: 9160, married: 18320 };
const BRACKET_THRESHOLD: Record<FilingStatus, number> = { single: 23000, married: 46000 };
const LOW_RATE = .052;
const HIGH_RATE = .0558;

function isExemptPension(pensionType: HouseholdTaxInput["income"][number]["pensionType"]) {
  return pensionType === "federal-government" || pensionType === "other-government" || pensionType === "ny-government";
}

export function kansasTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.kansasContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Kansas planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Kansas projection year.");
  const exemptPension = input.income.filter(item => item.kind === "pension" && isExemptPension(item.pensionType)).reduce((sum, item) => sum + item.amount, 0);
  const ksAgi = Math.max(0, federalAgi - taxableBenefits - exemptPension);
  let standardDeduction = STANDARD_DEDUCTION[input.filing];
  for (const person of input.people) standardDeduction += ((ageAtYearEnd(person.birthDate, input.year) >= 65 ? 1 : 0) + (person.blind ? 1 : 0)) * STANDARD_DEDUCTION_STEP[input.filing];
  const taxable = Math.max(0, ksAgi - standardDeduction - EXEMPTION[input.filing]);
  const threshold = BRACKET_THRESHOLD[input.filing];
  const stateTax = Math.min(taxable, threshold) * LOW_RATE + Math.max(0, taxable - threshold) * HIGH_RATE;
  return {
    stateTax, localTax: 0, ksAgi, standardDeduction,
    warning: "Kansas pre-credit estimate using the enacted graduated schedule (5.2% to $23,000 single/$46,000 married, "
      + "5.58% above) applied after the Kansas standard deduction ($3,605 single/$8,240 married, plus $850 per condition "
      + "-- 65 or older or blind -- for single filers and $700 per condition for married filers) and the consolidated "
      + "exemption allowance ($9,160 single/$18,320 married), not a prediction of future legislation. Social Security is "
      + "fully exempt. Income entered as annual pension with a federal-government, other-government or ny-government "
      + "pensionType is treated as a specifically-exempt retirement benefit and fully excluded; a private or unspecified "
      + "pension, and this planner's aggregate 401(k)/IRA/annuity distribution figure, remain fully taxable. Only single "
      + "and married-filing-jointly are supported. Itemized deductions and credits are excluded.",
  };
}
