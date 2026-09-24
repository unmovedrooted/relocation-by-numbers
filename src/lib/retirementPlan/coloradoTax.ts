import type { HouseholdTaxInput } from "./householdTax";
import { stateSocialSecurityInclusion } from "./stateSocialSecurityCoverage";
import { ageAtYearEnd } from "./rules";

/** Restricted, federal-taxable-income-based, PRE-CREDIT planning estimate.
 * Rates and thresholds reviewed 2026-09-23 against:
 * - Colorado General Assembly, Legislative Council Staff, "Individual Income
 *   Tax": confirms the flat 4.40% rate applies to FEDERAL TAXABLE INCOME
 *   (after the federal standard/itemized deduction), not federal AGI, with
 *   only Colorado-specific additions/subtractions layered on top. Colorado
 *   has no local income tax.
 *   https://content.leg.colorado.gov/agencies/legislative-council-staff/individual-income-tax
 * - Colorado Department of Revenue, "Income Tax Topics: Social Security,
 *   Pensions and Annuities" (source already verified and cited by this
 *   planner's existing stateSocialSecurityInclusion, reused here unchanged):
 *   Social Security is fully subtracted for an owner 65 or older, or for an
 *   owner 55-64 whose household federal AGI is at or below $75,000 (single)
 *   or $95,000 (married); otherwise an owner 55-64 may subtract up to
 *   $20,000 of Social Security. Separately, pension/annuity income (this
 *   planner's "pension" income) may be subtracted up to $24,000 for an
 *   owner 65 or older (independent of that owner's Social Security
 *   treatment), or up to $20,000 for an owner 55-64 -- SHARED with that same
 *   owner's own Social Security subtraction when the general (non-exempt)
 *   $20,000 cap applies. An owner under 55 receiving Social Security is
 *   unsupported (matching stateSocialSecurityInclusion's own contract), as
 *   is any pension for an owner under 55.
 *
 * Uses enacted law, not a prediction of future legislation. When a 55-64
 * owner qualifies for the full income-tested Social Security exemption,
 * this planner assumes (not independently confirmed in a fetched primary
 * document) that owner's $20,000 pension/annuity cap remains fully
 * available, unreduced by the Social Security exemption -- the same
 * structure the 65+ case unambiguously uses. If Colorado law instead treats
 * that exemption as consuming the same combined bucket, this planner
 * overstates the exclusion for such a household. Only single and
 * married-filing-jointly are supported. No itemized deductions or credits,
 * including the separate senior/disabled property-tax-style credits, are
 * modeled. Colorado parameters are not inflation-indexed in this model,
 * matching the restricted New York, Maryland, Indiana, DC, Illinois, New
 * Jersey and Pennsylvania estimates' convention.
 */

const STATE_RATE = .044;
const PENSION_CAP_65_PLUS = 24000;
const PENSION_CAP_UNDER_65 = 20000;
/** Must stay in sync with the CO branch of stateSocialSecurityInclusion. */
const SS_EXEMPTION_AGI: Record<"single" | "married", number> = { single: 75000, married: 95000 };

function incomeByOwner(input: HouseholdTaxInput, kind: "pension" | "social-security") {
  const map = new Map(input.people.map(person => [person.id, 0]));
  for (const item of input.income) if (item.kind === kind) map.set(item.ownerId, map.get(item.ownerId)! + item.amount);
  return map;
}

export function coloradoTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, federalTaxableIncome: number) {
  if (input.coloradoContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Colorado planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Colorado projection year.");
  const socialSecurityByOwner = incomeByOwner(input, "social-security");
  const pensionByOwner = incomeByOwner(input, "pension");
  const grossBenefits = [...socialSecurityByOwner.values()].reduce((sum, value) => sum + value, 0);
  const ssResult = stateSocialSecurityInclusion({
    state: "co", year: input.year, futurePolicy: input.year > 2026 ? "hold-2026-law" : undefined,
    filing: input.filing === "married" ? "married-joint" : "single", federalAgi, grossBenefits,
    federallyTaxableBenefits: taxableBenefits,
    owners: input.people.map(person => ({ ageAtYearEnd: ageAtYearEnd(person.birthDate, input.year), grossBenefits: socialSecurityByOwner.get(person.id)! })),
  });
  if (ssResult.status === "unsupported") throw new RangeError(`Colorado retirement-income treatment is unsupported for this household: ${ssResult.reason}`);
  const socialSecuritySubtraction = taxableBenefits - ssResult.taxableBenefits!;
  const exempt = federalAgi <= SS_EXEMPTION_AGI[input.filing];
  let pensionSubtraction = 0;
  for (const person of input.people) {
    const age = ageAtYearEnd(person.birthDate, input.year);
    const ownPension = pensionByOwner.get(person.id)!;
    if (age >= 65) { pensionSubtraction += Math.min(ownPension, PENSION_CAP_65_PLUS); continue; }
    if (age < 55) continue;
    const ownShare = grossBenefits > 0 ? taxableBenefits * (socialSecurityByOwner.get(person.id)! / grossBenefits) : 0;
    const ssCapUsed = exempt ? 0 : Math.min(ownShare, PENSION_CAP_UNDER_65);
    pensionSubtraction += Math.min(ownPension, Math.max(0, PENSION_CAP_UNDER_65 - ssCapUsed));
  }
  const taxable = Math.max(0, federalTaxableIncome - socialSecuritySubtraction - pensionSubtraction);
  const stateTax = taxable * STATE_RATE;
  return {
    stateTax, localTax: 0, socialSecuritySubtraction, pensionSubtraction,
    warning: "Colorado pre-credit estimate: enacted flat 4.40% rate applied to federal taxable income (reviewed 2026-09-23), "
      + "with no separate Colorado standard deduction. Social Security is fully subtracted for an owner 65 or older, or for "
      + "an owner 55-64 when household federal AGI is at or below $75,000 (single) or $95,000 (married); otherwise up to "
      + "$20,000 per owner 55-64. Pension/annuity income (entered as annual pension) is separately subtracted, up to "
      + "$24,000 per owner 65 or older, or up to $20,000 per owner 55-64 SHARED with that owner's own Social Security "
      + "subtraction when the general (non income-tested) cap applies; this planner assumes, without independent primary "
      + "confirmation, that the income-tested full Social Security exemption leaves that same owner's $20,000 pension cap "
      + "untouched. An owner under 55 receiving Social Security, or any pension for an owner under 55, is unsupported. "
      + "Colorado has no local income tax. Itemized deductions and credits are excluded. Colorado parameters are not "
      + "inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
