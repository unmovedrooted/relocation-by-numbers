"use client";

/** The "why did this change" line shown above a calculator's results; see useChangeNote. */
export default function ChangeNote({ note, onDismiss, dark = false }: { note: string | null; onDismiss: () => void; dark?: boolean }) {
  if (!note) return null;
  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs leading-5 ${
        dark
          ? "border-sky-300/30 bg-sky-300/10 text-sky-100"
          : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100"
      }`}
    >
      <span>{note}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 font-semibold opacity-70 hover:opacity-100">×</button>
    </div>
  );
}
