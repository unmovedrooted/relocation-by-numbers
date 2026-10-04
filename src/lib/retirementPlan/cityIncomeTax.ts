/** Resident-city income taxes for the Ohio, Michigan and Alabama cities this planner rates.
 *
 * Sources read 2026-10-04:
 * - Columbus 2.5% on wages and net profits, https://www.columbus.gov/Government/City-Auditor/Income-Tax-Division/General-Income-Tax-Information
 * - Cleveland 2.5% on anyone who works in the city (Central Collection Agency),
 *   https://www.clevelandohio.gov/city-hall/departments/finance/divisions/taxation
 * - Cincinnati 1.8% effective 2020-10-02 (2.1% before), https://www.cincinnati-oh.gov/finance/frequently-asked-questions/
 *   Ohio municipal tax on individuals is levied on qualifying wages (Medicare wages, so 401(k) deferrals are
 *   included) and net profits; Social Security, pensions, retirement distributions, interest, dividends and
 *   capital gains are not taxed.
 * - Detroit resident rate 2.4% with a $600 exemption per person, on federal AGI with city adjustments
 *   (Michigan Treasury Form 5123, 2026), and Grand Rapids resident rate 1.5% with $600 exemptions (2025 resident
 *   return, https://www.grandrapidsmi.gov/media/wu1bna3f/2025-resident-printable.pdf). Both exempt Social
 *   Security and pensions or annuities that are normal (Form 1099-R code 7) distributions; both tax wages,
 *   interest, dividends, capital gains and premature retirement distributions. Ann Arbor has no city income tax.
 * - Birmingham 1% of Medicare wages for work performed in the city (City of Birmingham occupational tax refund
 *   affidavit). Montgomery's 1% occupational tax was blocked by 2025 legislation requiring local-act approval and
 *   Huntsville levies none (its list of administered taxes), so both are zero here.
 *
 * Rates are held for later years. Ohio and Alabama taxes follow the workplace: this planner assumes every wage is
 * earned in the selected city, so it applies the city rate once and ignores credits for tax paid to a work city.
 * Any other city, or no selection, is not modeled and returns zero.
 */
export interface CityIncomeBase {
  /** Gross wages including 401(k) deferrals, plus ESPP compensation: Ohio and Alabama's base. */
  qualifyingWages: number;
  /** AGI-like income for Michigan's resident city taxes, before exemptions and with normal retirement distributions out. */
  residentIncome: number;
}

type CityRule = { state: "oh" | "mi" | "al"; rate: number; base: "qualifying-wages" | "resident-income"; exemption: number };

const CITY_RULES: Readonly<Record<string, CityRule>> = {
  "columbus-oh": { state: "oh", rate: .025, base: "qualifying-wages", exemption: 0 },
  "cleveland-oh": { state: "oh", rate: .025, base: "qualifying-wages", exemption: 0 },
  "cincinnati-oh": { state: "oh", rate: .018, base: "qualifying-wages", exemption: 0 },
  "detroit-mi": { state: "mi", rate: .024, base: "resident-income", exemption: 600 },
  "grand-rapids-mi": { state: "mi", rate: .015, base: "resident-income", exemption: 600 },
  "birmingham-al": { state: "al", rate: .01, base: "qualifying-wages", exemption: 0 },
};

/** Cities in the planner's list known to levy no city income tax. */
const NO_CITY_INCOME_TAX: ReadonlySet<string> = new Set(["ann-arbor-mi", "montgomery-al", "huntsville-al"]);

/** Cities the planner offers for each state's optional city selector. */
export const CITY_TAX_CHOICES: Readonly<Record<"oh" | "mi" | "al", readonly string[]>> = {
  oh: ["columbus-oh", "cleveland-oh", "cincinnati-oh"],
  mi: ["detroit-mi", "grand-rapids-mi", "ann-arbor-mi"],
  al: ["birmingham-al", "montgomery-al", "huntsville-al"],
};

export function cityIncomeTax(state: string, cityId: string, base: CityIncomeBase, exemptions: number): number {
  for (const value of [base.qualifyingWages, base.residentIncome, exemptions]) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError("Invalid city income tax input.");
  }
  if (!cityId || NO_CITY_INCOME_TAX.has(cityId)) return 0;
  const rule = CITY_RULES[cityId];
  if (!rule || rule.state !== state) return 0;
  const income = rule.base === "qualifying-wages" ? base.qualifyingWages : Math.max(0, base.residentIncome - rule.exemption * exemptions);
  return income * rule.rate;
}

/** True when the selection is a city this planner models (so the consent text and results can say so). */
export const isRatedCity = (cityId: string) => cityId in CITY_RULES;
