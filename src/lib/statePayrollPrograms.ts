import type { StateCode } from "./states";
import { PAYROLL_2026 } from "./taxYear2026";

/**
 * Employee-paid state payroll programs for 2026 (state disability, paid family and medical leave,
 * long-term care and employee-paid unemployment contributions).
 *
 * Each rate and cap was read from the named state agency page or document on 2026-10-13. These are
 * deducted from the employee's pay on top of federal Social Security and Medicare. Programs that let
 * the employer decide how much of the cost to pass on (marked `employerMayPay`) are modeled at the
 * largest employee share the law allows, which is what most employers deduct; an employer that pays
 * more makes take-home pay higher than shown.
 *
 * Maryland's program (0.45% employee share) starts collecting January 1, 2027, so it is not in 2026.
 * DC's paid-leave program is funded by employers only.
 */
export type PayrollProgram = Readonly<{
  id: string;
  state: StateCode;
  name: string;
  /** Employee rate as a decimal of covered wages. */
  rate: number;
  /** Annual wage cap on which the rate applies; undefined means no cap. */
  wageCap?: number;
  /** Annual dollar maximum when the state publishes one instead of, or in addition to, a wage cap. */
  maxAnnual?: number;
  /** True when the employer decides whether to deduct the employee share, up to the rate shown. */
  employerMayPay?: boolean;
  status: "published" | "not-independently-confirmed";
  source: Readonly<{ label: string; url: string }>;
  note?: string;
}>;

const SS_BASE = PAYROLL_2026.socialSecurityWageBase;

export const STATE_PAYROLL_PROGRAMS: readonly PayrollProgram[] = Object.freeze([
  { id: "ca-sdi", state: "ca", name: "California State Disability Insurance (SDI)", rate: 0.013, status: "published",
    source: { label: "California EDD, 2026 payroll tax rates (DE 201)", url: "https://edd.ca.gov/siteassets/files/pdf_pub_ctr/de201.pdf" },
    note: "1.3% of all wages; California removed the wage limit in 2024." },
  { id: "nj-ui", state: "nj", name: "New Jersey unemployment insurance (employee)", rate: 0.003825, wageCap: 44_800, status: "published",
    source: { label: "New Jersey Department of Labor, 2026 worker rates", url: "https://www.nj.gov/labor/ea/employer-services/rate-info/" } },
  { id: "nj-wf", state: "nj", name: "New Jersey workforce development fund (employee)", rate: 0.000425, wageCap: 44_800, status: "published",
    source: { label: "New Jersey Department of Labor, 2026 worker rates", url: "https://www.nj.gov/labor/ea/employer-services/rate-info/" } },
  { id: "nj-tdi", state: "nj", name: "New Jersey temporary disability insurance (employee)", rate: 0.0019, wageCap: 171_100, status: "published",
    source: { label: "New Jersey Department of Labor, 2026 benefit rates and wage bases", url: "https://www.nj.gov/labor/lwdhome/press/2025/20251229_newbenefitrates2026.shtml" } },
  { id: "nj-fli", state: "nj", name: "New Jersey family leave insurance (employee)", rate: 0.0023, wageCap: 171_100, status: "published",
    source: { label: "New Jersey Department of Labor, 2026 benefit rates and wage bases", url: "https://www.nj.gov/labor/lwdhome/press/2025/20251229_newbenefitrates2026.shtml" } },
  { id: "ny-pfl", state: "ny", name: "New York Paid Family Leave", rate: 0.00432, maxAnnual: 411.91, status: "published",
    source: { label: "New York Workers' Compensation Board, 2026 Paid Family Leave updates", url: "https://www.wcb.ny.gov/content/main/PressRe/paid-family-leave-2026.jsp" } },
  { id: "ny-dbl", state: "ny", name: "New York Disability Benefits Law (SDI)", rate: 0.005, maxAnnual: 0.6 * 52, employerMayPay: true, status: "published",
    source: { label: "New York Workers' Compensation Board, Disability Benefits Law", url: "https://www.wcb.ny.gov/content/main/DisabilityBenefits/employee-disability-benefits.jsp" },
    note: "One half of one percent of wages, at most 60 cents a week (WCL section 209); employers may choose to pay it." },
  { id: "wa-pfml", state: "wa", name: "Washington Paid Family and Medical Leave (employee share)", rate: 0.0113 * 0.7143, wageCap: SS_BASE, status: "published",
    source: { label: "Washington Employment Security Department, 2026 premium rate", url: "https://esd.wa.gov/about-us/news-release/2025/paid-family-medical-leave-premium-rate-increases-113-2026" },
    note: "Total premium 1.13% up to the Social Security cap; employees pay 71.43%." },
  { id: "wa-cares", state: "wa", name: "Washington WA Cares Fund", rate: 0.0058, status: "published",
    source: { label: "Washington Paid Leave, employer roles and premium rates", url: "https://paidleave.wa.gov/employer-roles-responsibilities/" },
    note: "0.58% of all wages with no cap, paid by employees unless exempt." },
  { id: "or-pl", state: "or", name: "Paid Leave Oregon (employee share)", rate: 0.006, wageCap: SS_BASE, status: "published",
    source: { label: "Paid Leave Oregon, common questions (2026 rate and wage cap)", url: "https://paidleave.oregon.gov/resources/common-questions.html" },
    note: "Total rate 1%, employees pay 60%, up to the Social Security wage base." },
  { id: "or-stt", state: "or", name: "Oregon Statewide Transit Tax", rate: 0.001, status: "published",
    source: { label: "Oregon Department of Revenue, 2026 combined payroll tax report instructions", url: "https://www.oregon.gov/dor/forms/FormsPubs/combined-payroll_211-155-2_2026.pdf" },
    note: "0.1% of Oregon wages; a scheduled increase is delayed pending a November 2026 vote." },
  { id: "co-famli", state: "co", name: "Colorado FAMLI (employee share)", rate: 0.0044, wageCap: SS_BASE, employerMayPay: true, status: "published",
    source: { label: "Colorado FAMLI, employer information", url: "https://famli.colorado.gov/employers" },
    note: "Total premium 0.88%, split 0.44% each; wages up to the Social Security cap." },
  { id: "ct-pl", state: "ct", name: "Connecticut Paid Leave", rate: 0.005, wageCap: SS_BASE, status: "published",
    source: { label: "CT Paid Leave Authority, contributions", url: "https://www.ctpaidleave.org/how-ct-paid-leave-works/contributions" } },
  { id: "ma-pfml", state: "ma", name: "Massachusetts Paid Family and Medical Leave (employee share)", rate: 0.0046, wageCap: SS_BASE, employerMayPay: true, status: "published",
    source: { label: "Mass.gov, PFML contribution rates", url: "https://www.mass.gov/info-details/paid-family-and-medical-leave-employer-contribution-rates-and-calculator" },
    note: "Up to 0.18% for family leave and 0.28% for medical leave may be withheld; capped at the Social Security taxable maximum." },
  { id: "mn-pl", state: "mn", name: "Minnesota Paid Leave (employee share)", rate: 0.0044, wageCap: 185_000, employerMayPay: true, status: "published",
    source: { label: "Minnesota Paid Leave, premium rate and contributions", url: "https://pl.mn.gov/resources/calculators/premium-rate-and-contributions" },
    note: "Total premium 0.88%; employees may pay up to 0.44%; the state publishes a $185,000 wage cap for 2026." },
  { id: "me-pfml", state: "me", name: "Maine Paid Family and Medical Leave (employee share)", rate: 0.005, wageCap: SS_BASE, employerMayPay: true, status: "published",
    source: { label: "Maine Department of Labor, PFML employer FAQ", url: "https://www.maine.gov/paidleave/docs/2026/employers/faq/employerFAQenglish.pdf" },
    note: "Up to half of a 1% contribution for employers with 15 or more employees; capped at the Social Security base." },
  { id: "de-pl", state: "de", name: "Delaware Paid Leave (employee share)", rate: 0.004, wageCap: SS_BASE, employerMayPay: true, status: "not-independently-confirmed",
    source: { label: "Delaware Department of Labor, Delaware Paid Leave", url: "https://labor.delaware.gov/delaware-paid-leave/" },
    note: "Total about 0.8% with employees paying up to half; the rate document could not be downloaded for this update." },
  { id: "hi-tdi", state: "hi", name: "Hawaii Temporary Disability Insurance (employee share)", rate: 0.005, maxAnnual: 7.5 * 52, employerMayPay: true, status: "published",
    source: { label: "Hawaii Disability Compensation Division, 2026 maximum weekly wage base", url: "https://labor.hawaii.gov/dcd/files/2025/12/2026-Maximum-Weekly-Wage-Base.pdf" },
    note: "Half the premium cost, at most 0.5% of weekly wages and $7.50 a week." },
  { id: "ri-tdi", state: "ri", name: "Rhode Island Temporary Disability and Caregiver Insurance", rate: 0.011, wageCap: 100_000, status: "published",
    source: { label: "Rhode Island Department of Labor and Training, 2026 UI and TDI quick reference", url: "https://dlt.ri.gov/sites/g/files/xkgbur571/files/2026-06/7.1.26%20UI%20%26%20TDI%20Quick%20Reference.pdf" } },
  { id: "ak-ui", state: "ak", name: "Alaska unemployment insurance (employee)", rate: 0.005, wageCap: 54_200, status: "published",
    source: { label: "Alaska Department of Labor, 2026 unemployment insurance tax rates", url: "https://labor.alaska.gov/estax/2026-experience-rates.html" } },
  { id: "pa-ui", state: "pa", name: "Pennsylvania unemployment compensation (employee)", rate: 0.0007, status: "published",
    source: { label: "Pennsylvania Department of Labor and Industry, yearly tax highlights", url: "https://www.pa.gov/agencies/dli/resources/for-employers-and-educators/how-to-file/uc-tax/yearly-tax-highlights" },
    note: "0.07% of all gross wages with no cap." },
] as readonly PayrollProgram[]);

export type PayrollLine = Readonly<{ id: string; name: string; amount: number }>;

function programAmount(program: PayrollProgram, wages: number): number {
  const covered = program.wageCap === undefined ? wages : Math.min(wages, program.wageCap);
  const raw = covered * program.rate;
  return program.maxAnnual === undefined ? raw : Math.min(raw, program.maxAnnual);
}

/** Employee-paid state payroll deductions for one worker's annual wages. */
export function statePayrollLines(state: StateCode, wages: number): PayrollLine[] {
  const w = Math.max(0, Number.isFinite(wages) ? wages : 0);
  return STATE_PAYROLL_PROGRAMS.filter((p) => p.state === state)
    .map((p) => ({ id: p.id, name: p.name, amount: programAmount(p, w) }))
    .filter((line) => line.amount > 0);
}

/** Total employee-paid state payroll deductions, applied to each earner's wages separately. */
export function statePayrollTotal(state: StateCode, earnerWages: readonly number[]): number {
  return earnerWages.reduce((sum, wages) => sum + statePayrollLines(state, wages).reduce((s, l) => s + l.amount, 0), 0);
}

/** States that have at least one employee-paid program in 2026. */
export const STATES_WITH_PAYROLL_PROGRAMS: ReadonlySet<StateCode> = new Set(STATE_PAYROLL_PROGRAMS.map((p) => p.state));
