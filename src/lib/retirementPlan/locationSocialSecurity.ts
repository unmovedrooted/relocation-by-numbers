import type {StateCode} from "../states";

/** Only verified federal-AGI subtraction rules belong here. Absence is unknown,
 * not a declaration that a state taxes benefits. Reviewed 2026-09-08.
 */
export const SOCIAL_SECURITY_SUBTRACTIONS: Partial<Record<StateCode, Readonly<{source:string;dataYear:number;firstSupportedYear:number}>>> = {
  ny:{source:"https://www.tax.ny.gov/forms/html-instructions/2025/it/it201i-2025.htm",dataYear:2025,firstSupportedYear:2026},
  ca:{source:"https://www.ftb.ca.gov/file/personal/income-types/social-security.html",dataYear:2026,firstSupportedYear:2026},
  va:{source:"https://www.tax.virginia.gov/subtractions",dataYear:2026,firstSupportedYear:2026},
  wv:{source:"https://tax.wv.gov/Individuals/SeniorCitizens/Pages/SeniorCitizenSocialSecurityModification.aspx",dataYear:2026,firstSupportedYear:2026},
};

/** Narrow tax-base helper, not a complete state or local tax return.
 * Verified 2026-09-08 against NY DTF retirement guidance and 2025 IT-201.
 * https://www.tax.ny.gov/pit/file/information_for_seniors.htm
 * https://www.tax.ny.gov/forms/html-instructions/2025/it/it201i-2025.htm
 * NY subtracts only the benefits included in federal AGI, not gross benefits.
 * Future-year use requires an explicit hold-current-law assumption.
 * Intentionally not wired into the existing wage-based retirement proxy yet.
 */
export type SocialSecurityLocationInput = {
  /** Omitted means the current supported base year, 2026. */
  year?: number;
  futurePolicy?: "hold-2026-law";
  state: StateCode;
  cityId?: string;
  federalAgi: number;
  grossBenefits: number;
  federallyTaxableBenefits: number;
};

export function validateSocialSecurityLocationInput(input: SocialSecurityLocationInput) {
  const year=input.year??2026;
  if (!Number.isInteger(year)||year<2026||year>2126) throw new RangeError("Location Social Security rules support 2026 through 2126 only.");
  if (input.futurePolicy!==undefined&&input.futurePolicy!=="hold-2026-law") throw new RangeError("Unsupported location projection policy.");
  if (year>2026&&input.futurePolicy!=="hold-2026-law") throw new RangeError("Future location treatment requires an explicit hold-2026-law assumption.");
  for (const [label,value] of Object.entries({federalAgi:input.federalAgi,
    grossBenefits:input.grossBenefits,federallyTaxableBenefits:input.federallyTaxableBenefits})) {
    if (!Number.isFinite(value) || Math.abs(value)>1e12 || (label!=="federalAgi"&&value<0)) {
      throw new RangeError(`Invalid ${label} for location Social Security treatment.`);
    }
  }
  if (input.federallyTaxableBenefits>input.grossBenefits) {
    throw new RangeError("Taxable Social Security cannot exceed gross benefits.");
  }
  return year;
}

export function locationSocialSecurityBase(input: SocialSecurityLocationInput) {
  const year=validateSocialSecurityLocationInput(input);
  const rule=SOCIAL_SECURITY_SUBTRACTIONS[input.state];
  if (!rule || year<rule.firstSupportedYear) return {
    status:"unsupported" as const,
    reason:"Social Security treatment for this state has not been verified in the location layer.",
    stateBase:null, localBase:null, socialSecuritySubtraction:null,
  };
  const stateBase=input.federalAgi-input.federallyTaxableBenefits;
  const supportedCity=input.state==="ny"&&(input.cityId==="nyc-ny"||input.cityId==="yonkers-ny");
  return {
    status:"supported-social-security-subtraction" as const,
    stateBase,
    socialSecuritySubtraction:input.federallyTaxableBenefits,
    localBase:supportedCity?stateBase:null,
    localStatus:supportedCity?"supported-social-security-subtraction" as const:"unverified-or-unselected" as const,
    dataYear:rule.dataYear,
    source:rule.source,
    year,
    isProjection:year>2026,
    warning:"Income base after Social Security subtraction only. Other state modifications, deductions, pension exclusions and local tax calculations are not included.",
  };
}
