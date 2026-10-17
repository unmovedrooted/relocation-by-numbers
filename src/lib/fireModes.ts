/** One-line explanation of what each FIRE calculator mode answers. Shown in the page header, and repeated in the calculator's method note. */
export type FireModeKey = "standard" | "lean" | "coast" | "barista";

export const MODE_NOTES: Record<FireModeKey, string> = {
  standard: "Estimates the portfolio you need to cover your full lifestyle indefinitely at your chosen withdrawal rate.",
  lean: "Shows how a lower spending target shrinks the portfolio you need, and how much faster Lean FIRE arrives vs a higher-spending plan.",
  coast: "Answers a different question: do you already have enough that compound growth alone can carry you to retirement without another dollar contributed?",
  barista: "Part-time income reduces the gap your portfolio must cover. The lower the gap, the smaller the number, and the sooner you can walk away from full-time work.",
};
