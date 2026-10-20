import { calculatePreview, PREVIEW_DEFAULTS } from "./retirementPlan/preview";
import { initialAccountEditor } from "./retirementPlan/previewAccounts";
import { initialContributionEditor } from "./retirementPlan/previewContributions";
import { initialMedicareEditor } from "./retirementPlan/previewMedicare";
import { initialConversionEditor } from "./retirementPlan/previewConversions";
import { encodeScenario } from "./retirementPlan/shareState";

export type WithdrawalHandoffInput = {
  state: string;
  filing: "single" | "married";
  age: number;
  balance: number;
  roth: boolean;
  /** Expected annual return and inflation, %. */
  returnPct: number;
  inflationPct: number;
  /** Yearly spending after income tax, in today's dollars. */
  afterTaxSpending: number;
  horizonYears: number;
};

const PLAN_PATH = "/complete-retirement-plan";

/**
 * A link that opens the Complete Retirement Plan with the withdrawal scenario filled in: one account holding the balance, no wages,
 * pension or Social Security, and the after-tax spending. The planner is only handed a scenario it accepts; some states need the
 * visitor's own confirmation of restricted assumptions, and for those (or anything it rejects) the link opens the planner without a
 * prefilled scenario, so the handoff never confirms anything on the visitor's behalf. A Roth IRA is also left for the visitor to enter:
 * the planner needs the year of the first Roth contribution (the five-year rule), which this calculator does not ask for.
 */
export function buildPlanHandoff(i: WithdrawalHandoffInput): { href: string; prefilled: boolean } {
  if (i.roth) return { href: PLAN_PATH, prefilled: false };
  const startYear = 2026;
  const birth = `${startYear - Math.min(100, Math.max(40, Math.round(i.age || 65)))}-01-01`;
  const retire = `${startYear}-01-01`;
  const values: Record<string, string> = {
    ...PREVIEW_DEFAULTS,
    state: i.state,
    household: i.filing,
    startYear: String(startYear),
    endYear: String(Math.min(2126, startYear + Math.max(5, Math.round(i.horizonYears || 30)))),
    spending: String(Math.max(0, Math.round(i.afterTaxSpending))),
    cash: "0",
    inflation: String(i.inflationPct),
    returns: String(i.returnPct),
    "one-birth": birth, "one-retirement": retire, "one-salary": "0", "one-ira": String(Math.round(i.balance)),
    "one-pension": "0", "one-pensionStart": retire, "one-benefit": "0", "one-benefitStart": retire,
    "two-birth": birth, "two-retirement": retire, "two-salary": "0", "two-ira": "0",
    "two-pension": "0", "two-pensionStart": retire, "two-benefit": "0", "two-benefitStart": retire,
  };
  const accounts = initialAccountEditor();
  const account = accounts.accounts[0];
  account.kind = "traditional-ira";
  account.name = "Person 1 IRA";
  account.fields.balance = String(Math.round(i.balance));
  account.fields.priorBalance = String(Math.round(i.balance));
  account.fields.returns = String(i.returnPct);
  const saving = initialContributionEditor();
  const medicare = initialMedicareEditor();
  const conversions = initialConversionEditor();
  try {
    calculatePreview(values, accounts, saving, medicare);
  } catch {
    return { href: PLAN_PATH, prefilled: false };
  }
  return { href: PLAN_PATH + encodeScenario({ values, accounts, saving, medicare, conversions }), prefilled: true };
}
