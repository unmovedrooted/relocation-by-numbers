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
 * Reviewed 2026-10-04 against each module's own limitations text and re-checked against
 * primary sources. Each remaining entry is a parameter its agency had not yet published for
 * 2026 on that date (not an assumption to be inflated); replace it when the agency publishes:
 * - California: the FTB's 2026 Form 540-ES still uses the 2025 amounts; the indexed 2026
 *   brackets, deduction and credit phase-out are published with the 2026 booklet (about December).
 * - Rhode Island: the Division of Taxation announces the indexed 2026 thresholds in its annual
 *   advisory, issued in the fall (the 2025 advisory is ADV 2025-22).
 * - Vermont: the age-65/blind additional deduction is statutorily indexed (32 V.S.A.
 *   5811(21)(D)) and the Department of Taxes has not published the 2026 amount; its other 2026
 *   amounts come from the published 2026 withholding tables.
 * - Washington: RCW 82.87.150 has the Department of Revenue announce the indexed standard
 *   deduction by October 31 of the preceding year; the 2026 announcement was not yet out.
 * States verified against 2026 publications and removed from this list on 2026-10-04: Maine,
 * Missouri, Montana, Utah, Idaho, Nebraska, Georgia, Arizona (dollar figures updated); Alabama
 * and Connecticut (fixed statutory amounts, confirmed unchanged for 2026).
 */
export const STATE_PARAMETERS_HELD_FROM_2025: Readonly<Partial<Record<StateCode, string>>> = Object.freeze({
  ca: "The California brackets, deduction and credit phase-out are the 2025 figures; the 2026 indexed amounts are not yet published.",
  ri: "The Rhode Island eligibility thresholds are the 2025 figures; the 2026 indexed amounts are not yet published.",
  vt: "The Vermont age-65/blind additional deduction is the 2025 figure; the 2026 amount is not yet published.",
  wa: "The Washington capital-gains standard deduction is the 2025 figure; the 2026 amount is not yet announced.",
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
