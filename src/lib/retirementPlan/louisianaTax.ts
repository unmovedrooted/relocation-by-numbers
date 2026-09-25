import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Louisiana resident annual settlement.
 *
 * Verified against the Louisiana Department of Revenue's own 2025 Form
 * IT-540 instructions (IT540i-WEB-2025.pdf): Act 11 of the 2024 Third
 * Extraordinary Legislative Session set a flat 3% tax rate and the
 * standard deduction at $12,500 single/married filing separate, $25,000
 * married filing jointly/head of household/qualifying surviving spouse
 * (2025 figures, not yet inflation-indexed for 2026 as of this publication
 * cycle, held here pending Louisiana's 2026 update), replacing the prior
 * personal-exemption system entirely -- Louisiana no longer has a
 * personal exemption, and the former additional exemption for age 65 or
 * blindness was repealed effective December 31, 2024.
 * https://dam.ldr.la.gov/taxforms/IT540i-WEB-2025.pdf
 *
 * Social Security included in federal AGI is fully subtracted (code
 * 07E). Retirement benefits from the Louisiana State Employees'
 * Retirement System, the Louisiana State Teachers' Retirement System,
 * a Federal Retirement System (including military survivor benefits),
 * and other specifically-exempted state and local retirement systems
 * (school employees, State Police, municipal/parish employees and
 * police, Assessors, Clerks of Court, District Attorneys, Registrars of
 * Voters, Sheriffs, and others) are fully exempt regardless of age (codes
 * 02E-05E); this planner maps that to any pension income with a
 * federal-government, other-government or ny-government pensionType. A
 * separate Annual Retirement Income Exemption of up to $12,000 per
 * taxpayer 65 or older applies to any other taxable pension, annuity or
 * IRA distribution (code 06E) not otherwise exempt above; this planner
 * maps that to a private or unspecified pensionType and a share of this
 * planner's aggregate 401(k)/IRA/annuity distribution figure, for an
 * owner 65 or older only.
 */

const FLAT_RATE = .03;
const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 12500, married: 25000 };
const RETIREMENT_EXEMPTION_CAP = 12000;

function isExemptSystemPension(pensionType: HouseholdTaxInput["income"][number]["pensionType"]) {
  return pensionType === "federal-government" || pensionType === "other-government" || pensionType === "ny-government";
}

export function louisianaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.louisianaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Louisiana planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Louisiana projection year.");
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  const exemptSystemPension = input.income.filter(item => item.kind === "pension" && isExemptSystemPension(item.pensionType)).reduce((sum, item) => sum + item.amount, 0);
  let retirementExemption = 0;
  for (const person of input.people) {
    if (ageAtYearEnd(person.birthDate, input.year) < 65) continue;
    const ownOtherPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension" && !isExemptSystemPension(item.pensionType)).reduce((sum, item) => sum + item.amount, 0);
    retirementExemption += Math.min(RETIREMENT_EXEMPTION_CAP, ownOtherPension + perOwnerOrdinary);
  }
  const laAgi = Math.max(0, federalAgi - taxableBenefits - exemptSystemPension - retirementExemption);
  const taxable = Math.max(0, laAgi - STANDARD_DEDUCTION[input.filing]);
  const stateTax = taxable * FLAT_RATE;
  return {
    stateTax, localTax: 0, laAgi, retirementExemption,
    warning: "Louisiana pre-credit estimate using the enacted flat 3% rate applied after the latest published (2025) "
      + "standard deduction ($12,500 single/$25,000 married filing jointly, held pending Louisiana's 2026 inflation "
      + "adjustment), not a prediction of future legislation; Louisiana has no personal exemption. Social Security is "
      + "fully exempt. Income entered as annual pension with a federal-government, other-government or ny-government "
      + "pensionType is treated as an exempt state, local or federal retirement system benefit and fully excluded at "
      + "any age; a private or unspecified pension, and a share of this planner's aggregate 401(k)/IRA/annuity "
      + "distribution figure, are excluded up to $12,000 per owner 65 or older only. Only single and "
      + "married-filing-jointly are supported. Itemized deductions and credits are excluded.",
  };
}
