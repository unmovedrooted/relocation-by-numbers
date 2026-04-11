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
//  "verified"    — Zero-tax or trivially exact.
//                  Countries: AE, QA, SA, OM.
//
//  "partial"     — Core brackets correct and current. Dominant structural
//                  components modelled. Gap bounded and unlikely to exceed
//                  ~3–4 pp for most planning incomes.
//                  Countries: AU, NZ.
//
//  "simplified"  — Structurally believable but at least one significant
//                  source of variation is unmodelled. Gap may be 5–10 pp.
//                  Countries: JP, KR, MY, VN, ID.
//
//  "placeholder" — Thresholds unstable or model too simplified for reliable
//                  planning. Use directional only.
//                  Not currently assigned, but structure preserved.
//
//  Note: SG, TH, TW, PH, CN, IN, HK upgrade from "simplified" to "partial"
//  when the residency/regime conditional question is answered.

export type TaxConfidence = "verified" | "partial" | "simplified" | "placeholder";

export type TaxEstimateResult = {
  effectiveRate: number;
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

function progressiveTax(
  income: number,
  brackets: Array<{ upTo: number; rate: number }>
): number {
  let remaining = Math.max(0, income);
  let taxed = 0;
  let prev = 0;
  for (const bracket of brackets) {
    const slice = Math.max(0, Math.min(remaining, bracket.upTo - prev));
    taxed += slice * bracket.rate;
    remaining -= slice;
    prev = bracket.upTo;
    if (remaining <= 0) break;
  }
  if (remaining > 0) {
    taxed += remaining * (brackets[brackets.length - 1]?.rate ?? 0);
  }
  return income > 0 ? taxed / income : 0;
}

// ---------------------------------------------------------------------------
// TAX ESTIMATORS
// ---------------------------------------------------------------------------

const ASIA_TAX_ESTIMATORS: Record<string, TaxEstimator> = {

  // -------------------------------------------------------------------------
  // JAPAN — JPY
  // 2024 national rates + reconstruction surtax 2.1% of income tax.
  // Local inhabitant tax: flat 10% of income.
  // No joint filing. incomeScenario: remote workers are still taxed as
  // residents if they live in Japan ≥183 days. No separate remote regime.
  // -------------------------------------------------------------------------
  JP: ({ annualIncome, isRetired }) => {
    const nationalRate = progressiveTax(annualIncome, [
      { upTo: 1950000,  rate: 0.05 },
      { upTo: 3300000,  rate: 0.10 },
      { upTo: 6950000,  rate: 0.20 },
      { upTo: 9000000,  rate: 0.23 },
      { upTo: 18000000, rate: 0.33 },
      { upTo: 40000000, rate: 0.40 },
      { upTo: Infinity, rate: 0.45 },
    ]);
    const reconstructionSurtax = nationalRate * 0.021;
    const localTax = 0.10;
    const pensionDeduction = isRetired ? -0.02 : 0;
    return {
      effectiveRate: clampRate(nationalRate + reconstructionSurtax + localTax + pensionDeduction),
      model: "country-plus-local",
      confidence: "simplified",
      label: "Japan national + surtax + local inhabitant tax (2024)",
      missingFactor: "Employee social insurance (~14–15% combined) not included.",
      note: "National brackets, reconstruction surtax (2.1% of income tax), and local inhabitant tax (flat 10%) are correct. Major omission: employee social insurance premiums total ~14–15% of gross salary (health ~5%, pension ~9.15%, employment ~0.6%). Employment income deduction (kyuyo shotoku kojo) not applied — may overstate income tax by several pp. Japan taxes residents on worldwide income; remote workers living in Japan are treated as residents and taxed the same way. Income must be passed in JPY.",
    };
  },

  // -------------------------------------------------------------------------
  // SOUTH KOREA — KRW
  // 2024 national brackets. Local income tax = 10% surcharge on national tax.
  // No joint filing. Remote workers resident in Korea taxed on worldwide income.
  // -------------------------------------------------------------------------
  KR: ({ annualIncome, isRetired }) => {
    const nationalRate = progressiveTax(annualIncome, [
      { upTo: 14000000,   rate: 0.06 },
      { upTo: 50000000,   rate: 0.15 },
      { upTo: 88000000,   rate: 0.24 },
      { upTo: 150000000,  rate: 0.35 },
      { upTo: 300000000,  rate: 0.38 },
      { upTo: 500000000,  rate: 0.40 },
      { upTo: 1000000000, rate: 0.42 },
      { upTo: Infinity,   rate: 0.45 },
    ]);
    const localSurtax = nationalRate * 0.10;
    const pensionDeduction = isRetired ? -0.02 : 0;
    return {
      effectiveRate: clampRate(nationalRate + localSurtax + pensionDeduction),
      model: "country-plus-local",
      confidence: "simplified",
      label: "South Korea national + local surtax (2024)",
      missingFactor: "National Health Insurance and pension contributions (~8% combined) not included.",
      note: "National brackets and 10% local surtax are correct. Key omissions: National Health Insurance (~3.545% employee) and National Pension (~4.5% up to KRW 5,900,000/mo) add ~8% for most employees. Employment income deduction not applied — overstates income tax at lower incomes. Korea taxes residents on worldwide income; remote workers with Korean domicile are fully subject to these rates. Income must be passed in KRW.",
    };
  },

  // -------------------------------------------------------------------------
  // SINGAPORE — SGD
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

    // Non-resident remote workers earning foreign-source income outside Singapore:
    // Singapore does not tax foreign-source income remitted to Singapore (territorial
    // for individuals). If the work is not performed in Singapore, no SG tax applies.
    if (isNonResident && incomeScenario === "remote") {
      return {
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: "Singapore — non-resident remote worker (foreign-source income not taxed)",
        missingFactor: "Assumes all work performed outside Singapore; any SG-source days trigger withholding.",
        note: "Singapore does not tax foreign-source income for non-residents who are not physically working in Singapore. If you are a non-resident whose employment is entirely with a foreign employer and the work is performed outside Singapore, Singapore Salaries Tax does not apply. If you spend time working from Singapore, the days worked in Singapore may create a partial tax liability. This estimate assumes 100% foreign-source work.",
      };
    }

    // Non-resident working in Singapore (local employment): 15% flat or progressive, higher
    if (isNonResident && !isRetired) {
      const flatRate = 0.15;
      const progressiveRate = progressiveTax(annualIncome, [
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
      const effectiveRate = Math.max(flatRate, progressiveRate);
      return {
        effectiveRate: clampRate(effectiveRate),
        model: "progressive-country",
        confidence: "partial",
        label: "Singapore non-resident Salaries Tax (2024 YA — higher of 15%/progressive)",
        missingFactor: "CPF contributions not applicable to non-residents; director's fees taxed at 24%.",
        note: "Non-resident employees pay the higher of: 15% flat rate OR progressive resident rates. CPF contributions are not required from non-residents. Director's fees are taxed at a flat 24% for non-residents (not modelled here). Income must be passed in SGD.",
      };
    }

    // Resident (≥183 days): standard progressive with earned income relief
    const earnedIncomeRelief = isRetired ? 8000 : 1000;
    const taxable = Math.max(0, annualIncome - earnedIncomeRelief);
    const rate = progressiveTax(taxable, [
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
    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    const hasResidencyAnswer = !!residency;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: hasResidencyAnswer ? "partial" : "simplified",
      label: hasResidencyAnswer
        ? "Singapore resident Salaries Tax (2024 YA)"
        : "Singapore Salaries Tax (2024 YA — select residency status)",
      missingFactor: hasResidencyAnswer
        ? "CPF contributions (~20% employee) not modelled; personal reliefs not applied."
        : "Residency status matters — non-residents on foreign-source income may owe nothing.",
      note: "2024 YA resident rates with earned income relief. CPF contributions (~20% employee up to SGD 6,800/mo) are a significant real deduction. Various personal reliefs can reduce tax further. Singapore taxes residents on Singapore-source income; foreign-source income remitted is generally exempt for individuals. Income must be passed in SGD.",
    };
  },

  // -------------------------------------------------------------------------
  // THAILAND — THB
  // 2024 progressive PIT.
  // Residents (≥180 days): foreign income remitted to Thailand in the same
  //   tax year is now taxable (rule change effective 1 Jan 2024).
  // Non-residents: only Thailand-source income taxed.
  // Remote workers who are non-residents: 0 Thailand tax on foreign income.
  // Conditional: th_residency ("resident_remits" | "resident_no_remit" | "non_resident")
  // -------------------------------------------------------------------------
  TH: ({ annualIncome, incomeScenario = "local", answers }) => {
    const residency = answers?.th_residency ?? "";

    // Non-resident OR resident who does not remit foreign income to Thailand:
    // foreign-source remote income is not taxable in Thailand
    if (incomeScenario === "remote" && (residency === "non_resident" || residency === "resident_no_remit")) {
      return {
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: residency === "non_resident"
          ? "Thailand — non-resident (foreign-source income not taxed)"
          : "Thailand — resident, foreign income not remitted (not taxable in 2024)",
        missingFactor: "Assumes foreign income earned and kept abroad; remittance to Thailand triggers tax.",
        note: residency === "non_resident"
          ? "Non-residents (fewer than 180 days in Thailand) are only taxed on Thailand-source income. Foreign-source income from a foreign employer is not subject to Thai PIT if the work is not performed in Thailand."
          : "Under Thailand's 2024 rule, foreign income earned in a given tax year and NOT remitted to Thailand in that same year is not taxable. If you keep foreign income abroad and only remit in a later year, it remains exempt under current rules. Always verify with a Thai tax advisor — interpretations of the 2024 rule are still evolving.",
      };
    }

    // Resident who remits foreign income OR local income: standard PIT applies
    const deductions = Math.min(annualIncome * 0.5, 100000) + 60000;
    const taxable = Math.max(0, annualIncome - deductions);
    const rate = progressiveTax(taxable, [
      { upTo: 150000,  rate: 0.00 },
      { upTo: 300000,  rate: 0.05 },
      { upTo: 500000,  rate: 0.10 },
      { upTo: 750000,  rate: 0.15 },
      { upTo: 1000000, rate: 0.20 },
      { upTo: 2000000, rate: 0.25 },
      { upTo: 5000000, rate: 0.30 },
      { upTo: Infinity, rate: 0.35 },
    ]);
    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    const hasAnswer = !!residency;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Thailand PIT — resident, taxable income (2024)"
        : "Thailand PIT (2024 — select residency/remittance status)",
      missingFactor: hasAnswer
        ? "Social security contributions (~5%, capped THB 750/mo) not included."
        : "Foreign-income remittance/residency rules changed Jan 2024 — treatment depends on your situation.",
      note: "Brackets and standard deductions (50% up to THB 100,000 + THB 60,000 personal allowance) are 2024 figures. From 1 January 2024, foreign-source income remitted to Thailand in the same tax year is taxable for residents — select your situation above for a more accurate estimate. Social security employee contribution (~5%, capped at THB 750/mo) not included. Income must be passed in THB.",
    };
  },

  // -------------------------------------------------------------------------
  // VIETNAM — VND
  // 2024 progressive. Annual personal allowance VND 132M. No joint filing.
  // Residents (≥183 days): worldwide income at progressive rates.
  // Non-residents (<183 days): flat 20% on Vietnam-source income only.
  //   Foreign remote income from a foreign employer is not Vietnam-source.
  // Conditional: vn_residency ("resident" | "non_resident")
  // -------------------------------------------------------------------------
  VN: ({ annualIncome, incomeScenario = "local", answers }) => {
    const residency = answers?.vn_residency ?? "";
    const isNonResident = residency === "non_resident";

    // Non-resident remote worker for foreign employer: not Vietnam-source — no VN tax
    if (isNonResident && incomeScenario === "remote") {
      return {
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: "Vietnam — non-resident remote worker (foreign-source income not taxed)",
        missingFactor: "Assumes work performed outside Vietnam; any Vietnam-source income triggers 20% flat.",
        note: "Vietnam does not tax non-residents on foreign-source income. If you are in Vietnam fewer than 183 days per year and your income is from a foreign employer for work performed outside Vietnam, there is no Vietnam PIT liability on that income. If the work is performed in Vietnam, the income becomes Vietnam-source and is taxed at 20% flat for non-residents. Always confirm with a Vietnam-licensed tax advisor.",
      };
    }

    // Non-resident working locally in Vietnam: 20% flat on Vietnam-source income
    if (isNonResident) {
      return {
        effectiveRate: clampRate(0.20),
        model: "flat",
        confidence: "partial",
        label: "Vietnam — non-resident income tax (20% flat, 2024)",
        missingFactor: "Applies to Vietnam-source income only; no personal allowance available.",
        note: "Non-residents (fewer than 183 days in Vietnam) pay a flat 20% tax on Vietnam-source income. No personal allowance (VND 132M) is available. Social insurance contributions from foreign non-resident employees depend on the employment contract structure. Income must be passed in VND.",
      };
    }

    // Resident (≥183 days): progressive with personal allowance
    const personalAllowance = 132000000;
    const taxable = Math.max(0, annualIncome - personalAllowance);
    const rate = progressiveTax(taxable, [
      { upTo: 60000000,  rate: 0.05 },
      { upTo: 120000000, rate: 0.10 },
      { upTo: 216000000, rate: 0.15 },
      { upTo: 384000000, rate: 0.20 },
      { upTo: 624000000, rate: 0.25 },
      { upTo: 960000000, rate: 0.30 },
      { upTo: Infinity,  rate: 0.35 },
    ]);
    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    const hasAnswer = !!residency;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Vietnam PIT — resident (2024)"
        : "Vietnam PIT (2024 — select residency status)",
      missingFactor: hasAnswer
        ? "Social insurance (~10.5% combined) and dependent relief not modelled."
        : "Non-residents (<183 days) on foreign-source remote income may owe nothing — select status above.",
      note: "Brackets and personal allowance (VND 132M/yr) are 2024 figures. Employee social insurance (~10.5%: social 8%, health 1.5%, unemployment 1%) is a significant deduction for locally-employed residents — not modelled. Dependent relief (VND 52.8M per dependent) also excluded. Income must be passed in VND.",
    };
  },

  // -------------------------------------------------------------------------
  // MALAYSIA — MYR
  // 2024 progressive. No joint filing.
  // Remote workers: Malaysia taxes residents on Malaysia-source income only
  // (territorial for individuals). Foreign remote income generally not taxed.
  // -------------------------------------------------------------------------
  MY: ({ annualIncome, incomeScenario = "local" }) => {
    if (incomeScenario === "remote") {
      return {
        effectiveRate: 0,
        model: "none",
        confidence: "simplified",
        label: "Malaysia — remote worker (foreign-source income generally not taxed)",
        missingFactor: "Section 127 exemption is real but under review — verify before planning.",
        note: "Malaysia's individual income tax is territorial — foreign-source income remitted to Malaysia by a Malaysian tax resident is generally exempt under the Income Tax Act (Section 127). Remote workers earning from foreign employers typically pay no Malaysian income tax on that income. However, the government has signalled reviews of this exemption and the rules may change. This is modelled as 0% effective rate but rated 'simplified' rather than 'partial' because the exemption's future is uncertain and professional verification is strongly recommended before relying on it for planning.",
      };
    }
    const rate = progressiveTax(annualIncome, [
      { upTo: 5000,    rate: 0.00 },
      { upTo: 20000,   rate: 0.01 },
      { upTo: 35000,   rate: 0.03 },
      { upTo: 50000,   rate: 0.06 },
      { upTo: 70000,   rate: 0.11 },
      { upTo: 100000,  rate: 0.19 },
      { upTo: 400000,  rate: 0.25 },
      { upTo: 600000,  rate: 0.26 },
      { upTo: 2000000, rate: 0.28 },
      { upTo: Infinity, rate: 0.30 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Malaysia income tax (2024 — local employment)",
      missingFactor: "Personal relief system (potentially MYR 20–30k deductible) not modelled.",
      note: "Brackets are 2024 figures. Malaysia has an extensive personal relief system — individual relief MYR 9,000, lifestyle relief MYR 2,500, EPF contributions relief up to MYR 4,000, medical relief up to MYR 10,000 — which can drop effective rates by 3–6 pp. SOCSO (1.75% employee) and EIS (0.4% employee) add modestly. Income must be passed in MYR.",
    };
  },

  // -------------------------------------------------------------------------
  // INDONESIA — IDR
  // 2024 PPh Orang Pribadi. No joint filing.
  // Remote workers: Indonesia taxes residents on worldwide income.
  // Non-residents: Indonesia-source income only, withholding at source.
  // -------------------------------------------------------------------------
  ID: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 60000000,   rate: 0.05 },
      { upTo: 250000000,  rate: 0.15 },
      { upTo: 500000000,  rate: 0.25 },
      { upTo: 5000000000, rate: 0.30 },
      { upTo: Infinity,   rate: 0.35 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Indonesia PPh income tax (2024)",
      missingFactor: "PTKP non-taxable threshold (IDR 54M/yr) not applied — overstates at lower incomes.",
      note: "Brackets are 2024 figures. The PTKP non-taxable threshold (IDR 54M/yr for a single individual) is not applied — income tax is overstated at lower incomes. BPJS health (1% employee) and employment contributions excluded. Indonesia taxes residents on worldwide income; foreign remote workers living in Indonesia ≥183 days are tax residents. Income must be passed in IDR.",
    };
  },

  // -------------------------------------------------------------------------
  // UNITED ARAB EMIRATES — AED — No personal income tax
  // -------------------------------------------------------------------------
  AE: () => ({
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "No personal income tax",
    missingFactor: "No personal income tax — this estimate is exact.",
    note: "The UAE does not levy personal income tax on employment or investment income. A 9% corporate tax applies to businesses with profits above AED 375,000, but there is no individual income tax. This applies equally to UAE nationals and expatriates.",
  }),

  // -------------------------------------------------------------------------
  // PHILIPPINES — PHP
  // 2024 TRAIN Law brackets.
  // Citizens and resident aliens: worldwide income taxed at TRAIN rates.
  // Non-resident aliens engaged in trade/business: graduated rates on PH-source income.
  // Non-resident aliens NOT engaged: flat 25% on PH-source gross income.
  // Remote workers (Filipino citizens / resident aliens): TRAIN rates apply
  //   even on foreign-source income — Philippines taxes citizens on worldwide income.
  // Conditional: ph_residency ("citizen_resident" | "non_resident_etb" | "non_resident_netb")
  // -------------------------------------------------------------------------
  PH: ({ annualIncome, isRetired, incomeScenario = "local", answers }) => {
    const residency = answers?.ph_residency ?? "";

    // Non-resident alien, not engaged in trade/business: flat 25% on PH-source
    if (residency === "non_resident_netb") {
      return {
        effectiveRate: clampRate(0.25),
        model: "flat",
        confidence: "partial",
        label: "Philippines — non-resident alien, not engaged in trade/business (25% flat)",
        missingFactor: "Applies only to Philippines-source income; foreign remote income not taxed.",
        note: "Non-resident aliens not engaged in trade or business in the Philippines pay a final withholding tax of 25% on gross Philippines-source income. Foreign-source income (e.g. from a foreign employer for work performed outside the Philippines) is not taxable in the Philippines. Income must be passed in PHP.",
      };
    }

    // Non-resident alien engaged in trade/business: TRAIN brackets on PH-source income
    // (same brackets as residents, but no personal exemptions)
    if (residency === "non_resident_etb") {
      const rate = progressiveTax(annualIncome, [
        { upTo: 250000,  rate: 0.00 },
        { upTo: 400000,  rate: 0.15 },
        { upTo: 800000,  rate: 0.20 },
        { upTo: 2000000, rate: 0.25 },
        { upTo: 8000000, rate: 0.30 },
        { upTo: Infinity, rate: 0.35 },
      ]);
      return {
        effectiveRate: clampRate(rate),
        model: "progressive-country",
        confidence: "partial",
        label: "Philippines TRAIN — non-resident alien, engaged in business (2024)",
        missingFactor: "Only Philippines-source income taxed; no SSS/PhilHealth contributions required.",
        note: "Non-resident aliens engaged in trade or business pay TRAIN Law graduated rates on Philippines-source income only. No SSS, PhilHealth, or Pag-IBIG contributions are required from non-resident employees. Foreign-source income is not taxable. Income must be passed in PHP.",
      };
    }

    // Citizens and resident aliens: worldwide income at TRAIN rates + social contributions
    // Filipino citizens are taxed on worldwide income regardless of where they live
    const rate = progressiveTax(annualIncome, [
      { upTo: 250000,  rate: 0.00 },
      { upTo: 400000,  rate: 0.15 },
      { upTo: 800000,  rate: 0.20 },
      { upTo: 2000000, rate: 0.25 },
      { upTo: 8000000, rate: 0.30 },
      { upTo: Infinity, rate: 0.35 },
    ]);
    // SSS ~4.5%, PhilHealth ~2.5% employee share, Pag-IBIG minimal; not on pension
    const socialOverlay = isRetired ? 0 : 0.065;
    const hasAnswer = residency === "citizen_resident";
    return {
      effectiveRate: clampRate(rate + socialOverlay),
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Philippines TRAIN Law + contributions — citizen/resident alien (2024)"
        : "Philippines TRAIN Law + contributions (2024 — select residency status)",
      missingFactor: hasAnswer
        ? "13th-month pay exemption (up to PHP 90,000) not modelled — real rate somewhat lower."
        : "Residency status matters — non-resident foreigners on foreign income may owe nothing.",
      note: "2024 TRAIN Law brackets. Filipino citizens are taxed on worldwide income regardless of where they reside. Employee contributions (~6.5%: SSS ~4.5%, PhilHealth ~2.5%, Pag-IBIG minimal) applied to working income. The 13th-month pay exemption (up to PHP 90,000) is not modelled — reduces effective tax for most salaried employees. Income must be passed in PHP.",
    };
  },

  // -------------------------------------------------------------------------
  // TAIWAN — TWD
  // 2024 Individual Income Tax.
  // Residents (≥183 days): worldwide income, progressive brackets + deductions.
  // Non-residents (<183 days): 18% flat on Taiwan-source income.
  //   Remote workers for foreign employers outside Taiwan: Taiwan-source test
  //   generally not met — no Taiwan tax.
  // Conditional: tw_residency ("resident" | "non_resident")
  // -------------------------------------------------------------------------
  TW: ({ annualIncome, filing, isRetired, incomeScenario = "local", answers }) => {
    const residency = answers?.tw_residency ?? "";
    const isNonResident = residency === "non_resident";

    // Non-resident remote worker for foreign employer: Taiwan-source test generally
    // not met if work performed outside Taiwan — no Taiwan tax
    if (isNonResident && incomeScenario === "remote") {
      return {
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: "Taiwan — non-resident remote worker (foreign-source income not taxed)",
        missingFactor: "Assumes work performed outside Taiwan; any Taiwan-source income triggers 18% flat.",
        note: "Taiwan does not tax non-residents on foreign-source income. If you are in Taiwan fewer than 183 days per year and your employment income is from a foreign employer for work performed outside Taiwan, there is generally no Taiwan tax liability. If any portion of the work is performed in Taiwan, that portion becomes Taiwan-source income taxed at 18% flat. Confirm with a Taiwan-licensed tax advisor.",
      };
    }

    // Non-resident working in Taiwan locally: 18% flat on Taiwan-source income
    if (isNonResident && !isRetired) {
      return {
        effectiveRate: clampRate(0.18),
        model: "flat",
        confidence: "partial",
        label: "Taiwan — non-resident income tax (18% flat, 2024)",
        missingFactor: "Applies to Taiwan-source income only; no deductions or exemptions available.",
        note: "Non-residents (fewer than 183 days in Taiwan) pay 18% flat tax on Taiwan-source income with no deductions. Labour insurance and NHI contributions may still apply depending on employer. Income must be passed in TWD.",
      };
    }

    // Resident (≥183 days): progressive with standard deduction, personal exemption,
    // and employment income deduction
    const standardDeduction = filing === "married" ? 262000 : 131000;
    const personalExemption = filing === "married" ? 194000 : 97000;
    const employmentDeduction = isRetired ? 0 : Math.min(annualIncome * 0.20, 218000);
    const taxable = Math.max(0, annualIncome - standardDeduction - personalExemption - employmentDeduction);

    const rate = progressiveTax(taxable, [
      { upTo: 560000,  rate: 0.05 },
      { upTo: 1260000, rate: 0.12 },
      { upTo: 2520000, rate: 0.20 },
      { upTo: 4720000, rate: 0.30 },
      { upTo: Infinity, rate: 0.40 },
    ]);
    const taxAmount = rate * taxable;
    const effectiveRate = annualIncome > 0 ? taxAmount / annualIncome : 0;

    // Labour Insurance (~1%) + NHI (~1.55% employee share); excluded for retirees
    const socialOverlay = isRetired ? 0 : 0.025;
    const hasAnswer = !!residency;

    return {
      effectiveRate: clampRate(effectiveRate + socialOverlay),
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Taiwan individual income tax — resident (2024)"
        : "Taiwan individual income tax (2024 — select residency status)",
      missingFactor: hasAnswer
        ? "Special deductions (disability, long-term care, education) not modelled."
        : "Non-residents on foreign-source remote income may owe nothing — select residency above.",
      note: "2024 brackets with standard deduction, personal exemption, and employment income deduction applied. Labour insurance (~1%) and NHI (~1.55% employee share) included for workers. Special deductions (disability TWD 207,000, long-term care TWD 120,000, education TWD 25,000/child) can reduce taxable income significantly. Income must be passed in TWD.",
    };
  },

  // -------------------------------------------------------------------------
  // HONG KONG — HKD
  // 2024-25 Salaries Tax.
  // HK Salaries Tax applies to Hong Kong-SOURCE income only — income arising
  // from employment where the services are rendered in Hong Kong.
  // If all services rendered outside HK: no Salaries Tax.
  // If some services in HK: only the HK-apportioned portion is taxed.
  // Tax is the LOWER of: progressive rates (after basic allowance) or 15% standard.
  // Conditional: hk_work_location ("in_hk" | "outside_hk" | "mixed")
  // -------------------------------------------------------------------------
  HK: ({ annualIncome, filing, isRetired, answers }) => {
    const workLocation = answers?.hk_work_location ?? "";

    function computeHkTax(income: number): number {
      const basicAllowance = filing === "married" ? 264000 : 132000;
      const taxable = Math.max(0, income - basicAllowance);
      const progressiveAmount = progressiveTax(taxable, [
        { upTo: 50000,   rate: 0.02 },
        { upTo: 100000,  rate: 0.06 },
        { upTo: 150000,  rate: 0.10 },
        { upTo: 200000,  rate: 0.14 },
        { upTo: Infinity, rate: 0.17 },
      ]) * taxable;
      const standardAmount = income * 0.15;
      return isRetired
        ? Math.min(progressiveAmount, standardAmount) * 0.85
        : Math.min(progressiveAmount, standardAmount);
    }

    // All work performed outside Hong Kong: no HK Salaries Tax
    if (workLocation === "outside_hk") {
      return {
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: "Hong Kong — no Salaries Tax (all services rendered outside HK)",
        missingFactor: "Any days physically working in Hong Kong create a proportional HK tax liability.",
        note: "Hong Kong Salaries Tax applies only to Hong Kong-source income — income from services rendered in Hong Kong. If all your work is performed outside Hong Kong (for a non-HK employer or a HK employer with services entirely offshore), no Salaries Tax is due. Even a few working days in Hong Kong can create a proportional liability — if you visit HK for work, those days may be subject to tax. Always confirm with a Hong Kong tax advisor.",
      };
    }

    // Mixed — work partly in HK, partly outside: only HK-apportioned income taxed
    // Standard apportionment: HK-source = total income × (HK days / total days)
    // Without knowing the split, model at 50% HK-source as a planning midpoint
    if (workLocation === "mixed") {
      const hkSourceIncome = annualIncome * 0.50;
      const taxAmount = computeHkTax(hkSourceIncome);
      const effectiveRate = annualIncome > 0 ? taxAmount / annualIncome : 0;
      return {
        effectiveRate: clampRate(effectiveRate),
        model: "progressive-country",
        confidence: "simplified",
        label: "Hong Kong Salaries Tax — mixed work location (50% HK-source estimate, 2024-25)",
        missingFactor: "Actual HK tax based on HK-worked days as % of total days — 50% split is a midpoint estimate.",
        note: "When services are rendered partly in and partly outside Hong Kong, Salaries Tax is apportioned based on the proportion of days worked in HK. This model applies a 50% HK-source split as a planning midpoint — your actual liability depends on your specific HK vs offshore working days. MPF contributions (5% employee, capped HKD 1,500/mo) not modelled. Income must be passed in HKD.",
      };
    }

    // All work in HK (or no answer): full Salaries Tax on all income
    const taxAmount = computeHkTax(annualIncome);
    const effectiveRate = annualIncome > 0 ? taxAmount / annualIncome : 0;
    const hasAnswer = workLocation === "in_hk";
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "Hong Kong Salaries Tax (2024-25 — lower of progressive/standard)"
        : "Hong Kong Salaries Tax (2024-25 — select work location)",
      missingFactor: hasAnswer
        ? "MPF mandatory pension contributions (5%, capped HKD 1,500/mo) not included."
        : "Work location is the key variable — outside-HK workers may owe nothing.",
      note: "Salaries Tax is the lower of: progressive rates (2–17% on net chargeable income after basic allowance) or 15% standard rate on gross assessable income. MPF contributions (5% employee, capped HKD 1,500/mo) not modelled. No capital gains or dividend tax in HK. Income must be passed in HKD.",
    };
  },

  // -------------------------------------------------------------------------
  // INDIA — INR
  // 2024-25 New Tax Regime (default since FY2023-24).
  // Standard deduction: INR 75,000 salaried (Budget 2024).
  // Old regime (with 80C deductions) often better for those with home loans,
  // large insurance, etc. — conditional question allows user to select.
  // Conditional: in_regime ("new_regime" | "old_regime")
  // -------------------------------------------------------------------------
  IN: ({ annualIncome, filing, isRetired, answers }) => {
    const regime = answers?.in_regime ?? "new_regime";

    if (regime === "old_regime") {
      // Old Regime: higher rates but with 80C/HRA/standard deduction benefits
      // Standard deduction INR 50,000; 80C deduction limit INR 150,000
      // HRA and other deductions vary widely — model simplified composite
      const standardDeduction = isRetired ? 0 : 50000;
      const section80C = isRetired ? 0 : 150000; // max deduction (investments, insurance, PF)
      const estimatedHRA = isRetired ? 0 : Math.min(annualIncome * 0.10, 96000); // conservative HRA
      const taxable = Math.max(0, annualIncome - standardDeduction - section80C - estimatedHRA);

      const rate = progressiveTax(taxable, [
        { upTo: 250000,  rate: 0.00 },
        { upTo: 500000,  rate: 0.05 },
        { upTo: 1000000, rate: 0.20 },
        { upTo: Infinity, rate: 0.30 },
      ]);
      // Surcharge: 10% on tax if income 50L–1Cr; 15% 1Cr–2Cr; 25% 2Cr–5Cr; 37% above 5Cr
      const surchargeRate =
        annualIncome > 50000000 ? 0.37
        : annualIncome > 20000000 ? 0.25
        : annualIncome > 10000000 ? 0.15
        : annualIncome > 5000000  ? 0.10
        : 0;
      const taxAmount = rate * taxable;
      const cess = (taxAmount + taxAmount * surchargeRate) * 0.04;
      const totalTax = taxAmount * (1 + surchargeRate) + cess;
      const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0;
      const epfOverlay = isRetired ? 0 : 0.06;
      return {
        effectiveRate: clampRate(effectiveRate + epfOverlay),
        model: "progressive-country",
        confidence: "partial",
        label: "India Old Tax Regime + EPF + Cess (2024-25)",
        missingFactor: "Actual 80C/HRA/deductions vary — composite estimate; real rate may be lower.",
        note: "Old Tax Regime modelled with standard deduction (INR 50,000), simplified 80C deduction (INR 150,000), and conservative HRA estimate. Surcharge applies at higher incomes. 4% Health & Education Cess applied. EPF employee contribution (~6% of gross) modelled. Actual deductions depend on your specific investments, home loan, and employer — real effective rate may differ materially. Income must be passed in INR.",
      };
    }

    // New Tax Regime (default): fewer deductions, lower rates
    const standardDeduction = isRetired ? 0 : 75000;
    const taxable = Math.max(0, annualIncome - standardDeduction);
    const rate = progressiveTax(taxable, [
      { upTo: 300000,  rate: 0.00 },
      { upTo: 700000,  rate: 0.05 },
      { upTo: 1000000, rate: 0.10 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.20 },
      { upTo: Infinity, rate: 0.30 },
    ]);
    const taxAmount = rate * taxable;
    const cess = taxAmount * 0.04;
    const totalTax = taxAmount + cess;
    const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0;
    const epfOverlay = isRetired ? 0 : 0.06;
    const hasAnswer = !!answers?.in_regime;
    return {
      effectiveRate: clampRate(effectiveRate + epfOverlay),
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "India New Tax Regime + EPF + Cess (2024-25)"
        : "India New Tax Regime + EPF + Cess (2024-25 — select regime)",
      missingFactor: hasAnswer
        ? "EPF estimated at ~6% of gross; actual depends on basic salary structure."
        : "Old vs New regime can differ by 3–8 pp — select your regime above.",
      note: "New Tax Regime (Budget 2024-25) with INR 75,000 standard deduction and 4% Health & Education Cess. EPF employee contribution (~12% of basic salary, modelled at ~6% of gross) included. The Old Tax Regime with 80C deductions often results in lower effective tax for salaried employees with home loans, investments, and HRA — select Old Regime above to model that path. Income must be passed in INR.",
    };
  },

  // -------------------------------------------------------------------------
  // CHINA — CNY
  // 2024 Individual Income Tax (个人所得税).
  // Residents (≥183 days): worldwide income taxable.
  // Non-residents (<183 days): China-source income only, withholding basis.
  // 6-year rule: foreigners resident <6 consecutive years can apply for
  //   exemption on overseas income not remitted to China (complex — noted).
  // Conditional: cn_residency ("resident" | "non_resident")
  // -------------------------------------------------------------------------
  CN: ({ annualIncome, isRetired, incomeScenario = "local", answers }) => {
    const residency = answers?.cn_residency ?? "";
    const isNonResident = residency === "non_resident";

    // Non-resident remote worker: only China-source income taxed
    // If work performed outside China for foreign employer: generally 0 China IIT
    if (isNonResident && incomeScenario === "remote") {
      return {
        effectiveRate: 0,
        model: "none",
        confidence: "partial",
        label: "China — non-resident remote worker (foreign-source income not taxed)",
        missingFactor: "Assumes work entirely performed outside China; any China-source days trigger withholding.",
        note: "China taxes non-residents only on China-source income. If you are in China fewer than 183 days per year and your employment income is from a foreign employer for work performed outside China, there is generally no China IIT liability. Spending time in China working may create a partial liability for those China-worked days. Residents (≥183 days) are taxed on worldwide income, subject to the 6-year rule for foreigners. Consult a China-licensed tax advisor.",
      };
    }

    // Non-resident working locally in China: withholding on China-source income
    if (isNonResident && !isRetired) {
      const taxable = Math.max(0, annualIncome - 60000);
      const rate = progressiveTax(taxable, [
        { upTo: 36000,   rate: 0.03 },
        { upTo: 144000,  rate: 0.10 },
        { upTo: 300000,  rate: 0.20 },
        { upTo: 420000,  rate: 0.25 },
        { upTo: 660000,  rate: 0.30 },
        { upTo: 960000,  rate: 0.35 },
        { upTo: Infinity, rate: 0.45 },
      ]);
      const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
      return {
        effectiveRate: clampRate(effectiveRate),
        model: "progressive-country",
        confidence: "partial",
        label: "China IIT — non-resident, China-source income (2024)",
        missingFactor: "Social insurance generally not required from non-residents; housing fund may apply.",
        note: "Non-residents pay IIT on China-source income only, with CNY 60,000 standard deduction available even for non-residents on monthly basis. Social insurance contributions are generally not required from non-resident foreign employees, though some cities require it. Income must be passed in CNY.",
      };
    }

    // Resident: worldwide income, full social overlay
    const standardDeduction = 60000;
    const additionalDeduction = isRetired ? 0 : 20000;
    const taxable = Math.max(0, annualIncome - standardDeduction - additionalDeduction);
    const rate = progressiveTax(taxable, [
      { upTo: 36000,   rate: 0.03 },
      { upTo: 144000,  rate: 0.10 },
      { upTo: 300000,  rate: 0.20 },
      { upTo: 420000,  rate: 0.25 },
      { upTo: 660000,  rate: 0.30 },
      { upTo: 960000,  rate: 0.35 },
      { upTo: Infinity, rate: 0.45 },
    ]);
    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    const socialOverlay = isRetired ? 0 : 0.105;
    const hasAnswer = !!residency;
    return {
      effectiveRate: clampRate(effectiveRate + socialOverlay),
      model: "progressive-country",
      confidence: hasAnswer ? "partial" : "simplified",
      label: hasAnswer
        ? "China IIT + social insurance — resident (2024)"
        : "China IIT + social insurance (2024 — select residency status)",
      missingFactor: hasAnswer
        ? "Housing provident fund (5–12% by city) and regional social base variations not fully captured."
        : "Non-residents on foreign-source remote income may owe nothing — select residency above.",
      note: "2024 comprehensive income brackets with CNY 60,000 standard deduction and ~CNY 20,000 simplified additional deductions. Five Social Insurance + Housing Fund employee share (~10.5%) applied. Foreigners resident for fewer than 6 consecutive years may apply for exemption on overseas income not remitted to China — a significant planning consideration not modelled. Income must be passed in CNY.",
    };
  },

  // -------------------------------------------------------------------------
  // QATAR — QAR — No personal income tax
  // -------------------------------------------------------------------------
  QA: () => ({
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "No personal income tax",
    missingFactor: "No personal income tax on employment income — this estimate is exact.",
    note: "Qatar does not levy personal income tax on salaries and wages. A 10% corporate income tax applies to businesses, but individual employment income is not taxed. Social insurance applies to Qatari nationals only — expatriates are not enrolled. Qatar is particularly attractive for high-earning expatriates.",
  }),

  // -------------------------------------------------------------------------
  // SAUDI ARABIA — SAR — No personal income tax on employment income
  // -------------------------------------------------------------------------
  SA: () => ({
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "No personal income tax on employment income",
    missingFactor: "No personal income tax — expatriates pay no income tax in Saudi Arabia.",
    note: "Saudi Arabia does not levy personal income tax on employment income. Expatriate employees pay no income tax. Saudi nationals pay GOSI (General Organization for Social Insurance) at 10% employee share, but this does not apply to expatriates. A 15% VAT applies to consumption but does not reduce gross-to-net income directly.",
  }),

  // -------------------------------------------------------------------------
  // OMAN — OMR — No personal income tax
  // -------------------------------------------------------------------------
  OM: () => ({
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "No personal income tax",
    missingFactor: "No personal income tax on employment income — this estimate is exact.",
    note: "Oman does not levy personal income tax on salaries and wages. PASI (Public Authority for Social Insurance) contributions apply to Omani nationals only — expatriate employees are exempt. This makes Oman tax-free for expatriate workers from an income tax perspective.",
  }),

  // -------------------------------------------------------------------------
  // AUSTRALIA — AUD
  // 2024-25 rates (Stage 3 tax cuts enacted from 1 July 2024).
  // No joint filing. Medicare Levy: 2% working, 1% retired.
  // Remote workers: Australia taxes residents on worldwide income (183-day rule).
  // -------------------------------------------------------------------------
  AU: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 18200,   rate: 0.00  },
      { upTo: 45000,   rate: 0.19  },
      { upTo: 135000,  rate: 0.325 },
      { upTo: 190000,  rate: 0.37  },
      { upTo: Infinity, rate: 0.45 },
    ]);
    const medicareLevy = isRetired ? 0.01 : 0.02;
    return {
      effectiveRate: clampRate(rate + medicareLevy),
      model: "progressive-country",
      confidence: "partial",
      label: "Australia income tax + Medicare Levy (2024-25)",
      missingFactor: "LITO (low income tax offset, up to $700) not applied; minor effect at planning incomes.",
      note: "2024-25 brackets (Stage 3 tax cuts) and Medicare Levy are correct. Minor omission: the Low Income Tax Offset (LITO, up to $700) is not modelled — small effect at planning incomes. Superannuation contributions (11.5% employer-side) are not deducted from employment income. Australia taxes residents on worldwide income — remote workers living in Australia are fully subject to these rates. Income must be passed in AUD.",
    };
  },

  // -------------------------------------------------------------------------
  // NEW ZEALAND — NZD
  // 2024-25 rates. Budget 2024 raised thresholds effective 31 Jul 2024.
  // No joint filing. Remote workers: NZ taxes residents on worldwide income.
  // -------------------------------------------------------------------------
  NZ: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 14000,   rate: 0.105 },
      { upTo: 53500,   rate: 0.175 },
      { upTo: 78100,   rate: 0.30  },
      { upTo: 180000,  rate: 0.33  },
      { upTo: Infinity, rate: 0.39 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "New Zealand PAYE (2024-25, Budget 2024 thresholds)",
      missingFactor: "ACC levies (~1.6% on employment income) not included.",
      note: "2024-25 brackets including Budget 2024 threshold increases are correct. ACC levies (~1.6% on employment income up to ~NZD 142,283) add approximately 1–1.6 pp — not included. New Zealand taxes residents on worldwide income. No joint filing. NZ Super is taxable at the same rates. Income must be passed in NZD.",
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
        { value: "resident",     label: "Resident — ≥183 days in Singapore per year" },
        { value: "non_resident", label: "Non-resident — fewer than 183 days in Singapore" },
      ],
    },
  ],
  TH: [
    {
      key: "th_residency",
      label: "What is your Thailand tax and remittance situation?",
      helpText:
        "From 1 January 2024, Thailand taxes residents (≥180 days/year) on foreign income remitted to Thailand in the same year it was earned. Non-residents or residents who keep foreign income abroad are not taxed on it.",
      options: [
        { value: "resident_remits",    label: "Resident (≥180 days) — I remit foreign income to Thailand in the same year" },
        { value: "resident_no_remit",  label: "Resident (≥180 days) — I keep foreign income abroad (not remitted same year)" },
        { value: "non_resident",       label: "Non-resident — fewer than 180 days in Thailand" },
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
        { value: "resident",     label: "Resident — ≥183 days in Vietnam per year" },
        { value: "non_resident", label: "Non-resident — fewer than 183 days in Vietnam" },
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
        { value: "resident",     label: "Resident — ≥183 days in Taiwan per year" },
        { value: "non_resident", label: "Non-resident — fewer than 183 days in Taiwan" },
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
        { value: "citizen_resident",   label: "Filipino citizen or resident alien — worldwide income" },
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
        "Hong Kong Salaries Tax applies only to Hong Kong-source income — income from services physically rendered in Hong Kong. If all your work is performed outside HK, no Salaries Tax is due. Mixed situations are apportioned by HK working days.",
      options: [
        { value: "in_hk",      label: "All work performed in Hong Kong" },
        { value: "outside_hk", label: "All work performed outside Hong Kong" },
        { value: "mixed",      label: "Mixed — work partly in HK, partly outside (50% split estimated)" },
      ],
    },
  ],
  IN: [
    {
      key: "in_regime",
      label: "Which India income tax regime applies to you?",
      helpText:
        "India's New Tax Regime (default since FY2023-24) has lower rates but fewer deductions. The Old Regime has higher rates but allows 80C investments, HRA, and home loan interest deductions — often better for those with significant eligible deductions.",
      options: [
        { value: "new_regime", label: "New Tax Regime — lower rates, fewer deductions (default)" },
        { value: "old_regime", label: "Old Tax Regime — higher rates, with 80C/HRA/home loan deductions" },
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
        { value: "resident",     label: "Resident — ≥183 days in China per year" },
        { value: "non_resident", label: "Non-resident — fewer than 183 days in China" },
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
  AE:  293600,    // ~$80k at AED 3.67/USD (irrelevant — zero tax)
  PH:  4480000,   // ~$80k at ₱56/USD
  TW:  2600000,   // ~$80k at NT$32.5/USD
  HK:  624000,    // ~$80k at HK$7.8/USD
  IN:  6680000,   // ~$80k at ₹83.5/USD
  CN:  576000,    // ~$80k at ¥7.2/USD
  QA:  291200,    // ~$80k at QAR 3.64/USD (irrelevant — zero tax)
  SA:  300000,    // ~$80k at SAR 3.75/USD (irrelevant — zero tax)
  OM:  30800,     // ~$80k at OMR 0.385/USD (irrelevant — zero tax)
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