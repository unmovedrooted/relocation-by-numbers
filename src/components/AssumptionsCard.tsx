/**
 * Lists the assumptions behind a result and where each one came from, so a visitor can tell their own numbers from the site's
 * and knows which figures to replace with a real quote.
 */
export type AssumptionSource = "yours" | "city" | "planning" | "sample";

export type AssumptionItem = { label: string; value: string; source: AssumptionSource; note?: string };

const SOURCE_STYLE: Record<AssumptionSource, { label: string; cls: string }> = {
  yours: { label: "Your input", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
  city: { label: "City data", cls: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300" },
  planning: { label: "Planning assumption", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  sample: { label: "Sample value", cls: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
};

/** "yours" when the value differs from the starting value, otherwise the kind of default it is. */
export function sourceFor(value: string, startingValue: string, whenUntouched: Exclude<AssumptionSource, "yours">): AssumptionSource {
  return value.trim() !== startingValue.trim() ? "yours" : whenUntouched;
}

export default function AssumptionsCard({ items, replaceHint, dark = false }: { items: AssumptionItem[]; replaceHint?: string; dark?: boolean }) {
  const used = (Object.keys(SOURCE_STYLE) as AssumptionSource[]).filter((s) => items.some((i) => i.source === s));
  const card = dark
    ? "rounded-2xl border border-white/10 bg-white/5 p-5"
    : "rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800";
  const head = dark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-900 dark:text-slate-100";
  const muted = dark ? "text-slate-300" : "text-slate-500 dark:text-slate-400";
  const text = dark ? "text-slate-200" : "text-slate-700 dark:text-slate-300";
  return (
    <div className={card}>
      <div className={head}>Assumptions behind this result</div>
      <p className={`mb-3 mt-1 text-xs leading-5 ${muted}`}>
        {replaceHint ?? "Replace a default with a real quote or your own figure to firm up the answer."}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className={`flex flex-col gap-1 border-b border-black/5 pb-2 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4 dark:border-white/10 ${text}`}>
            <span className="min-w-0 sm:basis-2/5">
              {item.label}
              {item.note && <span className={`block text-[11px] ${muted}`}>{item.note}</span>}
            </span>
            <span className="min-w-0 sm:basis-3/5 sm:text-right">
              <span className="block font-semibold">{item.value}</span>
              <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${SOURCE_STYLE[item.source].cls}`}>{SOURCE_STYLE[item.source].label}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className={`mt-3 text-[11px] leading-4 ${muted}`}>
        {used.map((s) => SOURCE_STYLE[s].label).join(" · ")}.{" "}
        {used.includes("city") && "City data comes from Census, BEA and other public sources for the city you chose. "}
        {used.includes("planning") && "Planning assumptions are the site's starting estimates, not quotes or forecasts. "}
        {used.includes("sample") && "Sample values are placeholders until you enter your own."}
      </p>
    </div>
  );
}
