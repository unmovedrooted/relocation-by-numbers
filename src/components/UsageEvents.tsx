"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isCalculatorPath, trackUsage } from "@/lib/analytics";

/**
 * Counts, per calculator page, when a visitor starts (first focus in a form), makes a first edit, sees a result after editing, and
 * follows a "next step" link. It records only the event and the page path (see lib/analytics.ts), once per page view.
 */
export default function UsageEvents() {
  const pathname = usePathname();

  useEffect(() => {
    const onCalculator = isCalculatorPath(pathname);
    let started = false;
    let edited = false;
    let resultSent = false;

    const inForm = (el: EventTarget | null) => el instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !el.closest("header, nav, footer");

    const onFocus = (e: FocusEvent) => {
      if (!onCalculator || started || !inForm(e.target)) return;
      started = true;
      trackUsage("calculator_start", pathname);
    };
    // eslint-disable-next-line prefer-const
    let onScroll: () => void = () => {};
    const onEdit = (e: Event) => {
      if (!onCalculator || edited || !inForm(e.target)) return;
      edited = true;
      trackUsage("calculator_first_edit", pathname);
      // On wide screens the results are already beside the form, so check once shortly after the first edit.
      window.setTimeout(onScroll, 1000);
    };
    // A result counts as viewed once, after the visitor has edited something and the results are on screen.
    onScroll = () => {
      if (!onCalculator || !edited || resultSent) return;
      const results = document.querySelector<HTMLElement>("[id$='-results']");
      if (!results) return;
      const rect = results.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
        resultSent = true;
        trackUsage("calculator_result_viewed", pathname);
      }
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || !link.closest("[data-next-step]")) return;
      try {
        const url = new URL(link.href, window.location.origin);
        if (url.origin === window.location.origin) trackUsage("next_tool_click", url.pathname);
      } catch { /* ignore */ }
    };

    document.addEventListener("focusin", onFocus);
    document.addEventListener("input", onEdit);
    document.addEventListener("change", onEdit);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("input", onEdit);
      document.removeEventListener("change", onEdit);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, [pathname]);

  return null;
}
