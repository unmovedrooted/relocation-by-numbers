import type { TimelineInput } from "./timeline";
import type { IraOwnerPolicy } from "./eligibleContributions2026";

export type IraOwnerDraft = {
  coverage: "" | "yes" | "no";
  deduction: "" | "deduct-eligible" | "nondeductible";
  confirmed: boolean;
};
export type IraContributionEditorState = {
  amounts: Record<string, string>;
  owners: Record<"one" | "two", IraOwnerDraft>;
};
export function initialIraContributionEditor(): IraContributionEditorState {
  const owner = (): IraOwnerDraft => ({ coverage: "", deduction: "", confirmed: false });
  return { amounts: {}, owners: { one: owner(), two: owner() } };
}

/** Form adapter only: all limits, tax/MAGI feedback and basis remain in the engine.
 * The coverage election applies during employment through the retirement year.
 * No inference of coverage from ownership of an old workplace account.
 */
export function addPreviewIraContributions(input: TimelineInput, editor: IraContributionEditorState): TimelineInput {
  const requests = input.accounts.filter(account => ["traditional-ira", "roth-ira"].includes(account.kind)).map(account => {
    const raw = editor.amounts[account.id] ?? "0";
    if (!raw.trim() || !Number.isFinite(Number(raw)) || Number(raw) < 0 || Number(raw) > 1e9) throw new RangeError(`${account.id}: enter an annual IRA contribution from 0 to 1000000000; use 0 for none.`);
    return { account, amount: Number(raw) };
  }).filter(item => item.amount > 0);
  if (!requests.length) return input;
  for (const person of input.people) {
    const draft = editor.owners[person.id as "one" | "two"];
    const label = `Person ${person.id === "one" ? 1 : 2}`;
    if (!draft || !["yes", "no"].includes(draft.coverage)) throw new RangeError(`${label}: choose workplace coverage, including spouse coverage for joint IRA eligibility.`);
    const owned = requests.filter(item => item.account.ownerId === person.id);
    if (!owned.length) continue;
    if (!draft.confirmed) throw new RangeError(`${label}: confirm the supported IRA assumptions before contributing.`);
    for (const kind of ["traditional-ira", "roth-ira"]) {
      if (owned.filter(item => item.account.kind === kind).length > 1) throw new RangeError(`${label}: this preview supports contributions to one traditional IRA and one Roth IRA. Set other IRA contribution amounts to 0.`);
    }
    if (owned.some(item => item.account.kind === "traditional-ira") && !["deduct-eligible", "nondeductible"].includes(draft.deduction)) throw new RangeError(`${label}: choose the traditional IRA deduction treatment.`);
  }
  const iraPoliciesByYear: Record<number, IraOwnerPolicy[]> = {};
  for (let year = input.startYear; year <= input.endYear; year++) {
    const covered = (id: string) => editor.owners[id as "one" | "two"].coverage === "yes" && input.retirementDates[id] > `${year}-01-01`;
    for (const person of input.people) {
      const draft = editor.owners[person.id as "one" | "two"];
      if (draft.coverage === "no" && input.contributions.some(item => item.annualAmount > 0 && item.startDate < `${year + 1}-01-01`
        && (item.endDate === null || item.endDate > `${year}-01-01`) && input.retirementDates[person.id] > `${year}-01-01`
        && input.accounts.some(account => account.id === item.accountId && account.ownerId === person.id && ["401k", "roth-401k"].includes(account.kind)))) {
        throw new RangeError(`Person ${person.id === "one" ? 1 : 2}: workplace contributions conflict with "not covered" IRA coverage.`);
      }
      const owned = requests.filter(item => item.account.ownerId === person.id);
      if (!owned.length) continue;
      const spouse = input.people.find(item => item.id !== person.id);
      (iraPoliciesByYear[year] ??= []).push({ ownerId: person.id,
        traditionalAccountId: owned.find(item => item.account.kind === "traditional-ira")?.account.id,
        rothAccountId: owned.find(item => item.account.kind === "roth-ira")?.account.id,
        coveredByWorkplacePlan: covered(person.id), spouseCoveredByWorkplacePlan: spouse ? covered(spouse.id) : false,
        deductionChoice: draft.deduction === "nondeductible" ? "nondeductible" : "deduct-eligible", allocation: "traditional-first" });
    }
  }
  return { ...input, iraPoliciesByYear, contributions: [...input.contributions, ...requests.map(({ account, amount }) => ({
    id: `preview-ira-saving-${account.id}`, accountId: account.id, annualAmount: amount, annualGrowth: 0,
    startDate: `${input.startYear}-01-01`, endDate: null, taxTreatment: "after-tax" as const, eligibility: "externally-validated" as const,
  }))] };
}

export function previewIraRows(result: ReturnType<typeof import("./timeline").runRetirementTimeline>) {
  return result.years.map(row => {
    const traditional = new Set(row.result.nextState.accounts.filter(account => account.kind === "traditional-ira").map(account => account.id));
    const roth = new Set(row.result.nextState.accounts.filter(account => account.kind === "roth-ira").map(account => account.id));
    const iras = row.contributions.filter(item => traditional.has(item.accountId) || roth.has(item.accountId));
    const traditionalFunded = iras.filter(item => traditional.has(item.accountId)).reduce((sum, item) => sum + item.funded, 0);
    const rothFunded = iras.filter(item => roth.has(item.accountId)).reduce((sum, item) => sum + item.funded, 0);
    return { year: row.year, requested: iras.reduce((sum, item) => sum + item.requested, 0),
      eligible: iras.reduce((sum, item) => sum + item.eligible, 0), traditionalFunded, rothFunded,
      deduction: row.result.tax.iraDeduction, traditionalBasisAdded: traditionalFunded - row.result.tax.iraDeduction,
      rothBasisAdded: rothFunded };
  });
}
