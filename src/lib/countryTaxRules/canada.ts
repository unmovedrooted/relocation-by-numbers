/**
 * Canada: federal and provincial income tax, CPP and EI for the 2026 tax year, in Canadian dollars.
 *
 * Federal and provincial/territorial brackets: Canada Revenue Agency, "Current year tax rates and income brackets (2026)"
 * https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
 * Federal credit amounts (basic personal amount, age amount, Canada employment amount): CRA, "Indexation adjustment for personal
 * income tax and benefit amounts" https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/adjustment-personal-income-tax-benefit-amounts.html
 * CPP (2026: maximum pensionable earnings $74,600, exemption $3,500, 5.95%, maximum $4,230.45; CPP2 4% between $74,600 and
 * $85,000, maximum $416) and EI (2026: maximum insurable earnings $68,900, 1.63%, maximum $1,123.07), CRA payroll pages.
 * Provincial basic personal amounts and the Ontario surtax: CRA Payroll Deductions Formulas (T4127), 122nd and 123rd editions,
 * and the provinces' own announcements. Quebec: Revenu Quebec, taxation year 2026 (brackets indexed 2.05%, basic amount $18,952).
 * Read 2026-10-13.
 *
 * How it is computed: taxable income is gross pay less the enhanced CPP contributions (1% of earnings plus all of CPP2).
 * Tax is each bracket's tax less credits valued at the lowest bracket rate: the basic personal amount, the base CPP (4.95%) and
 * EI amounts, and (federal, employees) the Canada employment amount. Retirees get the federal age amount. Married filers get
 * the federal spouse amount, as if the spouse has no income. Ontario adds its surtax and the Ontario Health Premium (the
 * long-standing schedule up to $900). Quebec residents get the 16.5% federal abatement; the QPP and QPIP are approximated by CPP and EI.
 *
 * Not modeled: provincial age, spouse and pension credits, low-income tax reductions, the Alberta credit-rate and enhanced
 * personal amount phase-out, remote workers' CPP and EI (assumed foreign-employed and not subject), the pension income amount,
 * and Quebec's own contribution rates.
 */
export const CANADA_TAX_YEAR_LABEL = "2026";

type Bracket = { upTo: number; rate: number };

const FEDERAL: Bracket[] = [
  { upTo: 58_523, rate: 0.14 }, { upTo: 117_045, rate: 0.205 }, { upTo: 181_440, rate: 0.26 },
  { upTo: 258_482, rate: 0.29 }, { upTo: Infinity, rate: 0.33 },
];

export type ProvinceRule = { name: string; brackets: Bracket[]; bpa: (netIncome: number) => number };

const flat = (amount: number) => () => amount;

export const CANADA_PROVINCES: Record<string, ProvinceRule> = {
  AB: { name: "Alberta", bpa: flat(22_769), brackets: [
    { upTo: 61_200, rate: 0.08 }, { upTo: 154_259, rate: 0.10 }, { upTo: 185_111, rate: 0.12 },
    { upTo: 246_813, rate: 0.13 }, { upTo: 370_220, rate: 0.14 }, { upTo: Infinity, rate: 0.15 }] },
  BC: { name: "British Columbia", bpa: flat(13_216), brackets: [
    { upTo: 50_363, rate: 0.056 }, { upTo: 100_728, rate: 0.077 }, { upTo: 115_648, rate: 0.105 },
    { upTo: 140_430, rate: 0.1229 }, { upTo: 190_405, rate: 0.147 }, { upTo: 265_545, rate: 0.168 }, { upTo: Infinity, rate: 0.205 }] },
  MB: { name: "Manitoba", bpa: (n) => 15_780 * Math.min(1, Math.max(0, 1 - (n - 200_000) / 200_000)), brackets: [
    { upTo: 47_564, rate: 0.108 }, { upTo: 101_200, rate: 0.1275 }, { upTo: Infinity, rate: 0.174 }] },
  NB: { name: "New Brunswick", bpa: flat(13_664), brackets: [
    { upTo: 52_333, rate: 0.094 }, { upTo: 104_666, rate: 0.14 }, { upTo: 193_861, rate: 0.16 }, { upTo: Infinity, rate: 0.195 }] },
  NL: { name: "Newfoundland and Labrador", bpa: flat(13_094), brackets: [
    { upTo: 44_678, rate: 0.087 }, { upTo: 89_354, rate: 0.145 }, { upTo: 159_528, rate: 0.158 }, { upTo: 223_340, rate: 0.178 },
    { upTo: 285_319, rate: 0.198 }, { upTo: 570_638, rate: 0.208 }, { upTo: 1_141_275, rate: 0.213 }, { upTo: Infinity, rate: 0.218 }] },
  NT: { name: "Northwest Territories", bpa: flat(18_198), brackets: [
    { upTo: 53_003, rate: 0.059 }, { upTo: 106_009, rate: 0.086 }, { upTo: 172_346, rate: 0.122 }, { upTo: Infinity, rate: 0.1405 }] },
  NS: { name: "Nova Scotia", bpa: flat(11_932), brackets: [
    { upTo: 30_995, rate: 0.0879 }, { upTo: 61_991, rate: 0.1495 }, { upTo: 97_417, rate: 0.1667 },
    { upTo: 157_124, rate: 0.175 }, { upTo: Infinity, rate: 0.21 }] },
  NU: { name: "Nunavut", bpa: flat(19_659), brackets: [
    { upTo: 55_801, rate: 0.04 }, { upTo: 111_602, rate: 0.07 }, { upTo: 181_439, rate: 0.09 }, { upTo: Infinity, rate: 0.115 }] },
  ON: { name: "Ontario", bpa: flat(12_989), brackets: [
    { upTo: 53_891, rate: 0.0505 }, { upTo: 107_785, rate: 0.0915 }, { upTo: 150_000, rate: 0.1116 },
    { upTo: 220_000, rate: 0.1216 }, { upTo: Infinity, rate: 0.1316 }] },
  PE: { name: "Prince Edward Island", bpa: flat(15_000), brackets: [
    { upTo: 33_928, rate: 0.095 }, { upTo: 65_820, rate: 0.1347 }, { upTo: 106_890, rate: 0.166 },
    { upTo: 142_520, rate: 0.1762 }, { upTo: 200_000, rate: 0.19 }, { upTo: Infinity, rate: 0.20 }] },
  QC: { name: "Quebec", bpa: flat(18_952), brackets: [
    { upTo: 54_345, rate: 0.14 }, { upTo: 108_680, rate: 0.19 }, { upTo: 132_245, rate: 0.24 }, { upTo: Infinity, rate: 0.2575 }] },
  SK: { name: "Saskatchewan", bpa: flat(20_381), brackets: [
    { upTo: 54_532, rate: 0.105 }, { upTo: 155_805, rate: 0.125 }, { upTo: Infinity, rate: 0.145 }] },
  YT: { name: "Yukon", bpa: (n) => federalBpa(n), brackets: [
    { upTo: 58_523, rate: 0.064 }, { upTo: 117_045, rate: 0.09 }, { upTo: 181_440, rate: 0.109 },
    { upTo: 500_000, rate: 0.128 }, { upTo: Infinity, rate: 0.15 }] },
};

export const CANADA_DEFAULT_PROVINCE = "ON";

export function bracketTax(income: number, brackets: Bracket[]): number {
  let tax = 0;
  let previous = 0;
  for (const b of brackets) {
    if (income <= previous) break;
    tax += (Math.min(income, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

/** Federal basic personal amount: $16,452 up to the top of the 29% bracket, falling evenly to $14,829 at the 33% bracket. */
export function federalBpa(netIncome: number): number {
  const high = 16_452, low = 14_829, from = 181_440, to = 258_482;
  if (netIncome <= from) return high;
  if (netIncome >= to) return low;
  return high - (high - low) * (netIncome - from) / (to - from);
}

/** Ontario Health Premium for taxable income. */
export function ontarioHealthPremium(taxable: number): number {
  const steps: Array<[number, number, number, number]> = [
    // [from, to, premium at from, rate on the excess]
    [20_000, 25_000, 0, 0.06], [25_000, 36_000, 300, 0], [36_000, 38_500, 300, 0.06], [38_500, 48_000, 450, 0],
    [48_000, 48_600, 450, 0.25], [48_600, 72_000, 600, 0], [72_000, 72_600, 600, 0.25], [72_600, 200_000, 750, 0],
    [200_000, 200_600, 750, 0.25],
  ];
  if (taxable <= 20_000) return 0;
  if (taxable >= 200_600) return 900;
  for (const [from, to, base, rate] of steps) {
    if (taxable > from && taxable <= to) return base + rate * (taxable - from);
  }
  return 0;
}

export function ontarioSurtax(basicOntarioTax: number): number {
  return 0.20 * Math.max(0, basicOntarioTax - 5_818) + 0.36 * Math.max(0, basicOntarioTax - 7_446);
}

export type CanadaScenario = "local" | "remote" | "retired";

export type CanadaTaxResult = {
  federalTax: number; provincialTax: number; surtaxAndPremium: number; payroll: number; province: string;
};

export function canadaTax(income: number, opts: { province?: string; scenario: CanadaScenario; married: boolean }): CanadaTaxResult {
  const code = opts.province && CANADA_PROVINCES[opts.province] ? opts.province : CANADA_DEFAULT_PROVINCE;
  const prov = CANADA_PROVINCES[code];
  const gross = Math.max(0, income);
  const employee = opts.scenario === "local";

  // CPP, CPP2 and EI for employees
  const cppEarnings = employee ? Math.max(0, Math.min(gross, 74_600) - 3_500) : 0;
  const cpp = 0.0595 * cppEarnings;
  const cppBaseCredit = 0.0495 * cppEarnings;
  const cppEnhancedDeduction = 0.01 * cppEarnings;
  const cpp2 = employee ? 0.04 * Math.max(0, Math.min(gross, 85_000) - 74_600) : 0;
  const ei = employee ? 0.0163 * Math.min(gross, 68_900) : 0;

  const taxable = Math.max(0, gross - cppEnhancedDeduction - cpp2);

  // Federal
  const retiredAge = opts.scenario === "retired" ? Math.max(0, 9_208 - 0.15 * Math.max(0, taxable - 46_432)) : 0;
  const federalCredits = federalBpa(taxable) + cppBaseCredit + ei + (employee ? Math.min(1_501, gross) : 0) + retiredAge
    + (opts.married ? 16_452 : 0);
  let federalTax = Math.max(0, bracketTax(taxable, FEDERAL) - 0.14 * federalCredits);
  if (code === "QC") federalTax *= 1 - 0.165;

  // Provincial
  const lowestRate = prov.brackets[0].rate;
  const provincialCredits = prov.bpa(taxable) + cppBaseCredit + ei;
  const provincialTax = Math.max(0, bracketTax(taxable, prov.brackets) - lowestRate * provincialCredits);
  const surtaxAndPremium = code === "ON" ? ontarioSurtax(provincialTax) + ontarioHealthPremium(taxable) : 0;

  return { federalTax, provincialTax, surtaxAndPremium, payroll: cpp + cpp2 + ei, province: code };
}
