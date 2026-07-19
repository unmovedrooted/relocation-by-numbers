# Phase 7 — Tier 1 Build Plan

Scope: CSV export, retirement planner cross-linking, salary negotiation estimator. AI advisor dropped per decision. Grounded in the actual current codebase (no auth, no database — everything is static pages plus URL-param state).

---

## 1. CSV Export

**What exists today:** `Calculator.tsx`'s numbers aren't in one tidy object. The core results live in a `results` memo (`Calculator.tsx:571`) with fields like `salaryReady`, `buyReady`, `netFromMonthly`, `netToMonthly`, `grossMonthly`, `monthlyIncomeDiff`. But several values users would actually want in an export — `trueMonthlyLeftover`, `maxSafeHousing`, `neededSalary`, `verdict`, `comparable` (COL-adjusted salary), `targetBreakdown` — live in separate memos outside that object.

`MortgageCalculator.tsx` is worse: no aggregated object at all. Each tab (Purchase, Refinance, and a third block) computes ~30 loose `const`s independently in the component body.

**Plan:**
- Phase 1a: `src/lib/csvExport.ts` — a small dependency-free helper (`downloadCsv(filename, rows)`) that builds a CSV string and triggers a browser download via a Blob + temporary `<a>` tag. No new npm package needed.
- Phase 1b: In `Calculator.tsx`, add one more memo that flattens `results` + the six sibling memos into a single row object, wire an "Export CSV" button next to the existing "Share scenario" button.
- Phase 1c: Extend the same pattern to the regional calculators (Caribbean/Asia/Europe/South America/International) — they follow a similar results-shape to `Calculator.tsx` based on earlier dark-mode work, so this should mostly be copy-adapt once 1b is proven.
- Phase 1d (separate, don't bundle): `MortgageCalculator.tsx` needs its own pass since nothing is aggregated and each tab is independent. Ship Purchase-tab export first (highest traffic), Refinance later.

**Effort:** 1b is a half-day. 1c is an hour or two per calculator once the pattern exists. 1d is its own small project — budget it separately, don't treat it as "the same feature."

---

## 2. Retirement Planner Cross-Linking

**What exists today:** Zero links currently run from the FIRE calculator side back to relocation/cost-of-living pages — confirmed by search. One-way links already exist forward (`cost-of-living/[cityId]/page.tsx` → `/fire-in/[cityId]` or `/fire-calculator`).

Prefill support is asymmetric:
- `Calculator.tsx` already accepts `initialToState` / `initialToCityId` props (proven — `cost-of-living/[cityId]/page.tsx` uses them today). Pointing the FIRE side at the relocation calculator with a prefilled destination is nearly free.
- `FireCalculator.tsx` only accepts `initialIncome` and `hideFAQ` as props. It has no city/expense/age prefill — `defaultsForMode()` seeds everything else from hardcoded defaults. Getting relocation numbers *into* the FIRE calculator needs new plumbing.

**Plan:**
- Phase 2a (cheap, do first): On relocation calculator result screens, add a "See your FIRE number after this move" CTA linking to `/fire-calculator?income=<netFromMonthly*12>` — but this requires each `fire-calculator`-family page (`fire-calculator/page.tsx`, `coast-fire-calculator/page.tsx`, etc.) to read an `income` searchParam and pass it into `initialIncome`, since that prop currently only gets set by hardcoded values, not URL. Small, mechanical change across ~6 page files.
- Phase 2b (also cheap, since Calculator.tsx already supports it): On `best-states-for-fire`/`best-cities-for-fire` result pages, add a "Full relocation cost breakdown for [state]" link into the relocation calculator using the existing `initialToState`/`initialToCityId` props. This is close to a pure linking task, no new prefill engineering needed.
- Phase 2c (defer): Passing more than income (age, current expenses, target retirement date) into the FIRE calculator would need real prop additions to `FireCalculatorProps` and touches `defaultsForMode()`. Worth doing only if 2a/2b show engagement.

**Effort:** 2a and 2b together are a small, well-bounded piece of work — a day or so including testing the URL param plumbing across the FIRE page variants. 2c is open-ended; don't commit to it yet.

---

## 3. Salary Negotiation Estimator

**What exists today:** Two separate salary-target formulas already live in the codebase:
- `Calculator.tsx`'s `comparable` memo: COL-adjusted equivalent salary using a weighted cost-of-living index (housing 35%, groceries 15%, utilities 10%, transport 15%, healthcare 10%, +15% flat), falling back to a rent-ratio blend when full COL data isn't available.
- `cost-of-living/[cityId]/page.tsx`'s Tighter/Target/Comfort: annualized rent divided by 35%/30%/28% rent-to-income ratios.

Also worth checking before building: `salary-needed-in/[cityId]/page.tsx` already exists in the FIRE-branded page set and may cover overlapping ground — needs a quick read to confirm it's not already doing most of this.

**Plan:**
- Phase 3a: Extract the `colIndex`/ratio math out of `Calculator.tsx` into `src/lib/salaryComparison.ts` as a standalone, reusable function. Clean refactor, low risk, unlocks reuse elsewhere.
- Phase 3b: Add a "Negotiation range" card embedded in the existing calculator result panel (`Calculator.tsx`, and eventually the regional calculators) — shows current offer vs. computed target/comfort salary, a suggested ask (midpoint of target–comfort), and a one-line justification using the already-computed COL delta %. Rides existing traffic, no new route needed.
- Phase 3c (defer pending the `salary-needed-in` check above): A standalone `/salary-negotiation-calculator` page for people who land directly via search, without running the full relocation calculator first.

**Effort:** 3a is small (pure refactor). 3b is a day or so of UI work once 3a is done. 3c should wait until we confirm it's not redundant with `salary-needed-in`.

---

## Recommended build order

1. CSV export for `Calculator.tsx` only (1a + 1b) — self-contained, immediately shippable.
2. Retirement cross-linking, both directions (2a + 2b) — small, and 2b is nearly free given existing prefill support.
3. Salary negotiation estimator, extracted logic + embedded card (3a + 3b) — reuses proven math, no new route.

Everything past this line (Mortgage CSV export, deeper FIRE prefill, standalone negotiation page, extending CSV/negotiation to regional calculators) is real but should be scoped as its own follow-up once the above ships and we see usage.
