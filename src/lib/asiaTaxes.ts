// ---------------------------------------------------------------------------
// asiaTaxes.ts
//
// CONTRACT:
//   annualIncome must always be passed in LOCAL CURRENCY for the destination
//   country. The caller is responsible for FX conversion before calling
//   estimateAsiaTax(). No internal FX conversion is performed here.
//
// Local currencies by country:
//   JP=JPY, KR=KRW, SG=SGD, TH=THB, VN=VND, MY=MYR, ID=IDR, AE=AED,
//   PH=PHP, TW=TWD, HK=HKD, IN=INR, CN=CNY, QA=QAR, SA=SAR, OM=OMR,
//   AU=AUD, NZ=NZD
//
// Last updated: April 2026. Sources: OECD Taxing Wages 2025, PwC Worldwide
// Tax Summaries, and each country's official tax authority publications.
// ---------------------------------------------------------------------------

export type FilingStatus = "single" | "married";

export type IncomeScenario = "local" | "remote" | "retired";

export type TaxModelKind =
  | "none"
  | "progressive-country"
  | "country-plus-province"
  | "country-plus-local"
  | "flat"
  | "placeholder";

// Confidence rubric:
//
//  "verified", Zero-tax or trivially exact.
//                  Countries: AE, QA, SA, OM.
//
//  "partial", Core brackets correct and current. Dominant structural
//                  components modelled. Gap bounded and unlikely to exceed
//                  ~3–4 pp for most planning incomes.
//                  Countries: AU, NZ.
//
//  "simplified", Structurally believable but at least one significant
//                  source of variation is unmodelled. Gap may be 5–10 pp.
//                  Countries: JP, KR, MY, VN, ID.
//
//  "placeholder", Thresholds unstable or model too simplified for reliable
//                  planning. Use directional only.
//                  Not currently assigned, but structure preserved.
//
//  Note: SG, TH, TW, PH, CN, IN, HK upgrade from "simplified" to "partial"
//  when the residency/regime conditional question is answered.

export type TaxConfidence = "verified" | "partial" | "simplified" | "placeholder";

export type TaxEstimateResult = {
  effectiveRate: number;
  incomeTaxRate: number;
  socialContributionRate: number;
  model: TaxModelKind;
  confidence: TaxConfidence;
  label: string;
  note: string;
  missingFactor: string;
};

export type ConditionalQuestionOption = {
  value: string;
  label: string;
};

export type ConditionalQuestion = {
  key: string;
  label: string;
  helpText?: string;
  when?: {
    incomeScenario?: IncomeScenario[];
  };
  options: ConditionalQuestionOption[];
};

type TaxEstimatorArgs = {
  annualIncome: number;
  filing: FilingStatus;
  isRetired: boolean;
  incomeScenario?: IncomeScenario;
  answers?: Record<string, string>;
};

type TaxEstimator = (args: TaxEstimatorArgs) => TaxEstimateResult;

export type EstimateAsiaTaxArgs = {
  countryCode: string;
  annualIncome: number;
  filing: FilingStatus;
  isRetired: boolean;
  incomeScenario?: IncomeScenario;
  answers?: Record<string, string>;
};

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(rate, 0.65));
}

function progressiveTaxAmount(
  income: number,
  brackets: Array<{ upTo: number; rate: number }>
): number {
  let remaining = Math.max(0, income);
  let tax = 0;
  let prev = 0;

  for (const bracket of brackets) {
    const slice = Math.max(0, Math.min(remaining, bracket.upTo - prev));
    tax += slice * bracket.rate;
    remaining -= slice;
    prev = bracket.upTo;

    if (remaining <= 0) break;
  }

  return tax;
}

function effectiveRateFromTax(taxAmount: number, grossIncome: number): number {
  return grossIncome > 0 ? taxAmount / grossIncome : 0;
}

function combineRates(incomeTaxRate: number, socialContributionRate = 0): {
  incomeTaxRate: number;
  socialContributionRate: number;
  effectiveRate: number;
} {
  const cleanIncomeTaxRate = clampRate(incomeTaxRate);
  const cleanSocialContributionRate = clampRate(socialContributionRate);

  return {
    incomeTaxRate: cleanIncomeTaxRate,
    socialContributionRate: cleanSocialContributionRate,
    effectiveRate: clampRate(cleanIncomeTaxRate + cleanSocialContributionRate),
  };
}

// ---------------------------------------------------------------------------
// TAX ESTIMATORS
// ---------------------------------------------------------------------------

const ASIA_TAX_ESTIMATORS: Record<string, TaxEstimator> = {

  // -------------------------------------------------------------------------
  // JAPAN, JPY
  // 2024 national rates + reconstruction surtax 2.1% of income tax.
  // Local inhabitant tax: flat 10% of income.
  // No joint filing. incomeScenario: remote workers are still taxed as
  // residents if they live in Japan ≥183 days. No separate remote regime.
  // -------------------------------------------------------------------------
 JP: ({ annualIncome, isRetired }) => {

    const basicDeduction = 420000; // conservative baseline
  const employmentDeduction = Math.min(annualIncome * 0.3, 1950000);

  const taxable = Math.max(
    0,
    annualIncome - basicDeduction - employmentDeduction
  );

   const nationalTaxAmount = progressiveTaxAmount(taxable, [
    { upTo: 1950000,  rate: 0.05 },
    { upTo: 3300000,  rate: 0.10 },
    { upTo: 6950000,  rate: 0.20 },
    { upTo: 9000000,  rate: 0.23 },
    { upTo: 18000000, rate: 0.33 },
    { upTo: 40000000, rate: 0.40 },
    { upTo: Infinity, rate: 0.45 },
  ]);

  const nationalRate = effectiveRateFromTax(nationalTaxAmount, annualIncome);
  const reconstructionSurtaxRate = nationalRate * 0.021;
  const localTaxRate = 0.10;
  const incomeTaxRate = nationalRate + reconstructionSurtaxRate + localTaxRate;
const socialContributionRate = isRetired ? 0 : 0.145;
const rates = combineRates(incomeTaxRate, socialContributionRate);

  return {
    ...rates,
    model: "country-plus-local",
    confidence: "simplified",
    label: "Japan national + surtax + local inhabitant tax (2024)",
    missingFactor: "Employment income deduction not applied, may overstate income tax.",
    note: "National brackets, reconstruction surtax (2.1% of income tax), and local inhabitant tax (flat 10%) are included. Employee social insurance is estimated at ~14.5% for working individuals. Employment income deduction is not applied, so this may overstate income tax at some incomes. Income must be passed in JPY.",
  };
},

KR: ({ annualIncome, isRetired }) => {
  const nationalTaxAmount = progressiveTaxAmount(annualIncome, [
    { upTo: 14000000,   rate: 0.06 },
    { upTo: 50000000,   rate: 0.15 },
    { upTo: 88000000,   rate: 0.24 },
    { upTo: 150000000,  rate: 0.35 },
    { upTo: 300000000,  rate: 0.38 },
    { upTo: 500000000,  rate: 0.40 },
    { upTo: 1000000000, rate: 0.42 },
    { upTo: Infinity,   rate: 0.45 },
  ]);

  const nationalRate = effectiveRateFromTax(nationalTaxAmount, annualIncome);
  const localSurtaxRate = nationalRate * 0.10;
  const incomeTaxRate = nationalRate + localSurtaxRate;
const socialContributionRate = isRetired ? 0 : 0.08;
const rates = combineRates(incomeTaxRate, socialContributionRate);

  return {
    ...rates,
    model: "country-plus-local",
    confidence: "simplified",
    label: "South Korea national + local surtax (2024)",
    missingFactor: "Employment income deduction not applied, may overstate income tax at lower incomes.",
    note: "National brackets and 10% local surtax are included. Social contributions are estimated at ~8% for working individuals. Employment income deduction is not applied, so this may overstate income tax at lower incomes. Income must be passed in KRW.",
  };
},
  // -------------------------------------------------------------------------
  // SINGAPORE, SGD
  // 2024 YA rates.
  // Resident (≥183 days): progressive rates with earned income relief.
  // Non-resident: 15% flat on employment income OR progressive, whichever
  //   is HIGHER. Non-residents not physically working in Singapore generally
  //   owe no Singapore tax on foreign-source remote income.
  // Conditional: sg_residency ("resident" | "non_resident")
  // -------------------------------------------------------------------------
 SG: ({ annualIncome, isRetired, incomeScenario = "local", answers }) => {
  const residency = answers?.sg_residency ?? "";
  const isNonResident = residency === "non_resident";

  // Non-resident remote (0 tax)
  if (isNonResident && incomeScenario === "remote") {
    return {
      incomeTaxRate: 0,
      socialContributionRate: 0,
      effectiveRate: 0,
      model: "none",
      confidence: "partial",
      label: "Singapore, non-resident remote worker (foreign-source income not taxed)",
      missingFactor: "Assumes all work performed outside Singapore; any SG-source days trigger withholding.",
      note: "Singapore does not tax foreign-source income for non-residents not working in Singapore.",
    };
  }

    // Non-resident working in Singapore (local employment): 15% flat or progressive, higher
if (isNonResident && !isRetired) {
  const flatRate = 0.15;

  const progressiveTaxDue = progressiveTaxAmount(annualIncome, [
    { upTo: 20000,   rate: 0.000 },
    { upTo: 30000,   rate: 0.020 },
    { upTo: 40000,   rate: 0.035 },
    { upTo: 80000,   rate: 0.070 },
    { upTo: 120000,  rate: 0.115 },
    { upTo: 160000,  rate: 0.150 },
    { upTo: 200000,  rate: 0.180 },
    { upTo: 240000,  rate: 0.190 },
    { upTo: 280000,  rate: 0.195 },
    { upTo: 320000,  rate: 0.200 },
    { upTo: 500000,  rate: 0.220 },
    { upTo: 1000000, rate: 0.230 },
    { upTo: Infinity, rate: 0.240 },
  ]);

  const progressiveRate = effectiveRateFromTax(progressiveTaxDue, annualIncome);
  const incomeTaxRate = Math.max(flatRate, progressiveRate);
  const rates = combineRates(incomeTaxRate, 0);

  return {
    ...rates,
    model: "progressive-country",
    confidence: "partial",
    label: "Singapore non-resident Salaries Tax (2024 YA, higher of 15%/progressive)",
    missingFactor: "CPF contributions not applicable to non-residents; director's fees taxed at 24%.",
    note: "Non-resident employees pay the higher of: 15% flat rate OR progressive resident rates. CPF contributions are not required from non-residents. Director's fees are taxed at a flat 24% for non-residents (not modelled here). Income must be passed in SGD.",
  };
}

// Resident (≥183 days): standard progressive with earned income relief
const earnedIncomeRelief = isRetired ? 8000 : 1000;
const taxable = Math.max(0, annualIncome - earnedIncomeRelief);

const taxAmount = progressiveTaxAmount(taxable, [
  { upTo: 20000,   rate: 0.000 },
  { upTo: 30000,   rate: 0.020 },
  { upTo: 40000,   rate: 0.035 },
  { upTo: 80000,   rate: 0.070 },
  { upTo: 120000,  rate: 0.115 },
  { upTo: 160000,  rate: 0.150 },
  { upTo: 200000,  rate: 0.180 },
  { upTo: 240000,  rate: 0.190 },
  { upTo: 280000,  rate: 0.195 },
  { upTo: 320000,  rate: 0.200 },
  { upTo: 500000,  rate: 0.220 },
  { upTo: 1000000, rate: 0.230 },
  { upTo: Infinity, rate: 0.240 },
]);

const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
const rates = combineRates(incomeTaxRate, 0);

const hasResidencyAnswer = !!residency;

return {
  ...rates,
  model: "progressive-country",
  confidence: hasResidencyAnswer ? "partial" : "simplified",
  label: hasResidencyAnswer
    ? "Singapore resident Salaries Tax (2024 YA)"
    : "Singapore Salaries Tax (2024 YA, select residency status)",
  missingFactor: hasResidencyAnswer
    ? "CPF contributions (~20% employee) not modelled; personal reliefs not applied."
    : "Residency status matters, non-residents on foreign-source income may owe nothing.",
  note: "2024 YA resident rates with earned income relief. CPF contributions (~20% employee up to SGD 6,800/mo) are a significant real deduction. Various personal reliefs can reduce tax further. Singapore taxes residents on Singapore-source income; foreign-source income remitted is generally exempt for individuals. Income must be passed in SGD.",
};
}, 

  // -------------------------------------------------------------------------
  // THAILAND, THB
  // -------------------------------------------------------------------------
  TH: ({ annualIncome, incomeScenario = "local", answers }) => {
    const residency = answers?.th_residency ?? "";

    if (
      incomeScenario === "remote" &&
      (residency === "non_resident" || residency === "resident_no_remit")
    ) {
      return {
        incomeTaxRate: 0,
        socialContributionRate: 0,
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label:
          residency === "non_resident"
            ? "Thailand, non-resident (foreign-source income not taxed)"
            : "Thailand, resident, foreign income kept outside Thailand",
        missingFactor:
          "Assumes foreign income earned and kept abroad; remittance to Thailand triggers tax.",
        note:
          residency === "non_resident"
            ? "Non-residents are only taxed on Thailand-source income. Foreign-source income from a foreign employer is generally not subject to Thai PIT if the work is not performed in Thailand."
            : "This assumes foreign-source income is kept outside Thailand. Thailand's foreign-income remittance rules changed in 2024, so remitted foreign income may become taxable for Thai tax residents. Verify before relying on this estimate.",
      };
    }

    const deductions = Math.min(annualIncome * 0.5, 100000) + 60000;
    const taxable = Math.max(0, annualIncome - deductions);

    const taxAmount = progressiveTaxAmount(taxable, [
      { upTo: 150000, rate: 0.0 },
      { upTo: 300000, rate: 0.05 },
      { upTo: 500000, rate: 0.1 },
      { upTo: 750000, rate: 0.15 },
      { upTo: 1000000, rate: 0.2 },
      { upTo: 2000000, rate: 0.25 },
      { upTo: 5000000, rate: 0.3 },
      { upTo: Infinity, rate: 0.35 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const rates = combineRates(incomeTaxRate, 0);
    const hasAnswer = !!residency;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Thailand PIT, resident, taxable income (2024)"
        : "Thailand PIT (2024, select residency/remittance status)",
      missingFactor: hasAnswer
        ? "Social security contributions are not included."
        : "Foreign-income remittance/residency rules changed Jan 2024, treatment depends on your situation.",
      note: "Brackets and standard deductions are 2024 figures. Income must be passed in THB.",
    };
  },

  // -------------------------------------------------------------------------
  // VIETNAM, VND
  // -------------------------------------------------------------------------
  VN: ({ annualIncome, incomeScenario = "local", answers }) => {
    const residency = answers?.vn_residency ?? "";
    const isNonResident = residency === "non_resident";

    if (isNonResident && incomeScenario === "remote") {
      return {
        incomeTaxRate: 0,
        socialContributionRate: 0,
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: "Vietnam, non-resident remote worker",
        missingFactor:
          "Assumes foreign-source income and no Vietnam-source employment income.",
        note: "Non-residents are generally taxed only on Vietnam-source income. Income must be passed in VND.",
      };
    }

    if (isNonResident) {
      const rates = combineRates(0.2, 0);

      return {
        ...rates,
        model: "flat",
        confidence: "partial",
        label: "Vietnam, non-resident income tax (20% flat, 2024)",
        missingFactor:
          "Applies to Vietnam-source income only; no personal allowance available.",
        note: "Non-residents pay a flat 20% tax on Vietnam-source income. Income must be passed in VND.",
      };
    }

    const personalAllowance = 132000000;
    const taxable = Math.max(0, annualIncome - personalAllowance);

    const taxAmount = progressiveTaxAmount(taxable, [
      { upTo: 60000000, rate: 0.05 },
      { upTo: 120000000, rate: 0.1 },
      { upTo: 216000000, rate: 0.15 },
      { upTo: 384000000, rate: 0.2 },
      { upTo: 624000000, rate: 0.25 },
      { upTo: 960000000, rate: 0.3 },
      { upTo: Infinity, rate: 0.35 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const rates = combineRates(incomeTaxRate, 0);
    const hasAnswer = !!residency;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Vietnam PIT, resident (2024)"
        : "Vietnam PIT (2024, select residency status)",
      missingFactor: hasAnswer
        ? "Social insurance and dependent relief not modelled."
        : "Non-residents on foreign-source remote income may owe nothing.",
      note: "Brackets and personal allowance are 2024 figures. Income must be passed in VND.",
    };
  },

  // -------------------------------------------------------------------------
  // MALAYSIA, MYR
  // -------------------------------------------------------------------------
  MY: ({ annualIncome, incomeScenario = "local" }) => {
    if (incomeScenario === "remote") {
      return {
        incomeTaxRate: 0,
        socialContributionRate: 0,
        effectiveRate: 0,
        model: "none",
        confidence: "simplified",
        label: "Malaysia, remote worker",
        missingFactor:
          "Foreign-source income exemption should be verified before planning.",
        note: "Malaysia generally uses territorial taxation for individuals. Income must be passed in MYR.",
      };
    }

    const taxAmount = progressiveTaxAmount(annualIncome, [
      { upTo: 5000, rate: 0.0 },
      { upTo: 20000, rate: 0.01 },
      { upTo: 35000, rate: 0.03 },
      { upTo: 50000, rate: 0.06 },
      { upTo: 70000, rate: 0.11 },
      { upTo: 100000, rate: 0.19 },
      { upTo: 400000, rate: 0.25 },
      { upTo: 600000, rate: 0.26 },
      { upTo: 2000000, rate: 0.28 },
      { upTo: Infinity, rate: 0.3 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const socialContributionRate = 0.11;
const rates = combineRates(incomeTaxRate, socialContributionRate);

    return {
  ...rates,
  model: "progressive-country",
  confidence: "simplified",
  label: "Malaysia income tax (2024, local employment)",
  missingFactor: "Personal relief system not modelled.",
  note: "Brackets are 2024 figures. EPF employee contribution is estimated at 11%. Personal reliefs are not modelled. Income must be passed in MYR.",
};
  },

  // -------------------------------------------------------------------------
  // INDONESIA, IDR
  // -------------------------------------------------------------------------
  ID: ({ annualIncome }) => {
    const ptkp = 54000000; // single
const taxable = Math.max(0, annualIncome - ptkp);

const taxAmount = progressiveTaxAmount(taxable, [
      { upTo: 60000000, rate: 0.05 },
      { upTo: 250000000, rate: 0.15 },
      { upTo: 500000000, rate: 0.25 },
      { upTo: 5000000000, rate: 0.3 },
      { upTo: Infinity, rate: 0.35 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const rates = combineRates(incomeTaxRate, 0);

    return {
      ...rates,
      model: "progressive-country",
      confidence: "simplified",
      label: "Indonesia PPh income tax (2024)",
      missingFactor: "BPJS health and employment contributions are not included.",
note: "Brackets are 2024 figures. PTKP non-taxable threshold of IDR 54M is applied for single filers. Income must be passed in IDR.",
    };
  },

  // -------------------------------------------------------------------------
  // UNITED ARAB EMIRATES, AED
  // -------------------------------------------------------------------------
  AE: () => ({
    incomeTaxRate: 0,
    socialContributionRate: 0,
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "No personal income tax",
    missingFactor: "No personal income tax, this estimate is exact.",
    note: "The UAE does not levy personal income tax on employment or investment income.",
  }),

  // -------------------------------------------------------------------------
  // PHILIPPINES, PHP
  // -------------------------------------------------------------------------
  PH: ({ annualIncome, isRetired, answers }) => {
    const residency = answers?.ph_residency ?? "";

    if (residency === "non_resident_netb") {
      const rates = combineRates(0.25, 0);

      return {
        ...rates,
        model: "flat",
        confidence: "partial",
        label:
          "Philippines, non-resident alien, not engaged in trade/business (25% flat)",
        missingFactor:
          "Applies only to Philippines-source income.",
        note: "Foreign-source income is generally not taxable for non-resident aliens. Income must be passed in PHP.",
      };
    }

    const taxAmount = progressiveTaxAmount(annualIncome, [
      { upTo: 250000, rate: 0.0 },
      { upTo: 400000, rate: 0.15 },
      { upTo: 800000, rate: 0.2 },
      { upTo: 2000000, rate: 0.25 },
      { upTo: 8000000, rate: 0.3 },
      { upTo: Infinity, rate: 0.35 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const socialContributionRate = isRetired ? 0 : 0.05;
    const rates = combineRates(incomeTaxRate, socialContributionRate);
    const hasAnswer = residency === "citizen_resident";

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Philippines TRAIN Law + contributions, citizen/resident alien (2024)"
        : "Philippines TRAIN Law + contributions (2024, select residency status)",
      missingFactor:
        "13th-month pay exemption not modelled.",
      note: "2024 TRAIN Law brackets. Income must be passed in PHP.",
    };
  },

  // -------------------------------------------------------------------------
  // TAIWAN, TWD
  // -------------------------------------------------------------------------
  TW: ({ annualIncome, filing, isRetired, incomeScenario = "local", answers }) => {
    const residency = answers?.tw_residency ?? "";
    const isNonResident = residency === "non_resident";

    if (isNonResident && incomeScenario === "remote") {
      return {
        incomeTaxRate: 0,
        socialContributionRate: 0,
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: "Taiwan, non-resident remote worker",
        missingFactor:
          "Assumes foreign-source income and no Taiwan-source work.",
        note: "Non-residents are generally taxed only on Taiwan-source income. Income must be passed in TWD.",
      };
    }

    if (isNonResident && !isRetired) {
      const rates = combineRates(0.18, 0);

      return {
        ...rates,
        model: "flat",
        confidence: "partial",
        label: "Taiwan, non-resident income tax (18% flat, 2024)",
        missingFactor:
          "Applies to Taiwan-source income only.",
        note: "Non-residents pay 18% flat tax on Taiwan-source income. Income must be passed in TWD.",
      };
    }

    const standardDeduction = filing === "married" ? 262000 : 131000;
    const personalExemption = filing === "married" ? 194000 : 97000;
    const employmentDeduction = isRetired
      ? 0
      : Math.min(annualIncome * 0.2, 218000);

    const taxable = Math.max(
      0,
      annualIncome - standardDeduction - personalExemption - employmentDeduction
    );

    const taxAmount = progressiveTaxAmount(taxable, [
      { upTo: 560000, rate: 0.05 },
      { upTo: 1260000, rate: 0.12 },
      { upTo: 2520000, rate: 0.2 },
      { upTo: 4720000, rate: 0.3 },
      { upTo: Infinity, rate: 0.4 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const socialContributionRate = isRetired ? 0 : 0.025;
    const rates = combineRates(incomeTaxRate, socialContributionRate);
    const hasAnswer = !!residency;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Taiwan individual income tax, resident (2024)"
        : "Taiwan individual income tax (2024, select residency status)",
      missingFactor:
        "Special deductions not modelled.",
      note: "2024 brackets with standard deduction, personal exemption, and employment income deduction applied. Income must be passed in TWD.",
    };
  },

  // -------------------------------------------------------------------------
  // HONG KONG, HKD
  // -------------------------------------------------------------------------
  HK: ({ annualIncome, filing, isRetired, answers }) => {
    const workLocation = answers?.hk_work_location ?? "";

    function computeHkTax(income: number): number {
      const basicAllowance = filing === "married" ? 264000 : 132000;
      const taxable = Math.max(0, income - basicAllowance);

      const progressiveAmount = progressiveTaxAmount(taxable, [
        { upTo: 50000, rate: 0.02 },
        { upTo: 100000, rate: 0.06 },
        { upTo: 150000, rate: 0.1 },
        { upTo: 200000, rate: 0.14 },
        { upTo: Infinity, rate: 0.17 },
      ]);

      const standardAmount =
  income <= 5000000
    ? income * 0.15
    : 5000000 * 0.15 + (income - 5000000) * 0.16;
      const taxAmount = Math.min(progressiveAmount, standardAmount);

      return isRetired ? taxAmount * 0.85 : taxAmount;
    }

    if (workLocation === "outside_hk") {
      return {
        incomeTaxRate: 0,
        socialContributionRate: 0,
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: "Hong Kong, no Salaries Tax",
        missingFactor:
          "Any days physically working in Hong Kong create a proportional HK tax liability.",
        note: "Hong Kong Salaries Tax applies only to Hong Kong-source income. Income must be passed in HKD.",
      };
    }

    if (workLocation === "mixed") {
      const hkSourceIncome = annualIncome * 0.5;
      const taxAmount = computeHkTax(hkSourceIncome);
      const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
      const rates = combineRates(incomeTaxRate, 0);

      return {
        ...rates,
        model: "progressive-country",
        confidence: "simplified",
        label:
          "Hong Kong Salaries Tax, mixed work location (50% HK-source estimate)",
        missingFactor:
          "Actual HK tax depends on HK-worked days as a percentage of total work days.",
        note: "Mixed work location is estimated using a 50% HK-source split. Income must be passed in HKD.",
      };
    }

    const taxAmount = computeHkTax(annualIncome);
    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const rates = combineRates(incomeTaxRate, 0);
    const hasAnswer = workLocation === "in_hk";

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Hong Kong Salaries Tax (2024-25)"
        : "Hong Kong Salaries Tax (2024-25, select work location)",
      missingFactor:
        "MPF mandatory pension contributions not included.",
      note: "Salaries Tax is the lower of progressive rates or 15% standard rate. Income must be passed in HKD.",
    };
  },

  // -------------------------------------------------------------------------
  // INDIA, INR
  // -------------------------------------------------------------------------
  IN: ({ annualIncome, isRetired, answers }) => {
    const regime = answers?.in_regime ?? "new_regime";

    if (regime === "old_regime") {
      const standardDeduction = isRetired ? 0 : 50000;
      const section80C = isRetired ? 0 : 150000;
      const estimatedHRA = isRetired ? 0 : Math.min(annualIncome * 0.1, 96000);
      const taxable = Math.max(
        0,
        annualIncome - standardDeduction - section80C - estimatedHRA
      );

      const baseTaxAmount = progressiveTaxAmount(taxable, [
        { upTo: 250000, rate: 0.0 },
        { upTo: 500000, rate: 0.05 },
        { upTo: 1000000, rate: 0.2 },
        { upTo: Infinity, rate: 0.3 },
      ]);

      const surchargeRate =
        annualIncome > 50000000
          ? 0.37
          : annualIncome > 20000000
            ? 0.25
            : annualIncome > 10000000
              ? 0.15
              : annualIncome > 5000000
                ? 0.1
                : 0;

      const taxWithSurcharge = baseTaxAmount * (1 + surchargeRate);
      const cess = taxWithSurcharge * 0.04;
      const totalTax = taxWithSurcharge + cess;

      const incomeTaxRate = effectiveRateFromTax(totalTax, annualIncome);
      const socialContributionRate = isRetired ? 0 : 0.06;
      const rates = combineRates(incomeTaxRate, socialContributionRate);

      return {
        ...rates,
        model: "progressive-country",
        confidence: "partial",
        label: "India Old Tax Regime + EPF + Cess (2024-25)",
        missingFactor:
          "Actual 80C/HRA/deductions vary.",
        note: "Old Tax Regime modelled with standard deduction, 80C, conservative HRA, surcharge, cess, and EPF estimate. Income must be passed in INR.",
      };
    }

    const standardDeduction = isRetired ? 0 : 75000;
    const taxable = Math.max(0, annualIncome - standardDeduction);

    const baseTaxAmount = progressiveTaxAmount(taxable, [
      { upTo: 400000, rate: 0.0 },
{ upTo: 800000, rate: 0.05 },
{ upTo: 1200000, rate: 0.10 },
{ upTo: 1600000, rate: 0.15 },
{ upTo: 2000000, rate: 0.20 },
{ upTo: 2400000, rate: 0.25 },
{ upTo: Infinity, rate: 0.30 },
    ]);

    const cess = baseTaxAmount * 0.04;
    const totalTax = baseTaxAmount + cess;

    const incomeTaxRate = effectiveRateFromTax(totalTax, annualIncome);
    const socialContributionRate = isRetired ? 0 : 0.06;
    const rates = combineRates(incomeTaxRate, socialContributionRate);
    const hasAnswer = !!answers?.in_regime;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "India New Tax Regime + EPF + Cess (2024-25)"
        : "India New Tax Regime + EPF + Cess (2024-25, select regime)",
      missingFactor:
        "EPF estimated at ~6% of gross; actual depends on salary structure.",
      note: "New Tax Regime with standard deduction, cess, and EPF estimate. Income must be passed in INR.",
    };
  },

  // -------------------------------------------------------------------------
  // CHINA, CNY
  // -------------------------------------------------------------------------
  CN: ({ annualIncome, isRetired, incomeScenario = "local", answers }) => {
    const residency = answers?.cn_residency ?? "";
    const isNonResident = residency === "non_resident";

    if (isNonResident && incomeScenario === "remote") {
      return {
        incomeTaxRate: 0,
        socialContributionRate: 0,
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: "China, non-resident remote worker",
        missingFactor:
          "Assumes work entirely performed outside China.",
        note: "China taxes non-residents only on China-source income. Income must be passed in CNY.",
      };
    }

    const standardDeduction = 60000;
    const additionalDeduction = isRetired ? 0 : 20000;
    const taxable = Math.max(
      0,
      annualIncome - standardDeduction - additionalDeduction
    );

    const taxAmount = progressiveTaxAmount(taxable, [
      { upTo: 36000, rate: 0.03 },
      { upTo: 144000, rate: 0.1 },
      { upTo: 300000, rate: 0.2 },
      { upTo: 420000, rate: 0.25 },
      { upTo: 660000, rate: 0.3 },
      { upTo: 960000, rate: 0.35 },
      { upTo: Infinity, rate: 0.45 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const socialContributionRate = isRetired || isNonResident ? 0 : 0.105;
    const rates = combineRates(incomeTaxRate, socialContributionRate);
    const hasAnswer = !!residency;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "China IIT + social insurance (2024)"
        : "China IIT + social insurance (2024, select residency status)",
      missingFactor:
        "Housing fund and regional social base variations not fully captured.",
      note: "2024 comprehensive income brackets with standard deduction and simplified deductions. Income must be passed in CNY.",
    };
  },

  // -------------------------------------------------------------------------
  // QATAR, QAR
  // -------------------------------------------------------------------------
  QA: () => ({
    incomeTaxRate: 0,
    socialContributionRate: 0,
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "No personal income tax",
    missingFactor: "No personal income tax on employment income, this estimate is exact.",
    note: "Qatar does not levy personal income tax on salaries and wages.",
  }),

  // -------------------------------------------------------------------------
  // SAUDI ARABIA, SAR
  // -------------------------------------------------------------------------
  SA: () => ({
    incomeTaxRate: 0,
    socialContributionRate: 0,
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "No personal income tax on employment income",
    missingFactor: "No personal income tax, expatriates pay no income tax in Saudi Arabia.",
    note: "Saudi Arabia does not levy personal income tax on employment income.",
  }),

  // -------------------------------------------------------------------------
  // OMAN, OMR
  // -------------------------------------------------------------------------
  OM: () => ({
    incomeTaxRate: 0,
    socialContributionRate: 0,
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "No personal income tax",
    missingFactor: "No personal income tax on employment income, this estimate is exact.",
    note: "Oman does not levy personal income tax on salaries and wages.",
  }),

  // -------------------------------------------------------------------------
  // AUSTRALIA, AUD
  // -------------------------------------------------------------------------
  AU: ({ annualIncome, isRetired }) => {
    const taxAmount = progressiveTaxAmount(annualIncome, [
      { upTo: 18200, rate: 0.0 },
      { upTo: 45000, rate: 0.19 },
      { upTo: 135000, rate: 0.325 },
      { upTo: 190000, rate: 0.37 },
      { upTo: Infinity, rate: 0.45 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const socialContributionRate = isRetired ? 0.01 : 0.02;
    const rates = combineRates(incomeTaxRate, socialContributionRate);

    return {
      ...rates,
      model: "progressive-country",
      confidence: "partial",
      label: "Australia income tax + Medicare Levy (2024-25)",
      missingFactor:
        "LITO not applied.",
      note: "2024-25 brackets and Medicare Levy included. Income must be passed in AUD.",
    };
  },

  // -------------------------------------------------------------------------
  // NEW ZEALAND, NZD
  // -------------------------------------------------------------------------
  NZ: ({ annualIncome }) => {
    const taxAmount = progressiveTaxAmount(annualIncome, [
      { upTo: 14000, rate: 0.105 },
      { upTo: 53500, rate: 0.175 },
      { upTo: 78100, rate: 0.3 },
      { upTo: 180000, rate: 0.33 },
      { upTo: Infinity, rate: 0.39 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
const accIncomeCap = 142283;
const accTaxableIncome = Math.min(annualIncome, accIncomeCap);
const accLevyAmount = accTaxableIncome * 0.016;
const socialContributionRate = effectiveRateFromTax(accLevyAmount, annualIncome);
const rates = combineRates(incomeTaxRate, socialContributionRate);

    return {
  ...rates,
  model: "progressive-country",
  confidence: "partial",
  label: "New Zealand PAYE (2024-25)",
  missingFactor: "Low-income tax credits and other individual adjustments not included.",
  note: "2024-25 brackets included. ACC earner levy is estimated at 1.6% up to the income cap. Income must be passed in NZD.",
};
  },

};

// ---------------------------------------------------------------------------
// CONDITIONAL QUESTIONS
// ---------------------------------------------------------------------------

const ASIA_TAX_QUESTIONS: Record<string, ConditionalQuestion[]> = {
  SG: [
    {
      key: "sg_residency",
      label: "What is your Singapore tax residency status?",
      helpText:
        "Singapore tax residents (≥183 days/year) pay progressive rates. Non-residents pay the higher of 15% flat or progressive rates on Singapore-source income. Remote workers for foreign employers not physically working in Singapore generally owe no Singapore tax.",
      options: [
        { value: "resident",     label: "Resident, ≥183 days in Singapore per year" },
        { value: "non_resident", label: "Non-resident, fewer than 183 days in Singapore" },
      ],
    },
  ],
 TH: [
  {
    key: "th_residency",
    label: "Will you live in Thailand most of the year and bring your income into Thailand?",
    helpText:
      "Thailand tax residents are generally people who spend 180+ days in Thailand in a calendar year. Since 2024, foreign-source income earned from Jan 1, 2024 onward may be taxable when remitted into Thailand. Non-residents are generally taxed only on Thailand-source income.",
    options: [
      {
        value: "resident_remits",
        label: "Resident, 180+ days and I remit foreign income to Thailand",
      },
      {
        value: "resident_no_remit",
        label: "Resident, 180+ days but I keep foreign income outside Thailand",
      },
      {
        value: "non_resident",
        label: "Non-resident, fewer than 180 days in Thailand",
      },
    ],
  },
],
  VN: [
    {
      key: "vn_residency",
      label: "What is your Vietnam tax residency status?",
      helpText:
        "Vietnam tax residents (≥183 days/year) are taxed on worldwide income at progressive rates (5–35%). Non-residents pay a flat 20% on Vietnam-source income only. Remote workers for foreign employers not working in Vietnam owe no Vietnam PIT.",
      options: [
        { value: "resident",     label: "Resident, ≥183 days in Vietnam per year" },
        { value: "non_resident", label: "Non-resident, fewer than 183 days in Vietnam" },
      ],
    },
  ],
  TW: [
    {
      key: "tw_residency",
      label: "What is your Taiwan tax residency status?",
      helpText:
        "Taiwan tax residents (≥183 days/year) are taxed on worldwide income at progressive rates with full deductions. Non-residents pay 18% flat on Taiwan-source income only. Remote workers for foreign employers outside Taiwan generally owe no Taiwan tax.",
      options: [
        { value: "resident",     label: "Resident, ≥183 days in Taiwan per year" },
        { value: "non_resident", label: "Non-resident, fewer than 183 days in Taiwan" },
      ],
    },
  ],
  PH: [
    {
      key: "ph_residency",
      label: "What is your Philippines tax status?",
      helpText:
        "Filipino citizens and resident aliens are taxed on worldwide income. Non-resident aliens engaged in business pay TRAIN rates on Philippine-source income. Non-resident aliens not engaged pay 25% flat on Philippine-source income only.",
      options: [
        { value: "citizen_resident",   label: "Filipino citizen or resident alien, worldwide income" },
        { value: "non_resident_etb",   label: "Non-resident alien, engaged in business in PH" },
        { value: "non_resident_netb",  label: "Non-resident alien, NOT engaged in business in PH (25% flat)" },
      ],
    },
  ],
  HK: [
    {
      key: "hk_work_location",
      label: "Where will your work services be performed?",
      helpText:
        "Hong Kong Salaries Tax applies only to Hong Kong-source income, income from services physically rendered in Hong Kong. If all your work is performed outside HK, no Salaries Tax is due. Mixed situations are apportioned by HK working days.",
      options: [
        { value: "in_hk",      label: "All work performed in Hong Kong" },
        { value: "outside_hk", label: "All work performed outside Hong Kong" },
        { value: "mixed",      label: "Mixed, work partly in HK, partly outside (50% split estimated)" },
      ],
    },
  ],
  IN: [
    {
      key: "in_regime",
      label: "Which India income tax regime applies to you?",
      helpText:
        "India's New Tax Regime (default since FY2023-24) has lower rates but fewer deductions. The Old Regime has higher rates but allows 80C investments, HRA, and home loan interest deductions, often better for those with significant eligible deductions.",
      options: [
        { value: "new_regime", label: "New Tax Regime, lower rates, fewer deductions (default)" },
        { value: "old_regime", label: "Old Tax Regime, higher rates, with 80C/HRA/home loan deductions" },
      ],
    },
  ],
  CN: [
    {
      key: "cn_residency",
      label: "What is your China tax residency status?",
      helpText:
        "China taxes residents (≥183 days/year) on worldwide income. Non-residents are taxed only on China-source income. Foreigners resident fewer than 6 consecutive years may apply for exemption on overseas income not remitted to China.",
      options: [
        { value: "resident",     label: "Resident, ≥183 days in China per year" },
        { value: "non_resident", label: "Non-resident, fewer than 183 days in China" },
      ],
    },
  ],
};

export function getAsiaTaxQuestionsForCountry(
  countryCode: string,
  incomeScenario: IncomeScenario
): ConditionalQuestion[] {
  const questions = ASIA_TAX_QUESTIONS[countryCode] ?? [];
  return questions.filter((q) => {
    if (!q.when?.incomeScenario) return true;
    return q.when.incomeScenario.includes(incomeScenario);
  });
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export function estimateAsiaTax({
  countryCode,
  annualIncome,
  filing,
  isRetired,
  incomeScenario = isRetired ? "retired" : "local",
  answers = {},
}: EstimateAsiaTaxArgs): TaxEstimateResult {
  const estimator = ASIA_TAX_ESTIMATORS[countryCode];
 if (!estimator) {
  return {
    incomeTaxRate: 0,
    socialContributionRate: 0,
    effectiveRate: 0,
    model: "placeholder",
    confidence: "placeholder",
    label: "Tax estimate unavailable",
    missingFactor: "Tax model not configured for this country yet.",
    note: "Tax model not yet configured for this country.",
  };
}
  return estimator({ annualIncome, filing, isRetired, incomeScenario, answers });
}

// ---------------------------------------------------------------------------
// STATUS HELPER
// Samples at a meaningful planning income in each country's local currency
// (~USD 80,000 equivalent at approximate early 2026 rates), single filer.
// ---------------------------------------------------------------------------
const SAMPLE_INCOME_BY_COUNTRY: Record<string, number> = {
  JP:  12000000,  // ~$80k at ¥150/USD
  KR:  112000000, // ~$80k at ₩1,400/USD
  SG:  108000,    // ~$80k at SGD 1.35/USD
  TH:  2880000,   // ~$80k at ฿36/USD
  VN:  1960000000,// ~$80k at ₫24,500/USD
  MY:  376000,    // ~$80k at RM 4.70/USD
  ID:  1256000000,// ~$80k at Rp 15,700/USD
  AE:  293600,    // ~$80k at AED 3.67/USD (irrelevant, zero tax)
  PH:  4480000,   // ~$80k at ₱56/USD
  TW:  2600000,   // ~$80k at NT$32.5/USD
  HK:  624000,    // ~$80k at HK$7.8/USD
  IN:  6680000,   // ~$80k at ₹83.5/USD
  CN:  576000,    // ~$80k at ¥7.2/USD
  QA:  291200,    // ~$80k at QAR 3.64/USD (irrelevant, zero tax)
  SA:  300000,    // ~$80k at SAR 3.75/USD (irrelevant, zero tax)
  OM:  30800,     // ~$80k at OMR 0.385/USD (irrelevant, zero tax)
  AU:  123200,    // ~$80k at A$1.54/USD
  NZ:  131200,    // ~$80k at NZ$1.64/USD
};

export function getAsiaTaxModelStatus(countryCode: string): {
  model: TaxModelKind;
  confidence: TaxConfidence;
  label: string;
  note: string;
} {
  const estimator = ASIA_TAX_ESTIMATORS[countryCode];
  if (!estimator) {
    return { model: "placeholder", confidence: "placeholder", label: "Simplified", note: "No tax model configured for this country." };
  }
  const sampleIncome = SAMPLE_INCOME_BY_COUNTRY[countryCode] ?? 100000;
  const sample = estimator({ annualIncome: sampleIncome, filing: "single", isRetired: false, incomeScenario: "local", answers: {} });
  return { model: sample.model, confidence: sample.confidence, label: sample.label, note: sample.note };
}