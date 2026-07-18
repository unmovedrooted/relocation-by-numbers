"use client";

import { useId, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";

export function getImmediateNumberValue(event: Pick<ChangeEvent<HTMLInputElement>, "target">): string {
  return event.target.value;
}

type CalculatorImmediateNumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "value" | "onChange"> & {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  helpText?: ReactNode;
  error?: ReactNode;
  info?: ReactNode;
  prefix?: string;
  suffix?: string;
  wrapperClassName?: string;
};

export default function CalculatorImmediateNumberField({
  label,
  value,
  onChange,
  id,
  helpText,
  error,
  info,
  prefix,
  suffix,
  required,
  className,
  wrapperClassName = "",
  inputMode = "decimal",
  ...inputProps
}: CalculatorImmediateNumberFieldProps) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = id ?? `calculator-immediate-number-${generatedId}`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const describedBy = [helpText ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`text-sm ${wrapperClassName}`.trim()}>
      <div className="mb-1 flex items-center text-xs font-medium leading-4 text-slate-600 dark:text-slate-400">
        <label htmlFor={inputId}>{label}</label>
        {required ? <span className="ml-1" aria-hidden="true">*</span> : null}
        {info}
      </div>
      <div className="relative flex items-center">
        {prefix ? <span className="pointer-events-none absolute left-3 text-sm text-slate-500 dark:text-slate-400" aria-hidden="true">{prefix}</span> : null}
        <input
          {...inputProps}
          id={inputId}
          type="number"
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(getImmediateNumberValue(event))}
          required={required}
          className={`${className ?? ""} ${prefix ? "pl-8" : ""} ${suffix ? "pr-10" : ""}`.trim()}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
        />
        {suffix ? <span className="pointer-events-none absolute right-3 text-sm text-slate-500 dark:text-slate-400" aria-hidden="true">{suffix}</span> : null}
      </div>
      {helpText ? <div id={helpId} className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helpText}</div> : null}
      {error ? <div id={errorId} role="alert" className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</div> : null}
    </div>
  );
}
