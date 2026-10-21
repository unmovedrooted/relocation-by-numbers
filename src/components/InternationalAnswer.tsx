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
  cashAfterUpfront,
  comfortLabel,
  displayAmount,
}: {
  toCityLabel: string;
  salaryReady: boolean;
  monthlyFlexibility: number;
  upfrontCashNeeded: number;
  monthsCovered: number;
  /** Savings left after the upfront costs, in dollars; negative when they fall short. */
  cashAfterUpfront: number;
  comfortLabel: string;
  displayAmount: (amountUsd: number, digits?: number) => string;
}) {
  if (!salaryReady) return null;
  const left = monthlyFlexibility >= 0
    ? `About ${displayAmount(monthlyFlexibility, 0)} a month is left in ${toCityLabel} after taxes, housing and core living costs.`
    : `Housing and core living costs in ${toCityLabel} would exceed take-home pay by about ${displayAmount(Math.abs(monthlyFlexibility), 0)} a month.`;
  const runway = cashAfterUpfront < 0
    ? ` Your savings are about ${displayAmount(Math.abs(cashAfterUpfront), 0)} short of that.`
    : ` That would leave about ${displayAmount(cashAfterUpfront, 0)} in savings${Number.isFinite(monthsCovered) ? `, enough for about ${monthsCovered.toFixed(1)} months of costs` : ""}.`;
  // Three separate questions: can you live there, can you afford the move, and how long would savings last afterward.
  const cashOk = cashAfterUpfront >= 0;
  const runwayMonths = Number.isFinite(monthsCovered) ? monthsCovered : 0;
  const runwayLabel = runwayMonths >= 6 ? "Solid" : runwayMonths >= 3 ? "Moderate" : "Short";
  const tone = (good: boolean | "mid") => good === true ? "text-emerald-700 dark:text-emerald-300" : good === "mid" ? "text-amber-700 dark:text-amber-300" : "text-rose-700 dark:text-rose-300";
  const rows: Array<{ label: string; value: string; note: string; good: boolean | "mid" }> = [
    { label: "Monthly budget", value: comfortLabel, note: monthlyFlexibility >= 0 ? `${displayAmount(monthlyFlexibility, 0)} left each month` : "Costs exceed take-home pay", good: monthlyFlexibility < 0 ? false : /comfortable|strong|healthy/i.test(comfortLabel) ? true : "mid" },
    { label: "Cash after upfront costs", value: `${cashAfterUpfront < 0 ? "-" : ""}${displayAmount(Math.abs(cashAfterUpfront), 0)}`, note: cashOk ? "Savings left after upfront costs and any emergency reserve you set aside" : "Short of the upfront costs", good: cashOk },
    { label: "Additional runway", value: runwayLabel, note: `${runwayMonths.toFixed(1)} months of costs beyond upfront costs and your reserved emergency fund`, good: runwayMonths >= 6 ? true : runwayMonths >= 3 ? "mid" : false },
  ];
  return (
    <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
      <p className="text-base font-semibold leading-snug text-slate-900 dark:text-white">{left}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
        You would need about {displayAmount(upfrontCashNeeded, 0)} upfront, including deposits and any emergency buffer.{runway}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{r.label}</div>
            <div className={`text-sm font-semibold ${tone(r.good)}`}>{r.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
