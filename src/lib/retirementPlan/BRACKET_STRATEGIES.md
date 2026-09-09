# Pure bracket strategy evaluator

No UI or optimizer integration in this batch. Four candidates: baseline and annual fills to the 12%, 22%, 24% ordinary-income bracket ceilings. Ceilings come from the settlement engine's existing 2026 tables and its explicit growth assumption.

One selected owner's traditional IRA converts to their Roth IRA. Default window starts at the latest first full retired calendar year (January 1 retirement includes that year), ending before the earliest statutory RMD year, clipped to the horizon. An empty window is explicit; overrides must lie within the horizon.

Each annual amount uses a bounded cent-resolution bisection of settled ordinary taxable income and funding feasibility, after RMDs, under the already selected prior-year schedule. This is an annual bracket-fill policy, not a proof of global optimality or a combinatorial search. The first evaluator restricts inputs to retirement/cash accounts, wages, pensions and Social Security, without positive contributions. Candidate failures are returned with reasons. No hidden fallback or silently reduced fixed manual schedule.

Prefix reruns keep the original timeline start, income origins and historical MAGI. They trim only year-indexed configuration beyond the prefix. Each completed candidate then runs through the entire original horizon. IRMAA remains spending, uses its own two-year history, and is not a disqualifier. Post-horizon costs are excluded.

Ranking requires every year funded and all RMDs satisfied, then uses the approved terminal valuation rate identically across candidates. Sensitivity revalues the same projection at plus/minus five percentage points bounded to 0–100%. Equal values prefer the lower bracket/baseline deterministically. Unsupported terminal valuation prevents ranking. No claim about untested higher brackets.

The search does not promise to find disconnected feasible regions or nonmonotone global optima. Future broader contribution/income support requires dedicated solver analysis and tests. Real-browser checks are not applicable until a UI is added.
