import Link from "next/link";
import { STATES, type StateCode } from "../lib/states";
import { getStateRuleNote, PAYROLL_PROGRAMS_NOTE, taxRulesVerifiedLabel, TAX_YEAR } from "../lib/taxRuleNotes";

/**
 * Tax year, verification date and any held or derived state figures for the states a calculator is using.
 * Shows only what applies, so a calculator on a fully published state shows a single short line.
 */
export default function TaxAssumptionsNote({ states, includePayrollNote = false, omitStates = [], className = "" }: { states: Array<StateCode | undefined>; includePayrollNote?: boolean; /** States whose note is shown elsewhere on the page. */ omitStates?: StateCode[]; className?: string }) {
  const unique = [...new Set(states.filter((s): s is StateCode => Boolean(s) && !omitStates.includes(s as StateCode)))];
  const notes = unique
    .map((code) => ({ code, name: STATES.find((s) => s.code === code)?.name ?? code.toUpperCase(), note: getStateRuleNote(code) }))
    .filter((item) => item.note !== null);
  return (
    <div className={`text-xs leading-5 text-slate-500 dark:text-slate-400 ${className}`}>
      <div>
        {TAX_YEAR} tax rules from IRS and state government publications, checked {taxRulesVerifiedLabel()}.{" "}
        <Link href="/methodology" className="underline underline-offset-2">Methodology and sources</Link>
      </div>
      {includePayrollNote && <div className="mt-1">{PAYROLL_PROGRAMS_NOTE}</div>}
      {notes.map((item) => (
        <div key={item.code} className="mt-1">
          <span className="font-medium text-slate-600 dark:text-slate-300">{item.name}:</span> {item.note!.note}
        </div>
      ))}
    </div>
  );
}
