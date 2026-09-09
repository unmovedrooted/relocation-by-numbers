import { runRetirementTimeline, type TimelineInput } from "./timeline";

export type ConversionEditorState = {
  enabled: boolean; ownerId: string; sourceId: string; destinationId: string;
  startYear: string; endYear: string; amount: string;
};
export const initialConversionEditor = (): ConversionEditorState => ({
  enabled: false, ownerId: "one", sourceId: "", destinationId: "", startYear: "", endYear: "", amount: "",
});

/** One explicit nominal schedule. Tax and account calculations remain in the engine. */
export function addPreviewConversions(input: TimelineInput, draft: ConversionEditorState): TimelineInput {
  if (!draft.enabled) return input;
  const numeric = (raw: string, label: string, min: number, max: number) => {
    const value = Number(raw);
    if (!raw.trim() || !Number.isFinite(value) || value < min || value > max) throw new RangeError(`Conversion ${label}: enter a value from ${min} to ${max}.`);
    return value;
  };
  const start = numeric(draft.startYear, "first year", input.startYear, input.endYear);
  const end = numeric(draft.endYear, "last year", start, input.endYear);
  if (!Number.isInteger(start) || !Number.isInteger(end)) throw new RangeError("Conversion years must be whole years.");
  const amount = numeric(draft.amount, "annual amount", 0, 1e9);
  if (amount === 0) throw new RangeError("Enter a positive conversion amount or disable conversions.");
  const source = input.accounts.find(a => a.id === draft.sourceId);
  const destination = input.accounts.find(a => a.id === draft.destinationId);
  if (!input.people.some(p => p.id === draft.ownerId) || source?.ownerId !== draft.ownerId || destination?.ownerId !== draft.ownerId
    || source.kind !== "traditional-ira" || destination.kind !== "roth-ira") throw new RangeError("Select a traditional IRA and Roth IRA belonging to the selected person.");
  const conversionsByYear = Object.fromEntries(Array.from({ length: end - start + 1 }, (_, i) => [start + i,
    [{ sourceId: source.id, destinationId: destination.id, amount }]]));
  return { ...input, conversionsByYear };
}

export function comparePreviewConversions(input: TimelineInput, draft: ConversionEditorState) {
  const baseline = runRetirementTimeline(input);
  if (!draft.enabled) return { baseline: null, result: baseline };
  const result = runRetirementTimeline(addPreviewConversions(input, draft));
  if (!result.allYearsFunded || !result.allRmdsSatisfied) throw new RangeError("This conversion schedule does not fully fund spending, taxes or required distributions. Reduce the amount or shorten the schedule.");
  for (const row of result.years) {
    if (row.result.cash.conversions.length && row.result.cash.accounts.some(a => a.accountId === draft.destinationId && a.voluntaryWithdrawal > 0)) {
      throw new RangeError("The conversion would require a same-year withdrawal from its Roth destination. Reduce the conversion or adjust available funding.");
    }
  }
  return { baseline, result };
}
