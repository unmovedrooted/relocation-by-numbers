import type { StateCode } from "./states";
import { TAX_RULES_VERIFIED_ON, TAX_YEAR } from "./taxYear2026";

/**
 * Which state rules are published for the tax year and which are held, derived or unconfirmed.
 * A state is listed only when at least one figure it uses is not a published figure for TAX_YEAR.
 * States not listed use published or fixed statutory amounts for the year.
 * Keep this in step with STATE-WAGE-RULES-DRAFT.md; remove an entry when the agency publishes the figure.
 */
export type RuleStatus = "held-from-prior-year" | "statute-derived" | "not-independently-confirmed";

export type StateRuleNote = Readonly<{ status: RuleStatus; note: string }>;

export const STATE_RULE_NOTES: Readonly<Partial<Record<StateCode, StateRuleNote>>> = Object.freeze({
  ca: { status: "held-from-prior-year", note: "California's 2026 brackets and standard deduction are not published until the state's 2026 tax booklet, so the 2025 amounts are used." },
  md: { status: "statute-derived", note: "Maryland's 2026 standard deduction ($3,400 single, $6,800 joint) comes from the Comptroller's 2026 withholding guide and the statute's indexing; the filing-year figure is not published yet." },
  id: { status: "statute-derived", note: "Idaho's 2026 zero-bracket threshold is calculated from the statute's indexing formula; the Tax Commission has not published it yet." },
  ut: { status: "statute-derived", note: "Utah's 2026 taxpayer-credit phase-out amounts are calculated from the statute's indexing formula; the Tax Commission has not published them yet." },
  vt: { status: "statute-derived", note: "Vermont's 2026 brackets and standard deduction are calculated from the Department of Taxes' 2026 withholding tables; the 2026 return booklet is not published yet." },
  az: { status: "statute-derived", note: "Arizona's 2026 standard deduction is calculated from its statute; the published figure could differ by a few dollars of tax." },
  ny: { status: "statute-derived", note: "New York's 2026 tax-benefit recapture amounts are calculated from the 2026 rate schedule; the state's 2026 worksheets are not published yet." },
  oh: { status: "held-from-prior-year", note: "Ohio sets its personal exemption each August; the 2025 amounts are used because no 2026 amount was found." },
  ms: { status: "held-from-prior-year", note: "Mississippi's standard deduction and exemption amounts are the 2025 figures; the 2026 rate is from its enacted schedule." },
  ok: { status: "held-from-prior-year", note: "Oklahoma's standard deduction and exemption are the 2025 figures; the 2026 rates are from the enacted bill." },
  ar: { status: "held-from-prior-year", note: "Arkansas's standard deduction and personal credit are the 2025 figures; the 2026 rates are from the enacted act." },
  ne: { status: "statute-derived", note: "Nebraska's 2026 tax table is a department draft dated August 2026; the figures also appear on its 2026 estimated-tax form and will be updated if the final table differs." },
  de: { status: "not-independently-confirmed", note: "Delaware's bracket breakpoints and standard deduction could not be confirmed against a Delaware Division of Revenue document for this update." },
});

export function getStateRuleNote(state: StateCode): StateRuleNote | null {
  return STATE_RULE_NOTES[state] ?? null;
}

/** Human-readable date for display ("October 13, 2026"). */
export function taxRulesVerifiedLabel(): string {
  const [y, m, d] = TAX_RULES_VERIFIED_ON.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** Short statement of what the calculators include and leave out. */
export const PAYROLL_PROGRAMS_NOTE =
  "State disability, paid-family-leave and similar payroll deductions (such as CA SDI, NJ, NY PFL, WA Cares, Oregon paid leave and transit tax) are not included, so take-home pay in those states is lower than shown.";

export { TAX_YEAR };
