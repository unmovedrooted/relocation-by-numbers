"use client";

import { NO_US_OVERLAY, US_SELF_EMPLOYED_QUESTION, US_TAX_STATUS_QUESTION } from "../lib/internationalTaxes";

/**
 * "Do you owe U.S. income tax while living there?" for calculators that do not draw it from their own question list.
 * Choosing Yes adds the U.S. tax a citizen or green-card holder still owes (see usTaxAbroadAddition).
 */
export default function UsTaxQuestion({ countryCode, countryName, value, onChange, selfEmployed, onSelfEmployedChange, selectClassName }: {
  countryCode: string;
  countryName: string;
  value: string;
  onChange: (value: string) => void;
  selfEmployed: string;
  onSelfEmployedChange: (value: string) => void;
  selectClassName: string;
}) {
  if (NO_US_OVERLAY.has(countryCode)) return null;
  const q = US_TAX_STATUS_QUESTION;
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
      <div className="mb-3 text-sm font-semibold">{countryName}, Tax Question</div>
      <label className="block text-sm">
        <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">{q.label}</div>
        <select id="us-tax-status" className={selectClassName} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {q.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {q.helpText && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{q.helpText}</p>}
      </label>
      <label className="mt-4 block text-sm">
        <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">{US_SELF_EMPLOYED_QUESTION.label}</div>
        <select id="us-self-employed" className={selectClassName} value={selfEmployed} onChange={(e) => onSelfEmployedChange(e.target.value)}>
          <option value="">Select…</option>
          {US_SELF_EMPLOYED_QUESTION.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {US_SELF_EMPLOYED_QUESTION.helpText && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{US_SELF_EMPLOYED_QUESTION.helpText}</p>}
      </label>
    </div>
  );
}
