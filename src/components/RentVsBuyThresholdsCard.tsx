import type { RentVsBuyThresholds } from "@/lib/rentVsBuy";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number) => `${(Math.round(n * 10) / 10).toString()}%`;

/**
 * Says what would change the rent-versus-buy conclusion, from the visitor's own numbers: not just who is ahead but how far the
 * scenario is from flipping. Shared by the Rent vs. Buy and mortgage calculators.
 */
export default function RentVsBuyThresholdsCard({
  thresholds,
  homePrice,
  monthlyRent,
  appreciationPct,
  years,
  horizonChosen = true,
}: {
  thresholds: RentVsBuyThresholds;
  homePrice: number;
  monthlyRent: number;
  appreciationPct: number;
  years: number;
  /** False when the page fixes the comparison at `years` instead of letting the visitor choose it. */
  horizonChosen?: boolean;
}) {
  const t = thresholds;
  const renting = t.winner === "rent";
  const items: string[] = [];

  if (renting) {
    items.push(
      t.breakEvenYears !== null
        ? `Staying longer: buying catches up with renting after about ${t.breakEvenYears} years ${horizonChosen ? `(you chose ${years})` : `(compared over ${years} years here)`}.`
        : "Staying longer: buying does not catch up with renting within 40 years at these numbers.",
    );
    if (t.homePrice !== null) items.push(`A cheaper home: at about ${money(t.homePrice)} (${pct(((homePrice - t.homePrice) / homePrice) * 100)} lower) buying draws level at ${years} years.`);
    if (t.monthlyRent !== null) items.push(`Higher rent: if rent were about ${money(t.monthlyRent)} a month instead of ${money(monthlyRent)}, buying draws level.`);
    if (t.appreciationPct !== null) items.push(`Faster appreciation: if the home gained about ${pct(t.appreciationPct)} a year instead of ${pct(appreciationPct)}, buying draws level.`);
  } else {
    items.push(
      t.breakEvenYears !== null
        ? `Staying long enough: buying only pulls ahead after about ${t.breakEvenYears} years; if you might sell sooner, renting could be ahead.`
        : "Buying is ahead for the whole period you chose.",
    );
    if (t.homePrice !== null) items.push(`A pricier home: at about ${money(t.homePrice)} (${pct(((t.homePrice - homePrice) / homePrice) * 100)} higher) renting draws level at ${years} years.`);
    if (t.monthlyRent !== null) items.push(`Lower rent: if rent were about ${money(t.monthlyRent)} a month instead of ${money(monthlyRent)}, renting draws level.`);
    if (t.appreciationPct !== null) items.push(`Slower appreciation: if the home gained about ${pct(t.appreciationPct)} a year instead of ${pct(appreciationPct)}, renting draws level.`);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">What would change the answer</div>
      <p className="mb-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
        {renting ? "Renting is ahead at these numbers." : "Buying is ahead at these numbers."} Each line changes one thing and keeps the rest as entered.
      </p>
      <ul className="space-y-1.5 text-sm leading-6 text-slate-700 dark:text-slate-300">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
