"use client";

import { useEffect, useRef, useState } from "react";

/** One input the visitor can change: its label and the text shown for its current value. */
export type TrackedField = { label: string; value: string };
/** One headline result: what it is called, its value, and how to write it. */
export type TrackedOutput = { label: string; value: number | null; format: (n: number) => string; unit?: { singular: string; plural: string } };

/**
 * Explains a change in the result after the visitor edits an input: which input they changed and how each headline result moved.
 * The note appears once typing pauses, only when one or two inputs changed (a pasted link or a reset changes many) and only when a result
 * actually moved. It names the input that changed rather than guessing at hidden causes. No financial inputs leave the page.
 * Changes that happen without the visitor touching the page (defaults loading once a city is known, a restored link) are absorbed silently.
 */
export function useChangeNote(fields: Record<string, TrackedField>, outputs: TrackedOutput[], settleMs = 700): { note: string | null; dismiss: () => void } {
  const committed = useRef<{ fields: Record<string, TrackedField>; outputs: TrackedOutput[] } | null>(null);
  const latest = useRef({ fields, outputs });
  latest.current = { fields, outputs };
  const [note, setNote] = useState<string | null>(null);
  const touched = useRef(false);

  // Only a visitor's own keystroke, click or choice can make a change worth explaining.
  useEffect(() => {
    const mark = () => { touched.current = true; };
    const events = ["input", "change", "click", "keydown"] as const;
    events.forEach((e) => document.addEventListener(e, mark, true));
    return () => events.forEach((e) => document.removeEventListener(e, mark, true));
  }, []);

  // A stable signature so the effect reruns only when an input or a result changes.
  const signature = JSON.stringify([Object.entries(fields).map(([k, f]) => [k, f.value]), outputs.map((o) => o.value)]);

  useEffect(() => {
    if (committed.current === null) {
      committed.current = { fields: latest.current.fields, outputs: latest.current.outputs };
      return;
    }
    const timer = window.setTimeout(() => {
      const before = committed.current;
      const now = latest.current;
      if (!before) return;
      const changed = Object.keys(now.fields).filter((k) => before.fields[k] !== undefined && before.fields[k].value !== now.fields[k].value);
      const moved = now.outputs
        .map((o, i) => ({ o, was: before.outputs[i]?.value ?? null }))
        .filter(({ o, was }) => o.value !== null && was !== null && Math.abs(o.value - was) > 1e-9);
      committed.current = { fields: now.fields, outputs: now.outputs };
      const byVisitor = touched.current;
      touched.current = false;
      if (!byVisitor) return;
      if (changed.length === 0 || changed.length > 2) { setNote(null); return; }
      if (moved.length === 0) {
        setNote(`You changed ${changed.map((k) => `${now.fields[k].label} from ${before.fields[k].value} to ${now.fields[k].value}`).join(" and ")}. The result did not change.`);
        return;
      }
      const what = changed.map((k) => `${now.fields[k].label} from ${before.fields[k].value} to ${now.fields[k].value}`).join(" and ");
      const effects = moved.map(({ o, was }) => `${o.label} moved from ${o.format(was as number)} to ${o.format(o.value as number)}`).join("; ");
      setNote(`You changed ${what}. ${effects.charAt(0).toUpperCase()}${effects.slice(1)}.`);
    }, settleMs);
    return () => window.clearTimeout(timer);
  }, [signature, settleMs]);

  return { note, dismiss: () => setNote(null) };
}
