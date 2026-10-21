export type VerdictTone = "good" | "caution" | "risk" | "neutral";
export type MoveVerdict = { label: string; tone: VerdictTone; note: string };

/**
 * The monthly-budget verdict says whether you can live there; it does not know whether you can pay for the move. When savings fall short
 * of the one-time costs, the overall verdict says so instead of calling the move ready, and the monthly part stays visible in the wording.
 */
export function withUpfrontFunding(monthly: MoveVerdict, cashAfterUpfront: number): MoveVerdict {
  if (monthly.tone === "neutral" || !(cashAfterUpfront < 0)) return monthly;
  if (monthly.tone === "risk") {
    return {
      label: "Monthly budget and upfront funding both fall short",
      tone: "risk",
      note: `${monthly.note} Your savings also fall short of the one-time move costs, so more cash would be needed before moving.`,
    };
  }
  return {
    label: monthly.tone === "good" ? "Monthly budget works; upfront funding needed" : "Monthly budget is tight; upfront funding needed",
    tone: "caution",
    note: `${monthly.note} Your savings fall short of the one-time move costs, so this move needs more cash saved first.`,
  };
}
