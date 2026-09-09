# Household Monte Carlo foundation

The engine is exposed through the local-development preview's Range of outcomes
panel. It is not a public release, maximum-spending solver, or automatic strategy
selection. Existing deterministic calls are unchanged.

Each path invokes the complete household timeline, including contributions,
RMDs, taxes, owner basis, withdrawals, and candidate-specific two-year IRMAA
history. The only new timeline input is an optional complete nominal return
matrix covering every account and calendar year. Annual growth retains the
existing end-of-year convention; it is not a monthly model.

The caller must explicitly choose `lognormal-shared-market-nominal`, provide
an annual arithmetic return standard deviation (decimal) for each invested
account, and accept `fixed-input-schedule` conversions. No risk default is
silently selected. Cash and annuity returns remain fixed. Brokerage/ESPP
returns remain price-only, with dividends supplied separately as before.

For expected nominal return m and standard deviation s, set
v = ln(1 + (s/(1+m))²), then R = exp(ln(1+m) - v/2 + sqrt(v) Z) - 1.
This matches the arithmetic moments, not a geometric-return assumption.
Zero volatility returns m exactly. Reference:
https://www.itl.nist.gov/div898/handbook/eda/section3/eda3669.htm

One normal shock is shared across invested accounts for each simulated year.
Years are independent. This assumes one common market factor, not independent
spouse accounts or asset-class diversification. It omits regime changes, fat
tails, stochastic inflation/income and return-predictability. A future UI must
disclose this and obtain explicit assumptions, not call it a calibrated forecast.

Success requires spending and taxes funded and RMDs satisfied in every year.
Later recovery cannot erase failure. All paths, including unfunded ones, remain
in the percentile denominator. Annual 10th/50th/90th percentiles interpolate
sorted balances; these are cross-sectional summaries, not one actual path.
Nominal and start-year-dollar balances are separately summarized.

Input/unsupported path errors abort the whole run; they are never discarded,
resampled, counted as ordinary insolvency, or replaced with zero-tax estimates.
Draws outside the existing settlement return domain [-1,10] also abort rather
than being silently clipped. Results use a fixed unsigned 32-bit seed and are
reproducible. Limits: 1–1000 paths, at most 2 million account-years. These are
work guards, not guarantees of responsiveness. Use a terminable worker for UI
integration and benchmark representative horizons before choosing UI defaults.

Fixed dollar conversions may fail on adverse paths. Bracket policies are not
reoptimized inside paths; no Monte Carlo strategy ranking is claimed. Existing
unsupported contribution/tax contracts remain blocked. No public-route, URL,
default, or existing calculator changes are included.

## Local preview integration

The preview starts in Average (explicitly labeled fixed-return, not simulated
mean). Range of outcomes starts with 200 paths and seed 42, but requires explicit
per-account volatility and confirmation before running. Zero volatility is
allowed. Work runs in a dedicated module worker with progress and termination
on cancel/unmount. Late messages from superseded workers are ignored.

Every household/account/contribution/Medicare/conversion draft edit and projection
revision remounts the panel, terminating pending work and clearing all simulation
settings/results. Simulation setting edits also terminate work and clear results.
No financial payload is logged, persisted, or transmitted to a server. The
deterministic summary, annual table, and CSV/PDF exports remain separate; the
panel explicitly identifies this distinction. Simulation exports are not added.
