"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

type CalculatorSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  id?: string;
  wrapperClassName?: string;
  helpText?: string;
  error?: string;
  info?: ReactNode;
};

export default function CalculatorSelect({
  label,
  id,
  wrapperClassName = "",
  helpText,
  error,
  info,
  required,
  className,
  children,
  ...selectProps
}: CalculatorSelectProps) {
  const generatedId = useId().replace(/:/g, "");
  const selectId = id ?? `calculator-select-${generatedId}`;
  const helpId = `${selectId}-help`;
  const errorId = `${selectId}-error`;
  const describedBy = [helpText ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`text-sm ${wrapperClassName}`.trim()}>
      <div className="mb-1 flex items-center text-xs font-medium leading-4 text-slate-600 dark:text-slate-400">
        <label htmlFor={selectId}>{label}</label>
        {required ? <span className="ml-1" aria-hidden="true">*</span> : null}
        {info}
      </div>
      <select
        {...selectProps}
        id={selectId}
        required={required}
        className={className}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
      >
        {children}
      </select>
      {helpText ? <div id={helpId} className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helpText}</div> : null}
      {error ? <div id={errorId} role="alert" className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</div> : null}
    </div>
  );
}
