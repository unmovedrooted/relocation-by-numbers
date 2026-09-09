# IRA and catch-up eligibility foundation

Verified 2026 bases, with opt-in future IRA timeline integration added September
6, 2026. See FUTURE_ELIGIBILITY_IRMAA_CONTRACT.md for the explicit projection
policy and restricted automatic MAGI integration. IRA preview controls now use this
restricted path with explicit coverage and deduction choices.
Single and married filing jointly, regular traditional/Roth IRAs and ordinary
2026 401(k) catch-up are supported; legacy 2026 entry points remain year-restricted.

IRA combined contribution room uses own eligible taxable compensation, the
age-at-year-end limit, and all existing IRA contributions. Roth uses separately
verified Roth MAGI, not generic AGI, wages, or traditional-deduction MAGI. The
phaseout implements Publication 590-A worksheet 2-2 at full ratio precision,
with the required upward $10 rounding and $200 floor, capped by combined room.
These worksheet rounding rules are not cosmetic display rounding. Other IRA
contributions are subtracted in the worksheet's order, after the income phaseout.

Traditional contribution room does not establish deductibility. Separate
deduction MAGI and workplace coverage yield only an income-phaseout status;
deductionAmount is null, not an invented tax deduction. Spousal compensation,
deduction amounts, MAGI addbacks, Social Security/IRA deduction interactions,
excess corrections, SIMPLE/SEP/inherited accounts and special filing statuses
are not implemented. Negative MAGI inputs require separate handling, not silent
clamping. Reported combined and Roth excess overlap and must not be summed.

401(k) catch-up uses age at year end and explicit plan permission. Ages 60–63
use the higher limit. The Roth requirement uses prior-year FICA wages from the
sponsoring employer with a strict greater-than threshold. Unknown wages must
not be substituted with zero. Available catch-up is shared between traditional
and Roth: their reported capacities are alternatives, not additive allowances.
The regular-plus-catch-up ceiling is before compensation, prior contributions,
plan-specific restrictions and affordability caps. High-wage participants without
the required Roth feature have zero supported catch-up capacity. Multi-employer,
special transition/collectively bargained cases require review.

## Verified 2026 values

- IRA regular $7,500, age-50 catch-up $1,100.
- Roth MAGI phaseout: single $153,000–$168,000; joint $242,000–$252,000.
- Covered traditional IRA deduction: single $81,000–$91,000; joint $129,000–$149,000.
- Uncovered contributor with covered spouse: joint $242,000–$252,000.
- Regular 401(k) deferral $24,500; catch-up $8,000 or $11,250 at ages 60–63.
- Prior-year sponsor FICA wage threshold for required Roth catch-up: $150,000.

Sources:
- https://www.irs.gov/irb/2025-49_IRB (Notice 2025-67, 2026 limits)
- https://www.irs.gov/publications/p590a (2025 edition worksheet mechanics; 2026 thresholds come from the notice)
- https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-catch-up-contributions

## Broader integration still pending

The restricted annual solver now establishes distinct MAGIs and resolves funded
contribution feedback, preserving deductible/nondeductible basis. Do not bypass
its guards to support investment income, withdrawals, conversions or Social
Security. Those need broader tax/basis feedback and additional worksheet support.
Future years use an explicit scenario policy, not claimed published law. Workplace
catch-up routing beyond 2026 remains separate work. Medicare preview controls now
use the opt-in IRMAA contract documented alongside the future eligibility model.
