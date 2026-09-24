import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { stateSocialSecurityInclusion } from "./stateSocialSecurityCoverage";

/** Restricted, step-exemption, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-24 against:
 * - Connecticut DRS, Informational Publication 2026(7), "Is My Connecticut
 *   Withholding Correct?": the single/MFS bracket schedule (Table B,
 *   Withholding Code A/D/F: 2%/4.5%/5.5%/6%/6.5%/6.9%/6.99% at $10k/$50k/
 *   $100k/$200k/$250k/$500k), the single personal-exemption step table
 *   (Table A, Withholding Code F: $15,000 at $0-$30,000 federal AGI, phasing
 *   down $1,000 per $1,000 to $0 at $44,001+), and the Pension and Annuity
 *   Phase-Out Table (100% below $75,000 single/$100,000 married federal
 *   AGI, phasing to 0% by $100,000/$150,000). The married-filing-jointly
 *   bracket schedule is NOT read from this withholding-focused document
 *   (its own "Code B"/"Code C" tables are withholding-election variants,
 *   not directly the return's MFJ schedule); it is instead the well-
 *   corroborated, exact doubling of the single thresholds at the same
 *   rates, consistent with CT's long-standing bracket structure. The
 *   married personal-exemption step table (Withholding Code C: $24,000 at
 *   $0-$48,000, phasing to $0 by $71,001) is read from the same document's
 *   Table A and is a reasonable but not independently return-confirmed
 *   match for the actual joint-filer exemption schedule.
 *   https://portal.ct.gov/-/media/drs/publications/pubsip/2026/ip-2026-7.pdf
 * - This planner reuses the already-verified stateSocialSecurityInclusion
 *   Connecticut branch for the Social Security Benefit Adjustment: full
 *   exemption below $75,000 (single/MFS) or $100,000 (married/HOH/QSS)
 *   federal AGI; above it, 25% of the lesser of gross benefits or federal
 *   Publication 505 Worksheet 2-2 Line 10, subtracted from federally
 *   taxable benefits. Worksheet 2-2 Line 10 itself is not read from a
 *   fetched primary document; this planner approximates it as federal AGI
 *   less federally taxable Social Security, plus tax-exempt interest --
 *   the standard "all other income" figure every such federal worksheet
 *   uses ahead of adding back half of Social Security.
 *
 * Uses enacted law, not a prediction of future legislation. Connecticut has
 * no local income tax; localTax is always zero. The pension/annuity
 * subtraction phase-out is applied to income entered as "pension" plus this
 * planner's aggregate 401(k)/IRA/annuity distribution figure, both at the
 * full percentage; real law caps IRA distributions at 75% of that
 * percentage and excludes military retired pay, Railroad Retirement, and
 * Connecticut teachers' retirement pay, none of which this planner can
 * identify separately, so this overstates the subtraction for such income.
 * The exemption phase-out tests federal AGI, not Connecticut AGI. Only
 * single and married-filing-jointly are supported. No itemized deductions
 * or credits are modeled. Connecticut parameters are not inflation-indexed
 * in this model, matching the restricted New York, Maryland, Indiana, DC,
 * Illinois, New Jersey, Pennsylvania, Colorado, New Mexico, Minnesota and
 * Utah estimates' convention.
 */

const STATE_BRACKETS: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [
    { upTo: 10000, rate: .02 }, { upTo: 50000, rate: .045 }, { upTo: 100000, rate: .055 }, { upTo: 200000, rate: .06 },
    { upTo: 250000, rate: .065 }, { upTo: 500000, rate: .069 }, { upTo: Infinity, rate: .0699 },
  ],
  married: [
    { upTo: 20000, rate: .02 }, { upTo: 100000, rate: .045 }, { upTo: 200000, rate: .055 }, { upTo: 400000, rate: .06 },
    { upTo: 500000, rate: .065 }, { upTo: 1000000, rate: .069 }, { upTo: Infinity, rate: .0699 },
  ],
};

const EXEMPTION_TABLE: Record<FilingStatus, { upTo: number; amount: number }[]> = {
  single: [
    { upTo: 30000, amount: 15000 }, { upTo: 31000, amount: 14000 }, { upTo: 32000, amount: 13000 }, { upTo: 33000, amount: 12000 },
    { upTo: 34000, amount: 11000 }, { upTo: 35000, amount: 10000 }, { upTo: 36000, amount: 9000 }, { upTo: 37000, amount: 8000 },
    { upTo: 38000, amount: 7000 }, { upTo: 39000, amount: 6000 }, { upTo: 40000, amount: 5000 }, { upTo: 41000, amount: 4000 },
    { upTo: 42000, amount: 3000 }, { upTo: 43000, amount: 2000 }, { upTo: 44000, amount: 1000 }, { upTo: Infinity, amount: 0 },
  ],
  married: [
    { upTo: 48000, amount: 24000 }, { upTo: 49000, amount: 23000 }, { upTo: 50000, amount: 22000 }, { upTo: 51000, amount: 21000 },
    { upTo: 52000, amount: 20000 }, { upTo: 53000, amount: 19000 }, { upTo: 54000, amount: 18000 }, { upTo: 55000, amount: 17000 },
    { upTo: 56000, amount: 16000 }, { upTo: 57000, amount: 15000 }, { upTo: 58000, amount: 14000 }, { upTo: 59000, amount: 13000 },
    { upTo: 60000, amount: 12000 }, { upTo: 61000, amount: 11000 }, { upTo: 62000, amount: 10000 }, { upTo: 63000, amount: 9000 },
    { upTo: 64000, amount: 8000 }, { upTo: 65000, amount: 7000 }, { upTo: 66000, amount: 6000 }, { upTo: 67000, amount: 5000 },
    { upTo: 68000, amount: 4000 }, { upTo: 69000, amount: 3000 }, { upTo: 70000, amount: 2000 }, { upTo: 71000, amount: 1000 },
    { upTo: Infinity, amount: 0 },
  ],
};

const PENSION_PHASE_OUT: Record<FilingStatus, { upTo: number; fraction: number }[]> = {
  single: [
    { upTo: 74999, fraction: 1 }, { upTo: 77499, fraction: .85 }, { upTo: 79999, fraction: .70 }, { upTo: 82499, fraction: .55 },
    { upTo: 84999, fraction: .40 }, { upTo: 87499, fraction: .25 }, { upTo: 89999, fraction: .10 }, { upTo: 94999, fraction: .05 },
    { upTo: 99999, fraction: .025 }, { upTo: Infinity, fraction: 0 },
  ],
  married: [
    { upTo: 99999, fraction: 1 }, { upTo: 104999, fraction: .85 }, { upTo: 109999, fraction: .70 }, { upTo: 114999, fraction: .55 },
    { upTo: 119999, fraction: .40 }, { upTo: 124999, fraction: .25 }, { upTo: 129999, fraction: .10 }, { upTo: 139999, fraction: .05 },
    { upTo: 149999, fraction: .025 }, { upTo: Infinity, fraction: 0 },
  ],
};

function personalExemption(input: HouseholdTaxInput, federalAgi: number) {
  return EXEMPTION_TABLE[input.filing].find(row => federalAgi <= row.upTo)!.amount;
}

function pensionSubtraction(input: HouseholdTaxInput, federalAgi: number, retirementOrdinary: number) {
  const fraction = PENSION_PHASE_OUT[input.filing].find(row => federalAgi <= row.upTo)!.fraction;
  const pensionIncome = input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
  return (pensionIncome + retirementOrdinary) * fraction;
}

export function connecticutTax(
  input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, taxExemptInterest: number, retirementOrdinary: number,
) {
  if (input.connecticutContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Connecticut planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Connecticut projection year.");
  const ssResult = stateSocialSecurityInclusion({
    state: "ct", year: input.year, futurePolicy: input.year > 2026 ? "hold-2026-law" : undefined,
    filing: input.filing === "married" ? "married-joint" : "single", federalAgi,
    grossBenefits: input.income.filter(item => item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0),
    federallyTaxableBenefits: taxableBenefits,
    ctFederalWorksheetLine10: federalAgi - taxableBenefits + taxExemptInterest,
  });
  const socialSecuritySubtraction = taxableBenefits - ssResult.taxableBenefits!;
  const pension = pensionSubtraction(input, federalAgi, retirementOrdinary);
  const exemption = personalExemption(input, federalAgi);
  const taxable = Math.max(0, federalAgi - socialSecuritySubtraction - pension - exemption);
  const stateTax = sumBrackets(taxable, STATE_BRACKETS[input.filing]);
  return {
    stateTax, localTax: 0, socialSecuritySubtraction, pensionSubtraction: pension, personalExemption: exemption,
    warning: "Connecticut pre-credit estimate: enacted brackets (reviewed 2026-09-24; the married schedule is the "
      + "well-corroborated doubling of the single thresholds, not independently read from a primary return-instructions "
      + "table), a step-down personal exemption ($15,000 single/$24,000 married, phased out by $44,001/$71,001 federal "
      + "AGI), and the Social Security Benefit Adjustment (full exclusion below $75,000/$100,000 federal AGI, else a "
      + "25%-of-worksheet-amount formula whose federal worksheet input this planner approximates rather than reads "
      + "directly). Pension/annuity income (entered as annual pension) and this planner's combined 401(k)/IRA/annuity "
      + "distribution figure share a single phase-out by federal AGI (100% below $75,000/$100,000, 0% at $100,000/"
      + "$150,000); real law caps IRA distributions at 75% of that percentage and excludes military, Railroad Retirement "
      + "and CT teachers' pay, none of which this planner can identify, so the subtraction is overstated for such income. "
      + "Connecticut has no local income tax. Only single and married-filing-jointly are supported. Itemized deductions "
      + "and credits are excluded. Connecticut parameters are not inflation-indexed in this model. Future legislation is "
      + "not predicted. Not a tax return.",
  };
}
