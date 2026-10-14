import { describe, expect, it } from "vitest";
import { estimateNetBreakdown } from "./wageTax";
import { estimateInternationalTax } from "./internationalTaxes";
import { estimateAsiaTax } from "./asiaTaxes";
import { monthlyHousingCost, estimateMortgageMonthly as percentMortgage } from "./housing";
import { estimateMortgageMonthly as decimalMortgage } from "./mortgage";
import { accumulationPaths } from "./monteCarlo";
import { withdrawalIncomeTax } from "./retirementTax";
import { requiredDistribution } from "./retirementPlan/rules";
import { estimateHouseholdTax } from "./retirementPlan/householdTax";
import { taxCharacter } from "./retirementPlan/accountTax";
import { simulateRentVsBuy } from "./rentVsBuy";
import { estimateScenarioTax } from "./caribbeanTax/engine";
import { JM_TAX_CONFIG } from "./caribbeanTax/countries/jm";

/** Audit only: independent reference constants, not production tax tables.
 * These are official-RULE comparisons, not captured official calculator UI results.
 * See docs/audits/official-scenario-comparison-2026-10-14.md for sources and scope.
 * The observation test prints differences; passing it is NOT a correctness verdict.
 */
const salaries = [50_000, 100_000, 150_000, 250_000];
type Row = { scenario: string; input: number; expected: number; actual: number | null; difference: number | null };
const rows: Row[] = [];
function record(scenario: string, input: number, expected: number, actual: number | null) {
  rows.push({ scenario, input, expected, actual, difference: actual === null ? null : actual - expected });
  expect(Number.isFinite(expected)).toBe(true);
  if (actual !== null) expect(Number.isFinite(actual)).toBe(true);
}

// IRS Publication 505, 2026 Schedule X. No credits, age 40, wages only.
function federal(gross: number) {
  const taxable = Math.max(0, gross - 16_100);
  if (taxable <= 12_400) return taxable * 0.1;
  if (taxable <= 50_400) return 1_240 + (taxable - 12_400) * 0.12;
  if (taxable <= 105_700) return 5_800 + (taxable - 50_400) * 0.22;
  if (taxable <= 201_775) return 17_966 + (taxable - 105_700) * 0.24;
  return 41_024 + (taxable - 201_775) * 0.32; // this audit stops at $250k gross
}
function payroll(gross: number) {
  return Math.min(gross, 184_500) * 0.062 + gross * 0.0145 + Math.max(0, gross - 200_000) * 0.009;
}
// IRAS YA2026: under-55 resident employment-pass holder, no CPF, only $1k earned-income relief.
function singapore(gross: number) {
  const taxable = gross - 1_000;
  if (taxable <= 80_000) return 550 + (taxable - 40_000) * 0.07;
  if (taxable <= 120_000) return 3_350 + (taxable - 80_000) * 0.115;
  if (taxable <= 160_000) return 7_950 + (taxable - 120_000) * 0.15;
  return 28_750 + (taxable - 240_000) * 0.195;
}

describe("official-rule fixed-scenario audit (observational, not a pass certificate)", () => {
  it("records wage, country, withdrawal and mathematical comparisons", () => {
    for (const state of ["fl", "tx", "nc", "pa"] as const) {
      for (const salary of salaries) {
        const stateTax = state === "nc" ? (salary - 12_750) * 0.0399 : state === "pa" ? salary * 0.0307 : 0;
        const employeeProgram = state === "pa" ? salary * 0.0007 : 0;
        const result = estimateNetBreakdown({ grossAnnual: salary, state, filing: "single", k401Pct: 0 });
        record(`US ${state}: annual net USD, no city tax`, salary,
          salary - federal(salary) - payroll(salary) - stateTax - employeeProgram, result.net);
      }
    }
    for (const salary of salaries) {
      // Jamaica: isolate income-tax bracket placement, not payroll deductions/net pay.
      // Input is statutory income before the tax-free threshold; post-April annualized regime.
      const jamaicaIncome = salary * 100;
      const jamaicaReference = Math.max(0, Math.min(jamaicaIncome, 6_000_000) - 1_902_360) * 0.25
        + Math.max(0, jamaicaIncome - 6_000_000) * 0.30;
      const jamaica = estimateScenarioTax({ config: JM_TAX_CONFIG, scenario: "local", grossIncomeLocalCurrency: jamaicaIncome });
      record("JM income-tax-only bracket check JMD, post-April annualized", jamaicaIncome, jamaicaReference, jamaica.tax);
      const allowance = Math.max(0, 12_570 - Math.max(0, salary - 100_000) / 2);
      const taxable = salary - allowance;
      const tax = Math.min(taxable, 37_700) * 0.2
        + Math.max(0, Math.min(salary, 125_140) - allowance - 37_700) * 0.4
        + Math.max(0, salary - 125_140) * 0.45;
      const ni = Math.max(0, Math.min(salary, 50_270) - 12_570) * 0.08 + Math.max(0, salary - 50_270) * 0.02;
      const uk = estimateInternationalTax({ countryCode: "GB", annualIncome: salary, filing: "single", isRetired: false });
      record("GB: annual income tax + employee NI GBP", salary, tax + ni, uk.effectiveRate * salary);
      for (const [name, engine] of [["international", estimateInternationalTax], ["Asia", estimateAsiaTax]] as const) {
        const sg = engine({ countryCode: "SG", annualIncome: salary, filing: "single", isRetired: false,
          incomeScenario: "local", answers: { sg_residency: "resident" } });
        record(`SG ${name}: annual income tax SGD`, salary, singapore(salary), sg.effectiveRate * salary);
      }
      record("FL qualified traditional withdrawal: federal tax only, age 40 reference deduction", salary,
        federal(salary), withdrawalIncomeTax(salary, "fl", "single", "traditional").total);
      record("PA qualified traditional withdrawal: federal tax only, age 40 reference deduction", salary,
        federal(salary), withdrawalIncomeTax(salary, "pa", "single", "traditional").total);
      // An age-65 U.S. citizen, single, no other income, eligible for the temporary senior deduction.
      const seniorExtra = 2_050 + Math.max(0, 6_000 - Math.max(0, salary - 75_000) * 0.06);
      const seniorTax = federal(salary - seniorExtra);
      record("FL standalone withdrawal helper: eligible age65 federal tax USD", salary, seniorTax,
        withdrawalIncomeTax(salary, "fl", "single", "traditional").federal);
      const household = estimateHouseholdTax({ year: 2026, filing: "single", state: "fl", stateTreatment: "existing-2025-proxy",
        people: [{ id: "one", birthDate: "1961-01-01", blind: false, eligibleForSeniorDeduction: true }],
        income: [], accountIncome: taxCharacter({ retirementOrdinary: salary }), lossCarryover: { shortTerm: 0, longTerm: 0 } });
      record("FL Complete Plan household engine: eligible age65 federal tax USD", salary, seniorTax, household.regularFederal);
    }
    for (const loan of [120_000, 240_000, 400_000, 800_000]) {
      const inputs = { homePrice: loan, downPct: 0, termYears: 10, propertyTaxPct: 0, homeInsMonthly: 0, hoaMonthly: 0 };
      record("Full housing: zero-rate monthly P&I USD", loan, loan / 120, monthlyHousingCost({ ...inputs, ratePct: 0 }).principalInterest);
      record("Percent quick mortgage: zero-rate rounded P&I USD", loan, Math.round(loan / 120), percentMortgage(loan, { downPct: 0, rate: 0, years: 10 }));
      record("Decimal quick mortgage: zero-rate rounded P&I USD", loan, Math.round(loan / 120), decimalMortgage(loan, { downPct: 0, rate: 0, years: 10 }));
      // Independent discounted-cash-flow identity: principal = payment * sum(discount factors).
      const discountFactors = Array.from({ length: 360 }, (_, k) => (1 + 0.065 / 12) ** -(k + 1));
      const expected = loan / discountFactors.reduce((a, b) => a + b, 0);
      record("Full housing: 6.5% 30-year P&I USD", loan, expected,
        monthlyHousingCost({ ...inputs, termYears: 30, ratePct: 6.5 }).principalInterest);
      record("Accumulation: 10y 5%, no contributions/volatility USD", loan, loan * 1.05 ** 10,
        accumulationPaths({ startBalance: loan, annualContribution: 0, realReturn: 0.05, volatility: 0, years: 10, nPaths: 1 }).mean);
      record("Complete Plan RMD: age75 Uniform Lifetime USD", loan, loan / 24.6,
        requiredDistribution({ birthDate: "1951-01-01", year: 2026, priorDecemberBalance: loan, accountType: "traditional-ira" }));
      const rentBuy = simulateRentVsBuy({ homePrice: loan, downPct: 0, mortgageRatePct: 0, loanYears: 10,
        propertyTaxPct: 0, homeInsuranceAnnual: 0, hoaMonthly: 0, maintenancePct: 0, buyClosingPct: 0,
        appreciationPct: 0, sellingCostPct: 0, monthlyRent: loan / 120, rentGrowthPct: 0,
        rentersInsuranceMonthly: 0, investmentReturnPct: 0, years: 1 });
      record("Rent versus buy: year1 buyer equity, zero rate/costs/growth USD", loan, loan / 10, rentBuy.finalBuyer);
    }
    console.log("\n| Scenario | Input | Reference | Repository | Difference (repo-reference) |\n|---|---:|---:|---:|---:|\n"
      + rows.map(r => `| ${r.scenario} | ${r.input} | ${r.expected.toFixed(2)} | ${r.actual?.toFixed(2) ?? "null"} | ${r.difference?.toFixed(2) ?? "not numeric"} |`).join("\n"));
    expect(rows).toHaveLength(76);
  });
});
