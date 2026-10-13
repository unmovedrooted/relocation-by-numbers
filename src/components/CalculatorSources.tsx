import Link from "next/link";
import { CALCULATOR_INFO, SOURCES_REVIEWED_ON, type SourceRef } from "../lib/calculatorSources";
import { taxRulesVerifiedLabel, TAX_YEAR } from "../lib/taxRuleNotes";

function reviewedLabel(): string {
  const [y, m, d] = SOURCES_REVIEWED_ON.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function SourceLink({ source, linkClass }: { source: SourceRef; linkClass: string }) {
  if (source.url.startsWith("/")) return <Link href={source.url} className={linkClass}>{source.label}</Link>;
  return <a href={source.url} target="_blank" rel="noopener noreferrer" className={linkClass}>{source.label}</a>;
}

/**
 * Tax year, review date, sources and known exclusions for one calculator, from src/lib/calculatorSources.ts.
 * Render it near the end of a calculator page. `tone="dark"` is for pages with a fixed dark background.
 */
export default function CalculatorSources({ path, tone = "light" }: { path: string; tone?: "light" | "dark" }) {
  const info = CALCULATOR_INFO[path];
  if (!info) return null;
  const box = tone === "dark"
    ? "border-white/10 bg-white/5 text-slate-300"
    : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400";
  const heading = tone === "dark" ? "text-white" : "text-slate-900 dark:text-slate-100";
  const linkClass = "underline underline-offset-2 hover:opacity-80";
  return (
    <section aria-label={`Sources and limits for the ${info.name}`} className={`mx-auto my-6 w-full max-w-5xl rounded-2xl border p-5 text-xs leading-5 sm:text-sm sm:leading-6 ${box}`}>
      <h2 className={`text-sm font-semibold sm:text-base ${heading}`}>Sources and limits</h2>
      <p className="mt-1">
        {info.taxDriven
          ? <>Tax figures come from IRS and state government publications ({TAX_YEAR} rules, checked {taxRulesVerifiedLabel()}). </>
          : null}
        Sources and limits reviewed {reviewedLabel()}.{" "}
        <Link href="/methodology" className={linkClass}>Full methodology</Link>
      </p>

      {info.sources.length > 0 && (
        <>
          <h3 className={`mt-3 font-medium ${heading}`}>Sources</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {info.sources.map((source) => (
              <li key={source.url}><SourceLink source={source} linkClass={linkClass} /></li>
            ))}
          </ul>
        </>
      )}

      {info.notes && info.notes.length > 0 && (
        <div className="mt-3 space-y-1">
          {info.notes.map((note) => <p key={note}>{note}</p>)}
        </div>
      )}

      <h3 className={`mt-3 font-medium ${heading}`}>Not included</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {info.exclusions.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
