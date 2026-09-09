import { activeYearFraction, type TimelineInput } from "./timeline";
import type { EmployerMatchPlan } from "./employerMatchLedger";
import { projectThreshold } from "./thresholdProjection";
import { initialIraContributionEditor, type IraContributionEditorState } from "./previewIraContributions";

export type ContributionOwnerDraft = {
  verified: boolean; employeeLimit: string; additionsLimit: string; compensationCap: string;
  matchEnabled: boolean; matchRate: string; matchThrough: string; destination: string;
};
export type ContributionEditorState = {
  ira?: IraContributionEditorState;
  amounts: Record<string, string>;
  owners: Record<"one" | "two", ContributionOwnerDraft>;
};
export function initialContributionEditor(): ContributionEditorState {
  const owner = (): ContributionOwnerDraft => ({ verified: false, employeeLimit: "", additionsLimit: "", compensationCap: "",
    matchEnabled: false, matchRate: "50", matchThrough: "6", destination: "" });
  return { amounts: {}, owners: { one: owner(), two: owner() }, ira: initialIraContributionEditor() };
}
function number(raw: string | undefined, label: string, max = 1e9) {
  if (typeof raw !== "string" || !raw.trim() || !Number.isFinite(Number(raw)) || Number(raw) < 0 || Number(raw) > max) {
    throw new RangeError(`${label}: enter a finite value from 0 to ${max}.`);
  }
  return Number(raw);
}

/** Local preview contract: one verified plan group per owner, no catch-up or
 * outside additions. Fixed nominal saving/limits; actual wages are prorated by
 * the same helper as the timeline. Hidden/deleted/inactive drafts are ignored.
 */
export function addPreviewContributions(input: TimelineInput, editor: ContributionEditorState): TimelineInput {
  const contributions: TimelineInput["contributions"][number][] = [];
  const contributionCapacities: TimelineInput["contributionCapacities"][number][] = [];
  const employerMatchesByYear: Record<number, EmployerMatchPlan[]> = {};
  for (const person of input.people) {
    const ownerId = person.id as "one" | "two";
    const draft = editor.owners[ownerId];
    const accounts = input.accounts.filter(account => account.ownerId === ownerId && ["401k", "roth-401k"].includes(account.kind));
    const saving = accounts.map(account => ({ account, amount: number(editor.amounts[account.id] ?? "0", `${account.id} annual employee contribution`) }));
    const active = saving.filter(item => item.amount > 0);
    if (!active.length) continue;
    if (!draft?.verified) throw new RangeError(`Person ${ownerId === "one" ? 1 : 2}: confirm the supported plan assumptions before contributing.`);
    const employeeLimit = number(draft.employeeLimit, "Regular employee limit");
    const additionsLimit = number(draft.additionsLimit, "Combined annual additions limit");
    const compensationCap = number(draft.compensationCap, "Eligible compensation cap");
    const matchRate = draft.matchEnabled ? number(draft.matchRate, "Employer match rate", 1000) / 100 : 0;
    const matchThrough = draft.matchEnabled ? number(draft.matchThrough, "Matched salary fraction", 100) / 100 : 0;
    if (draft.matchEnabled && (matchThrough === 0 || matchRate === 0)) throw new RangeError("Set positive match percentages or disable matching.");
    if (draft.matchEnabled && !accounts.some(account => account.id === draft.destination && account.kind === "401k")) {
      throw new RangeError("Choose a same-owner traditional 401(k) for employer matching.");
    }
    for (const { account, amount } of active) contributions.push({ id: `preview-saving-${account.id}`, accountId: account.id,
      annualAmount: amount, annualGrowth: 0, startDate: `${input.startYear}-01-01`, endDate: null,
      taxTreatment: account.kind === "401k" ? "pretax-401k" : "after-tax", eligibility: "externally-validated" });
    for (let year = input.startYear; year <= input.endYear; year++) {
      const rate = input.taxProjection.annualBracketGrowth;
      const projectedEmployeeLimit = projectThreshold(employeeLimit, year, input.startYear, rate, 500);
      const projectedAdditionsLimit = projectThreshold(additionsLimit, year, input.startYear, rate, 1000);
      const projectedCompensationCap = projectThreshold(compensationCap, year, input.startYear, rate, 5000);
      contributionCapacities.push({ year, ownerId, planEmployee: Math.min(projectedEmployeeLimit, projectedAdditionsLimit, projectedCompensationCap), iraCombined: 0, rothIra: 0 });
      const wages = input.income.filter(item => item.ownerId === ownerId && item.kind === "wages").reduce((sum, item) => {
        const retirement = input.retirementDates[ownerId];
        const end = item.endDate === null || retirement < item.endDate ? retirement : item.endDate;
        return sum + (end <= item.startDate ? 0 : item.annualAmount * (1 + item.annualGrowth) ** (year - input.startYear)
          * activeYearFraction(year, item.startDate, end));
      }, 0);
      if (draft.matchEnabled && wages > 0) (employerMatchesByYear[year] ??= []).push({ ownerId,
        destinationAccountId: draft.destination, employeeAccountIds: active.map(item => item.account.id),
        terms: { eligibleCompensation: wages, compensationCap: projectedCompensationCap, regularEmployeeCapacity: projectedEmployeeLimit, catchUpCapacity: 0,
          annualAdditionsLimit: projectedAdditionsLimit, otherAnnualAdditions: 0,
          tiers: [{ throughCompensationFraction: matchThrough, employerPerEmployeeDollar: matchRate }],
          assumptions: { eligibility: "externally-validated", matching: "annual-true-up", vesting: "fully-vested", employerTaxTreatment: "traditional-pretax" } } });
    }
  }
  if (!contributions.length) return input;
  return { ...input, contributions, contributionCapacities, employerMatchesByYear };
}
