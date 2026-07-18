"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

export function parseCalculatorNumber(raw: string): number {
  const parsed = raw.trim() === "" ? 0 : Number(raw.trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

type CalculatorNumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  id?: string;
  ariaLabel?: string;
  prefix?: string;
  suffix?: string;
  helpText?: string;
  error?: string;
  info?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  inputMode?: "decimal" | "numeric";
  className?: string;
};

export default function CalculatorNumberField({
  label,
  value,
  onChange,
  id,
  ariaLabel,
  prefix,
  suffix,
  helpText,
  error,
  info,
  required = false,
  disabled = false,
  min,
  max,
  step,
  inputMode = "numeric",
  className = "",
}: CalculatorNumberFieldProps) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = id ?? `calculator-number-${generatedId}`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const describedBy = [helpText ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  const [raw, setRaw] = useState(value === 0 ? "" : String(value));

  useEffect(() => {
    // Presets and URL hydration can replace the last committed value externally.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRaw(value === 0 ? "" : String(value));
  }, [value]);

  return (
    <div className={`block ${className}`.trim()}>
      <div className="mb-1 flex items-center text-[11px] font-medium leading-tight text-slate-300">
        {label ? <label htmlFor={inputId}>{label}</label> : null}
        {required ? <span className="ml-1" aria-hidden="true">*</span> : null}
        {info}
      </div>
      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 shadow-inner transition focus-within:border-emerald-400/50 focus-within:ring-4 focus-within:ring-emerald-400/10">
        {prefix ? <span className="mr-2 text-sm text-slate-400" aria-hidden="true">{prefix}</span> : null}
        <input
          id={inputId}
          type="text"
          inputMode={inputMode}
          value={raw}
          aria-label={label ? undefined : ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
          onChange={(event) => setRaw(event.target.value)}
          onBlur={() => {
            const safe = parseCalculatorNumber(raw);
            onChange(safe);
            setRaw(safe === 0 ? "" : String(safe));
          }}
        />
        {suffix ? <span className="ml-2 text-sm text-slate-400" aria-hidden="true">{suffix}</span> : null}
      </div>
      {helpText ? <p id={helpId} className="mt-1 text-xs text-slate-400">{helpText}</p> : null}
      {error ? <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-rose-300">{error}</p> : null}
    </div>
  );
}
