/**
 * Anonymous usage events, to see where visitors get stuck. Only the event names below can be sent, with a calculator name or a page path
 * and nothing else: never a number, a city, an address query string or anything a visitor typed. Events are sent only when Google
 * Analytics is already loaded (production, with an ID set) and the browser has not asked not to be tracked.
 */
export type UsageEvent = "calculator_start" | "calculator_first_edit" | "calculator_result_viewed" | "next_tool_click";

/** Pages that are calculators, so an event can say which one without recording anything about the visitor. */
export const CALCULATOR_PATHS = [
  "/", "/fire-calculator", "/lean-fire-calculator", "/barista-fire-calculator", "/coast-fire-calculator", "/chubby-fire-calculator",
  "/fat-fire-calculator", "/fire-number-calculator", "/savings-rate-for-fire", "/how-much-do-i-need-to-retire", "/international-relocation",
  "/europe-relocation-calculator", "/asia-relocation-calculator", "/south-america-relocation-calculator", "/caribbean-relocation-calculator",
  "/mortgage-calculator", "/rent-vs-buy-calculator", "/housing-affordability-calculator", "/paycheck-calculator", "/income-tax-calculator",
  "/compare-cities", "/one-income-relocation-calculator", "/retirement-calculator", "/retirement-withdrawal-calculator", "/401k-calculator",
  "/hsa-calculator", "/roth-conversion-calculator", "/rmd-calculator", "/complete-retirement-plan", "/investment-calculator",
] as const;

export function isCalculatorPath(pathname: string): boolean {
  return (CALCULATOR_PATHS as readonly string[]).includes(pathname);
}

type Gtag = (command: "event", name: string, params: Record<string, string>) => void;

/** Sends one event. `where` is a calculator path or the destination path of a link, never including a query string or fragment. */
export function trackUsage(name: UsageEvent, where: string): void {
  if (typeof window === "undefined") return;
  if (navigator.doNotTrack === "1") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function") return;
  const path = where.split("?")[0].split("#")[0].slice(0, 120);
  gtag("event", name, { page_path: path });
}
