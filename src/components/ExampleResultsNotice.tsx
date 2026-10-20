"use client";

import { useEffect, useState } from "react";

/**
 * A short label for the results of a calculator that opens with sample inputs. It disappears as soon as the visitor changes any field
 * on the page, or when the page was opened from a link that carries the visitor's own numbers (`typed` in the address).
 */
export default function ExampleResultsNotice({ className = "" }: { className?: string }) {
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).has("typed")) {
        setEdited(true);
        return;
      }
    } catch { /* ignore */ }
    const onEdit = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) setEdited(true);
    };
    document.addEventListener("input", onEdit);
    document.addEventListener("change", onEdit);
    return () => {
      document.removeEventListener("input", onEdit);
      document.removeEventListener("change", onEdit);
    };
  }, []);

  if (edited) return null;
  return (
    <p
      role="note"
      className={`rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 ${className}`}
    >
      Example results from sample inputs. Change any field to see your own numbers.
    </p>
  );
}
