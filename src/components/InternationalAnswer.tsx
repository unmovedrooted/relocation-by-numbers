/**
 * The answer in two sentences, above the detailed breakdown on the international calculators: what is left each month in the
 * destination, what has to be paid up front, and how long savings last after that. All amounts arrive already converted for display.
 */
export default function InternationalAnswer({
  toCityLabel,
  salaryReady,
  monthlyFlexibility,
  upfrontCashNeeded,
  monthsCovered,
  comfortLabel,
  displayAmount,
}: {
  toCityLabel: string;
  salaryReady: boolean;
  monthlyFlexibility: number;
  upfrontCashNeeded: number;
  monthsCovered: number;
  comfortLabel: string;
  displayAmount: (amountUsd: number, digits?: number) => string;
}) {
  if (!salaryReady) return null;
  const left = monthlyFlexibility >= 0
    ? `About ${displayAmount(monthlyFlexibility, 0)} a month is left in ${toCityLabel} after taxes, housing and core living costs.`
    : `Housing and core living costs in ${toCityLabel} would exceed take-home pay by about ${displayAmount(Math.abs(monthlyFlexibility), 0)} a month.`;
  const runway = !Number.isFinite(monthsCovered)
    ? ""
    : monthsCovered <= 0
      ? " Your savings do not cover the upfront costs."
      : ` After that, your savings would cover about ${monthsCovered.toFixed(1)} months of costs.`;
  return (
    <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
      <p className="text-base font-semibold leading-snug text-slate-900 dark:text-white">{left}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
        You would need about {displayAmount(upfrontCashNeeded, 0)} upfront, including deposits and any emergency buffer.{runway} Overall: {comfortLabel.toLowerCase()}.
      </p>
    </div>
  );
}
