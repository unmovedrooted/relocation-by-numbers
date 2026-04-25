import { estimateScenarioTax } from "./engine"
import { getCountryTaxConfig, AVAILABLE_TAX_COUNTRIES } from "./index"
import { describe, it, expect } from "vitest"


describe("estimateScenarioTax", () => {

  it("returns zero tax for zero income on any country", () => {
    for (const config of AVAILABLE_TAX_COUNTRIES) {
      for (const scenario of ["local", "remote", "retired"] as const) {
        const result = estimateScenarioTax({
          config, scenario,
          grossIncomeLocalCurrency: 0,
        })
        expect(result.tax).toBe(0)
        expect(result.netIncome).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it("returns zero effective rate for no-tax jurisdictions", () => {
    const noTaxCodes = ["AG", "BS", "KN", "KY", "VG", "TC"] as const
    for (const code of noTaxCodes) {
      const config = getCountryTaxConfig(code)!
      const result = estimateScenarioTax({
        config, scenario: "local",
        grossIncomeLocalCurrency: 100_000,
      })
      expect(result.tax).toBe(0)
      expect(result.effectiveRate).toBe(0)
    }
  })

  it("BB: income exactly at allowance boundary is zero-taxed", () => {
    const config = getCountryTaxConfig("BB")!
    const result = estimateScenarioTax({
      config, scenario: "local",
      grossIncomeLocalCurrency: 25_000,
    })
    expect(result.tax).toBe(0)
    expect(result.taxableIncome).toBe(0)
  })

 it("BB: income just above allowance hits first bracket correctly", () => {
  const config = getCountryTaxConfig("BB")!
  const result = estimateScenarioTax({
    config, scenario: "local",
    grossIncomeLocalCurrency: 25_001,
  })
  expect(result.tax).toBeCloseTo(0.115, 1) // 1 BBD taxable at 11.5%
  expect(result.marginalRate).toBe(0.115)
})

  it("returns isDisclaimer for pending/us_mirror/french_system scenarios", () => {
    const disclaimerCountries = ["PR", "VI", "GP", "MQ", "MF", "BL"] as const
    for (const code of disclaimerCountries) {
      const config = getCountryTaxConfig(code)
      if (!config) continue
      for (const scenario of ["local", "remote", "retired"] as const) {
        const s = config.scenarios[scenario]
        if (["us_mirror", "french_system", "pending"].includes(s.kind)) {
          const result = estimateScenarioTax({
            config, scenario,
            grossIncomeLocalCurrency: 100_000,
          })
          expect(result.isDisclaimer).toBe(true)
        }
      }
    }
  })

 it("PR: local scenario returns disclaimer", () => {
  const config = getCountryTaxConfig("PR")!
  const result = estimateScenarioTax({
    config, scenario: "local",
    grossIncomeLocalCurrency: 100_000,
    filingStatus: "single",
  })
  expect(result.isDisclaimer).toBe(true)
})

  it("netIncome + tax always equals grossIncome (within rounding)", () => {
    const testIncome = 75_000
    for (const config of AVAILABLE_TAX_COUNTRIES) {
      const result = estimateScenarioTax({
        config, scenario: "local",
        grossIncomeLocalCurrency: testIncome,
      })
      if (!result.isDisclaimer) {
        expect(result.tax + result.netIncome).toBeCloseTo(testIncome, 1)
      }
    }
  })
})