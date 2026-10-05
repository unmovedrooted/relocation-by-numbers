import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ownerRetirementIncome } from "./ownerRetirementIncome";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Louisiana resident annual settlement.
 *
 * Verified against the Louisiana Department of Revenue's own 2025 Form
 * IT-540 instructions (IT540i-WEB-2025.pdf): Act 11 of the 2024 Third
 * Extraordinary Legislative Session set a flat 3% tax rate and the
 * standard deduction at $12,500 single/married filing separate, $25,000
 * married filing jointly/head of household/qualifying surviving spouse
 * (2025 figures), replacing the prior
 * personal-exemption system entirely -- Louisiana no longer has a
 * personal exemption, and the former additional exemption for age 65 or
 * blindness was repealed effective December 31, 2024.
 * https://dam.ldr.la.gov/taxforms/IT540i-WEB-2025.pdf
 *
 * The standard deduction is inflation-indexed from 2026. The Department of
 * Revenue's 2026 withholding publication R-1306 (1/26) states the 2026
 * standard deduction as $12,875 single/married filing separate and
 * $25,750 married filing jointly/qualifying surviving spouse/head of
 * household, which this planner uses for 2026 and holds for later years
 * rather than predicting the annual adjustment. The flat income tax rate
 * itself is the enacted 3% (R-1306's 3.09% is only a withholding rate).
 * https://dam.ldr.la.gov/taxforms/1306-1-26.pdf
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
 * federal-government or other-government pensionType; the exempt systems are federal ones and Louisiana's own,
 * so an ny-government pension (another state's system) is not exempt here and falls into the $12,000
 * exemption below, and an other-government pension is assumed to be a Louisiana system. A
 * separate Annual Retirement Income Exemption of up to $12,000 per
 * taxpayer 65 or older applies to any other taxable pension, annuity or
 * IRA distribution (code 06E) not otherwise exempt above; this planner
 * maps that to a private or unspecified pensionType and a share of this
 * planner's aggregate 401(k)/IRA/annuity distribution figure, for an
 * owner 65 or older only.
 */

const FLAT_RATE = .03;
const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 12875, married: 25750 };
const RETIREMENT_EXEMPTION_CAP = 12000;

function isExemptSystemPension(pensionType: HouseholdTaxInput["income"][number]["pensionType"]) {
  return pensionType === "federal-government" || pensionType === "other-government";
}

export function louisianaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.louisianaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Louisiana planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Louisiana projection year.");
  const ownerRetirement = ownerRetirementIncome(input, retirementOrdinary, "Louisiana");
  const exemptSystemPension = input.income.filter(item => item.kind === "pension" && isExemptSystemPension(item.pensionType)).reduce((sum, item) => sum + item.amount, 0);
  let retirementExemption = 0;
  for (const person of input.people) {
    if (ageAtYearEnd(person.birthDate, input.year) < 65) continue;
    const ownOtherPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension" && !isExemptSystemPension(item.pensionType)).reduce((sum, item) => sum + item.amount, 0);
    retirementExemption += Math.min(RETIREMENT_EXEMPTION_CAP, ownOtherPension + ownerRetirement.get(person.id)!);
  }
  const laAgi = Math.max(0, federalAgi - taxableBenefits - exemptSystemPension - retirementExemption);
  const taxable = Math.max(0, laAgi - STANDARD_DEDUCTION[input.filing]);
  const stateTax = taxable * FLAT_RATE;
  return {
    stateTax, localTax: 0, laAgi, retirementExemption,
    warning: "Louisiana pre-credit estimate using the enacted flat 3% rate applied after the published 2026 "
      + "standard deduction ($12,875 single/$25,750 married filing jointly, held for later years without predicting "
      + "Louisiana's annual inflation adjustment), not a prediction of future legislation; Louisiana has no personal exemption. Social Security is "
      + "fully exempt. Income entered as annual pension with a federal-government or other-government "
      + "pensionType is treated as an exempt state, local or federal retirement system benefit and fully excluded at "
      + "any age. " + "A New York government pension is another state's system, so it is not an exempt Louisiana system and falls under the $12,000 exemption for owners 65 or older; an other-government pension is assumed to be a Louisiana system." + " A private or unspecified pension, and that owner's own attributed 401(k)/IRA/annuity "
      + "distributions, are excluded up to $12,000 per owner 65 or older only. Only single and "
      + "married-filing-jointly are supported. Itemized deductions and credits are excluded.",
  };
}
