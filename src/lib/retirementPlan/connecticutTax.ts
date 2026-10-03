import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { retirementIncomeFromSources } from "./ownerRetirementIncome";
import { stateSocialSecurityInclusion } from "./stateSocialSecurityCoverage";

/** Restricted planning estimate (step exemption, 2% add-back, recapture and
 * personal tax credit; property-tax and other credits excluded).
 * Tables A-E were read from the 2025 Form CT-1040 return instructions (Rev.
 * 12/25), https://portal.ct.gov/DRS/Individuals/Resident-Income-Tax/Tax-Information,
 * and the single/married bracket schedule (Table B) from the same document. Rates and
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
 * planner's owner-attributed 401(k)/IRA/annuity distributions, both at the
 * same percentage (IRA distributions are 100% from tax year 2026); taxable
 * Roth IRA distributions are excluded. Real law also excludes military
 * retired pay, Railroad Retirement, and Connecticut teachers' retirement
 * pay, none of which this planner can identify separately, so this
 * overstates the subtraction for such income.
 * The exemption, 2% add-back, recapture and personal-tax-credit tables test
 * Connecticut AGI (federal AGI less the Social Security and pension
 * subtractions; additions such as non-Connecticut municipal interest are not
 * modeled). Only
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

type StepTable = { upTo: number; value: number }[];
const range = (count: number, build: (index: number) => { upTo: number; value: number }) => Array.from({ length: count }, (_, index) => build(index));

// Tables C, D and E of the 2025 Form CT-1040 instructions (Tax Calculation Schedule, lines 5, 6 and 8), all keyed on Connecticut AGI.
const PHASE_OUT_ADD_BACK: Record<FilingStatus, StepTable> = {
  single: [{ upTo: 56500, value: 0 }, ...range(9, i => ({ upTo: 61500 + 5000 * i, value: 25 * (i + 1) })), { upTo: Infinity, value: 250 }],
  married: [{ upTo: 100500, value: 0 }, ...range(9, i => ({ upTo: 105500 + 5000 * i, value: 50 * (i + 1) })), { upTo: Infinity, value: 500 }],
};

const RECAPTURE: Record<FilingStatus, StepTable> = {
  single: [
    { upTo: 105000, value: 0 }, ...range(9, i => ({ upTo: 110000 + 5000 * i, value: 25 * (i + 1) })), { upTo: 200000, value: 250 },
    ...range(29, j => ({ upTo: 205000 + 5000 * j, value: 340 + 90 * j })), { upTo: 500000, value: 2950 },
    ...range(8, k => ({ upTo: 505000 + 5000 * k, value: 3000 + 50 * k })), { upTo: Infinity, value: 3400 },
  ],
  married: [
    { upTo: 210000, value: 0 }, ...range(9, i => ({ upTo: 220000 + 10000 * i, value: 50 * (i + 1) })), { upTo: 400000, value: 500 },
    ...range(29, j => ({ upTo: 410000 + 10000 * j, value: 680 + 180 * j })), { upTo: 1000000, value: 5900 },
    ...range(8, k => ({ upTo: 1010000 + 10000 * k, value: 6000 + 100 * k })), { upTo: Infinity, value: 6800 },
  ],
};

const PERSONAL_CREDIT: Record<FilingStatus, StepTable> = {
  single: [
    [18800, .75], [19300, .70], [19800, .65], [20300, .60], [20800, .55], [21300, .50], [21800, .45], [22300, .40], [25000, .35],
    [25500, .30], [26000, .25], [26500, .20], [31300, .15], [31800, .14], [32300, .13], [32800, .12], [33300, .11], [60000, .10],
    [60500, .09], [61000, .08], [61500, .07], [62000, .06], [62500, .05], [63000, .04], [63500, .03], [64000, .02], [64500, .01],
    [Infinity, 0],
  ].map(([upTo, value]) => ({ upTo, value })),
  married: [
    [30000, .75], [30500, .70], [31000, .65], [31500, .60], [32000, .55], [32500, .50], [33000, .45], [33500, .40], [40000, .35],
    [40500, .30], [41000, .25], [41500, .20], [50000, .15], [50500, .14], [51000, .13], [51500, .12], [52000, .11], [96000, .10],
    [96500, .09], [97000, .08], [97500, .07], [98000, .06], [98500, .05], [99000, .04], [99500, .03], [100000, .02], [100500, .01],
    [Infinity, 0],
  ].map(([upTo, value]) => ({ upTo, value })),
};

const stepValue = (table: StepTable, agi: number) => table.find(row => agi <= row.upTo)!.value;

function personalExemption(input: HouseholdTaxInput, connecticutAgi: number) {
  return EXEMPTION_TABLE[input.filing].find(row => connecticutAgi <= row.upTo)!.amount;
}

// CGS 12-701(a)(20)(B): pensions/annuities and, from tax year 2026, IRA distributions at 100%; Roth IRA distributions are excluded.
const ELIGIBLE_SOURCES = ["traditional-ira", "ira-conversion", "401k", "plan-conversion", "roth-401k", "annuity"] as const;

function pensionSubtraction(input: HouseholdTaxInput, federalAgi: number, retirementOrdinary: number) {
  const fraction = PENSION_PHASE_OUT[input.filing].find(row => federalAgi <= row.upTo)!.fraction;
  const pensionIncome = input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
  return (pensionIncome + retirementIncomeFromSources(input, retirementOrdinary, "Connecticut", ELIGIBLE_SOURCES)) * fraction;
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
  const connecticutAgi = federalAgi - socialSecuritySubtraction - pension;
  const exemption = personalExemption(input, connecticutAgi);
  const taxable = Math.max(0, connecticutAgi - exemption);
  const initialTax = sumBrackets(taxable, STATE_BRACKETS[input.filing]);
  const phaseOutAddBack = taxable > 0 ? stepValue(PHASE_OUT_ADD_BACK[input.filing], connecticutAgi) : 0;
  const recapture = taxable > 0 ? stepValue(RECAPTURE[input.filing], connecticutAgi) : 0;
  const preCreditTax = initialTax + phaseOutAddBack + recapture;
  const personalCredit = preCreditTax * stepValue(PERSONAL_CREDIT[input.filing], connecticutAgi);
  const stateTax = preCreditTax - personalCredit;
  return {
    stateTax, localTax: 0, socialSecuritySubtraction, pensionSubtraction: pension, personalExemption: exemption,
    connecticutAgi, phaseOutAddBack, recapture, personalCredit,
    warning: "Connecticut pre-credit estimate: enacted brackets (reviewed 2026-10-02 against the 2025 Form CT-1040 "
      + "instructions, Tables A-E, held constant for later years), a step-down personal exemption ($15,000 single/$24,000 "
      + "married, phased out by $44,001/$71,001 Connecticut AGI), the 2% rate phase-out add-back (up to $250/$500), the "
      + "high-income tax recapture (up to $3,400/$6,800), the personal tax credit that phases out by $64,500/$100,500 "
      + "Connecticut AGI, and the Social Security Benefit Adjustment (full exclusion below $75,000/$100,000 federal AGI, else a "
      + "25%-of-worksheet-amount formula whose federal worksheet input this planner approximates rather than reads "
      + "directly). Pension/annuity income (entered as annual pension) and this planner's owner-attributed 401(k)/IRA/annuity "
      + "distributions share a single phase-out by federal AGI (100% below $75,000/$100,000, 0% at $100,000/"
      + "$150,000); from tax year 2026 IRA distributions qualify at 100% of that percentage (75% applied only to 2025), while "
      + "taxable Roth IRA distributions are kept taxable. Military, Railroad Retirement and CT teachers' pay are excluded from "
      + "the subtraction in real law but cannot be identified by this planner, so the subtraction is overstated for such income. "
      + "Connecticut has no local income tax. Only single and married-filing-jointly are supported. Itemized deductions "
      + "and credits are excluded. Connecticut parameters are not inflation-indexed in this model. Future legislation is "
      + "not predicted. Not a tax return.",
  };
}
