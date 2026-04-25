// ---------------------------------------------------------------------------
// internationalTaxes.ts
//
// CONTRACT:
//   annualIncome must always be passed in LOCAL CURRENCY for the destination
//   country. The caller is responsible for FX conversion before calling
//   estimateInternationalTax(). No internal FX conversion is performed here.
//
//  Local currencies by country:
//   US=USD, GB=GBP, PT=EUR, ES=EUR, MX=MXN, CA=CAD, DE=EUR, NL=EUR,
//   CR=CRC, FR=EUR, IT=EUR, IE=EUR, AU=AUD, NZ=NZD, JP=JPY, KR=KRW,
//   AE=AED, SG=SGD, CH=CHF, DK=DKK, SE=SEK, NO=NOK, FI=EUR, PL=PLN,
//   CZ=CZK, HU=HUF, GR=EUR, TR=TRY, HR=EUR, EE=EUR, LV=EUR, LT=EUR,
//   RO=RON, BG=BGN, SI=EUR, SK=EUR, MT=EUR, CY=EUR, PA=USD, CO=COP,
//   BR=BRL, AR=ARS, CL=CLP, PE=PEN, TH=THB, VN=VND, MY=MYR, ID=IDR,
//   ZA=ZAR, AT=EUR, BE=EUR, PH=PHP, TW=TWD
//
// Last updated: 2025 tax year figures. Sources: IRS Rev. Proc. 2024-40 &
// OBBB amendments, HMRC 2024-25 tables, OECD Taxing Wages 2025, PwC
// Worldwide Tax Summaries, and each country's official tax authority.
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

// Confidence rubric — used to drive UI badge colour and disclaimer text:
//
//  "verified"    — Brackets are legislative, filing logic is structurally
//                  correct, major credits/deductions modelled, result is
//                  within ~2-3 pp of a professional estimate for most incomes.
//                  Currently: AE (zero-tax, trivially exact).
//
//  "partial"     — Core national brackets are correct and current. The
//                  dominant structural components are modelled. One or two
//                  meaningful items are omitted (named explicitly in the note)
//                  but the gap is bounded and unlikely to exceed ~3-4 pp for
//                  most planning incomes.
//                  Countries: US, GB, AU, NZ, DK, NO, HR, HU, BG, MT,
//                             PA, RO, PT-IFICI, ES-Beckham.
//
//  "simplified"  — Structurally believable but at least one significant
//                  source of real-world variation is unmodelled: major
//                  local/cantonal spread, large omitted credit or deduction
//                  systems, blended social overlays that could be off by
//                  5-10 pp, or a key regime (30% ruling, jobbskatteavdrag,
//                  PTKP threshold) that changes the answer materially.
//                  Show a yellow/amber badge.
//                  Countries: PT, ES, DE, NL, FR, IT, IE, CA, CH, SE, FI,
//                             PL, CZ, GR, EE, LV, LT, SI, SK, CY,
//                             JP, KR, SG, MX, CR, CO, BR, CL, PE,
//                             TH, VN, MY, ID, ZA.
//
//  "placeholder" — Either thresholds change faster than we can reliably track
//                  (Turkey revised mid-year for inflation; Argentina updated
//                  quarterly) or the model is so simplified that the number
//                  could easily be off by 10+ pp. Treat as directional only.
//                  Show a red/orange badge.
//                  Countries: TR, AR.
export type TaxConfidence = "verified" | "partial" | "simplified" | "placeholder";

export type TaxEstimateResult = {
  effectiveRate: number;
  model: TaxModelKind;
  confidence: TaxConfidence;
  label: string;
  note: string;
  // One short sentence naming the single biggest gap in this estimate.
  // Shown prominently in the UI beside the tax rate. Keep under ~80 chars.
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

export type CountryTaxConfig = {
  code: string;
  estimator: TaxEstimator;
  conditionalQuestions?: ConditionalQuestion[];
};

export type EstimateInternationalTaxArgs = {
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

const TAX_ESTIMATORS: Record<string, TaxEstimator> = {

  // -------------------------------------------------------------------------
  // UNITED STATES — USD
  // 2025 tax year figures (IRS Rev. Proc. 2024-40 + OBBB amendments).
  // Standard deduction: $15,750 single / $31,500 MFJ (post-OBBB).
  // Social Security wage base 2025: $176,100.
  // Employee NI equivalents: SS 6.2% up to $176,100, Medicare 1.45%,
  // Additional Medicare 0.9% above $200k single / $250k MFJ.
  // Federal brackets are applied to TAXABLE income (after std deduction).
  // -------------------------------------------------------------------------
  US: ({ annualIncome, filing, isRetired }) => {
    // 2025 standard deductions (OBBB-adjusted)
    const standardDeduction = filing === "married" ? 31500 : 15750;
    const taxable = Math.max(0, annualIncome - standardDeduction);

    // 2025 IRS federal brackets (taxable income thresholds)
    const brackets =
      filing === "married"
        ? [
          { upTo: 23850, rate: 0.10 },
          { upTo: 96950, rate: 0.12 },
          { upTo: 206700, rate: 0.22 },
          { upTo: 394600, rate: 0.24 },
          { upTo: 501050, rate: 0.32 },
          { upTo: 751600, rate: 0.35 },
          { upTo: Infinity, rate: 0.37 },
        ]
        : [
          { upTo: 11925, rate: 0.10 },
          { upTo: 48475, rate: 0.12 },
          { upTo: 103350, rate: 0.22 },
          { upTo: 197300, rate: 0.24 },
          { upTo: 250525, rate: 0.32 },
          { upTo: 626350, rate: 0.35 },
          { upTo: Infinity, rate: 0.37 },
        ];

    const federalTaxAmount = progressiveTax(taxable, brackets) * taxable;
    const federalEffectiveRate = annualIncome > 0 ? federalTaxAmount / annualIncome : 0;

    let payrollEffectiveRate = 0;

    if (!isRetired && annualIncome > 0) {
      // 2025 SS wage base
      const socialSecurityWageBase = 176100;
      const socialSecurityTax = Math.min(annualIncome, socialSecurityWageBase) * 0.062;
      const medicareTax = annualIncome * 0.0145;
      const additionalMedicareThreshold = filing === "married" ? 250000 : 200000;
      const additionalMedicareTax =
        Math.max(0, annualIncome - additionalMedicareThreshold) * 0.009;
      payrollEffectiveRate =
        (socialSecurityTax + medicareTax + additionalMedicareTax) / annualIncome;
    }

    return {
      effectiveRate: clampRate(federalEffectiveRate + payrollEffectiveRate),
      model: "progressive-country",
      confidence: "partial",
      label: isRetired ? "US federal estimate (2025)" : "US federal + payroll estimate (2025)",
      missingFactor: "State income tax not included — adds 0–13% depending on state.",
      note: isRetired
        ? "Brackets and standard deduction are exact 2025 IRS figures (OBBB-adjusted). State and local taxes are not included — these add 0–13% depending on state and can materially change the result."
        : "Brackets and standard deduction are exact 2025 IRS figures (OBBB-adjusted). Payroll taxes included (SS 6.2% up to $176,100, Medicare 1.45%, Additional Medicare 0.9% above threshold). State and local taxes are not included — these add 0–13% depending on state.",
    };
  },

  // -------------------------------------------------------------------------
  // UNITED KINGDOM — GBP
  // 2024-25 HMRC figures. Personal allowance £12,570.
  // Income tax: 20% basic (up to £50,270), 40% higher (£50,270–£125,140),
  //   45% additional (above £125,140). Personal allowance tapers to zero
  //   between £100,000–£125,140 (effective 60% rate in that band).
  // Employee Class 1 NI (2024-25): 8% on £12,570–£50,270, then 2% above.
  //   (Rate was cut from 12% → 10% Jan 2024, then → 8% Apr 2024.)
  // No NI on pension income. No joint filing — married = same as single.
  // -------------------------------------------------------------------------
  GB: ({ annualIncome, isRetired }) => {
    const personalAllowance = 12570;
    // Allowance tapers: £1 lost per £2 earned above £100,000
    const taperThreshold = 100000;
    const effectiveAllowance = annualIncome > taperThreshold
      ? Math.max(0, personalAllowance - Math.floor((annualIncome - taperThreshold) / 2))
      : personalAllowance;

    const taxable = Math.max(0, annualIncome - effectiveAllowance);

    // Income tax using the reduced effective personal allowance
    const incomeTaxAmount = progressiveTax(taxable, [
      { upTo: 37700, rate: 0.20 },
      { upTo: 125140, rate: 0.40 },
      { upTo: Infinity, rate: 0.45 },
    ]) * taxable;
    const incomeTaxRate = annualIncome > 0 ? incomeTaxAmount / annualIncome : 0;

    // Employee NI 2024-25: 8% on £12,570–£50,270 band, 2% above
    let niRate = 0;
    if (!isRetired && annualIncome > 0) {
      const niLower = 12570;
      const niUpper = 50270;
      const niMain = Math.max(0, Math.min(annualIncome, niUpper) - niLower) * 0.08;
      const niHigher = Math.max(0, annualIncome - niUpper) * 0.02;
      niRate = (niMain + niHigher) / annualIncome;
    }

    return {
      effectiveRate: clampRate(incomeTaxRate + niRate),
      model: "progressive-country",
      confidence: "partial",
      label: "UK income tax + employee NI (2024-25)",
      missingFactor: "Scotland uses different rates; pension contribution relief not modelled.",
      note: "Brackets, personal allowance taper, and NI rates are 2024-25 HMRC figures. Employee NI: 8% on £12,570–£50,270, 2% above. No NI on pensions. Main omissions: Scotland uses different rates; tax-free pension lump sums, marriage allowance transfers, and pension contribution relief not modelled.",
    };
  },

  // -------------------------------------------------------------------------
  // PORTUGAL — EUR
  // 2024 IRS brackets (Continente). Conditional: IFICI / NHR special regime.
  // Key: answers.pt_ifici (note: calculator may also pass pt_nhr — both checked)
  // -------------------------------------------------------------------------
  PT: ({ annualIncome, isRetired, incomeScenario = isRetired ? "retired" : "local", answers }) => {
    const ificiAnswer = answers?.pt_ifici ?? answers?.pt_nhr;

    if (incomeScenario === "remote" && ificiAnswer === "yes") {
      return {
        effectiveRate: clampRate(isRetired ? 0.18 : 0.20),
        model: "flat",
        confidence: "partial",
        label: "Portugal IFICI / NHR planning estimate",
        missingFactor: "Income classification (employment vs passive vs pension) changes the treatment.",
        note: "The IFICI flat rate (20% on qualifying Portuguese-source income) is well-defined in legislation. Main uncertainty: whether your specific income streams qualify — foreign employment, pension, and passive income each have different treatment. Confirm with a Portugal-licensed tax advisor before relying on this number.",
      };
    }

    const rate = progressiveTax(annualIncome, [
      { upTo: 8059, rate: 0.1325 },
      { upTo: 12160, rate: 0.18 },
      { upTo: 17233, rate: 0.23 },
      { upTo: 22407, rate: 0.26 },
      { upTo: 28321, rate: 0.3288 },
      { upTo: 41629, rate: 0.37 },
      { upTo: 44987, rate: 0.435 },
      { upTo: 83696, rate: 0.45 },
      { upTo: Infinity, rate: 0.48 },
    ]);

    const retiredAdj = isRetired ? -0.025 : 0;

    return {
      effectiveRate: clampRate(rate + retiredAdj),
      model: "progressive-country",
      confidence: "simplified",
      label: "Portugal IRS estimate (2024 Continente brackets)",
      missingFactor: "Personal deductions and household splitting not modelled — real rate is often lower.",
      note: "National brackets are current (2024 Continente). Not modelled: household income splitting (declaração conjunta), personal deductions (health, education, housing interest), solidarity surcharges above €80k, and Madeira/Azores rates. Real effective rate can be materially lower once deductions are applied.",
    };
  },

  // -------------------------------------------------------------------------
  // SPAIN — EUR
  // 2024 national (estatal) + autonomous community average overlay.
  // Conditional: Beckham Law (Régimen de Impatriados) — answers.es_beckham
  // -------------------------------------------------------------------------
  ES: ({ annualIncome, filing, incomeScenario = "local", answers }) => {
    if ((incomeScenario === "remote" || incomeScenario === "local") && answers?.es_beckham === "yes") {
      const effectiveRate = annualIncome <= 600000 ? 0.24 : 0.30;
      return {
        effectiveRate: clampRate(effectiveRate),
        model: "flat",
        confidence: "partial",
        label: "Spain Beckham Law planning estimate",
        missingFactor: "Eligibility requires employer sponsorship and formal AEAT application approval.",
        note: "The Beckham Law rate (24% up to €600k) is legislated and well-defined. Main uncertainty: eligibility requires employer sponsorship, non-residency in Spain for the prior 5 years, and formal application approval. Blended rate above €600k is approximate. Confirm eligibility with a Spanish tax advisor.",
      };
    }

    // 2024 national (estatal) IRPF brackets. These are exactly half the total;
    // the autonomous community (tramo autonómico) adds the other half.
    const jointDeduction = filing === "married" ? 3400 : 0;
    const taxable = Math.max(0, annualIncome - jointDeduction);

    const nationalRate = progressiveTax(taxable, [
      { upTo: 12450, rate: 0.095 },
      { upTo: 20200, rate: 0.12 },
      { upTo: 35200, rate: 0.15 },
      { upTo: 60000, rate: 0.185 },
      { upTo: 300000, rate: 0.225 },
      { upTo: Infinity, rate: 0.245 },
    ]);

    // Autonomous community brackets (tramo autonómico) 2024.
    // Each comunidad autónoma sets its own rates independently.
    // Source: AEAT + regional BOE publications 2024.
    const COMMUNITY_BRACKETS: Record<string, Array<{ upTo: number; rate: number }>> = {
      MD: [ // Madrid — most competitive
        { upTo: 12450, rate: 0.09 }, { upTo: 17707, rate: 0.12 },
        { upTo: 33007, rate: 0.14 }, { upTo: 53407, rate: 0.175 },
        { upTo: Infinity, rate: 0.205 },
      ],
      CT: [ // Catalonia — highest overall
        { upTo: 12450, rate: 0.105 }, { upTo: 17707, rate: 0.12 },
        { upTo: 21000, rate: 0.14 }, { upTo: 33007, rate: 0.175 },
        { upTo: 53407, rate: 0.2175 }, { upTo: 90000, rate: 0.2375 },
        { upTo: 120000, rate: 0.245 }, { upTo: 175000, rate: 0.2575 },
        { upTo: 500000, rate: 0.2675 }, { upTo: Infinity, rate: 0.2775 },
      ],
      AN: [ // Andalusia
        { upTo: 12450, rate: 0.095 }, { upTo: 20200, rate: 0.12 },
        { upTo: 35200, rate: 0.14 }, { upTo: 60000, rate: 0.185 },
        { upTo: 120000, rate: 0.225 }, { upTo: Infinity, rate: 0.245 },
      ],
      VC: [ // Valencia
        { upTo: 12000, rate: 0.10 }, { upTo: 15000, rate: 0.13 },
        { upTo: 17707, rate: 0.155 }, { upTo: 33007, rate: 0.175 },
        { upTo: 53407, rate: 0.20 }, { upTo: 65000, rate: 0.225 },
        { upTo: 80000, rate: 0.25 }, { upTo: 120000, rate: 0.255 },
        { upTo: 175000, rate: 0.26 }, { upTo: Infinity, rate: 0.265 },
      ],
      PV: [ // Basque Country (foral — own system, approximated)
        { upTo: 15450, rate: 0.07 }, { upTo: 25450, rate: 0.10 },
        { upTo: 35450, rate: 0.15 }, { upTo: 60450, rate: 0.20 },
        { upTo: 90450, rate: 0.22 }, { upTo: 180450, rate: 0.25 },
        { upTo: Infinity, rate: 0.28 },
      ],
      NC: [ // Navarre (foral — own system, approximated)
        { upTo: 12450, rate: 0.09 }, { upTo: 19800, rate: 0.12 },
        { upTo: 32200, rate: 0.14 }, { upTo: 48600, rate: 0.18 },
        { upTo: 68400, rate: 0.215 }, { upTo: Infinity, rate: 0.235 },
      ],
      GA: [ // Galicia
        { upTo: 12450, rate: 0.09 }, { upTo: 20200, rate: 0.12 },
        { upTo: 35200, rate: 0.145 }, { upTo: 60000, rate: 0.185 },
        { upTo: 80000, rate: 0.225 }, { upTo: Infinity, rate: 0.245 },
      ],
      CL: [ // Castilla y León
        { upTo: 12450, rate: 0.09 }, { upTo: 20200, rate: 0.12 },
        { upTo: 35200, rate: 0.14 }, { upTo: 60000, rate: 0.185 },
        { upTo: Infinity, rate: 0.215 },
      ],
      CM: [ // Castilla-La Mancha
        { upTo: 12450, rate: 0.095 }, { upTo: 20200, rate: 0.12 },
        { upTo: 35200, rate: 0.145 }, { upTo: 60000, rate: 0.185 },
        { upTo: Infinity, rate: 0.225 },
      ],
      AR: [ // Aragón
        { upTo: 12450, rate: 0.10 }, { upTo: 15000, rate: 0.12 },
        { upTo: 17707, rate: 0.14 }, { upTo: 33007, rate: 0.175 },
        { upTo: 53407, rate: 0.21 }, { upTo: Infinity, rate: 0.245 },
      ],
      EX: [ // Extremadura
        { upTo: 12450, rate: 0.09 }, { upTo: 20200, rate: 0.12 },
        { upTo: 24000, rate: 0.155 }, { upTo: 35200, rate: 0.175 },
        { upTo: 60000, rate: 0.20 }, { upTo: Infinity, rate: 0.245 },
      ],
      MC: [ // Murcia
        { upTo: 12450, rate: 0.095 }, { upTo: 20200, rate: 0.12 },
        { upTo: 35200, rate: 0.145 }, { upTo: 60000, rate: 0.185 },
        { upTo: Infinity, rate: 0.235 },
      ],
      AS: [ // Asturias
        { upTo: 12450, rate: 0.10 }, { upTo: 17707, rate: 0.12 },
        { upTo: 33007, rate: 0.145 }, { upTo: 53407, rate: 0.185 },
        { upTo: 70000, rate: 0.215 }, { upTo: 90000, rate: 0.235 },
        { upTo: Infinity, rate: 0.255 },
      ],
      CB: [ // Cantabria
        { upTo: 12450, rate: 0.095 }, { upTo: 20200, rate: 0.12 },
        { upTo: 35200, rate: 0.145 }, { upTo: 60000, rate: 0.185 },
        { upTo: Infinity, rate: 0.245 },
      ],
      RI: [ // La Rioja
        { upTo: 12450, rate: 0.095 }, { upTo: 20200, rate: 0.12 },
        { upTo: 35200, rate: 0.14 }, { upTo: 60000, rate: 0.185 },
        { upTo: Infinity, rate: 0.225 },
      ],
      IB: [ // Balearic Islands
        { upTo: 10000, rate: 0.09 }, { upTo: 17707, rate: 0.115 },
        { upTo: 33007, rate: 0.145 }, { upTo: 53407, rate: 0.185 },
        { upTo: 70000, rate: 0.22 }, { upTo: 90000, rate: 0.235 },
        { upTo: 120000, rate: 0.2425 }, { upTo: Infinity, rate: 0.25 },
      ],
      CN: [ // Canary Islands (lower rates)
        { upTo: 12450, rate: 0.09 }, { upTo: 17707, rate: 0.115 },
        { upTo: 33007, rate: 0.14 }, { upTo: 53407, rate: 0.175 },
        { upTo: Infinity, rate: 0.205 },
      ],
      CE: [ // Ceuta and Melilla (50% general IRPF rebate — modelled as halved community rates)
        { upTo: 12450, rate: 0.05 }, { upTo: 20200, rate: 0.06 },
        { upTo: 35200, rate: 0.07 }, { upTo: 60000, rate: 0.09 },
        { upTo: Infinity, rate: 0.11 },
      ],
    };

    const REGION_NAMES: Record<string, string> = {
      MD: "Madrid", CT: "Catalonia", AN: "Andalusia", VC: "Valencia",
      PV: "Basque Country", NC: "Navarre", GA: "Galicia", CL: "Castilla y León",
      CM: "Castilla-La Mancha", AR: "Aragón", EX: "Extremadura", MC: "Murcia",
      AS: "Asturias", CB: "Cantabria", RI: "La Rioja", IB: "Balearic Islands",
      CN: "Canary Islands", CE: "Ceuta / Melilla",
    };

    const region = answers?.es_region ?? "";
    const hasRegion = !!COMMUNITY_BRACKETS[region];
    const communityBrackets = COMMUNITY_BRACKETS[region] ?? null;
    const isForalTerritory = region === "PV" || region === "NC";

    const communityRate = communityBrackets
      ? progressiveTax(taxable, communityBrackets)
      : nationalRate * 0.95; // fallback weighted average

    const totalTaxOnTaxable = (nationalRate + communityRate) * taxable;
    const effectiveRate = annualIncome > 0 ? totalTaxOnTaxable / annualIncome : 0;

    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: hasRegion ? "partial" : "simplified",
      label: hasRegion
        ? `Spain IRPF — ${REGION_NAMES[region] ?? region} (2024)`
        : "Spain IRPF estimate (2024 — select region to improve)",
      missingFactor: hasRegion
        ? (isForalTerritory
          ? `${REGION_NAMES[region]} has a separate foral system — rates are approximate.`
          : "Major personal deductions (pension contributions, mortgage) not modelled.")
        : "Autonomous region matters — Madrid vs Catalonia can differ by 5–8 pp.",
      note: hasRegion
        ? (isForalTerritory
          ? `${REGION_NAMES[region]} operates under a separate foral tax system with its own administration. These brackets approximate the foral rates — consult a local advisor for accurate figures. Personal deductions not modelled.`
          : `2024 national IRPF combined with ${REGION_NAMES[region]} autonomous community rates. Personal deductions (pension contributions, mortgage interest, childcare) can reduce taxable income and are not modelled. Income must be passed in EUR.`)
        : "National brackets are 2024 IRPF figures. The autonomous community overlay is a broad average — actual combined rates range from ~19% effective (Madrid) to 47%+ top marginal (Catalonia). Select your region above to significantly improve accuracy. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // MEXICO — MXN
  // 2024 ISR brackets (same structure as prior years, inflation-indexed).
  // No joint filing. Same brackets for all statuses.
  // -------------------------------------------------------------------------
  MX: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 8952.49, rate: 0.0192 },
      { upTo: 75984.55, rate: 0.064 },
      { upTo: 133536.07, rate: 0.1088 },
      { upTo: 155229.80, rate: 0.16 },
      { upTo: 185852.57, rate: 0.1792 },
      { upTo: 374837.88, rate: 0.2136 },
      { upTo: 590795.99, rate: 0.2352 },
      { upTo: 1127926.45, rate: 0.30 },
      { upTo: 1503902.46, rate: 0.32 },
      { upTo: Infinity, rate: 0.35 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Mexico ISR federal income tax (2024)",
      missingFactor: "IMSS social security and state payroll taxes not included.",
      note: "ISR brackets are 2024 federal figures. Not modelled: IMSS social security (~2-3% employee share on capped base), INFONAVIT housing fund contributions, or state payroll taxes. The ISR system also has a large employer-side subsidy (subsidio al empleo) at lower incomes that reduces employee liability — not reflected here. Income must be passed in MXN.",
    };
  },

  // -------------------------------------------------------------------------
  // CANADA — CAD
  // 2025 federal brackets (indexed annually).
  // Married: spousal amount credit (~CAD 2,600 tax reduction equivalent).
  // Retired: age amount credit (~CAD 1,900 tax reduction equivalent).
  // Provincial overlay: broad average ~10% (varies AB ~10% to QC ~25%).
  // -------------------------------------------------------------------------
  // Province top marginal rates (approximate 2024 combined federal+provincial max effective)
  // Used when answers.ca_province is set.
  CA: ({ annualIncome, filing, isRetired, answers }) => {
    // 2025 federal brackets
    const federalRate = progressiveTax(annualIncome, [
      { upTo: 57375, rate: 0.15 },
      { upTo: 114750, rate: 0.205 },
      { upTo: 177882, rate: 0.26 },
      { upTo: 253414, rate: 0.29 },
      { upTo: Infinity, rate: 0.33 },
    ]);

    // Province-specific marginal rate overlays (2024 combined avg effective additions)
    const PROVINCE_OVERLAY: Record<string, number> = {
      AB: 0.10,   // Alberta — lowest: no surtax
      BC: 0.145,  // British Columbia
      MB: 0.175,  // Manitoba
      NB: 0.195,  // New Brunswick
      NL: 0.215,  // Newfoundland
      NS: 0.21,   // Nova Scotia
      NT: 0.135,  // Northwest Territories
      NU: 0.115,  // Nunavut
      ON: 0.1316, // Ontario (incl. surtax effect avg)
      PE: 0.185,  // Prince Edward Island
      QC: 0.2575, // Quebec — highest
      SK: 0.145,  // Saskatchewan
      YT: 0.15,   // Yukon
    };

    const province = answers?.ca_province ?? "";
    const provincialOverlay = PROVINCE_OVERLAY[province] ?? 0.13; // fallback: broad average
    const hasProvince = !!PROVINCE_OVERLAY[province];

    // Credits modeled as effective rate reductions
    const spousalCredit = filing === "married" && annualIncome > 0 ? 2600 / annualIncome : 0;
    const ageCredit = isRetired && annualIncome > 0 ? 1900 / annualIncome : 0;

    return {
      effectiveRate: clampRate(federalRate + provincialOverlay - spousalCredit - ageCredit),
      model: "country-plus-province",
      confidence: hasProvince ? "partial" : "simplified",
      label: hasProvince
        ? `Canada federal + ${province} provincial estimate (2025)`
        : "Canada federal + provincial estimate (2025 — select province)",
      missingFactor: hasProvince
        ? "CPP contributions (~5.95% up to CAD 68,500) not included."
        : "Province can swing combined rate by 10–15 pp — select province for accuracy.",
      note: hasProvince
        ? `Federal brackets are exact 2025 figures. ${province} provincial rate applied. CPP contributions (~5.95% on earnings up to CAD 68,500) are not modelled. Provincial credits and deductions vary and are not fully captured.`
        : "Federal brackets are 2025 figures. Provincial overlay (~13% average) is the dominant source of uncertainty: Alberta ~10%, Ontario ~13.2%, British Columbia ~14.5%, Quebec ~25.75%. The real combined rate can differ by 10–15 pp depending on province. Select your province above to improve accuracy.",
    };
  },

  // -------------------------------------------------------------------------
  // GERMANY — EUR
  // 2024 Einkommensteuer. Ehegattensplitting for married couples.
  // Solidarity surcharge: 5.5% of income tax where tax > €17,543 (single)
  // or > €35,086 (joint). Church tax not modeled.
  // -------------------------------------------------------------------------
  DE: ({ annualIncome, filing, isRetired, answers }) => {
    const taxablePerUnit = filing === "married" ? annualIncome / 2 : annualIncome;

    // 2024 German brackets (basic allowance €11,604)
    const ratePerUnit = progressiveTax(taxablePerUnit, [
      { upTo: 11604, rate: 0.00 },
      { upTo: 17006, rate: 0.14 },
      { upTo: 66761, rate: 0.24 },
      { upTo: 277826, rate: 0.42 },
      { upTo: Infinity, rate: 0.45 },
    ]);

    const taxPerUnit = ratePerUnit * taxablePerUnit;
    const totalTax = filing === "married" ? taxPerUnit * 2 : taxPerUnit;
    const baseTaxRate = annualIncome > 0 ? totalTax / annualIncome : 0;

    // Solidarity surcharge applies if income tax > threshold
    const solidarityThresholdTax = filing === "married" ? 35086 : 17543;
    const solidarity = totalTax > solidarityThresholdTax ? baseTaxRate * 0.055 : 0;

    // Church tax conditional (applies to registered members — ~8-9% of income tax)
    const churchTaxApplies = answers?.de_church_tax === "yes";
    const churchTax = churchTaxApplies ? (baseTaxRate + solidarity) * 0.085 : 0;

    // Scenario-split confidence: retirees have no social insurance gap; workers do.
    const isWorker = !isRetired;
    const confidence: TaxConfidence = isWorker ? "simplified" : "partial";

    return {
      effectiveRate: clampRate(baseTaxRate + solidarity + churchTax),
      model: "progressive-country",
      confidence,
      label: churchTaxApplies
        ? "Germany Einkommensteuer + Soli + Kirchensteuer (2024)"
        : "Germany Einkommensteuer + Soli (2024)",
      missingFactor: isWorker
        ? "Employee social insurance (~20% combined) not included — major gap for workers."
        : "Church tax (~8-9% of income tax) not included unless selected above.",
      note: isWorker
        ? "National brackets and Ehegattensplitting are structurally correct. Major omissions: employee social insurance contributions total approximately 20% (health ~7.3%, pension ~9.3%, unemployment ~1.3%, long-term care ~1.7%) — these dramatically increase the real total burden for working residents. This estimate understates total deductions from gross income for an employed person by a wide margin."
        : `Retirees do not pay social insurance on pension income, so this estimate is more reliable for retired residents. Church tax (${churchTaxApplies ? "included at 8.5% of income tax" : "not included — select above if applicable"}) and investment income (Abgeltungsteuer 25%) are not modelled.`,
    };
  },

  // -------------------------------------------------------------------------
  // NETHERLANDS — EUR
  // 2024 Box 1 rates. No joint filing.
  // Working: Box 1 has a combined income-tax + national insurance band
  // up to €75,518 at 36.97%, then 49.50% above.
  // Retired (AOW recipients): reduced rate ~19.36% on first ~€38,098
  // (no AOW premium), then 49.50%.
  // 30% ruling: not modeled here — flagged in notes.
  // -------------------------------------------------------------------------
  NL: ({ annualIncome, isRetired, answers }) => {
    const brackets = isRetired
      ? [
        { upTo: 38441, rate: 0.1936 }, // No AOW premium for retirees
        { upTo: Infinity, rate: 0.495 },
      ]
      : [
        { upTo: 75518, rate: 0.3697 }, // Income tax + national insurance combined
        { upTo: Infinity, rate: 0.495 },
      ];
    const ruling30 = answers?.nl_30pct_ruling === "yes";
    let effectiveRate = progressiveTax(annualIncome, brackets);
    if (ruling30 && !isRetired) {
      // 30% ruling: 30% of salary is tax-free, so taxable base = 70%
      const taxableWithRuling = annualIncome * 0.70;
      effectiveRate = progressiveTax(taxableWithRuling, brackets) * 0.70;
    }

    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: ruling30 ? "partial" : "simplified",
      label: ruling30
        ? "Netherlands Box 1 + 30% ruling (2024)"
        : "Netherlands Box 1 income tax (2024)",
      missingFactor: ruling30
        ? "Box 2/3 taxes and exact ruling cap (€246,000/yr salary limit) not modelled."
        : "30% ruling not modelled — can reduce effective rate substantially for qualifying expats.",
      note: ruling30
        ? "30% ruling applied: 30% of salary treated as tax-free expense allowance, reducing the taxable base to 70%. The ruling has a maximum salary of €246,000/yr (2024) and lasts up to 5 years. Box 2 (substantial interest) and Box 3 (notional return on savings) are not included."
        : "Box 1 rate structure is correct (combined income tax + national insurance). The 30% ruling for qualifying expats (tax-free allowance on 30% of salary for up to 5 years) can reduce effective rates substantially — select above if you qualify. Box 2 and Box 3 taxes are not included. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // AUSTRIA — EUR
  // 2024 Einkommensteuer. Progressive brackets; married filing not available
  // (joint assessment not used — spouses file individually).
  // Employee social insurance: ~18.12% combined (health 3.87%, pension 10.25%,
  // unemployment 3%, accident 1%). Not on pension income.
  // -------------------------------------------------------------------------
  AT: ({ annualIncome, isRetired }) => {
    // 2024 Austrian income tax brackets
    const rate = progressiveTax(annualIncome, [
      { upTo: 11693, rate: 0.00 },
      { upTo: 19134, rate: 0.20 },
      { upTo: 32075, rate: 0.30 },
      { upTo: 62080, rate: 0.40 },
      { upTo: 93120, rate: 0.48 },
      { upTo: 1000000, rate: 0.50 },
      { upTo: Infinity, rate: 0.55 },
    ]);

    // Employee social insurance ~18.12% on working income; waived on pension
    const socialOverlay = isRetired ? 0 : 0.1812;

    return {
      effectiveRate: clampRate(rate + socialOverlay),
      model: "progressive-country",
      confidence: "simplified",
      label: "Austria Einkommensteuer + social insurance (2024)",
      missingFactor: "Employee social insurance (~18.12%) included; commuter allowance and other deductions not modelled.",
      note: "Uses 2024 Austrian income tax brackets with employee social insurance (~18.12% combined: health 3.87%, pension 10.25%, unemployment 3%, accident 1%) applied to working income. The traffic tax credit (Verkehrsabsetzbetrag), sole-earner credit, and pension credit are not modelled — effective rates may be somewhat overstated. No joint filing in Austria. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // BELGIUM — EUR
  // 2024 personenbelasting / impôt des personnes physiques.
  // Belgium has national + communal surcharges (avg ~7% of national tax).
  // Married / legally cohabiting: income splitting may apply (complex).
  // Employee social insurance: ~13.07% on working income.
  // -------------------------------------------------------------------------
  BE: ({ annualIncome, filing, isRetired }) => {
    // National personal allowance (forfaitaire beroepskosten) approximation:
    // Employment income deduction ~30% up to EUR 5,520 (simplified as flat deduction)
    const employmentDeduction = isRetired ? 0 : Math.min(annualIncome * 0.30, 5520);
    // Married: Belgium allows some income transfer between spouses (quotient conjugal)
    // Simplified: modest deduction equivalent for married filers
    const marriedDeduction = filing === "married" ? 3800 : 0;
    const taxable = Math.max(0, annualIncome - employmentDeduction - marriedDeduction);

    // 2024 Belgian national brackets
    const nationalRate = progressiveTax(taxable, [
      { upTo: 15820, rate: 0.25 },
      { upTo: 27920, rate: 0.40 },
      { upTo: 48320, rate: 0.45 },
      { upTo: Infinity, rate: 0.50 },
    ]);

    const nationalTax = nationalRate * taxable;
    // Communal surcharge: average ~7% of national tax (ranges 0–9% by municipality)
    const communalSurcharge = annualIncome > 0 ? (nationalTax * 0.07) / annualIncome : 0;
    const incomeTaxRate = annualIncome > 0 ? nationalTax / annualIncome : 0;

    // Employee social insurance ~13.07% on working income
    const socialOverlay = isRetired ? 0 : 0.1307;

    return {
      effectiveRate: clampRate(incomeTaxRate + communalSurcharge + socialOverlay),
      model: "country-plus-local",
      confidence: "simplified",
      label: "Belgium income tax + communal surcharge (2024)",
      missingFactor: "Communal surcharge (0–9%) averaged at 7%; full quotient conjugal not modelled.",
      note: "Uses 2024 Belgian national brackets with employment income deduction (~30% up to EUR 5,520), average communal surcharge (7% of national tax), and employee social insurance (~13.07%). Married income splitting (quotient conjugal) is simplified — real benefit for couples with unequal incomes is larger. The extensive Belgian tax credit system (tax-free allowance, family credits) is not fully modelled. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // COSTA RICA — CRC
  // 2024 Impuesto sobre la Renta brackets (employment income).
  // No joint filing.
  // -------------------------------------------------------------------------
  CR: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 929000, rate: 0.00 },
      { upTo: 1390000, rate: 0.10 },
      { upTo: 2435000, rate: 0.15 },
      { upTo: 4870000, rate: 0.20 },
      { upTo: Infinity, rate: 0.25 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: isRetired ? "partial" : "simplified",
      label: "Costa Rica income tax (2024)",
      missingFactor: isRetired ? "Pension income taxed at same brackets; CCSS not applicable to pension." : "CCSS employee contributions (~9%) not included for local employment.",
      note: "Income tax brackets are 2024 figures. Key omission: CCSS (Caja Costarricense de Seguro Social) employee contributions are approximately 9% of gross salary on top of income tax. For a remote worker paying foreign social security, this may not apply — but for locally-employed residents it materially increases total deductions. Income must be passed in CRC.",
    };
  },

  // -------------------------------------------------------------------------
  // FRANCE — EUR
  // 2024 IR. Quotient familial: income ÷ parts, tax × parts.
  // Single = 1 part, married/PACS = 2 parts.
  // Social charges: CSG+CRDS 9.7% on earned income; 6.6% (reduced) on pensions.
  // -------------------------------------------------------------------------
  FR: ({ annualIncome, filing, isRetired }) => {
    const parts = filing === "married" ? 2 : 1;
    const incomePerPart = annualIncome / parts;

    const taxPerPart = progressiveTax(incomePerPart, [
      { upTo: 11294, rate: 0.00 },
      { upTo: 28797, rate: 0.11 },
      { upTo: 82341, rate: 0.30 },
      { upTo: 177106, rate: 0.41 },
      { upTo: Infinity, rate: 0.45 },
    ]) * incomePerPart;

    const incomeTaxRate = annualIncome > 0 ? (taxPerPart * parts) / annualIncome : 0;
    // CSG+CRDS: 9.7% on earned, 6.6% on pensions (reduced rate for eligible retirees)
    const socialCharges = isRetired ? 0.066 : 0.097;

    return {
      effectiveRate: clampRate(incomeTaxRate + socialCharges),
      model: "progressive-country",
      confidence: "simplified",
      label: "France IR + CSG/CRDS (2024)",
      missingFactor: "Child parts (quotient familial) and tax credits not modelled — real rate lower for families.",
      note: "National brackets and 2-part quotient familial for married/PACS filers are structurally correct. Key omissions: child parts (each child adds 0.5 part, significantly reducing tax for families), the large array of tax credits (childcare, energy, home employment), and flat-rate social charges on investment income. The quotient familial system is one of the most family-sensitive in the world — this model understates the benefit for households with children. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // ITALY — EUR
  // 2024 IRPEF. No joint filing. Regional (~1.23-3.33%) + municipal (~0-0.9%)
  // surtax modeled at 2% combined average.
  // -------------------------------------------------------------------------
  IT: ({ annualIncome, answers }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 28000, rate: 0.23 },
      { upTo: 50000, rate: 0.35 },
      { upTo: Infinity, rate: 0.43 },
    ]);
    if (answers?.it_flat_tax === "yes") {
      // Flat Tax for New Residents: €100,000/yr on all foreign-source income (fixed sum, not rate-based)
      // On Italian-source income: standard IRPEF rates apply.
      // Simplified: model as a flat €100k annual tax on foreign income (very high earner regime).
      const flatTaxAmount = 100000; // EUR — fixed annual substitute tax
      const effectiveRate = annualIncome > 0 ? flatTaxAmount / annualIncome : 0;
      return {
        effectiveRate: clampRate(effectiveRate),
        model: "flat",
        confidence: "partial",
        label: "Italy Flat Tax for New Residents (€100k substitute tax)",
        missingFactor: "Italian-source income still subject to standard IRPEF; regime lasts 15 years max.",
        note: "Italy's Flat Tax for New Residents: a fixed €100,000/yr substitute tax on all foreign-source income, regardless of the actual amount. Italian-source income is taxed at standard IRPEF rates (not modelled here). This regime lasts up to 15 years. Most relevant for high-income individuals with significant foreign income. Eligibility requires not having been Italian tax resident in 9 of the prior 10 years.",
      };
    }

    // Regional (addizionale regionale) surtax rates 2024 (% of taxable income).
    // Ranges from 1.23% (minimum, applies to regions not yet having set higher rates)
    // to 3.33% (Lazio / historically higher regions). Plus municipal (0–0.9%).
    const IT_REGION_SURTAX: Record<string, number> = {
      ABR: 0.0173, // Abruzzo
      BAS: 0.0123, // Basilicata (minimum)
      CAL: 0.0330, // Calabria (highest mainland)
      CAM: 0.0320, // Campania
      EMR: 0.0133, // Emilia-Romagna
      FVG: 0.0123, // Friuli-Venezia Giulia (minimum — autonomous)
      LAZ: 0.0330, // Lazio (Rome — highest)
      LIG: 0.0173, // Liguria
      LOM: 0.0173, // Lombardy (Milan)
      MAR: 0.0150, // Marche
      MOL: 0.0220, // Molise
      PAB: 0.0123, // Bolzano / South Tyrol (autonomous — minimum)
      PAT: 0.0123, // Trento / Trentino (autonomous — minimum)
      PIE: 0.0173, // Piedmont
      PUG: 0.0230, // Puglia
      SAR: 0.0173, // Sardinia (autonomous)
      SIC: 0.0250, // Sicily (autonomous)
      TOS: 0.0173, // Tuscany (Florence)
      UMB: 0.0173, // Umbria
      VDA: 0.0123, // Aosta Valley (autonomous — minimum)
      VEN: 0.0173, // Veneto (Venice)
    };

    const itRegion = answers?.it_region ?? "";
    const hasItRegion = !!IT_REGION_SURTAX[itRegion];
    // Municipal surtax: average 0.5% (range 0–0.9% — not region-selectable here)
    const municipalSurtax = 0.005;
    const regionalSurtax = IT_REGION_SURTAX[itRegion] ?? 0.020; // fallback avg

    const IT_REGION_NAMES: Record<string, string> = {
      ABR: "Abruzzo", BAS: "Basilicata", CAL: "Calabria", CAM: "Campania",
      EMR: "Emilia-Romagna", FVG: "Friuli-Venezia Giulia", LAZ: "Lazio (Rome)",
      LIG: "Liguria", LOM: "Lombardy (Milan)", MAR: "Marche", MOL: "Molise",
      PAB: "Bolzano / South Tyrol", PAT: "Trentino", PIE: "Piedmont",
      PUG: "Puglia", SAR: "Sardinia", SIC: "Sicily", TOS: "Tuscany (Florence)",
      UMB: "Umbria", VDA: "Aosta Valley", VEN: "Veneto (Venice)",
    };

    return {
      effectiveRate: clampRate(rate + regionalSurtax + municipalSurtax),
      model: "country-plus-local",
      confidence: hasItRegion ? "partial" : "simplified",
      label: hasItRegion
        ? `Italy IRPEF + ${IT_REGION_NAMES[itRegion] ?? itRegion} surtax (2024)`
        : "Italy IRPEF + regional/municipal surtax (2024 — select region)",
      missingFactor: hasItRegion
        ? "INPS social contributions (~9.2%) and personal deductions not modelled."
        : "Regional surtax varies 1.2–3.3% — Lazio/Calabria vs Bolzano can differ by ~2 pp.",
      note: hasItRegion
        ? `2024 IRPEF brackets with ${IT_REGION_NAMES[itRegion] ?? itRegion} regional surtax (${(IT_REGION_SURTAX[itRegion]! * 100).toFixed(2)}%) and average municipal surtax (0.5%). INPS employee social contributions (~9.2%) not included. Personal deductions (healthcare, mortgage interest) not modelled. Income must be passed in EUR.`
        : "National IRPEF brackets are 2024 figures. Regional surtax ranges from 1.23% (Basilicata, autonomous regions) to 3.33% (Lazio, Calabria). Municipal surtax adds 0–0.9%. Select your region above to use the exact surtax rate. Italy's Flat Tax for New Residents (€100k/yr) is a separate regime — use the question above to model it. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // IRELAND — EUR
  // 2025 rates. Married (single-earner): standard rate band widens to €51,000.
  // USC 2025: threshold raised, revised bands.
  // PRSI 4.1% from Oct 2024 (increased from 4%).
  // Tax credits 2025: personal €1,875, PAYE employee €1,875 (working only),
  //   married person's credit €1,875 additional (married), age credit €245 (65+).
  // Retired: USC and PRSI waived.
  // -------------------------------------------------------------------------
  IE: ({ annualIncome, filing, isRetired }) => {
    const standardBand = filing === "married" ? 51000 : 42000;
    const grossTaxAmount = progressiveTax(annualIncome, [
      { upTo: standardBand, rate: 0.20 },
      { upTo: Infinity, rate: 0.40 },
    ]) * annualIncome;

    // 2025 tax credits — applied directly against tax liability
    const personalCredit = 1875;
    const payeCredit = isRetired ? 0 : 1875; // working only
    const marriedCredit = filing === "married" ? 1875 : 0;
    const ageCredit = isRetired ? 245 : 0;     // 65+ age credit
    const totalCredits = personalCredit + payeCredit + marriedCredit + ageCredit;

    const netTaxAmount = Math.max(0, grossTaxAmount - totalCredits);
    const payeRate = annualIncome > 0 ? netTaxAmount / annualIncome : 0;

    // 2025 USC bands
    const uscRate = isRetired ? 0 : progressiveTax(annualIncome, [
      { upTo: 13000, rate: 0.00 },
      { upTo: 25760, rate: 0.02 },
      { upTo: 70044, rate: 0.04 },
      { upTo: Infinity, rate: 0.08 },
    ]);

    // PRSI: 4.1% from Oct 2024
    const prsi = isRetired ? 0 : 0.041;

    return {
      effectiveRate: clampRate(payeRate + uscRate + prsi),
      model: "progressive-country",
      confidence: "partial",
      label: "Ireland PAYE + USC + PRSI + tax credits (2025)",
      missingFactor: "Home carer credit, rent credit, and other personal reliefs not modelled.",
      note: "2025 rate structure with key tax credits applied: personal credit (€1,875), PAYE employee credit (€1,875 for workers), married person's credit (€1,875), and age credit (€245 for 65+). USC and PRSI correctly excluded for retirees. Remaining omissions: home carer credit (€1,800), rent tax credit (€1,000), medical/tuition expenses, and pension contribution relief — these reduce tax further for eligible filers. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // AUSTRALIA — AUD
  // 2024-25 rates (Stage 3 tax cuts enacted from 1 July 2024).
  // No joint filing. Medicare Levy: 2% working, 1% retired.
  // -------------------------------------------------------------------------
  AU: ({ annualIncome, isRetired }) => {
    // 2024-25 brackets (Stage 3 cuts — new thresholds effective 1 Jul 2024)
    const rate = progressiveTax(annualIncome, [
      { upTo: 18200, rate: 0.00 },
      { upTo: 45000, rate: 0.19 },
      { upTo: 135000, rate: 0.325 }, // raised from $120k under Stage 3
      { upTo: 190000, rate: 0.37 },
      { upTo: Infinity, rate: 0.45 },
    ]);
    const medicareLevy = isRetired ? 0.01 : 0.02;
    return {
      effectiveRate: clampRate(rate + medicareLevy),
      model: "progressive-country",
      confidence: "partial",
      label: "Australia income tax + Medicare Levy (2024-25)",
      missingFactor: "LITO (low income tax offset) not applied; state/territory taxes not applicable.",
      note: "2024-25 brackets (Stage 3 tax cuts) and Medicare Levy are correct. Minor omission: the Low Income Tax Offset (LITO, up to $700) and Low and Middle Income Tax Offset (LMITO, now expired) are not modelled — effect is small at planning incomes. Superannuation contributions (11.5% employer-side in 2024-25) are not a deduction from employment income. Income must be passed in AUD.",
    };
  },

  // -------------------------------------------------------------------------
  // NEW ZEALAND — NZD
  // 2024-25 rates. No joint filing.
  // Budget 2024 increased the 17.5% bracket threshold from NZD 48k to NZD 53.5k
  // and the 30% bracket from NZD 70k to NZD 78.1k (effective 31 Jul 2024).
  // -------------------------------------------------------------------------
  NZ: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 14000, rate: 0.105 },
      { upTo: 53500, rate: 0.175 }, // raised from $48k (Budget 2024)
      { upTo: 78100, rate: 0.30 }, // raised from $70k (Budget 2024)
      { upTo: 180000, rate: 0.33 },
      { upTo: Infinity, rate: 0.39 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "New Zealand PAYE (2024-25, Budget 2024 thresholds)",
      missingFactor: "ACC levies (~1.6% on employment income) not included.",
      note: "2024-25 brackets including Budget 2024 threshold increases are correct. ACC levies (~1.6% on employment income up to ~NZD 142,283) are not included — these add approximately 1–1.6 pp to the effective rate for employees. No joint filing. NZ Super is taxable at the same rates. Income must be passed in NZD.",
    };
  },

  // -------------------------------------------------------------------------
  // JAPAN — JPY
  // 2024 national rates + reconstruction surtax 2.1% of income tax.
  // Local inhabitant tax: flat 10% of income.
  // No joint filing.
  // -------------------------------------------------------------------------
  JP: ({ annualIncome, isRetired }) => {
    const nationalRate = progressiveTax(annualIncome, [
      { upTo: 1950000, rate: 0.05 },
      { upTo: 3300000, rate: 0.10 },
      { upTo: 6950000, rate: 0.20 },
      { upTo: 9000000, rate: 0.23 },
      { upTo: 18000000, rate: 0.33 },
      { upTo: 40000000, rate: 0.40 },
      { upTo: Infinity, rate: 0.45 },
    ]);
    const reconstructionSurtax = nationalRate * 0.021;
    const localTax = 0.10;
    // Pension income deduction approximation for retirees
    const pensionDeduction = isRetired ? -0.02 : 0;

    return {
      effectiveRate: clampRate(nationalRate + reconstructionSurtax + localTax + pensionDeduction),
      model: "country-plus-local",
      confidence: "simplified",
      label: "Japan national + surtax + local inhabitant tax (2024)",
      missingFactor: "Employee social insurance (~14–15% combined) not included.",
      note: "National brackets, reconstruction surtax, and local inhabitant tax (flat 10%) are structurally correct. Major omission: employee social insurance premiums total approximately 14–15% of gross salary (health ~5%, pension ~9.15%, employment ~0.6%) — this is the dominant real-world deduction for employed residents and is not modelled. Employment income deduction (kyuyo shotoku kojo) also not applied, which means this estimate may overstate income tax on employment income. Income must be passed in JPY.",
    };
  },

  // -------------------------------------------------------------------------
  // SOUTH KOREA — KRW
  // 2024 national brackets. Local income tax = 10% surcharge on national tax.
  // No joint filing.
  // -------------------------------------------------------------------------
  KR: ({ annualIncome, isRetired }) => {
    const nationalRate = progressiveTax(annualIncome, [
      { upTo: 14000000, rate: 0.06 },
      { upTo: 50000000, rate: 0.15 },
      { upTo: 88000000, rate: 0.24 },
      { upTo: 150000000, rate: 0.35 },
      { upTo: 300000000, rate: 0.38 },
      { upTo: 500000000, rate: 0.40 },
      { upTo: 1000000000, rate: 0.42 },
      { upTo: Infinity, rate: 0.45 },
    ]);
    const localSurtax = nationalRate * 0.10;
    const pensionDeduction = isRetired ? -0.02 : 0;

    return {
      effectiveRate: clampRate(nationalRate + localSurtax + pensionDeduction),
      model: "country-plus-local",
      confidence: "simplified",
      label: "South Korea national + local surtax (2024)",
      missingFactor: "National Health Insurance and pension contributions (~8% combined) not included.",
      note: "National brackets and 10% local surtax are correct. Key omissions: National Health Insurance (~3.545% employee) and National Pension (~4.5% employee up to KRW 5,900,000/mo) together add approximately 8% to the total burden for most employees — a material gap. Employment income deduction (near income) also not applied, which overstates income tax on employment income at lower incomes. Income must be passed in KRW.",
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
    note: "The UAE does not levy personal income tax on employment or investment income. A 9% corporate tax applies to businesses with profits above AED 375,000, but there is no individual income tax.",
  }),

  // -------------------------------------------------------------------------
  // SINGAPORE — SGD
  // 2024 YA rates. No joint filing.
  // Earned Income Relief (EIR): $1,000 below age 55; senior relief modeled
  // as $8,000 for retirees. NSman and other personal reliefs not modeled.
  // -------------------------------------------------------------------------
  SG: ({ annualIncome, isRetired }) => {
    const earnedIncomeRelief = isRetired ? 8000 : 1000;
    const taxable = Math.max(0, annualIncome - earnedIncomeRelief);

    const rate = progressiveTax(taxable, [
      { upTo: 20000, rate: 0.00 },
      { upTo: 30000, rate: 0.02 },
      { upTo: 40000, rate: 0.035 },
      { upTo: 80000, rate: 0.07 },
      { upTo: 120000, rate: 0.115 },
      { upTo: 160000, rate: 0.15 },
      { upTo: 200000, rate: 0.18 },
      { upTo: 240000, rate: 0.19 },
      { upTo: 280000, rate: 0.195 },
      { upTo: 320000, rate: 0.20 },
      { upTo: 500000, rate: 0.22 },
      { upTo: 1000000, rate: 0.23 },
      { upTo: Infinity, rate: 0.24 },
    ]);

    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Singapore resident progressive (2024 YA)",
      missingFactor: "CPF contributions (~20% employee) not modelled; residency status affects rate.",
      note: "2024 YA resident rates with basic earned income relief applied. Key gaps: non-residents pay a flat 15% or progressive rates, whichever is higher — this model assumes tax residency which requires ≥183 days in Singapore. CPF contributions (~20% employee up to SGD 6,800/mo) are a significant real deduction but partly a savings mechanism. Various personal reliefs (NSman, parent, spouse) can reduce tax by thousands of dollars. Income must be passed in SGD.",
    };
  },

  // -------------------------------------------------------------------------
  // SWITZERLAND — CHF
  // 2024 federal rates (separate scales for single vs married).
  // Cantonal + municipal overlay: Zurich mid-range benchmark (~13%).
  // Range is wide: Zug ~18% total, Zurich ~27%, Geneva ~37%.
  // -------------------------------------------------------------------------
  CH: ({ annualIncome, filing }) => {
    const singleBrackets = [
      { upTo: 17800, rate: 0.00 },
      { upTo: 31600, rate: 0.077 },
      { upTo: 41400, rate: 0.088 },
      { upTo: 55200, rate: 0.11 },
      { upTo: 72500, rate: 0.13 },
      { upTo: 103600, rate: 0.133 },
      { upTo: 134600, rate: 0.134 },
      { upTo: 176000, rate: 0.135 },
      { upTo: Infinity, rate: 0.1197 },
    ];
    const marriedBrackets = [
      { upTo: 28300, rate: 0.00 },
      { upTo: 50900, rate: 0.02 },
      { upTo: 58400, rate: 0.03 },
      { upTo: 75300, rate: 0.04 },
      { upTo: 90300, rate: 0.05 },
      { upTo: 103400, rate: 0.06 },
      { upTo: 114700, rate: 0.07 },
      { upTo: 124000, rate: 0.08 },
      { upTo: 131700, rate: 0.09 },
      { upTo: 137300, rate: 0.10 },
      { upTo: 141200, rate: 0.105 },
      { upTo: 145000, rate: 0.11 },
      { upTo: Infinity, rate: 0.115 },
    ];
    const federalRate = progressiveTax(annualIncome, filing === "married" ? marriedBrackets : singleBrackets);
    // Zurich mid-range cantonal + municipal overlay. Married scale is inherently
    // lower at the federal level; no additional married discount applied.
    const cantonalOverlay = 0.13;

    return {
      effectiveRate: clampRate(federalRate + cantonalOverlay),
      model: "country-plus-province",
      confidence: "simplified",
      label: "Switzerland federal + cantonal estimate (2024 mid-range)",
      missingFactor: "Rate varies widely by canton — Zug ~18% total, Zurich ~27%, Geneva ~37%.",
      note: "Federal brackets are exact 2024 Swiss figures (separate single/married scales). Cantonal and municipal rates use a mid-range overlay (~13%) benchmarked to Zurich. Actual combined rates range from ~18% (Zug) to ~37% (Geneva, Vaud) — this estimate can be off by 10+ pp depending on location. Swiss social insurance contributions not included. Income must be passed in CHF.",
    };
  },

  // -------------------------------------------------------------------------
  // DENMARK — DKK
  // 2024 rates. AM-bidrag (labour market contribution) 8% on gross,
  // deducted before income tax. Not applicable to pension income.
  // Bottom tax + health tax (~12.5%) + top tax (15% above DKK 588,900).
  // Municipal tax average ~25.1%.
  // -------------------------------------------------------------------------
  DK: ({ annualIncome, isRetired }) => {
    if (annualIncome <= 0) return { effectiveRate: 0, model: "progressive-country", confidence: "partial", label: "Denmark income tax (2024)", missingFactor: "", note: "Enter income to calculate." };

    // AM-bidrag 8% (not on pension)
    const amBidragAmount = isRetired ? 0 : annualIncome * 0.08;
    const taxableAfterAM = Math.max(0, annualIncome - amBidragAmount);

    // Personal allowance (personfradrag) ~DKK 49,700 applied as deduction
    const personalAllowance = 49700;
    const taxable = Math.max(0, taxableAfterAM - personalAllowance);

    // Bottom tax: 12.01%, Top tax: 15% above DKK 588,900 (2024 threshold)
    const bottomTax = taxable * 0.1201;
    const topTaxBase = Math.max(0, taxable - 588900);
    const topTax = topTaxBase * 0.15;
    // Municipal average ~25.1% on taxable income (after personal allowance)
    const municipalTax = taxable * 0.251;

    const totalTax = amBidragAmount + bottomTax + topTax + municipalTax;
    const effectiveRate = totalTax / annualIncome;

    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: isRetired ? "partial" : "partial",
      label: "Denmark income tax + AM-bidrag + municipal (2024)",
      missingFactor: "Municipal rate varies by kommune (Copenhagen 23.5%+); church tax (~0.7%) not included.",
      note: "Structure is correct: AM-bidrag (8% on gross, not on pensions), personal allowance (DKK 49,700), bottom tax (12.01%), average municipal (25.1%), top tax (15% above DKK 588,900). Main omissions: church tax (~0.7%, opt-in) and the share-income tax (aktieindkomstskat) on dividends. Municipal rate varies by kommune — Copenhagen is 23.5%, some rural communes are 26%+. Income must be passed in DKK.",
    };
  },

  // -------------------------------------------------------------------------
  // SWEDEN — SEK
  // 2024 rates. Municipal tax average ~32% on income above threshold.
  // National state tax: 20% on income above ~SEK 598,500 (2024).
  // No joint filing. Social insurance not modeled (employer-side).
  // -------------------------------------------------------------------------
  SE: ({ annualIncome }) => {
    if (annualIncome <= 0) {
      return {
        effectiveRate: 0,
        model: "progressive-country",
        confidence: "simplified",
        label: "Sweden income tax (2024)",
        missingFactor: "Jobbskatteavdrag (earned income credit) not modelled.",
        note: "Enter income to calculate.",
      };
    }

    const basicAllowance = 36500;
    const taxable = Math.max(0, annualIncome - basicAllowance);

    const municipalRate = 0.3237;
    const municipalTax = taxable * municipalRate;

    const nationalThreshold = 598500;
    const nationalTax = Math.max(0, taxable - nationalThreshold) * 0.20;

    const totalTax = municipalTax + nationalTax;
    const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0;

    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Sweden municipal + national income tax (2024)",
      missingFactor: "Jobbskatteavdrag (earned income credit) not modelled — may overstate by 3–5 pp.",
      note: "Municipal average (32.37%) and national threshold (SEK 598,500) are correct for 2024. Key omission: the jobbskatteavdrag (earned income tax credit) reduces income tax for employed residents — it is income-dependent and can be worth SEK 20,000–35,000/yr, meaning this model overstates effective income tax on employment income by roughly 3–5 pp at mid-range incomes. Municipal rates vary: Stockholm 29.83%, Gothenburg 32.35%. Income must be passed in SEK.",
    };
  },

  // -------------------------------------------------------------------------
  // NORWAY — NOK
  // 2024 rates. Ordinary income tax 22% flat + bracket tax (trinnskatt).
  // No joint filing. Personal deduction (personfradrag): NOK 88,250.
  // -------------------------------------------------------------------------
  NO: ({ annualIncome, isRetired }) => {
    if (annualIncome <= 0) return { effectiveRate: 0, model: "progressive-country", confidence: isRetired ? "partial" : "simplified", label: "Norway income tax (2024)", missingFactor: "", note: "Enter income to calculate." };

    const personalDeduction = 88250;
    const taxable = Math.max(0, annualIncome - personalDeduction);

    // Ordinary income (alminnelig inntekt) tax: 22%
    const ordinaryTax = taxable * 0.22;

    // Bracket tax (trinnskatt) on gross personal income (not after deduction)
    const bracketTax = progressiveTax(annualIncome, [
      { upTo: 208050, rate: 0.00 },
      { upTo: 292850, rate: 0.017 },
      { upTo: 670000, rate: 0.04 },
      { upTo: 937900, rate: 0.136 },
      { upTo: 1350000, rate: 0.166 },
      { upTo: Infinity, rate: 0.176 },
    ]) * annualIncome;

    const totalTax = ordinaryTax + bracketTax;
    const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0;

    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: isRetired ? "partial" : "simplified",
      label: "Norway ordinary income + bracket tax (2024)",
      missingFactor: isRetired ? "Standard deduction (minstefradrag) not applied — slight overstatement." : "Employee National Insurance (7.9%) not included — adds ~6–7 pp for workers.",
      note: "Structure is correct: 22% ordinary income tax on income after personal deduction (NOK 88,250) plus bracket tax (trinnskatt) on gross income. Main omission: employee National Insurance contribution (7.9% on income above NOK 69,650) — this adds approximately 6–7 pp to the effective rate for employed residents. Standard deduction (minstefradrag, 46% of income up to NOK 109,950) is not applied here and would reduce income tax somewhat. Income must be passed in NOK.",
    };
  },

  // -------------------------------------------------------------------------
  // FINLAND — EUR
  // 2024 state + average municipal tax.
  // State progressive + municipal average ~21.5% + health insurance premium ~1.5%.
  // No joint filing.
  // -------------------------------------------------------------------------
  FI: ({ annualIncome }) => {
    // 2024 Finnish state (valtionvero) brackets
    const stateRate = progressiveTax(annualIncome, [
      { upTo: 22900, rate: 0.00 },
      { upTo: 33900, rate: 0.1264 },
      { upTo: 49500, rate: 0.19 },
      { upTo: 91300, rate: 0.3025 },
      { upTo: 150000, rate: 0.34 },
      { upTo: Infinity, rate: 0.355 },
    ]);

    // Municipal tax: average ~21.5% (varies commune to commune)
    const municipalRate = 0.215;
    // Health insurance premium contribution: ~1.5% on earned income
    const healthRate = 0.015;

    const effectiveRate = stateRate + municipalRate + healthRate;

    return {
      effectiveRate: clampRate(effectiveRate),
      model: "country-plus-local",
      confidence: "simplified",
      label: "Finland state + municipal + health insurance (2024)",
      missingFactor: "Municipal rate varies 18–23%; employee pension contributions (~7.15%) not included.",
      note: "State brackets are 2024 figures. Municipal average (21.5%) and health insurance premium (1.5%) are correctly applied. Key gaps: municipal rates span 18% (Helsinki) to 23%+ in some rural municipalities — a 5 pp spread on a large portion of income. Employee pension (TyEL, ~7.15%) and unemployment (0.79%) contributions are not modelled. The earned income deduction (ansiotulovähennys) and work income tax credit would reduce effective rates for employed residents, meaning this model somewhat overstates income tax on employment income. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // POLAND — PLN
  // 2024 PIT. Free amount PLN 30,000. Joint income splitting for married.
  // Social/health contributions: ~23% working; not on pension income.
  // -------------------------------------------------------------------------
  PL: ({ annualIncome, filing, isRetired }) => {
    const freeAmount = 30000;
    const taxablePerUnit = filing === "married"
      ? Math.max(0, annualIncome / 2 - freeAmount)
      : Math.max(0, annualIncome - freeAmount);

    const ratePerUnit = progressiveTax(taxablePerUnit, [
      { upTo: 120000, rate: 0.12 },
      { upTo: Infinity, rate: 0.32 },
    ]);

    const taxPerUnit = ratePerUnit * taxablePerUnit;
    const totalIncomeTax = filing === "married" ? taxPerUnit * 2 : taxPerUnit;
    const incomeTaxRate = annualIncome > 0 ? totalIncomeTax / annualIncome : 0;

    // Social + health contributions (~23% combined employee share on working income)
    const socialOverlay = isRetired ? 0 : 0.23;

    return {
      effectiveRate: clampRate(incomeTaxRate + socialOverlay),
      model: "progressive-country",
      confidence: isRetired ? "partial" : "simplified",
      label: "Poland PIT + social contributions (2024)",
      missingFactor: isRetired ? "Free amount (PLN 30,000) applied; pension income modelled simply." : "Health contribution (składka zdrowotna, 9%) changed under 2022 reform — complex interaction with income tax.",
      note: "PIT brackets and PLN 30,000 free amount are correct. The ~23% social/health overlay is a rough composite — the actual breakdown is: ZUS pension 9.76%, disability 1.5%, sickness 2.45%, health contribution (składka zdrowotna) 9% with no cap. The health contribution changed significantly in 2022 (Polski Ład reform) and is no longer deductible from income tax — this is a major source of real-world complexity not captured here. Result could be off by 3–6 pp depending on income level and contribution base. Income must be passed in PLN.",
    };
  },

  // -------------------------------------------------------------------------
  // CZECH REPUBLIC — CZK
  // 2024: 15% on income up to 36× average wage (~CZK 1,582,812); 23% above.
  // Social + health contributions: ~11% employee share on working income.
  // -------------------------------------------------------------------------
  CZ: ({ annualIncome, isRetired }) => {
    // 2024 threshold: 36× average monthly wage (approx CZK 43,967/mo)
    const higherRateThreshold = 1582812;
    const baseTax = Math.min(annualIncome, higherRateThreshold) * 0.15
      + Math.max(0, annualIncome - higherRateThreshold) * 0.23;
    const incomeTaxRate = annualIncome > 0 ? baseTax / annualIncome : 0;

    // Employee social + health: ~6.5% social + 4.5% health = 11%
    const socialOverlay = isRetired ? 0 : 0.11;

    return {
      effectiveRate: clampRate(incomeTaxRate + socialOverlay),
      model: "flat",
      confidence: "simplified",
      label: "Czech Republic PIT (15%/23%) + social contributions (2024)",
      missingFactor: "Health and social bases differ; non-taxable base not applied at lower incomes.",
      note: "Income tax rates and 2024 threshold are correct. The 11% social/health overlay is a composite: social insurance 6.5% and health 4.5% are correct rates but apply to different bases (health has no cap; social caps at 48× average wage ~CZK 2,110,416). The employee social base also excludes certain income types. Result is a reasonable ballpark but could be off by 1–3 pp depending on income composition. No joint filing. Income must be passed in CZK.",
    };
  },

  // -------------------------------------------------------------------------
  // HUNGARY — HUF
  // Flat 15% SZJA. No joint filing.
  // Social contributions: 18.5% working; not on pension income.
  // -------------------------------------------------------------------------
  HU: ({ annualIncome, isRetired }) => {
    const socialOverlay = isRetired ? 0 : 0.185;
    return {
      effectiveRate: clampRate(annualIncome > 0 ? 0.15 + socialOverlay : 0),
      model: "flat",
      confidence: "partial",
      label: "Hungary 15% SZJA flat + social contributions (2024)",
      missingFactor: "Flat rate is exact; family allowance credit for parents not modelled.",
      note: "The 15% flat SZJA rate is legislated and exact. Employee social contributions (18.5%: pension 10%, health services 7%, labour market 1.5%) are correctly applied to employment income and waived on pension. The family allowance (kedvezmény) credit for parents is not modelled. No joint filing. Income must be passed in HUF.",
    };
  },

  // -------------------------------------------------------------------------
  // GREECE — EUR
  // 2024 progressive income tax. Social contributions: ~13.87% working,
  // reduced rates on pension income (~6%).
  // No joint filing.
  // -------------------------------------------------------------------------
  GR: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 10000, rate: 0.09 },
      { upTo: 20000, rate: 0.22 },
      { upTo: 30000, rate: 0.28 },
      { upTo: 40000, rate: 0.36 },
      { upTo: Infinity, rate: 0.44 },
    ]);
    // Social contributions: ~13.87% employee share (working); ~6% on pensions
    const socialOverlay = isRetired ? 0.06 : 0.1387;

    return {
      effectiveRate: clampRate(rate + socialOverlay),
      model: "progressive-country",
      confidence: "simplified",
      label: "Greece income tax + social contributions (2024)",
      missingFactor: isRetired ? "Pension social contributions (~6%) included; solidarity surcharge not modelled." : "EFKA social contributions (~13.87%) included; solidarity surcharge (2.2–10%) not modelled.",
      note: "Brackets and social contribution rates are 2024 figures. Key gaps: the special solidarity contribution (εισφορά αλληλεγγύης) on incomes above €12,000 adds 2.2–10% in additional tax — not modelled. EFKA (social insurance) contributions have a monthly cap (~€6,500/mo) and different rates for self-employed vs employed. The 13.87% employee figure is the employed rate; self-employed pay a different graduated amount. Real effective rate for high earners or self-employed can differ significantly. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // TURKEY — TRY
  // 2024 brackets (revised annually for inflation — verify each year).
  // No joint filing.
  // -------------------------------------------------------------------------
  TR: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 158000, rate: 0.15 },
      { upTo: 330000, rate: 0.20 },
      { upTo: 800000, rate: 0.27 },
      { upTo: 4300000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "placeholder",
      label: "Turkey progressive income tax (2024 — thresholds unstable)",
      missingFactor: "Brackets revised mid-year for inflation — figure may be significantly outdated.",
      note: "⚠ Turkey's income tax brackets are revised annually and sometimes mid-year due to high inflation. These approximate 2024 thresholds may be significantly outdated. SGK employee social contributions (~14%: pension 9%, health 5%) are not included. Always verify current-year thresholds via the Turkish Revenue Administration (GİB) before using this for planning. This number should be treated as directional only. Income must be passed in TRY.",
    };
  },

  // -------------------------------------------------------------------------
  // CROATIA — EUR
  // 2024: Two-band national tax (20% / 30%). Surtax abolished Jan 2024.
  // Previously had local surtax up to 18% — removed from 2024.
  // -------------------------------------------------------------------------
  HR: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 50400, rate: 0.20 },
      { upTo: Infinity, rate: 0.30 },
    ]);
    // Surtax abolished from 1 January 2024 — rate now national only
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Croatia income tax (2024 — surtax abolished)",
      missingFactor: "Employee social contributions (~20%) not included.",
      note: "Brackets are correct: the local surtax (prireza) was abolished from 1 January 2024, so the national rate is now the complete income tax. Main omission: employee social contributions (~20% combined — pension pillar I 15%, pension pillar II 5%, health 16.5% — though health is employer-side) are not included. For a planning-level net income figure, the two national brackets are reliable. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // ESTONIA — EUR
  // 2024: Flat 20% income tax. From 2025 rises to 22%.
  // Social contributions: 1.6% unemployment + 2% funded pension (employee).
  // No joint filing.
  // -------------------------------------------------------------------------
  EE: ({ annualIncome, isRetired }) => {
    // Using 20% for 2024 (22% from Jan 2025 — noted)
    const flatRate = 0.20;
    // Employee social: ~3.6% (unemployment 1.6% + funded pension 2%)
    const socialOverlay = isRetired ? 0 : 0.036;
    return {
      effectiveRate: clampRate(annualIncome > 0 ? flatRate + socialOverlay : 0),
      model: "flat",
      confidence: "simplified",
      label: "Estonia flat income tax + contributions (2024/2025)",
      missingFactor: "Rate rises to 22% from Jan 2025; basic exemption not modelled at lower incomes.",
      note: "The flat rate is 20% for income earned in 2024, rising to 22% from 1 January 2025 — for forward-looking relocation planning the 22% figure is more relevant and should be used. Employee contributions (~3.6% — unemployment 1.6% + funded pension 2%) are correctly excluded for retirees. The basic exemption (up to €7,848/yr, tapering above €25,200) is not modelled — this understates take-home at lower incomes. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // LATVIA — EUR
  // 2024 progressive. Employee social: ~10.5% (pension 10% + unemployment 0.5%).
  // No joint filing.
  // -------------------------------------------------------------------------
  LV: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 20004, rate: 0.20 },
      { upTo: 78100, rate: 0.23 },
      { upTo: Infinity, rate: 0.31 },
    ]);
    const socialOverlay = isRetired ? 0 : 0.105;
    return {
      effectiveRate: clampRate(rate + socialOverlay),
      model: "progressive-country",
      confidence: "simplified",
      label: "Latvia progressive income tax + contributions (2024)",
      missingFactor: "Untaxed minimum (€3,744/yr) and health contribution (1.8%) not applied.",
      note: "Brackets are 2024 figures. Employee social contributions (10.5% composite: pension 10% + unemployment 0.5%) are correctly excluded for retirees. Key omission: the differentiated non-taxable minimum (up to €3,744/yr, tapering at higher incomes) is not applied — this understates take-home at lower to mid incomes. Health insurance contribution (1.8% employee) is also excluded. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // LITHUANIA — EUR
  // 2024 progressive. Threshold ~EUR 101,094 for standard bracket.
  // Employee social: ~19.5% (GPM +12.5% social), reduced on pension.
  // No joint filing.
  // -------------------------------------------------------------------------
  LT: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 101094, rate: 0.20 },
      { upTo: Infinity, rate: 0.32 },
    ]);
    // Employee social insurance ~12.52% (pension) + health 6.98% = ~19.5%
    const socialOverlay = isRetired ? 0 : 0.125;

    return {
      effectiveRate: clampRate(rate + socialOverlay),
      model: "progressive-country",
      confidence: "simplified",
      label: "Lithuania progressive income tax + contributions (2024)",
      missingFactor: "Full social package (~19.5% incl. health) understated at 12.5% here.",
      note: "Brackets are 2024 figures. The social overlay here uses only 12.5% (pension portion) — the full employee social package is approximately 19.5% including health insurance (6.98%), making this a material understatement of total deductions for employed residents. Non-taxable minimum (~€7,140/yr, income-tested) is also not applied. For a remote worker paying home-country social insurance, the income tax component alone may be the relevant figure. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // ROMANIA — RON
  // Flat 10% income tax. High social contributions: CAS 25% + CASS 10%
  // on gross (employee). Retired: CASS 10% health only on pension income.
  // No joint filing.
  // -------------------------------------------------------------------------
  RO: ({ annualIncome, isRetired }) => {
    // Working: CAS 25% pension + CASS 10% health + 10% income tax = 45% total
    // Retired: CASS 10% health + 10% income tax = 20% (simplified)
    const socialOverlay = isRetired ? 0.10 : 0.35;
    return {
      effectiveRate: clampRate(annualIncome > 0 ? 0.10 + socialOverlay : 0),
      model: "flat",
      confidence: "partial",
      label: "Romania 10% flat income tax + social contributions (2024)",
      missingFactor: "Social contributions (CAS 25% + CASS 10%) are explicitly modelled — main caveat is CASS floors/ceilings.",
      note: "The 10% flat income tax is exact. Social contributions are explicitly modelled: CAS 25% (pension) + CASS 10% (health) for working income; CASS 10% health only on pension. The combined rate is legislated and relatively stable. Main omission: CASS has a minimum floor (1× minimum wage, ~RON 3,300/yr) and a ceiling (60× minimum wage) — the ceiling affects very high earners only. No joint filing. Income must be passed in RON.",
    };
  },

  // -------------------------------------------------------------------------
  // BULGARIA — BGN
  // Flat 10% income tax — lowest in EU. Employee social: ~13.78%.
  // No joint filing.
  // -------------------------------------------------------------------------
  BG: ({ annualIncome, isRetired }) => {
    const socialOverlay = isRetired ? 0 : 0.1378;
    return {
      effectiveRate: clampRate(annualIncome > 0 ? 0.10 + socialOverlay : 0),
      model: "flat",
      confidence: "partial",
      label: "Bulgaria 10% flat income tax + social contributions (2024)",
      missingFactor: "Social contributions (~13.78%) not applied to pension income; ceiling applies.",
      note: "The 10% flat SZOD rate is legislated and exact. Employee social contributions (~13.78%: pension 12.9%, health 3.2%, unemployment 0.4% — employee share only) are correctly excluded for retirees. Social contributions have a monthly ceiling (~BGN 3,750/mo); above this only income tax applies. Annual revenue tax deduction (10% of gross for self-employed) is not modelled. Income must be passed in BGN.",
    };
  },

  // -------------------------------------------------------------------------
  // SLOVENIA — EUR
  // 2024 Dohodnina progressive. Slovenia introduced a new 6th bracket (50%)
  // above EUR 105,965 from 2024.
  // No joint filing.
  // -------------------------------------------------------------------------
  SI: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 9135, rate: 0.16 },
      { upTo: 27480, rate: 0.26 },
      { upTo: 54961, rate: 0.33 },
      { upTo: 82441, rate: 0.39 },
      { upTo: 105965, rate: 0.43 }, // 2023 bracket
      { upTo: Infinity, rate: 0.50 }, // New top bracket from 2024
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Slovenia Dohodnina (2024 — incl. new 50% top bracket)",
      missingFactor: "Employee social contributions (~22.1%) and general relief not included.",
      note: "Brackets are 2024 figures including the new 50% top bracket (introduced 2024). Key omission: employee social contributions total approximately 22.1% (pension 15.5%, health 6.36%, unemployment 0.14%, parental care 0.1%) — a major component of total deductions for employed residents, not modelled here. The general tax relief (splošna olajšava, up to €5,000/yr) is also not applied. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // SLOVAKIA — EUR
  // 2024: 19% up to EUR 47,537.98; 25% above.
  // Employee social + health: ~13.4%.
  // No joint filing.
  // -------------------------------------------------------------------------
  SK: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 47537.98, rate: 0.19 },
      { upTo: Infinity, rate: 0.25 },
    ]);
    // Employee: social 9.4% + health 4% = 13.4%
    const socialOverlay = isRetired ? 0 : 0.134;
    return {
      effectiveRate: clampRate(rate + socialOverlay),
      model: "progressive-country",
      confidence: "simplified",
      label: "Slovakia progressive income tax + contributions (2024)",
      missingFactor: "Health contributions (4%) uncapped; non-taxable base (€5,646) not applied.",
      note: "Income tax thresholds are 2024 figures. Employee contributions (social 9.4% + health 4%) are correctly excluded for retirees. Key nuance: health contributions (4%) have no ceiling; social contributions (9.4%) cap at a monthly assessment base of ~€9,128 (2024). Above this cap the social portion drops out, making the total burden lower for high earners than this model shows. The non-taxable base (€5,646.48/yr) is also not applied. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // MALTA — EUR
  // 2024: Real legislated separate single and married rate scales.
  // -------------------------------------------------------------------------
  MT: ({ annualIncome, filing }) => {
    const brackets =
      filing === "married"
        ? [
          { upTo: 12700, rate: 0.00 },
          { upTo: 21200, rate: 0.15 },
          { upTo: 28700, rate: 0.25 },
          { upTo: 60000, rate: 0.25 },
          { upTo: Infinity, rate: 0.35 },
        ]
        : [
          { upTo: 9100, rate: 0.00 },
          { upTo: 14500, rate: 0.15 },
          { upTo: 19500, rate: 0.25 },
          { upTo: 60000, rate: 0.25 },
          { upTo: Infinity, rate: 0.35 },
        ];
    return {
      effectiveRate: clampRate(progressiveTax(annualIncome, brackets)),
      model: "progressive-country",
      confidence: "partial",
      label: "Malta progressive income tax (2024 — separate scales)",
      missingFactor: "Social security contributions (~10%, capped) not modelled.",
      note: "Both single and married tax scales are the legislated 2024 Malta IRD figures and are exact. Social security contributions (~10% employee, capped at a weekly maximum of ~€29.70) add a modest fixed amount at most income levels — not modelled. Malta's Global Residence Programme and Nomad Residence Permit do not change the income tax rate; standard scales apply. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // CYPRUS — EUR
  // 2024 progressive. No joint filing.
  // GHS (GESY) health levy: 2.65% on working income; 1.7% on pension.
  // -------------------------------------------------------------------------
  CY: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 19500, rate: 0.00 },
      { upTo: 28000, rate: 0.20 },
      { upTo: 36300, rate: 0.25 },
      { upTo: 60000, rate: 0.30 },
      { upTo: Infinity, rate: 0.35 },
    ]);
    // GHS (GESY) contribution: 2.65% working, 1.7% pension
    const ghsRate = isRetired ? 0.017 : 0.0265;
    return {
      effectiveRate: clampRate(rate + ghsRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Cyprus income tax + GHS contribution (2024)",
      missingFactor: "Special Defence Contribution (SDC) on dividends/interest not included.",
      note: "Income tax brackets and GHS (GESY) rates are 2024 figures correctly applied. Key omission: the Special Defence Contribution (SDC) applies to Cyprus tax residents on passive income — dividends (17%), interest (30%), rents (2.25% on 75% of gross). For retirees or remote workers with significant investment/rental income this is a material gap. Cyprus non-domicile status (non-dom) exempts SDC on dividends and interest for 17 years — not modelled. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // PANAMA — USD
  // 2024 progressive. Territorial system — foreign-source income not taxed.
  // No joint filing.
  // -------------------------------------------------------------------------
  PA: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 11000, rate: 0.00 },
      { upTo: 50000, rate: 0.15 },
      { upTo: Infinity, rate: 0.25 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Panama income tax (2024 — territorial system)",
      missingFactor: "Foreign-source income generally not taxed — this estimate may not apply.",
      note: "Brackets are 2024 figures and simple enough to be reliably modelled. Most important planning note: Panama's territorial system means foreign-sourced income (remote salaries paid by a non-Panamanian employer for work performed outside Panama) is generally not taxed in Panama at all — making this estimate irrelevant for most remote workers. Social security contributions (~9.75% employee up to a monthly ceiling) are not included. Income in USD.",
    };
  },

  // -------------------------------------------------------------------------
  // COLOMBIA — COP
  // 2024 UVT-based brackets. UVT value COP 47,065 (2024).
  // No joint filing.
  // -------------------------------------------------------------------------
  CO: ({ annualIncome }) => {
    const uvtValue = 47065;
    const incomeUVT = annualIncome / uvtValue;

    const taxUVT = progressiveTax(incomeUVT, [
      { upTo: 1090, rate: 0.00 },
      { upTo: 1700, rate: 0.19 },
      { upTo: 4100, rate: 0.28 },
      { upTo: 8670, rate: 0.33 },
      { upTo: 18970, rate: 0.35 },
      { upTo: 31000, rate: 0.37 },
      { upTo: Infinity, rate: 0.39 },
    ]) * incomeUVT;

    const effectiveRate = incomeUVT > 0 ? taxUVT / incomeUVT : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Colombia UVT-based income tax (2024)",
      missingFactor: "Employment income deduction (25% up to 2,880 UVT) not applied.",
      note: "UVT brackets are 2024 figures (UVT COP 47,065). Key omission: employee health (4%) and pension (4% employee / 12% employer) contributions add approximately 8% to the total burden for locally-employed residents — not modelled. The large personal deduction (25% of net income up to 2,880 UVT) for employment income is also not applied, meaning this model overstates income tax for employees. For remote workers paying foreign social contributions, income tax alone is the relevant figure. Income must be passed in COP.",
    };
  },

  // -------------------------------------------------------------------------
  // BRAZIL — BRL
  // 2024 IRPF brackets (updated May 2024 — new exemption thresholds).
  // No joint filing. Pension income deduction for 65+.
  // -------------------------------------------------------------------------
  BR: ({ annualIncome, isRetired }) => {
    // From May 2024: monthly exemption BRL 2,824 (annual ~BRL 33,888)
    const pensionDeduction = isRetired ? 33888 : 0;
    const taxable = Math.max(0, annualIncome - pensionDeduction);

    // 2024 IRPF brackets (effective from May 2024)
    const rate = progressiveTax(taxable, [
      { upTo: 33888, rate: 0.00 },
      { upTo: 45012, rate: 0.075 },
      { upTo: 55976, rate: 0.15 },
      { upTo: 82596, rate: 0.225 },
      { upTo: Infinity, rate: 0.275 },
    ]);

    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Brazil IRPF (2024 — updated May 2024 thresholds)",
      missingFactor: "INSS contributions (7.5–14% on a progressive schedule) not included.",
      note: "IRPF brackets are the May 2024 revised figures. Retirees 65+ receive the correct pension deduction (~BRL 33,888/yr). Key omission: INSS (social security) contributions for employed residents range from 7.5% to 14% on a progressive schedule, capped at BRL 908/mo — a significant deduction for mid-income earners not modelled here. Brazil also has a large system of deductions (dependents, education, health expenses) that materially reduce taxable income for many filers. Income must be passed in BRL.",
    };
  },

  // -------------------------------------------------------------------------
  // ARGENTINA — ARS
  // Progressive brackets. Updated frequently due to inflation — approximate 2024.
  // Retired: approximate pension exemption threshold.
  // -------------------------------------------------------------------------
  AR: ({ annualIncome, isRetired }) => {
    // 2024 approximate thresholds (highly inflation-adjusted — verify annually)
    const pensionExemption = isRetired ? 1800000 : 0;
    const taxable = Math.max(0, annualIncome - pensionExemption);

    const rate = progressiveTax(taxable, [
      { upTo: 419253, rate: 0.05 },
      { upTo: 838506, rate: 0.09 },
      { upTo: 1257759, rate: 0.12 },
      { upTo: 1677012, rate: 0.15 },
      { upTo: 2514769, rate: 0.19 },
      { upTo: 3354259, rate: 0.23 },
      { upTo: 5031388, rate: 0.27 },
      { upTo: 6708518, rate: 0.31 },
      { upTo: Infinity, rate: 0.35 },
    ]);

    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "placeholder",
      label: "Argentina Impuesto a las Ganancias (approx. 2024)",
      missingFactor: "Brackets updated quarterly for inflation — this figure is likely outdated.",
      note: "Argentina's tax brackets are updated very frequently due to inflation — these are approximate 2024 figures and will be outdated. Always verify current-year thresholds via AFIP. Retirees: approximate pension exemption threshold applied. Income must be passed in ARS.",
    };
  },

  // -------------------------------------------------------------------------
  // CHILE — CLP
  // 2024 UTM-based brackets. UTM value CLP 67,294 (2024).
  // No joint filing.
  // -------------------------------------------------------------------------
  CL: ({ annualIncome }) => {
    const utmValue = 67294;
    const incomeUTM = annualIncome / utmValue;

    const taxUTM = progressiveTax(incomeUTM, [
      { upTo: 13.5, rate: 0.00 },
      { upTo: 30, rate: 0.04 },
      { upTo: 50, rate: 0.08 },
      { upTo: 70, rate: 0.135 },
      { upTo: 90, rate: 0.23 },
      { upTo: 120, rate: 0.304 },
      { upTo: 150, rate: 0.355 },
      { upTo: Infinity, rate: 0.40 },
    ]) * incomeUTM;

    const effectiveRate = incomeUTM > 0 ? taxUTM / incomeUTM : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Chile UTM-based income tax (2024)",
      missingFactor: "Employment income deduction (up to 30%) not applied — overstates employee tax.",
      note: "UTM brackets are 2024 figures. Key omission: employment income receives a deduction of up to 30% (capped at 8 UTM/mo) — not modelled, meaning this estimate overstates income tax for employees. AFP mandatory pension contributions (~10% employee, treated as a savings mechanism) are separately deducted before the tax base in practice but excluded here. The net result for an employee can be meaningfully lower than shown. Income must be passed in CLP.",
    };
  },

  // -------------------------------------------------------------------------
  // PERU — PEN
  // 2024 UIT-based brackets. UIT value PEN 5,150 (2024).
  // No joint filing.
  // -------------------------------------------------------------------------
  PE: ({ annualIncome }) => {
    const uitValue = 5150;
    const incomeUIT = annualIncome / uitValue;

    const taxUIT = progressiveTax(incomeUIT, [
      { upTo: 5, rate: 0.08 },
      { upTo: 20, rate: 0.14 },
      { upTo: 35, rate: 0.17 },
      { upTo: 45, rate: 0.20 },
      { upTo: Infinity, rate: 0.30 },
    ]) * incomeUIT;

    const effectiveRate = incomeUIT > 0 ? taxUIT / incomeUIT : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Peru UIT-based income tax (2024)",
      missingFactor: "7 UIT employment deduction (~PEN 36,050) not applied — overstates employee tax.",
      note: "UIT brackets are 2024 figures (UIT PEN 5,150). Key omission: employment income receives a deduction of 7 UIT (~PEN 36,050/yr) before the progressive scale applies — not modelled, so this estimate overstates income tax for employees, particularly at lower incomes. EsSalud health contributions are employer-only (~9%) and do not reduce employee take-home. Income must be passed in PEN.",
    };
  },

  // -------------------------------------------------------------------------
  // THAILAND — THB
  // 2024 progressive PIT. Personal allowance THB 60,000 + earned income
  // deduction (50% of income up to THB 100,000 max). No joint filing.
  // -------------------------------------------------------------------------
  TH: ({ annualIncome }) => {
    // Personal + employment deductions: up to ~THB 160,000 simplified
    const deductions = Math.min(annualIncome * 0.5, 100000) + 60000;
    const taxable = Math.max(0, annualIncome - deductions);

    const rate = progressiveTax(taxable, [
      { upTo: 150000, rate: 0.00 },
      { upTo: 300000, rate: 0.05 },
      { upTo: 500000, rate: 0.10 },
      { upTo: 750000, rate: 0.15 },
      { upTo: 1000000, rate: 0.20 },
      { upTo: 2000000, rate: 0.25 },
      { upTo: 5000000, rate: 0.30 },
      { upTo: Infinity, rate: 0.35 },
    ]);

    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Thailand PIT (2024 — with standard deductions)",
      missingFactor: "Foreign-income remittance rules changed Jan 2024 — treatment depends on timing.",
      note: "Brackets and standard deductions are 2024 figures. Critical planning caveat: Thailand shifted to taxing foreign-source income remitted to Thailand from 1 January 2024, regardless of the year it was earned. Previously, income earned in a prior year and remitted later was exempt. This change significantly affects remote workers and investors — the actual tax treatment depends on your specific income type, residency status (≥180 days), and remittance timing in ways this model cannot capture. Income must be passed in THB.",
    };
  },

  // -------------------------------------------------------------------------
  // VIETNAM — VND
  // 2024 progressive. Annual personal allowance VND 132M, dependent VND 52.8M.
  // No joint filing.
  // -------------------------------------------------------------------------
  VN: ({ annualIncome }) => {
    const personalAllowance = 132000000;
    const taxable = Math.max(0, annualIncome - personalAllowance);

    const rate = progressiveTax(taxable, [
      { upTo: 60000000, rate: 0.05 },
      { upTo: 120000000, rate: 0.10 },
      { upTo: 216000000, rate: 0.15 },
      { upTo: 384000000, rate: 0.20 },
      { upTo: 624000000, rate: 0.25 },
      { upTo: 960000000, rate: 0.30 },
      { upTo: Infinity, rate: 0.35 },
    ]);

    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Vietnam PIT (2024)",
      missingFactor: "Social insurance (~10.5% combined) and dependent relief not modelled.",
      note: "Brackets and personal allowance (VND 132M/yr) are 2024 figures. Key gaps: employee social insurance (~10.5% combined: social 8%, health 1.5%, unemployment 1%) is a significant deduction for locally-employed residents — not modelled. Dependent relief (VND 52.8M per dependent) is also excluded, which understates take-home for families. For remote workers maintaining foreign employment contracts, Vietnam PIT exposure depends on the tax treaty with your home country and actual days of residency. Income must be passed in VND.",
    };
  },

  // -------------------------------------------------------------------------
  // MALAYSIA — MYR
  // 2024 progressive. Each spouse files separately — no joint filing.
  // Employee EPF: 11% (compulsory, partly savings — not modeled).
  // -------------------------------------------------------------------------
  MY: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 5000, rate: 0.00 },
      { upTo: 20000, rate: 0.01 },
      { upTo: 35000, rate: 0.03 },
      { upTo: 50000, rate: 0.06 },
      { upTo: 70000, rate: 0.11 },
      { upTo: 100000, rate: 0.19 },
      { upTo: 400000, rate: 0.25 },
      { upTo: 600000, rate: 0.26 },
      { upTo: 2000000, rate: 0.28 },
      { upTo: Infinity, rate: 0.30 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Malaysia income tax (2024)",
      missingFactor: "Personal relief system (potentially MYR 20–30k deductible) not modelled.",
      note: "Brackets are 2024 figures and structurally correct. Key omission: Malaysia has an extensive personal relief system — individual relief MYR 9,000, lifestyle relief MYR 2,500, EPF contributions relief up to MYR 4,000, medical relief up to MYR 10,000, and others — that can reduce taxable income by MYR 20,000–30,000+ for most residents, potentially dropping the effective rate by 3–6 pp at mid-range incomes. SOCSO (1.75% employee) and EIS (0.4% employee) add modestly but are capped. Income must be passed in MYR.",
    };
  },

  // -------------------------------------------------------------------------
  // INDONESIA — IDR
  // 2024 PPh Orang Pribadi progressive brackets.
  // No joint filing (per-NPWP individual).
  // -------------------------------------------------------------------------
  ID: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 60000000, rate: 0.05 },
      { upTo: 250000000, rate: 0.15 },
      { upTo: 500000000, rate: 0.25 },
      { upTo: 5000000000, rate: 0.30 },
      { upTo: Infinity, rate: 0.35 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Indonesia PPh income tax (2024)",
      missingFactor: "PTKP non-taxable threshold (IDR 54M/yr) not applied — overstates at lower incomes.",
      note: "Brackets are 2024 figures. Key omission: the PTKP (Penghasilan Tidak Kena Pajak) non-taxable threshold of IDR 54M/yr for a single individual is not applied — meaning this model overstates income tax at lower incomes by the equivalent of IDR 54M taxed at the first bracket rate. BPJS health (1% employee) and employment contributions are also excluded. For high incomes where the PTKP is a small fraction, the estimate is reasonably accurate. Income must be passed in IDR.",
    };
  },

  // -------------------------------------------------------------------------
  // SOUTH AFRICA — ZAR
  // 2024-25 SARS progressive. Primary rebate: ZAR 17,235 (ZAR 26,679 for 65+).
  // No joint filing.
  // -------------------------------------------------------------------------
  ZA: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 237100, rate: 0.18 },
      { upTo: 370500, rate: 0.26 },
      { upTo: 512800, rate: 0.31 },
      { upTo: 673000, rate: 0.36 },
      { upTo: 857900, rate: 0.39 },
      { upTo: 1817000, rate: 0.41 },
      { upTo: Infinity, rate: 0.45 },
    ]);
    // 2024-25 rebates: primary ZAR 17,235; secondary (65+) additional ZAR 9,444
    const rebateZAR = isRetired ? (17235 + 9444) : 17235;
    const rebateRate = annualIncome > 0 ? rebateZAR / annualIncome : 0;

    return {
      effectiveRate: clampRate(Math.max(0, rate - rebateRate)),
      model: "progressive-country",
      confidence: "simplified",
      label: "South Africa SARS income tax + rebate (2024-25)",
      missingFactor: "Medical scheme credits and retirement fund deduction (up to 27.5%) not included.",
      note: "Brackets and rebates (primary ZAR 17,235; secondary ZAR 9,444 for 65+) are correct 2024-25 SARS figures — the rebates are a real strength of this model. Key omissions: medical scheme tax credits (MTC) reduce tax by ZAR 364/mo for the primary member, which is meaningful at lower incomes. UIF (1% employee, capped at UIF benefit ceiling) is also excluded. The retirement fund deduction (up to 27.5% of taxable income, max ZAR 350,000/yr) can substantially reduce taxable income for contributing residents. Income must be passed in ZAR.",
    };
  },
EC: ({ annualIncome, isRetired }) => {
  if (isRetired && annualIncome < 14000) {
    return {
      effectiveRate: 0,
      model: "progressive-country",
      confidence: "simplified",
      label: "Ecuador IR — below taxable threshold",
      missingFactor: "IESS social security for foreign residents not modelled.",
      note: "Retirement income below Ecuador's basic deduction threshold (~$11,722/yr). Zero income tax modelled. Ecuador is dollarized — no FX complexity. Verify residency-based tax treatment with a local advisor.",
    };
  }
  const brackets = [
    { upTo: 11722,    rate: 0 },
    { upTo: 14930,    rate: 0.05 },
    { upTo: 19670,    rate: 0.10 },
    { upTo: 26330,    rate: 0.12 },
    { upTo: 35080,    rate: 0.15 },
    { upTo: 46750,    rate: 0.20 },
    { upTo: 62330,    rate: 0.25 },
    { upTo: 83120,    rate: 0.30 },
    { upTo: Infinity, rate: 0.35 },
  ];
  const rate = progressiveTax(annualIncome, brackets);
  return {
    effectiveRate: clampRate(rate),
    model: "progressive-country",
    confidence: "simplified",
    label: "Ecuador IR — progressive (simplified, 2024 brackets)",
    missingFactor: "IESS social security contributions for foreign residents not modelled.",
    note: `Effective rate ${(clampRate(rate) * 100).toFixed(1)}%. Ecuador is dollarized — no FX conversion needed. 2024 IR brackets applied with basic personal deduction of ~$11,722/yr. IESS social security contributions for foreign residents vary by residency type and are not modelled. Verify with a local tax advisor.`,
  };
},

UY: ({ annualIncome, isRetired }) => {
  if (isRetired) {
    return {
      effectiveRate: 0.06,
      model: "flat",
      confidence: "simplified",
      label: "Uruguay IRPF — retirement income (simplified estimate)",
      missingFactor: "7-year territorial exemption for new residents not modelled — may reduce rate to 0%.",
      note: "Simplified flat 6% effective rate applied for retirement income. New tax residents may qualify for a 7-year territorial income exemption on foreign-source income — a major planning consideration. Verify eligibility with a local advisor.",
    };
  }
  const brackets = [
    { upTo: 9000,     rate: 0 },
    { upTo: 16000,    rate: 0.10 },
    { upTo: 28000,    rate: 0.15 },
    { upTo: 48000,    rate: 0.24 },
    { upTo: 75000,    rate: 0.25 },
    { upTo: 110000,   rate: 0.27 },
    { upTo: Infinity, rate: 0.31 },
  ];
  const rate = progressiveTax(annualIncome, brackets);
  return {
    effectiveRate: clampRate(rate),
    model: "progressive-country",
    confidence: "simplified",
    label: "Uruguay IRPF — progressive (simplified, USD-equivalent brackets)",
    missingFactor: "FONASA/BPS social contributions (~15–18%) not included; 7-year territorial exemption may apply.",
    note: `Effective rate ${(clampRate(rate) * 100).toFixed(1)}%. Brackets converted to approximate USD at 39.5 UYU/USD. FONASA health and BPS social security contributions (~15–18% on employment income) are not modelled. New residents may qualify for a 7-year territorial tax exemption on foreign-source income. Verify with a local advisor.`,
  };
},

PY: ({ annualIncome, isRetired }) => {
  if (isRetired) {
    return {
      effectiveRate: 0,
      model: "flat",
      confidence: "simplified",
      label: "Paraguay IRP — retirement income (territorial system)",
      missingFactor: "Territorial system means foreign pension income generally not taxed in Paraguay.",
      note: "Paraguay taxes only Paraguay-source income. Foreign pension and retirement income is generally not subject to IRP for resident individuals. Effective rate modelled as 0%. Verify your specific situation with a local advisor.",
    };
  }
  const THRESHOLD = 12000;
  if (annualIncome <= THRESHOLD) {
    return {
      effectiveRate: 0,
      model: "flat",
      confidence: "simplified",
      label: "Paraguay IRP — below threshold",
      missingFactor: "Territorial system means foreign-source remote salary typically not taxed at all.",
      note: "Income below Paraguay's IRP personal deduction threshold (~$12,000/yr). Zero tax modelled. Paraguay also taxes only Paraguay-source income — remote workers retaining a foreign salary typically owe zero Paraguayan income tax regardless of income level.",
    };
  }
  const tax = (annualIncome - THRESHOLD) * 0.10;
  const effectiveRate = clampRate(annualIncome > 0 ? tax / annualIncome : 0);
  return {
    effectiveRate,
    model: "flat",
    confidence: "simplified",
    label: "Paraguay IRP — flat 10% above threshold (simplified)",
    missingFactor: "Territorial system: foreign-source remote salary likely not taxed — this models local-source income only.",
    note: `Effective rate ${(effectiveRate * 100).toFixed(1)}%. Paraguay's IRP is a flat 10% on income above ~$12,000/yr. Critically: Paraguay taxes only Paraguay-source income. If you retain a foreign remote salary, your effective Paraguayan rate is likely 0% — this model assumes local-source income for conservatism. Verify with a local advisor.`,
  };
},

BO: ({ annualIncome, isRetired }) => {
  if (isRetired) {
    return {
      effectiveRate: 0.05,
      model: "flat",
      confidence: "placeholder",
      label: "Bolivia RC-IVA — retirement income (simplified estimate)",
      missingFactor: "Bolivia's RC-IVA system is non-standard — retirement and foreign income treatment not well-documented.",
      note: "Simplified 5% effective rate applied for retirement income. Bolivia's tax system is non-standard — RC-IVA applies at 13% on net salary after deductions, but retirement and foreign-source income treatment varies significantly. Verify with a local advisor before planning.",
    };
  }
  if (annualIncome < 10000) {
    return {
      effectiveRate: 0.05,
      model: "flat",
      confidence: "placeholder",
      label: "Bolivia RC-IVA — lower income (simplified estimate)",
      missingFactor: "RC-IVA deductions for minimum wages and VAT receipts not modelled.",
      note: "Simplified 5% effective rate applied. Bolivia's RC-IVA is nominally 13% but deductions for minimum wages and VAT receipts significantly reduce effective liability at lower incomes. Foreign-source income treatment varies. Verify with a local advisor.",
    };
  }
  return {
    effectiveRate: 0.10,
    model: "flat",
    confidence: "placeholder",
    label: "Bolivia RC-IVA — simplified planning estimate",
    missingFactor: "RC-IVA is 13% flat on net salary after deductions — this is a conservative approximation.",
    note: "Simplified 10% effective rate applied. Bolivia uses RC-IVA (flat 13% on net salary after deductions for minimum wages and VAT receipts) rather than a standard progressive income tax. Foreign-source income, self-employment, and business income are treated differently. Verify with a local advisor.",
  };
},

GY: ({ annualIncome, isRetired }) => {
  const ALLOWANCE = 4593; // ~G$960,000/yr at 209 GYD/USD
  if (isRetired && annualIncome <= ALLOWANCE) {
    return {
      effectiveRate: 0,
      model: "progressive-country",
      confidence: "simplified",
      label: "Guyana income tax — below personal allowance",
      missingFactor: "NIS social insurance (~5.6%) not modelled.",
      note: "Income below Guyana's personal allowance threshold (~$4,593 USD). Zero income tax modelled. NIS social insurance contributions not modelled. Guyana is the only English-speaking country in South America. Verify with a local advisor.",
    };
  }
  const taxable = Math.max(0, annualIncome - ALLOWANCE);
  const BAND1_LIMIT = 11480 - ALLOWANCE; // ~G$2.4M total at 209 GYD/USD
  const tax = taxable <= BAND1_LIMIT
    ? taxable * 0.28
    : BAND1_LIMIT * 0.28 + (taxable - BAND1_LIMIT) * 0.40;
  const effectiveRate = clampRate(annualIncome > 0 ? tax / annualIncome : 0);
  return {
    effectiveRate,
    model: "progressive-country",
    confidence: "simplified",
    label: "Guyana income tax — progressive (simplified, USD-equivalent brackets)",
    missingFactor: "NIS employee contributions (~5.6%) not included.",
    note: `Effective rate ${(effectiveRate * 100).toFixed(1)}%. Two-rate system: 28% up to ~$11,480 USD, 40% above, after personal allowance of ~$4,593 USD. Brackets converted at 209 GYD/USD. NIS employee contributions (~5.6%) not modelled. Verify with a local advisor.`,
  };
},

SR: ({ annualIncome, isRetired }) => {
  if (isRetired) {
    return {
      effectiveRate: 0.06,
      model: "flat",
      confidence: "placeholder",
      label: "Suriname income tax — retirement income (simplified estimate)",
      missingFactor: "Suriname expat tax rules are not well-documented — treat as rough estimate.",
      note: "Simplified 6% effective rate applied for retirement income. Suriname's tax rules for foreign residents and retirees are not well-documented in mainstream expat resources. Treat as a rough planning estimate only. Verify with a local advisor.",
    };
  }
  const brackets = [
    { upTo: 5000,     rate: 0 },
    { upTo: 10000,    rate: 0.08 },
    { upTo: 18000,    rate: 0.18 },
    { upTo: 30000,    rate: 0.28 },
    { upTo: Infinity, rate: 0.38 },
  ];
  const rate = progressiveTax(annualIncome, brackets);
  return {
    effectiveRate: clampRate(rate),
    model: "progressive-country",
    confidence: "placeholder",
    label: "Suriname income tax — simplified progressive estimate",
    missingFactor: "Limited public expat tax data — brackets are approximate and may be outdated.",
    note: `Effective rate ${(clampRate(rate) * 100).toFixed(1)}%. Simplified brackets converted to approximate USD at 36.5 SRD/USD. Suriname has limited publicly available expat tax data — this is a planning estimate only. Social security contributions not modelled. Verify with a local advisor before making decisions.`,
  };
},

VE: ({ annualIncome, isRetired }) => {
  if (isRetired) {
    return {
      effectiveRate: 0.05,
      model: "flat",
      confidence: "placeholder",
      label: "Venezuela ISLR — simplified planning estimate only",
      missingFactor: "FX volatility and inflation make all Venezuelan figures unreliable.",
      note: "Venezuela's tax, FX, and economic environment makes all estimates highly unreliable. Simplified 5% flat rate applied. Exchange rate volatility and inflation can invalidate planning figures quickly. Verify all assumptions with an independent local advisor before making any decisions.",
    };
  }
  if (annualIncome < 15000) {
    return {
      effectiveRate: 0.06,
      model: "flat",
      confidence: "placeholder",
      label: "Venezuela ISLR — simplified planning estimate only",
      missingFactor: "FX volatility and inflation make all Venezuelan figures unreliable.",
      note: "Venezuela's tax, FX, and economic environment makes all estimates highly unreliable. Simplified flat rate applied. Do not use this for financial planning without independent local verification.",
    };
  }
  return {
    effectiveRate: 0.12,
    model: "flat",
    confidence: "placeholder",
    label: "Venezuela ISLR — simplified planning estimate only",
    missingFactor: "FX volatility and inflation make all Venezuelan figures unreliable.",
    note: "Simplified 12% flat estimate only. Venezuela's ISLR is nominally progressive but the real tax burden, FX situation, and policy environment change rapidly. Exchange rate volatility can make USD purchasing power estimates stale within weeks. Treat all Venezuela figures as illustrative only and verify independently.",
  };
},
  
};

// ---------------------------------------------------------------------------
// CONDITIONAL QUESTIONS
// ---------------------------------------------------------------------------

const COUNTRY_TAX_QUESTIONS: Record<string, ConditionalQuestion[]> = {
  PT: [
    {
      key: "pt_ifici",
      label: "Are you applying for the IFICI (formerly NHR) special tax regime?",
      helpText:
        "Portugal's IFICI regime offers a 20% flat rate on qualifying Portuguese-source income and broad exemptions on foreign-source income for eligible new residents.",
      when: { incomeScenario: ["remote"] },
      options: [
        { value: "yes", label: "Yes — applying for IFICI / NHR" },
        { value: "no", label: "No — standard progressive rates apply" },
        { value: "unsure", label: "Not sure yet" },
      ],
    },
  ],
  ES: [
    {
      key: "es_region",
      label: "Which autonomous community will you live in?",
      helpText:
        "Spain's 17 autonomous communities each set their own income tax rates on top of the national rate. Madrid has the lowest combined rates; Catalonia and Valencia have the highest. Selecting your region significantly improves accuracy.",
      when: { incomeScenario: ["local", "remote"] },
      options: [
        { value: "AN", label: "Andalusia" },
        { value: "AR", label: "Aragón" },
        { value: "AS", label: "Asturias" },
        { value: "IB", label: "Balearic Islands" },
        { value: "PV", label: "Basque Country (foral — approx.)" },
        { value: "CN", label: "Canary Islands" },
        { value: "CB", label: "Cantabria" },
        { value: "CL", label: "Castilla y León" },
        { value: "CM", label: "Castilla-La Mancha" },
        { value: "CT", label: "Catalonia" },
        { value: "CE", label: "Ceuta / Melilla (50% rebate applies)" },
        { value: "EX", label: "Extremadura" },
        { value: "GA", label: "Galicia" },
        { value: "RI", label: "La Rioja" },
        { value: "MD", label: "Madrid" },
        { value: "MC", label: "Murcia" },
        { value: "NC", label: "Navarre (foral — approx.)" },
        { value: "VC", label: "Valencia" },
      ],
    },
    {
      key: "es_beckham",
      label: "Are you eligible for the Beckham Law (Régimen de Impatriados)?",
      helpText:
        "Spain's Beckham Law applies a 24% flat rate on Spanish-source income up to €600k for qualifying inbound workers who haven't been Spanish residents in the prior 5 years.",
      when: { incomeScenario: ["remote", "local"] },
      options: [
        { value: "yes", label: "Yes — eligible for Beckham Law" },
        { value: "no", label: "No — standard progressive rates apply" },
        { value: "unsure", label: "Not sure yet" },
      ],
    },
  ],
  NL: [
    {
      key: "nl_30pct_ruling",
      label: "Do you qualify for the Netherlands 30% ruling?",
      helpText:
        "The 30% ruling allows qualifying expat employees to receive 30% of their salary as a tax-free allowance for up to 5 years. It requires employer sponsorship, a specific expertise requirement, and a minimum salary (€46,107 in 2024).",
      when: { incomeScenario: ["remote", "local"] },
      options: [
        { value: "yes", label: "Yes — employer has applied / will apply for the ruling" },
        { value: "no", label: "No — standard Box 1 rates apply" },
        { value: "unsure", label: "Not sure yet" },
      ],
    },
  ],
  IT: [
    {
      key: "it_region",
      label: "Which Italian region will you live in?",
      helpText:
        "Italy's 20 regions each set a regional income surtax (addizionale regionale) ranging from 1.23% (minimum, e.g. Basilicata, South Tyrol) to 3.33% (Lazio/Rome, Calabria). Selecting your region uses the exact rate instead of a 2% average.",
      options: [
        { value: "ABR", label: "Abruzzo (1.73%)" },
        { value: "BAS", label: "Basilicata (1.23% — minimum)" },
        { value: "CAL", label: "Calabria (3.33% — highest)" },
        { value: "CAM", label: "Campania (3.20%)" },
        { value: "EMR", label: "Emilia-Romagna (1.33%)" },
        { value: "FVG", label: "Friuli-Venezia Giulia (1.23%)" },
        { value: "LAZ", label: "Lazio — Rome (3.33% — highest)" },
        { value: "LIG", label: "Liguria (1.73%)" },
        { value: "LOM", label: "Lombardy — Milan (1.73%)" },
        { value: "MAR", label: "Marche (1.50%)" },
        { value: "MOL", label: "Molise (2.20%)" },
        { value: "PAB", label: "Bolzano / South Tyrol (1.23%)" },
        { value: "PAT", label: "Trentino (1.23%)" },
        { value: "PIE", label: "Piedmont (1.73%)" },
        { value: "PUG", label: "Puglia (2.30%)" },
        { value: "SAR", label: "Sardinia (1.73%)" },
        { value: "SIC", label: "Sicily (2.50%)" },
        { value: "TOS", label: "Tuscany — Florence (1.73%)" },
        { value: "UMB", label: "Umbria (1.73%)" },
        { value: "VDA", label: "Aosta Valley (1.23%)" },
        { value: "VEN", label: "Veneto — Venice (1.73%)" },
      ],
    },
    {
      key: "it_flat_tax",
      label: "Are you considering Italy's Flat Tax for New Residents (€100k regime)?",
      helpText:
        "Italy's Flat Tax for New Residents substitutes a fixed €100,000/yr tax for all foreign-source income taxes, regardless of amount. Relevant for high earners with significant foreign income moving to Italy.",
      when: { incomeScenario: ["remote"] },
      options: [
        { value: "yes", label: "Yes — modelling the €100k flat tax regime" },
        { value: "no", label: "No — standard IRPEF rates apply" },
        { value: "unsure", label: "Not sure yet" },
      ],
    },
  ],
  DE: [
    {
      key: "de_church_tax",
      label: "Are you registered with a church in Germany (Kirchensteuer applies)?",
      helpText:
        "Church tax (Kirchensteuer) is ~8–9% of your income tax liability and applies if you are a registered member of the Catholic or Protestant church. It is automatically deducted alongside income tax.",
      options: [
        { value: "yes", label: "Yes — church tax applies (~8.5% of income tax)" },
        { value: "no", label: "No — not a registered church member" },
        { value: "unsure", label: "Not sure" },
      ],
    },
  ],
  CA: [
    {
      key: "ca_province",
      label: "Which Canadian province or territory will you live in?",
      helpText:
        "Provincial income tax is the largest variable in Canadian tax planning. Quebec has the highest rates (~25.75% top marginal addition); Alberta has the lowest (~10%). Selecting your province makes this estimate significantly more accurate.",
      options: [
        { value: "AB", label: "Alberta" },
        { value: "BC", label: "British Columbia" },
        { value: "MB", label: "Manitoba" },
        { value: "NB", label: "New Brunswick" },
        { value: "NL", label: "Newfoundland and Labrador" },
        { value: "NS", label: "Nova Scotia" },
        { value: "NT", label: "Northwest Territories" },
        { value: "NU", label: "Nunavut" },
        { value: "ON", label: "Ontario" },
        { value: "PE", label: "Prince Edward Island" },
        { value: "QC", label: "Quebec" },
        { value: "SK", label: "Saskatchewan" },
        { value: "YT", label: "Yukon" },
      ],
    },
  ],
};

export function getConditionalQuestionsForCountry(
  countryCode: string,
  incomeScenario: IncomeScenario
): ConditionalQuestion[] {
  const questions = COUNTRY_TAX_QUESTIONS[countryCode] ?? [];
  return questions.filter((q) => {
    if (!q.when?.incomeScenario) return true;
    return q.when.incomeScenario.includes(incomeScenario);
  });
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export function estimateInternationalTax({
  countryCode,
  annualIncome,
  filing,
  isRetired,
  incomeScenario = isRetired ? "retired" : "local",
  answers = {},
}: EstimateInternationalTaxArgs): TaxEstimateResult {
  const estimator = TAX_ESTIMATORS[countryCode];

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

  return estimator({
    annualIncome,
    filing,
    isRetired,
    incomeScenario,
    answers,
  });
}

export function getTaxModelStatus(countryCode: string): {
  model: TaxModelKind;
  confidence: TaxConfidence;
  label: string;
  note: string;
  missingFactor: string;
} {
  const estimator = TAX_ESTIMATORS[countryCode];

  if (!estimator) {
    return {
      model: "placeholder",
      confidence: "placeholder",
      label: "Tax estimate unavailable",
      note: "No tax model is configured for this country yet.",
      missingFactor: "Tax model not configured for this country yet.",
    };
  }

  const sample = estimator({
    annualIncome: 50000,
    filing: "single",
    isRetired: false,
    incomeScenario: "local",
    answers: {},
  });

  return {
    model: sample.model,
    confidence: sample.confidence,
    label: sample.label,
    note: sample.note,
    missingFactor: sample.missingFactor,
  };
}