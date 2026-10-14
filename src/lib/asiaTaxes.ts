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

import { AUSTRALIA_TAX_YEAR_LABEL, australiaTax } from "./countryTaxRules/australia";
import { INDONESIA_NOTE, INDONESIA_TAX_YEAR_LABEL, indonesiaTax } from "./countryTaxRules/indonesia";
import { MALAYSIA_TAX_YEAR_LABEL, malaysiaTax } from "./countryTaxRules/malaysia";
import { THAILAND_TAX_YEAR_LABEL, thailandTax } from "./countryTaxRules/thailand";
import { VIETNAM_TAX_YEAR_LABEL, vietnamTax } from "./countryTaxRules/vietnam";
import { NEW_ZEALAND_TAX_YEAR_LABEL, newZealandTax } from "./countryTaxRules/newZealand";
import { PHILIPPINES_TAX_YEAR_LABEL, philippinesTax } from "./countryTaxRules/philippines";
import { NO_US_OVERLAY, US_SELF_EMPLOYED_KEY, US_SELF_EMPLOYED_QUESTION, US_TAX_STATUS_KEY, US_TAX_STATUS_QUESTION, withUsTaxAbroad } from "./internationalTaxes";

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
  TH: ({ annualIncome, isRetired, incomeScenario = "local", answers }) => {
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

    // Rules in countryTaxRules/thailand.ts: Revenue Department scale, deductions, social security to THB 875 a month.
    const { incomeTax, contributions } = thailandTax(annualIncome, isRetired ? "retired" : incomeScenario);
    const incomeTaxRate = effectiveRateFromTax(incomeTax, annualIncome);
    const rates = combineRates(incomeTaxRate, effectiveRateFromTax(contributions, annualIncome));
    const hasAnswer = !!residency;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? `Thailand PIT + social security, resident (${THAILAND_TAX_YEAR_LABEL})`
        : `Thailand PIT + social security (${THAILAND_TAX_YEAR_LABEL}, select residency/remittance status)`,
      missingFactor: hasAnswer
        ? "Allowances for spouse, children and parents and fund deductions not modelled."
        : "Foreign-income remittance/residency rules changed Jan 2024, treatment depends on your situation.",
      note: "Revenue Department scale (0% to THB 150,000, then 5% to 35% above THB 5 million) after the 50% expense deduction (up to THB 100,000), the THB 60,000 personal allowance and employee social security of 5% on pay up to THB 17,500 a month (at most THB 875 a month from 2026, deductible); retirees and remote workers paid abroad pay no social security here. Income must be passed in THB.",
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
        label: "Vietnam, non-resident income tax (20% flat)",
        missingFactor:
          "Applies to Vietnam-source income only; no personal allowance available.",
        note: "Non-residents pay a flat 20% tax on Vietnam-source income. Income must be passed in VND.",
      };
    }

    // Rules in countryTaxRules/vietnam.ts: Law 109/2025 five-bracket scale, VND 186 million personal deduction, insurance 10.5%.
    const { incomeTax, contributions } = vietnamTax(annualIncome, incomeScenario);
    const incomeTaxRate = effectiveRateFromTax(incomeTax, annualIncome);
    const rates = combineRates(incomeTaxRate, effectiveRateFromTax(contributions, annualIncome));
    const hasAnswer = !!residency;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? `Vietnam PIT + social insurance, resident (${VIETNAM_TAX_YEAR_LABEL})`
        : `Vietnam PIT + social insurance (${VIETNAM_TAX_YEAR_LABEL}, select residency status)`,
      missingFactor: hasAnswer
        ? "Dependant deductions (VND 6.2 million a month each) not modelled; figures come from advisers' summaries of Law 109/2025."
        : "Non-residents on foreign-source remote income may owe nothing.",
      note: "Law 109/2025 as summarised by advisers: five brackets of 5%, 10%, 20%, 30% and 35% on taxable income (monthly limits of VND 10, 30, 60 and 100 million), after the VND 15.5 million monthly personal deduction and employee social insurance of 10.5% (up to 20 times the VND 2.34 million base salary), which is deductible. Retirees and remote workers paid abroad pay no insurance here. One source lists different middle rates, so treat this as an estimate. Income must be passed in VND.",
    };
  },

  // -------------------------------------------------------------------------
  // MALAYSIA, MYR
  // -------------------------------------------------------------------------
  MY: ({ annualIncome, isRetired, incomeScenario = "local" }) => {
    // Rules in countryTaxRules/malaysia.ts: LHDN resident rates, reliefs, EPF 11%; foreign-sourced and pension income exempt.
    const scenario = isRetired ? "retired" : incomeScenario;
    const { incomeTax, contributions } = malaysiaTax(annualIncome, scenario);
    const rates = combineRates(effectiveRateFromTax(incomeTax, annualIncome), effectiveRateFromTax(contributions, annualIncome));
    const exempt = scenario !== "local";
    return {
      ...rates,
      model: exempt ? "none" : "progressive-country",
      confidence: "simplified",
      label: exempt ? "Malaysia, foreign-sourced or pension income" : `Malaysia income tax + EPF/SOCSO (${MALAYSIA_TAX_YEAR_LABEL}, local employment)`,
      missingFactor: exempt
        ? "The exemption for foreign-sourced income runs to 2036 and has conditions; verify it before planning."
        : "Spouse, child and other reliefs, the EPF/insurance cap and the contribution rates (not re-read) are not modelled.",
      note: exempt
        ? "Malaysia taxes individuals on income arising in Malaysia: foreign-sourced income received by a resident individual is exempt (through 2036) and approved pensions are exempt, so no Malaysian income tax or contributions are shown. Check the conditions and the source of your income. Income must be passed in MYR."
        : "Uses the LHDN resident rates (0% to 30%), the MYR 9,000 individual relief, the EPF relief (up to MYR 4,000) and the MYR 400 rebate at chargeable income of MYR 35,000 or less, plus employee EPF (11%), SOCSO and EIS (0.7% on pay up to MYR 6,000 a month). Not modelled: spouse, child, parent, lifestyle and medical reliefs. Income must be passed in MYR.",
    };
  },

  // -------------------------------------------------------------------------
  // INDONESIA, IDR
  // -------------------------------------------------------------------------
  ID: ({ annualIncome, filing, isRetired }) => {
    // Rules in countryTaxRules/indonesia.ts (DJP Article 17 layers, PTKP, occupational-cost allowance).
    const taxAmount = indonesiaTax(annualIncome, filing === "married" ? "married" : "single", !!isRetired);
    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    const rates = combineRates(incomeTaxRate, 0);

    return {
      ...rates,
      model: "progressive-country",
      confidence: "simplified",
      label: `Indonesia PPh income tax (${INDONESIA_TAX_YEAR_LABEL} rules)`,
      missingFactor: "BPJS health and employment contributions are not included.",
      note: INDONESIA_NOTE,
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
    note: "The UAE does not levy personal income tax on employment or investment income; the Federal Tax Authority states that corporate tax does not apply to an individual's salary. A 9% corporate tax applies to businesses with profits above AED 375,000, which can matter for freelancers who operate through a company.",
  }),

  // -------------------------------------------------------------------------
  // PHILIPPINES, PHP
  // -------------------------------------------------------------------------
  PH: ({ annualIncome, isRetired, incomeScenario = "local", answers }) => {
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

    // Rules in countryTaxRules/philippines.ts: BIR graduated rates, SSS/PhilHealth/Pag-IBIG employee contributions.
    const { incomeTax, contributions } = philippinesTax(annualIncome, isRetired ? "retired" : incomeScenario);
    const rates = combineRates(effectiveRateFromTax(incomeTax, annualIncome), effectiveRateFromTax(contributions, annualIncome));
    const hasAnswer = residency === "citizen_resident";

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? `Philippines income tax + SSS/PhilHealth/Pag-IBIG, citizen/resident alien (${PHILIPPINES_TAX_YEAR_LABEL})`
        : `Philippines income tax + SSS/PhilHealth/Pag-IBIG (${PHILIPPINES_TAX_YEAR_LABEL}, select residency status)`,
      missingFactor:
        "13th-month pay exemption (up to PHP 90,000) and the 8% option for self-employed not modelled; contribution rates come from payroll summaries.",
      note: "Uses the BIR graduated rates (0% to PHP 250,000, then 15% to 35%) on income after mandatory contributions, with employee SSS (5% up to a PHP 35,000 monthly salary credit), PhilHealth (2.5% on pay between PHP 10,000 and 100,000 a month) and Pag-IBIG (PHP 200 a month). Retirees and remote workers paid abroad pay no Philippine contributions here. Income must be passed in PHP.",
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
        label: "Taiwan, non-resident income tax (18% flat)",
        missingFactor:
          "Applies to Taiwan-source income only.",
        note: "Non-residents pay 18% flat tax on Taiwan-source income. Income must be passed in TWD.",
      };
    }

    // Ministry of Finance announcement of 27 November 2025 for income year 115 (2026), reported by TVBS: exemption NT$101,000,
    // standard deduction NT$136,000 (NT$272,000 for a couple), salary special deduction NT$227,000, brackets 5% to NT$610,000, 12% to
    // 1,380,000, 20% to 2,770,000, 30% to 5,190,000, 40% above (the Ministry's own release was not fetched).
    const standardDeduction = filing === "married" ? 272000 : 136000;
    const personalExemption = filing === "married" ? 202000 : 101000;
    const employmentDeduction = isRetired
      ? 0
      : Math.min(annualIncome, 227000);

    const taxable = Math.max(
      0,
      annualIncome - standardDeduction - personalExemption - employmentDeduction
    );

    const taxAmount = progressiveTaxAmount(taxable, [
      { upTo: 610000, rate: 0.05 },
      { upTo: 1380000, rate: 0.12 },
      { upTo: 2770000, rate: 0.2 },
      { upTo: 5190000, rate: 0.3 },
      { upTo: Infinity, rate: 0.4 },
    ]);

    const incomeTaxRate = effectiveRateFromTax(taxAmount, annualIncome);
    // Employee share of labour insurance (13% x 20%, insured salary capped at NT$45,800 a month) and national health insurance (5.17% x 30%,
    // capped at NT$219,500 a month), from insurer summaries (not re-read); retirees and remote workers pay none here.
    const monthly = annualIncome / 12;
    const insurance = isRetired || incomeScenario === "remote" || annualIncome <= 0
      ? 0
      : 12 * (0.13 * 0.2 * Math.min(monthly, 45800) + 0.0517 * 0.3 * Math.min(monthly, 219500));
    const socialContributionRate = annualIncome > 0 ? insurance / annualIncome : 0;
    const rates = combineRates(incomeTaxRate, socialContributionRate);
    const hasAnswer = !!residency;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Taiwan individual income tax + insurance, resident (2026)"
        : "Taiwan individual income tax + insurance (2026, select residency status)",
      missingFactor:
        "Dependants, itemised and special deductions not modelled; the 2026 figures come from a news report of the Ministry of Finance announcement.",
      note: "2026 income-year figures announced by the Ministry of Finance: personal exemption NT$101,000, standard deduction NT$136,000 (NT$272,000 for couples), salary special deduction up to NT$227,000, and brackets of 5% to NT$610,000, 12%, 20%, 30% and 40% above NT$5.19 million. Employees also pay about 2.6% for labour insurance (on up to NT$45,800 a month) and 1.55% for health insurance (on up to NT$219,500 a month); retirees and remote workers paid abroad pay none here. Income must be passed in TWD.",
    };
  },

  // -------------------------------------------------------------------------
  // HONG KONG, HKD
  // -------------------------------------------------------------------------
  HK: ({ annualIncome, filing, isRetired, answers }) => {
    const workLocation = answers?.hk_work_location ?? "";

    // Inland Revenue Department, 2026-27: basic allowance HK$145,000 and married person's allowance HK$290,000 (2026-27 Budget,
    // https://www.ird.gov.hk/eng/tax/budget.htm); progressive rates 2% to 17% on bands of HK$50,000; standard rate 15% on the first
    // HK$5 million of net income and 16% above (https://www.gov.hk/en/residents/taxes/taxfiling/taxrates/salariesrates.htm);
    // mandatory MPF contributions of 5% of pay up to HK$18,000 a year are deductible (cap not re-read for 2026-27).
    // Read 2026-10-14. The old model also cut retirees' tax by 15% with no basis; that is removed.
    function computeHkTax(income: number): number {
      const basicAllowance = filing === "married" ? 290000 : 145000;
      const mpf = isRetired ? 0 : Math.min(0.05 * income, 18000);
      const net = income - mpf;
      const taxable = Math.max(0, net - basicAllowance);

      const progressiveAmount = progressiveTaxAmount(taxable, [
        { upTo: 50000, rate: 0.02 },
        { upTo: 100000, rate: 0.06 },
        { upTo: 150000, rate: 0.1 },
        { upTo: 200000, rate: 0.14 },
        { upTo: Infinity, rate: 0.17 },
      ]);

      const standardAmount =
  net <= 5000000
    ? net * 0.15
    : 5000000 * 0.15 + (net - 5000000) * 0.16;
      return Math.min(progressiveAmount, standardAmount);
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
    const mpfRate = isRetired || annualIncome <= 0 ? 0 : Math.min(0.05 * annualIncome, 18000) / annualIncome;
    const rates = combineRates(incomeTaxRate, mpfRate);
    const hasAnswer = workLocation === "in_hk";

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Hong Kong Salaries Tax + MPF (2026-27)"
        : "Hong Kong Salaries Tax + MPF (2026-27, select work location)",
      missingFactor:
        "Dependant allowances and other deductions not modelled.",
      note: "Salaries Tax is the lower of the progressive rates (2% to 17% on bands of HK$50,000) and the standard rate (15% on the first HK$5 million of net income, 16% above), after the 2026-27 basic allowance of HK$145,000 (HK$290,000 for a married person) and the deduction for mandatory MPF contributions (5% of pay, up to HK$18,000 a year, which is also counted as a cost). Retirees pay no MPF. Not modelled: allowances for children and dependants and other deductions. Income must be passed in HKD.",
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

    // Section 87A rebate (Income Tax Department / PIB, Budget 2025): up to INR 60,000 when income under the new regime is INR 12,00,000
    // or less, so no tax; above that, tax cannot exceed the income over INR 12,00,000 (marginal relief). Read 2026-10-14.
    const afterRebate = taxable <= 1200000
      ? Math.max(0, baseTaxAmount - 60000)
      : Math.min(baseTaxAmount, taxable - 1200000);
    const cess = afterRebate * 0.04;
    const totalTax = afterRebate + cess;

    const incomeTaxRate = effectiveRateFromTax(totalTax, annualIncome);
    const socialContributionRate = isRetired ? 0 : 0.06;
    const rates = combineRates(incomeTaxRate, socialContributionRate);
    const hasAnswer = !!answers?.in_regime;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "India New Tax Regime + EPF + Cess (FY 2025-26, AY 2026-27)"
        : "India New Tax Regime + EPF + Cess (FY 2025-26, select regime)",
      missingFactor:
        "EPF estimated at ~6% of gross; actual depends on salary structure.",
      note: "New Tax Regime slabs (nil to INR 4 lakh, then 5% to 30% at INR 24 lakh), the INR 75,000 standard deduction for salaried people, the section 87A rebate (no tax up to INR 12 lakh of income, with marginal relief just above) and 4% cess, as published by the Income Tax Department for AY 2026-27; the 2026-27 slabs were not separately found. EPF is a rough 6% estimate. Surcharge on incomes above INR 50 lakh is not applied. Income must be passed in INR.",
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

    // Comprehensive-income table and the CNY 60,000 basic deduction: State Taxation Administration, Individual Income Tax Law
    // (https://fgk.chinatax.gov.cn/zcfgk/c100009/c5193028/content.html); the table is unchanged for 2026 (read 2026-10-14).
    // Employee social insurance (pension 8%, medical 2%, unemployment 0.5%) is deducted before income tax. The old model
    // invented a CNY 20,000 "additional deduction"; the real special additional deductions (children, housing, elder care)
    // depend on the household, so none is applied.
    const standardDeduction = 60000;
    const socialRate = isRetired || isNonResident ? 0 : 0.105;
    const taxable = Math.max(0, annualIncome - standardDeduction - socialRate * annualIncome);

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
    const socialContributionRate = socialRate;
    const rates = combineRates(incomeTaxRate, socialContributionRate);
    const hasAnswer = !!residency;

    return {
      ...rates,
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "China IIT + social insurance (2026)"
        : "China IIT + social insurance (2026, select residency status)",
      missingFactor:
        "Housing fund, city social-insurance bases and family deductions not modelled.",
      note: "Uses the State Taxation Administration's comprehensive-income table (3% to 45%), the CNY 60,000 basic deduction, and employee social insurance of 10.5% (pension 8%, medical 2%, unemployment 0.5%) deducted before tax. Not modelled: the housing provident fund (5% to 12% by city), each city's minimum and maximum social-insurance base, the special additional deductions for children, housing and elder care, and the separate tax treatment of year-end bonuses. Income must be passed in CNY.",
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
    note: "Qatar does not levy personal income tax on salaries and wages (General Tax Authority). Self-employed people carrying on commercial activity for profit are taxed at the 10% corporate rate, which is not modelled here.",
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
    note: "Saudi Arabia does not levy personal income tax on employment income (ZATCA's income tax page covers business activity and non-resident income; the no-salary-tax position rests on secondary sources). Expatriates with dependants pay an annual levy of SAR 4,800 per dependant, which is not modelled.",
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
    label: "No personal income tax (until 2028)",
    missingFactor: "A 5% personal income tax on income above OMR 42,000 starts on 1 January 2028 (Royal Decree 56/2025, per news reports; the Tax Authority page was not read).",
    note: "Oman does not levy personal income tax on salaries and wages in 2026 or 2027. Royal Decree 56/2025 introduces a 5% tax on individuals with annual income above OMR 42,000 from 1 January 2028; the executive regulations were still to be issued, so the exact calculation is not yet known. Omani nationals also pay social security, which is not modelled here.",
  }),

  // -------------------------------------------------------------------------
  // AUSTRALIA, AUD
  // -------------------------------------------------------------------------
  AU: ({ annualIncome }) => {
    // Rules in countryTaxRules/australia.ts: ATO 2026-27 resident rates, low income tax offset, 2% Medicare levy.
    const { incomeTax, medicareLevy } = australiaTax(annualIncome);
    const rates = combineRates(
      effectiveRateFromTax(incomeTax, annualIncome),
      annualIncome > 0 ? medicareLevy / annualIncome : 0,
    );

    return {
      ...rates,
      model: "progressive-country",
      confidence: "partial",
      label: `Australia income tax + Medicare Levy (${AUSTRALIA_TAX_YEAR_LABEL})`,
      missingFactor: "Medicare levy low-income reduction, surcharge and HELP repayments not applied.",
      note: "Resident rates, low income tax offset and the 2% Medicare levy are from the Australian Taxation Office for 2026-27. Employer superannuation is paid on top of salary and is not deducted. Income must be passed in Australian dollars.",
    };
  },

  // -------------------------------------------------------------------------
  // NEW ZEALAND, NZD
  // -------------------------------------------------------------------------
  NZ: ({ annualIncome, isRetired, incomeScenario = "local" }) => {
    // Rules in countryTaxRules/newZealand.ts (same as the International estimator).
    const { incomeTax, acc } = newZealandTax(annualIncome, isRetired ? "retired" : incomeScenario);
    const rates = combineRates(effectiveRateFromTax(incomeTax, annualIncome), effectiveRateFromTax(acc, annualIncome));
    return {
      ...rates,
      model: "progressive-country",
      confidence: "partial",
      label: `New Zealand income tax + ACC levy (${NEW_ZEALAND_TAX_YEAR_LABEL})`,
      missingFactor: "KiwiSaver, tax credits and student-loan repayments not modelled; the ACC rate comes from payroll summaries.",
      note: "Uses Inland Revenue's resident rates (10.5% to NZD 15,600, 17.5% to 53,500, 30% to 78,100, 33% to 180,000, 39% above) and, for employees, the ACC earners' levy of 1.75% up to NZD 156,641 (2026-27, from payroll summaries of the ACC regulations). NZ Superannuation is taxed at the same rates with no levy; remote workers paid abroad pay no ACC levy. Not modelled: KiwiSaver, low-income and family credits, student-loan repayments. Income must be passed in NZD.",
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
  const questions = (ASIA_TAX_QUESTIONS[countryCode] ?? []).filter((q) => {
    if (!q.when?.incomeScenario) return true;
    return q.when.incomeScenario.includes(incomeScenario);
  });
  return NO_US_OVERLAY.has(countryCode) ? questions : [...questions, US_TAX_STATUS_QUESTION, US_SELF_EMPLOYED_QUESTION];
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
  const base = estimator({ annualIncome, filing, isRetired, incomeScenario, answers });
  if (answers[US_TAX_STATUS_KEY] === "yes" && !NO_US_OVERLAY.has(countryCode)) {
    return { ...base, ...withUsTaxAbroad(base, countryCode, annualIncome, filing, incomeScenario, answers[US_SELF_EMPLOYED_KEY] === "yes") };
  }
  return base;
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