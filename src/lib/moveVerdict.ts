export type VerdictTone = "good" | "caution" | "risk" | "neutral";
export type MoveVerdict = { label: string; tone: VerdictTone; note: string };

/** Below this many months of destination costs left after the one-time costs, the cash runway is called short (the same line the answer panel draws). */
export const SHORT_RUNWAY_MONTHS = 3;

/**
 * The monthly-budget verdict says whether you can live there; it does not know whether you can pay for the move. When savings fall short
 * of the one-time costs, the overall verdict says so instead of calling the move ready, and the monthly part stays visible in the wording.
 *
 * A comfortable monthly budget is also not called ready when the cash left after the one-time costs covers less than
 * SHORT_RUNWAY_MONTHS of costs: `cushionMonths` is that cushion in months of destination costs, counting any emergency reserve
 * the visitor set aside. Leave it out to skip the check.
 */
export function withUpfrontFunding(monthly: MoveVerdict, cashAfterUpfront: number, cushionMonths?: number): MoveVerdict {
  if (monthly.tone === "neutral") return monthly;
  if (!(cashAfterUpfront < 0)) {
    if (monthly.tone === "good" && typeof cushionMonths === "number" && Number.isFinite(cushionMonths) && cushionMonths < SHORT_RUNWAY_MONTHS) {
      return {
        label: "Monthly budget works; cash runway is short",
        tone: "caution",
        note: `${monthly.note} After the one-time move costs, your remaining savings, including any emergency reserve you set aside, would cover about ${cushionMonths.toFixed(1)} months of costs there. That leaves little room if income is delayed or costs run over.`,
      };
    }
    return monthly;
  }
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
