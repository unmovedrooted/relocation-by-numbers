import type { StateCode } from "../states";

/**
 * Provenance of the dollar parameters behind each verified state module.
 *
 * A state is listed only when its module discloses that at least one
 * parameter (a bracket, deduction, threshold, credit amount or cap) is the
 * latest published 2025 figure held for 2026 and later, rather than a
 * published 2026 amount. States not listed use only published 2026 or fixed
 * statutory parameters, or have no individual income tax. This replaces a
 * single flag that stamped 2026 on every verified state.
 *
 * Reviewed 2026-10-02 against each module's own limitations text.
 */
export const STATE_PARAMETERS_HELD_FROM_2025: Readonly<Partial<Record<StateCode, string>>> = Object.freeze({
  al: "Alabama Form 40 amounts are the 2025 booklet figures.",
  az: "The Arizona standard deduction is the 2025 figure.",
  ca: "The California brackets, deduction and credit phase-out are the 2025 figures.",
  ct: "The Connecticut tables are read from the 2025 return instructions and held for 2026 and later.",
  ga: "Georgia amounts were checked against the 2025 booklet.",
  id: "The Idaho zero-bracket threshold and retirement deduction cap are the 2025 indexed amounts.",
  me: "Maine pension-deduction phase-out thresholds are the approved provisional 2025 figures.",
  mo: "The Missouri public-pension cap is the 2025 figure.",
  mt: "The Montana age-65 subtraction is the 2025 figure.",
  ne: "The Nebraska 2026 age-65/blind additional deduction is the 2025 figure.",
  or: "The Oregon age/blind additions are the 2025 figures.",
  ri: "The Rhode Island eligibility thresholds are the 2025 figures.",
  ut: "The Utah Taxpayer Tax Credit base amounts are the 2025 figures.",
  vt: "The Vermont amounts are the 2025 figures.",
  wa: "The Washington capital-gains standard deduction is the 2025 figure.",
});

export interface StateDataVintage {
  /** The oldest parameter year in use for this state: 2025 when any parameter is held from 2025, otherwise 2026. */
  readonly year: 2025 | 2026;
  readonly basis: "published-2026" | "mixed-2025-2026";
  readonly note: string | null;
}

export function stateDataVintage(state: StateCode): StateDataVintage {
  const held = STATE_PARAMETERS_HELD_FROM_2025[state];
  return held
    ? Object.freeze({ year: 2025, basis: "mixed-2025-2026", note: held } as const)
    : Object.freeze({ year: 2026, basis: "published-2026", note: null } as const);
}
