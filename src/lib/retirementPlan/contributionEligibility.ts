import { projectedContributionLimits, projectedIraThresholds } from "./thresholdProjection";
import { taxProjectionFactors, type TaxProjectionPolicy } from "./householdTax";

/** Verified 2026 base rules. Future years require an explicit scenario policy.
 * Eligibility inputs are externally established; generic AGI is NOT IRA MAGI.
 */
function amount(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1e12) throw new RangeError(`${label} must be finite nonnegative dollars.`);
  return value;
}
function age(year: number, ageAtYearEnd: number) {
  if (year !== 2026) throw new RangeError("Only verified 2026 eligibility rules are supported; future years need an explicit policy.");
  if (!Number.isInteger(ageAtYearEnd) || ageAtYearEnd < 0 || ageAtYearEnd > 120) throw new RangeError("Age must be a whole year from 0 to 120.");
}
export type IraEligibilityInput = Readonly<{
  year: number; ageAtYearEnd: number; filing: "single" | "married";
  /** Own eligible taxable compensation; no inferred spousal compensation. */
  taxableCompensation: number;
  rothMagi: number;
  deductionMagi: number;
  coveredByWorkplacePlan: boolean; spouseCoveredByWorkplacePlan: boolean;
  /** All traditional and Roth contributions already made for this owner/year. */
  traditionalContributed: number; rothContributed: number;
}>;

export function iraEligibility2026(input: IraEligibilityInput) {
  age(input.year, input.ageAtYearEnd);
  return iraEligibility(input);
}

export function iraEligibility(input: IraEligibilityInput, projection?: TaxProjectionPolicy) {
  age(2026, input.ageAtYearEnd);
  taxProjectionFactors(input.year, projection);
  const limits = projectedContributionLimits(input.year, projection?.annualBracketGrowth ?? 0);
  const thresholds = projectedIraThresholds(input.year, projection?.annualBracketGrowth ?? 0);
  if (!["single", "married"].includes(input.filing)) throw new RangeError("Only single and married filing jointly are supported.");
  for (const key of ["taxableCompensation", "rothMagi", "deductionMagi", "traditionalContributed", "rothContributed"] as const) amount(input[key], key);
  if (typeof input.coveredByWorkplacePlan !== "boolean" || typeof input.spouseCoveredByWorkplacePlan !== "boolean") throw new RangeError("Workplace coverage must be explicit.");
  if (input.filing === "single" && input.spouseCoveredByWorkplacePlan) throw new RangeError("A single filer cannot specify spouse coverage.");
  const annualLimit = limits.iraRegular + (input.ageAtYearEnd >= 50 ? limits.iraCatchUp : 0);
  const combinedLimit = Math.min(annualLimit, input.taxableCompensation);
  const combinedContributed = input.traditionalContributed + input.rothContributed;
  const combinedRemaining = Math.max(0, combinedLimit - combinedContributed);
  const [start, end] = input.filing === "married" ? thresholds.rothMarried : thresholds.rothSingle;
  // Pub. 590-A worksheet 2-2: phase out compensation-limited line 6,
  // round UP to $10, apply $200 floor, then cap by remaining combined room.
  // Keep full precision in the phaseout ratio (at least three places).
  const phased = input.rothMagi >= end ? 0 : input.rothMagi <= start ? combinedLimit
    : Math.max(200, Math.ceil((combinedLimit * ((end - input.rothMagi) / (end - start))) / 10) * 10);
  const rothTotalLimit = Math.min(phased, Math.max(0, combinedLimit - input.traditionalContributed));
  const rothRemaining = Math.max(0, Math.min(combinedRemaining, rothTotalLimit - input.rothContributed));
  const deductionRange = input.coveredByWorkplacePlan
    ? input.filing === "married" ? thresholds.deductionMarried : thresholds.deductionSingle
    : input.filing === "married" && input.spouseCoveredByWorkplacePlan ? thresholds.deductionSpouseCovered : null;
  const deductionStatus = !deductionRange || input.deductionMagi <= deductionRange[0] ? "not-income-limited"
    : input.deductionMagi >= deductionRange[1] ? "fully-phased-out" : "partially-phased-out";
  return Object.freeze({ dataYear: 2026, year: input.year, isProjection: input.year !== 2026, annualLimit, combinedLimit, combinedRemaining,
    traditionalContributionRoom: combinedRemaining, rothTotalLimit, rothRemaining,
    combinedExcess: Math.max(0, combinedContributed - combinedLimit),
    rothExcess: Math.max(0, input.rothContributed - rothTotalLimit),
    deductionStatus, deductionRange: deductionRange ? Object.freeze(deductionRange) : null,
    deductionAmount: null, spousalCompensationInferred: false });
}

export type CatchUpEligibilityInput = Readonly<{
  year: number; ageAtYearEnd: number; planAllowsCatchUp: boolean; planHasRoth: boolean;
  /** Prior-calendar-year FICA wages from THIS sponsoring employer. */
  priorYearSponsorFicaWages: number;
}>;
export function catchUpEligibility2026(input: CatchUpEligibilityInput) {
  age(input.year, input.ageAtYearEnd);
  amount(input.priorYearSponsorFicaWages, "Prior-year sponsor FICA wages");
  if (typeof input.planAllowsCatchUp !== "boolean" || typeof input.planHasRoth !== "boolean") throw new RangeError("Plan catch-up and Roth availability must be explicit.");
  const ageBasedLimit = input.ageAtYearEnd < 50 ? 0 : input.ageAtYearEnd >= 60 && input.ageAtYearEnd <= 63 ? 11250 : 8000;
  const rothRequired = ageBasedLimit > 0 && input.priorYearSponsorFicaWages > 150000;
  const availableCatchUp = input.planAllowsCatchUp && (!rothRequired || input.planHasRoth) ? ageBasedLimit : 0;
  return Object.freeze({ dataYear: 2026, regularDeferralLimit: 24500, ageBasedLimit, availableCatchUp,
    rothRequired, pretaxCatchUpCapacity: rothRequired ? 0 : availableCatchUp,
    rothCatchUpCapacity: input.planHasRoth ? availableCatchUp : 0,
    totalDeferralCeiling: 24500 + availableCatchUp,
    blockedReason: !input.planAllowsCatchUp ? "plan-does-not-allow-catch-up" : rothRequired && !input.planHasRoth ? "required-roth-feature-unavailable" : null });
}
