import Link from "next/link";
import { buildFireAbroadLink } from "../lib/fireLink";

/**
 * "What does retiring here mean for FIRE?" for the international calculators. Passes the estimated monthly cost of living
 * at the destination, in US dollars; the FIRE calculator turns that into a FIRE number and a FIRE age.
 */
export default function FireAbroadLink({ monthlySpendingUsd, destination }: { monthlySpendingUsd: number; destination: string }) {
  if (!Number.isFinite(monthlySpendingUsd) || monthlySpendingUsd <= 0 || !destination.trim()) return null;
  const href = buildFireAbroadLink({ movedExpenses: monthlySpendingUsd, label: destination });
  return (
    <div className="my-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <p>
        At about <strong>{Math.round(monthlySpendingUsd).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</strong> a month,
        what would living in {destination} do to your path to financial independence?
      </p>
      <Link href={href} className="mt-3 inline-flex items-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
        See your FIRE number if you retire in {destination} →
      </Link>
    </div>
  );
}
