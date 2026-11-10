/**
 * Hands a relocation result to the mortgage calculator, so the visitor does not re-enter the home, loan, income and rent.
 * Only plain numbers and a state code travel in the link; every value is validated again on arrival.
 */
export type MortgageHandoff = {
  /** Lower-case state code of the home, for example "tx". */
  state?: string;
  homePrice?: number;
  downPct?: number;
  ratePct?: number;
  termYears?: number;
  propertyTaxPct?: number;
  insuranceMonthly?: number;
  hoaMonthly?: number;
  /** Household gross income per year. */
  grossIncome?: number;
  /** Rent the visitor pays now or would pay instead of buying, per month. */
  monthlyRent?: number;
  /** Where the home is, shown in the "prefilled from" note. */
  place?: string;
};

export const MORTGAGE_PATH = "/mortgage-calculator";
const TERMS = [10, 15, 20, 25, 30];

const KEYS: Array<[keyof MortgageHandoff, string, number, number]> = [
  ["homePrice", "price", 1, 100_000_000],
  ["downPct", "down", 0, 100],
  ["ratePct", "rate", 0.01, 30],
  ["propertyTaxPct", "tax", 0, 10],
  ["insuranceMonthly", "ins", 0, 100_000],
  ["hoaMonthly", "hoa", 0, 100_000],
  ["grossIncome", "income", 1, 100_000_000],
  ["monthlyRent", "rent", 0, 1_000_000],
];

const finite = (v: unknown, min: number, max: number): number | undefined => {
  const n = typeof v === "number" ? v : Number(v);
  return v !== null && v !== "" && Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

export function buildMortgageLink(m: MortgageHandoff): string {
  const qs = new URLSearchParams({ src: "move" });
  if (m.state && /^[a-z]{2}$/i.test(m.state)) qs.set("state", m.state.toLowerCase());
  for (const [field, key, min, max] of KEYS) {
    const n = finite(m[field], min, max);
    if (n !== undefined) qs.set(key, String(Math.round(n * 1000) / 1000));
  }
  if (m.termYears !== undefined && TERMS.includes(Math.round(m.termYears))) qs.set("term", String(Math.round(m.termYears)));
  const place = (m.place ?? "").replace(/[^\p{L}\p{N} .,'-]/gu, "").trim().slice(0, 60);
  if (place) qs.set("place", place);
  return `${MORTGAGE_PATH}?${qs.toString()}`;
}

/** The handoff carried by a link, or null when the link is not one. Out-of-range values are dropped, not clamped. */
export function parseMortgageLink(p: URLSearchParams): MortgageHandoff | null {
  if (p.get("src") !== "move") return null;
  const out: MortgageHandoff = {};
  const state = p.get("state");
  if (state && /^[a-z]{2}$/.test(state)) out.state = state;
  for (const [field, key, min, max] of KEYS) {
    const n = finite(p.get(key), min, max);
    if (n !== undefined) (out[field] as number) = n;
  }
  const term = finite(p.get("term"), 1, 50);
  if (term !== undefined && TERMS.includes(term)) out.termYears = term;
  const place = (p.get("place") ?? "").replace(/[^\p{L}\p{N} .,'-]/gu, "").trim().slice(0, 60);
  if (place) out.place = place;
  return out;
}
