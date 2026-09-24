import type { TimelineInput } from "./timeline";
import type { SpendingSearchRequest } from "./spendingSearch";

export type SpendingSearchDraft = Readonly<{
  minSpending: string;
  maxSpending: string;
  resolution: string;
  /** Whole-percent success target, e.g. "90" for 90%. */
  successTarget: string;
  paths: string;
  seed: string;
  volatility: Readonly<Record<string, string>>;
}>;

function number(raw: string | undefined, label: string, min: number, max: number, integer = false) {
  if (typeof raw !== "string" || !raw.trim()) throw new RangeError(`Enter ${label}.`);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new RangeError(`Check ${label}.`);
  return value;
}

/** Validates and converts the spending-search form draft into a request, without
 * mutating the draft. Confirmation is required, matching the simulation panel. */
export function spendingSearchRequest(input: TimelineInput, draft: SpendingSearchDraft, confirmed: boolean): SpendingSearchRequest {
  if (!confirmed) throw new RangeError("Confirm the search assumptions first.");
  const minSpending = number(draft.minSpending, "minimum spending", 0, 1e12);
  const maxSpending = number(draft.maxSpending, "maximum spending", 0, 1e12);
  if (maxSpending <= minSpending) throw new RangeError("Maximum spending must be greater than minimum spending.");
  const resolution = number(draft.resolution, "resolution (whole dollars)", 1, 1e9, true);
  const successTargetPct = number(draft.successTarget, "success target (1–100%)", 1, 100);
  const paths = number(draft.paths, "path count (1–1000)", 1, 1000, true);
  const seed = number(draft.seed, "seed (0–4294967295)", 0, 0xffffffff, true);
  const volatilityByAccount = Object.fromEntries(input.accounts.filter(a => a.kind !== "cash" && a.kind !== "annuity")
    .map(a => [a.id, number(draft.volatility[a.id], `volatility for ${a.id} (0–100%)`, 0, 100) / 100]));
  return {
    minSpending, maxSpending, resolution, successTarget: successTargetPct / 100,
    simulation: { paths, seed, volatilityByAccount, returnModel: "lognormal-shared-market-nominal", conversionPolicy: "fixed-input-schedule" },
  };
}
