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
//   RO=RON, BG=EUR (euro since 2026-01-01), SI=EUR, SK=EUR, MT=EUR, CY=EUR, PA=USD, CO=COP,
//   BR=BRL, AR=ARS, CL=CLP, PE=PEN, TH=THB, VN=VND, MY=MYR, ID=IDR,
//   ZA=ZAR, AT=EUR, BE=EUR, PH=PHP, TW=TWD
//
// Last updated: 2025 tax year figures. Sources: IRS Rev. Proc. 2024-40 &
// OBBB amendments, HMRC 2024-25 tables, OECD Taxing Wages 2025, PwC
// Worldwide Tax Summaries, and each country's official tax authority.
// ---------------------------------------------------------------------------

import { FEDERAL_2026, PAYROLL_2026, FOREIGN_EARNED_INCOME_EXCLUSION_2026 } from "./taxYear2026";
import { USD_TO_LOCAL } from "./internationalFx";
import { AUSTRALIA_TAX_YEAR_LABEL, australiaTax } from "./countryTaxRules/australia";
import { AUSTRIA_TAX_YEAR_LABEL, austriaTax } from "./countryTaxRules/austria";
import { BELGIUM_TAX_YEAR_LABEL, belgiumTax } from "./countryTaxRules/belgium";
import { BRAZIL_TAX_YEAR_LABEL, brazilTax } from "./countryTaxRules/brazil";
import { BULGARIA_TAX_YEAR_LABEL, bulgariaTax } from "./countryTaxRules/bulgaria";
import { CANADA_PROVINCES, CANADA_TAX_YEAR_LABEL, canadaTax } from "./countryTaxRules/canada";
import { CHILE_TAX_YEAR_LABEL, chileTax } from "./countryTaxRules/chile";
import { COLOMBIA_TAX_YEAR_LABEL, colombiaTax } from "./countryTaxRules/colombia";
import { COSTA_RICA_TAX_YEAR_LABEL, costaRicaTax } from "./countryTaxRules/costaRica";
import { CROATIA_TAX_YEAR_LABEL, croatiaTax } from "./countryTaxRules/croatia";
import { CZECH_TAX_YEAR_LABEL, czechTax } from "./countryTaxRules/czechRepublic";
import { DENMARK_TAX_YEAR_LABEL, denmarkTax } from "./countryTaxRules/denmark";
import { ESTONIA_TAX_YEAR_LABEL, estoniaTax } from "./countryTaxRules/estonia";
import { FRANCE_TAX_YEAR_LABEL, franceTax } from "./countryTaxRules/france";
import { GERMANY_TAX_YEAR_LABEL, germanyTax } from "./countryTaxRules/germany";
import { GREECE_TAX_YEAR_LABEL, greeceTax } from "./countryTaxRules/greece";
import { IRELAND_TAX_YEAR_LABEL, irelandTax } from "./countryTaxRules/ireland";
import { ITALY_NEW_RESIDENT_FLAT_TAX, ITALY_TAX_YEAR_LABEL, italyTax } from "./countryTaxRules/italy";
import { JAPAN_TAX_YEAR_LABEL, japanTax } from "./countryTaxRules/japan";
import { INDONESIA_NOTE, INDONESIA_TAX_YEAR_LABEL, indonesiaTax } from "./countryTaxRules/indonesia";
import { LATVIA_TAX_YEAR_LABEL, latviaTax } from "./countryTaxRules/latvia";
import { MALAYSIA_TAX_YEAR_LABEL, malaysiaTax } from "./countryTaxRules/malaysia";
import { MALTA_TAX_YEAR_LABEL, maltaTax } from "./countryTaxRules/malta";
import { MEXICO_TAX_YEAR_LABEL, mexicoTax } from "./countryTaxRules/mexico";
import { NETHERLANDS_TAX_YEAR_LABEL, netherlandsTax } from "./countryTaxRules/netherlands";
import { NEW_ZEALAND_TAX_YEAR_LABEL, newZealandTax } from "./countryTaxRules/newZealand";
import { NORWAY_TAX_YEAR_LABEL, norwayTax } from "./countryTaxRules/norway";
import { LITHUANIA_TAX_YEAR_LABEL, lithuaniaTax } from "./countryTaxRules/lithuania";
import { GUYANA_TAX_YEAR_LABEL, guyanaTax } from "./countryTaxRules/guyana";

export type FilingStatus = "single" | "married";

export type IncomeScenario = "local" | "remote" | "retired";

export type TaxModelKind =
  | "none"
  | "progressive-country"
  | "country-plus-province"
  | "country-plus-local"
  | "flat"
  | "placeholder";

// Confidence rubric, used to drive UI badge colour and disclaimer text:
//
//  "verified", Brackets are legislative, filing logic is structurally
//                  correct, major credits/deductions modelled, result is
//                  within ~2-3 pp of a professional estimate for most incomes.
//                  Currently: AE (zero-tax, trivially exact).
//
//  "partial", Core national brackets are correct and current. The
//                  dominant structural components are modelled. One or two
//                  meaningful items are omitted (named explicitly in the note)
//                  but the gap is bounded and unlikely to exceed ~3-4 pp for
//                  most planning incomes.
//                  Countries: US, GB, AU, NZ, DK, NO, HR, HU, BG, MT,
//                             PA, RO, PT-IFICI, ES-Beckham.
//
//  "simplified", Structurally believable but at least one significant
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
//  "placeholder", Either thresholds change faster than we can reliably track
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
  // UNITED STATES, USD
  // 2025 tax year figures (IRS Rev. Proc. 2024-40 + OBBB amendments).
  // Standard deduction: $15,750 single / $31,500 MFJ (post-OBBB).
  // Social Security wage base 2025: $176,100.
  // Employee NI equivalents: SS 6.2% up to $176,100, Medicare 1.45%,
  // Additional Medicare 0.9% above $200k single / $250k MFJ.
  // Federal brackets are applied to TAXABLE income (after std deduction).
  // -------------------------------------------------------------------------
  US: ({ annualIncome, filing, isRetired }) => {
    // 2026 figures from IRS Rev. Proc. 2025-32 and Publication 15 (see taxYear2026.ts).
    const standardDeduction = FEDERAL_2026.standardDeduction[filing];
    const taxable = Math.max(0, annualIncome - standardDeduction);
    const federalTaxAmount = progressiveTax(taxable, FEDERAL_2026.brackets[filing]) * taxable;
    const federalEffectiveRate = annualIncome > 0 ? federalTaxAmount / annualIncome : 0;

    let payrollEffectiveRate = 0;
    if (!isRetired && annualIncome > 0) {
      const socialSecurityTax = Math.min(annualIncome, PAYROLL_2026.socialSecurityWageBase) * PAYROLL_2026.socialSecurityRate;
      const medicareTax = annualIncome * PAYROLL_2026.medicareRate;
      const additionalMedicareTax =
        Math.max(0, annualIncome - PAYROLL_2026.additionalMedicareThreshold[filing]) * PAYROLL_2026.additionalMedicareRate;
      payrollEffectiveRate = (socialSecurityTax + medicareTax + additionalMedicareTax) / annualIncome;
    }

    return {
      effectiveRate: clampRate(federalEffectiveRate + payrollEffectiveRate),
      model: "progressive-country",
      confidence: "partial",
      label: isRetired ? "US federal estimate (2026)" : "US federal + payroll estimate (2026)",
      missingFactor: "State income tax not included, adds 0–13% depending on state.",
      note: isRetired
        ? "Brackets and standard deduction are the 2026 IRS figures (Rev. Proc. 2025-32). State and local taxes are not included, these add 0–13% depending on state and can materially change the result."
        : "Brackets and standard deduction are the 2026 IRS figures (Rev. Proc. 2025-32). Payroll taxes included (Social Security 6.2% up to the $184,500 wage base, Medicare 1.45%, Additional Medicare 0.9% above the threshold). State and local taxes are not included, these add 0–13% depending on state and can materially change the result.",
    };
  },

  // -------------------------------------------------------------------------
  // UNITED KINGDOM, GBP
  // 2024-25 HMRC figures. Personal allowance £12,570.
  // Income tax: 20% basic (up to £50,270), 40% higher (£50,270–£125,140),
  //   45% additional (above £125,140). Personal allowance tapers to zero
  //   between £100,000–£125,140 (effective 60% rate in that band).
  // Employee Class 1 NI (2024-25): 8% on £12,570–£50,270, then 2% above.
  //   (Rate was cut from 12% → 10% Jan 2024, then → 8% Apr 2024.)
  // No NI on pension income. No joint filing, married = same as single.
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
  // PORTUGAL, EUR
  // 2024 IRS brackets (Continente). Conditional: IFICI / NHR special regime.
  // Key: answers.pt_ifici (note: calculator may also pass pt_nhr, both checked)
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
        note: "The IFICI flat rate (20% on qualifying Portuguese-source income) is well-defined in legislation. Main uncertainty: whether your specific income streams qualify, foreign employment, pension, and passive income each have different treatment. Confirm with a Portugal-licensed tax advisor before relying on this number.",
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
      missingFactor: "Personal deductions and household splitting not modelled, real rate is often lower.",
      note: "National brackets are current (2024 Continente). Not modelled: household income splitting (declaração conjunta), personal deductions (health, education, housing interest), solidarity surcharges above €80k, and Madeira/Azores rates. Real effective rate can be materially lower once deductions are applied.",
    };
  },

  // -------------------------------------------------------------------------
  // SPAIN, EUR
  // 2024 national (estatal) + autonomous community average overlay.
  // Conditional: Beckham Law (Régimen de Impatriados), answers.es_beckham
  // -------------------------------------------------------------------------
  ES: ({ annualIncome, filing, incomeScenario = "local", answers }) => {
    if ((incomeScenario === "remote" || incomeScenario === "local") && answers?.es_beckham === "yes") {
      // Beckham Law: 24% flat up to €600k, 47% flat on the excess (not 30%,
      // verified against current AEAT/Beckham Law guidance). Blend the two
      // bands into a single effective rate on total income.
      const taxOwed = annualIncome <= 600000
        ? annualIncome * 0.24
        : 600000 * 0.24 + (annualIncome - 600000) * 0.47;
      const effectiveRate = annualIncome > 0 ? taxOwed / annualIncome : 0;
      return {
        effectiveRate: clampRate(effectiveRate),
        model: "flat",
        confidence: "partial",
        label: "Spain Beckham Law planning estimate",
        missingFactor: "Eligibility requires employer sponsorship and formal AEAT application approval.",
        note: "The Beckham Law rate is legislated and well-defined: 24% flat up to €600k, 47% flat on the excess. Main uncertainty: eligibility requires employer sponsorship, non-residency in Spain for the prior 5 years, and formal application approval. Confirm eligibility with a Spanish tax advisor.",
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
      MD: [ // Madrid, most competitive
        { upTo: 12450, rate: 0.09 }, { upTo: 17707, rate: 0.12 },
        { upTo: 33007, rate: 0.14 }, { upTo: 53407, rate: 0.175 },
        { upTo: Infinity, rate: 0.205 },
      ],
      CT: [ // Catalonia, highest overall
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
      PV: [ // Basque Country (foral, own system, approximated)
        { upTo: 15450, rate: 0.07 }, { upTo: 25450, rate: 0.10 },
        { upTo: 35450, rate: 0.15 }, { upTo: 60450, rate: 0.20 },
        { upTo: 90450, rate: 0.22 }, { upTo: 180450, rate: 0.25 },
        { upTo: Infinity, rate: 0.28 },
      ],
      NC: [ // Navarre (foral, own system, approximated)
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
      CE: [ // Ceuta and Melilla (50% general IRPF rebate, modelled as halved community rates)
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
        ? `Spain IRPF, ${REGION_NAMES[region] ?? region} (2024)`
        : "Spain IRPF estimate (2024, select region to improve)",
      missingFactor: hasRegion
        ? (isForalTerritory
          ? `${REGION_NAMES[region]} has a separate foral system, rates are approximate.`
          : "Major personal deductions (pension contributions, mortgage) not modelled.")
        : "Autonomous region matters, Madrid vs Catalonia can differ by 5–8 pp.",
      note: hasRegion
        ? (isForalTerritory
          ? `${REGION_NAMES[region]} operates under a separate foral tax system with its own administration. These brackets approximate the foral rates, consult a local advisor for accurate figures. Personal deductions not modelled.`
          : `2024 national IRPF combined with ${REGION_NAMES[region]} autonomous community rates. Personal deductions (pension contributions, mortgage interest, childcare) can reduce taxable income and are not modelled. Income must be passed in EUR.`)
        : "National brackets are 2024 IRPF figures. The autonomous community overlay is a broad average, actual combined rates range from ~19% effective (Madrid) to 47%+ top marginal (Catalonia). Select your region above to significantly improve accuracy. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // MEXICO, MXN
  // 2024 ISR brackets (same structure as prior years, inflation-indexed).
  // No joint filing. Same brackets for all statuses.
  // -------------------------------------------------------------------------
  MX: ({ annualIncome, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/mexico.ts: SAT Anexo 8 RMF 2026 annual tariff, IMSS employee share.
    const { isr, imss } = mexicoTax(annualIncome, isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    return {
      effectiveRate: clampRate(annualIncome > 0 ? (isr + imss) / annualIncome : 0),
      model: "progressive-country",
      confidence: "simplified",
      label: `Mexico ISR + IMSS (${MEXICO_TAX_YEAR_LABEL})`,
      missingFactor: "Employment subsidy, exempt benefits (aguinaldo) and personal deductions not modelled; IMSS rates come from summaries rather than the Ley del Seguro Social.",
      note: "Uses the SAT's 2026 annual tariff (Anexo 8 of the 2026 tax resolution, limits raised 13.21% from 2025; 1.92% to 35%) and the employee's IMSS share (about 2.4% of salary, capped at 25 UMA a day). Pensions are treated as fully taxable, and remote workers paid abroad pay no IMSS. Not modelled: the subsidy for low incomes, exempt benefits such as the 30-day aguinaldo, personal deductions and INFONAVIT. Income must be passed in pesos.",
    };
  },

  // -------------------------------------------------------------------------
  // CANADA, CAD
  // 2025 federal brackets (indexed annually).
  // Married: spousal amount credit (~CAD 2,600 tax reduction equivalent).
  // Retired: age amount credit (~CAD 1,900 tax reduction equivalent).
  // Provincial overlay: broad average ~10% (varies AB ~10% to QC ~25%).
  // -------------------------------------------------------------------------
  // Province top marginal rates (approximate 2024 combined federal+provincial max effective)
  // Used when answers.ca_province is set.
  CA: ({ annualIncome, filing, isRetired, incomeScenario, answers }) => {
    // Rules in countryTaxRules/canada.ts: CRA 2026 federal and provincial brackets, credits, CPP/CPP2/EI.
    const chosen = answers?.ca_province ?? "";
    const known = Boolean(CANADA_PROVINCES[chosen]);
    const scenario = isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local";
    const r = canadaTax(annualIncome, { province: chosen, scenario, married: filing === "married" });
    const total = r.federalTax + r.provincialTax + r.surtaxAndPremium + r.payroll;
    const provinceName = CANADA_PROVINCES[r.province].name;
    return {
      effectiveRate: clampRate(annualIncome > 0 ? total / annualIncome : 0),
      model: "country-plus-province",
      confidence: known ? "partial" : "simplified",
      label: known
        ? `Canada federal + ${provinceName} estimate (${CANADA_TAX_YEAR_LABEL})`
        : `Canada federal + provincial estimate (${CANADA_TAX_YEAR_LABEL}, select province; Ontario shown)`,
      missingFactor: known
        ? "Provincial age, spouse and low-income credits not modelled."
        : "Province can swing the combined rate by several points; select yours (Ontario is used until you do).",
      note: `Federal and provincial brackets are the Canada Revenue Agency's 2026 tables. Credits are valued at each government's lowest rate: the basic personal amount, base CPP and EI, and for employees the Canada employment amount; retirees get the federal age amount and married filers the federal spouse amount (as if the spouse has no income). Employees pay CPP (5.95% up to $74,600 with the $3,500 exemption), CPP2 (4% from $74,600 to $85,000) and EI (1.63% up to $68,900). Remote income is assumed to come from a foreign employer and so to pay no CPP or EI. Ontario adds its surtax and Health Premium. Quebec residents get the 16.5% federal abatement, and the QPP and QPIP are approximated by CPP and EI. Not modelled: provincial age, spouse and pension credits, low-income tax reductions, the Alberta credit-rate rules, the pension income amount. Income must be passed in Canadian dollars.`,
    };
  },

  // -------------------------------------------------------------------------
  // GERMANY, EUR
  // 2024 Einkommensteuer. Ehegattensplitting for married couples.
  // Solidarity surcharge: 5.5% of income tax where tax > €17,543 (single)
  // or > €35,086 (joint). Church tax not modeled.
  // -------------------------------------------------------------------------
  DE: ({ annualIncome, filing, isRetired, incomeScenario, answers }) => {
    // Rules in countryTaxRules/germany.ts: section 32a EStG 2026 tariff, solidarity surcharge, 2026 social-insurance values.
    const scenario = isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local";
    const married = filing === "married";
    const { incomeTax, solidarity, socialInsurance } = germanyTax(annualIncome, { scenario, married });
    // Church tax conditional (applies to registered members, 8-9% of income tax)
    const churchTaxApplies = answers?.de_church_tax === "yes";
    const churchTax = churchTaxApplies ? 0.085 * incomeTax : 0;
    const effective = annualIncome > 0 ? (incomeTax + solidarity + churchTax + socialInsurance) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "partial",
      label: churchTaxApplies
        ? `Germany Einkommensteuer + Soli + Kirchensteuer + social insurance (${GERMANY_TAX_YEAR_LABEL})`
        : `Germany Einkommensteuer + Soli + social insurance (${GERMANY_TAX_YEAR_LABEL})`,
      missingFactor: "Child allowances, the taxable share of pensions and low-income reductions not modelled.",
      note: "Income tax follows the section 32a EStG 2026 tariff (basic allowance EUR 12,348, 42% above EUR 69,878, 45% above EUR 277,825) with income splitting for married filers, plus the 5.5% solidarity surcharge above the EUR 20,350 (EUR 40,700 joint) limit. Employees pay pension 9.3%, unemployment 1.3%, health 7.3% plus 1.45% of additional contribution, and care 1.8% (0.6 points more if childless), up to the 2026 ceilings of EUR 101,400 and EUR 69,750; pension, health and care contributions reduce taxable income. Pensioners pay health and care contributions on the pension (assumed 8.75% and 3.6%) and 100% of the pension is treated as taxable. Church tax is added if you select it. Not modelled: child allowances and Kindergeld, the 13th salary and low-income reductions. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // NETHERLANDS, EUR
  // 2024 Box 1 rates. No joint filing.
  // Working: Box 1 has a combined income-tax + national insurance band
  // up to €75,518 at 36.97%, then 49.50% above.
  // Retired (AOW recipients): reduced rate ~19.36% on first ~€38,098
  // (no AOW premium), then 49.50%.
  // 30% ruling: not modeled here, flagged in notes.
  // -------------------------------------------------------------------------
  NL: ({ annualIncome, filing, isRetired, answers }) => {
    // Rules in countryTaxRules/netherlands.ts: Belastingdienst 2026 box 1 tariffs and tax credits.
    const ruling30 = answers?.nl_30pct_ruling === "yes";
    const tax = netherlandsTax(annualIncome, !!isRetired, ruling30);
    // Single-person elderly credit of EUR 540 for retirees without a partner.
    const singleElderly = isRetired && filing !== "married" && annualIncome > 0 ? Math.min(540, tax) : 0;
    return {
      effectiveRate: clampRate(annualIncome > 0 ? (tax - singleElderly) / annualIncome : 0),
      model: "progressive-country",
      confidence: ruling30 ? "partial" : "simplified",
      label: ruling30
        ? `Netherlands Box 1 + 30% ruling (${NETHERLANDS_TAX_YEAR_LABEL})`
        : `Netherlands Box 1 income tax and premiums (${NETHERLANDS_TAX_YEAR_LABEL})`,
      missingFactor: ruling30
        ? "Box 2/3 taxes, health-insurance premiums and the ruling's salary cap not modelled."
        : "30% ruling, health-insurance premiums, box 2 and box 3 not modelled; the AOW-age general credit comes from secondary sources.",
      note: "Uses the Belastingdienst's 2026 box 1 tariffs (35.75% to EUR 38,883, 37.56% to EUR 78,426, 49.50% above, with the combined income tax and national-insurance premiums), less the general tax credit (up to EUR 3,115) and the labour credit (up to EUR 5,685); retirees at AOW age pay 17.85% in the first bracket and get the elderly credit (EUR 2,067, plus EUR 540 if single) instead of the labour credit. The 30% ruling, if selected, taxes only 70% of pay. Not modelled: the flat health-insurance premium and pensioners' income-related health premium, box 2 and box 3 tax, and credits transferred between partners. Income must be passed in euros." + (ruling30 ? " The ruling's salary cap is not applied." : ""),
    };
  },

  // -------------------------------------------------------------------------
  // AUSTRIA, EUR
  // 2024 Einkommensteuer. Progressive brackets; married filing not available
  // (joint assessment not used, spouses file individually).
  // Employee social insurance: ~18.12% combined (health 3.87%, pension 10.25%,
  // unemployment 3%, accident 1%). Not on pension income.
  // -------------------------------------------------------------------------
  AT: ({ annualIncome, isRetired }) => {
    // Rules in countryTaxRules/austria.ts: BMF 2026 tariff and credits, 2026 social-insurance values.
    const { incomeTax, socialInsurance } = austriaTax(annualIncome, isRetired);
    const effective = annualIncome > 0 ? (incomeTax + socialInsurance) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `Austria Einkommensteuer + social insurance (${AUSTRIA_TAX_YEAR_LABEL})`,
      missingFactor: "13th/14th salary (taxed at 6%), pensioner health contribution and family credits not modelled.",
      note: "2026 tariff and credits are the Federal Ministry of Finance figures, and social insurance uses the 2026 Dachverband values (health 3.87%, pension 10.25%, unemployment 3%, plus Chamber of Labour and housing levies of 0.5% each, up to the 2026 maximum base). Social insurance and the EUR 132 allowance reduce taxable income; employees get the Verkehrsabsetzbetrag (EUR 496) and pensioners the Pensionistenabsetzbetrag. Not modelled: the 13th and 14th salary, which are taxed at a flat 6% within limits and would lower the tax for most employees; reduced unemployment insurance at low pay; the pensioner health contribution; sole-earner and child credits; commuter allowance. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // BELGIUM, EUR
  // 2024 personenbelasting / impôt des personnes physiques.
  // Belgium has national + communal surcharges (avg ~7% of national tax).
  // Married / legally cohabiting: income splitting may apply (complex).
  // Employee social insurance: ~13.07% on working income.
  // -------------------------------------------------------------------------
  BE: ({ annualIncome, isRetired }) => {
    // Rules in countryTaxRules/belgium.ts: FPS Finance income year 2026 brackets, EUR 11,180 allowance, 6,070 expense cap.
    const { nationalTax, communalSurcharge, socialSecurity } = belgiumTax(annualIncome, isRetired);
    const effective = annualIncome > 0 ? (nationalTax + communalSurcharge + socialSecurity) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "country-plus-local",
      confidence: "simplified",
      label: `Belgium income tax + communal surcharge (${BELGIUM_TAX_YEAR_LABEL})`,
      missingFactor: "Communal surcharge (0–9%) averaged at 7%; marital quotient and dependants not modelled.",
      note: "Brackets (25%/40%/45%/50%), the EUR 11,180 basic allowance and the 30% employee expense forfait (capped at EUR 6,070) are the FPS Finance figures for income year 2026. Employee social security is 13.07% of gross pay. The communal surcharge is an assumed 7% average of national tax; it is set by your municipality. Married and cohabiting filers are treated as single earners, because the marital quotient and allowances for dependants are not modelled. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // COSTA RICA, CRC
  // 2024 Impuesto sobre la Renta brackets (employment income).
  // No joint filing.
  // -------------------------------------------------------------------------
  CR: ({ annualIncome, filing, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/costaRica.ts: Hacienda 2026 monthly brackets, CCSS 2026 worker rates.
    const scenario = isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local";
    const { incomeTax, workerCharges } = costaRicaTax(annualIncome, scenario, filing === "married");
    const effective = annualIncome > 0 ? (incomeTax + workerCharges) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `Costa Rica income tax + CCSS (${COSTA_RICA_TAX_YEAR_LABEL})`,
      missingFactor: "Digital-nomad exemption, children's credits and the 13th-month bonus not modelled.",
      note: "Monthly brackets (no tax to CRC 918,000, then 10%, 15%, 20%, 25%) and the CRC 2,590 spouse credit are the Ministerio de Hacienda figures for fiscal period 2026, applied to annual pay divided by 12. Employees also pay CCSS health 5.50% and pension 4.33% plus 1% to the Banco Popular (10.83%). Costa Rica taxes income from work done in the country, so remote income is taxed here (with no CCSS); digital nomad visa holders have a separate exemption that is not modelled. Pensioners are assumed to pay no CCSS. Income must be passed in colones.",
    };
  },

  // -------------------------------------------------------------------------
  // FRANCE, EUR
  // 2024 IR. Quotient familial: income ÷ parts, tax × parts.
  // Single = 1 part, married/PACS = 2 parts.
  // Social charges: CSG+CRDS 9.7% on earned income; 6.6% (reduced) on pensions.
  // -------------------------------------------------------------------------
  FR: ({ annualIncome, filing, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/france.ts: 2026 scale (law 2026-103), decote, 10% allowance, Urssaf and Agirc-Arrco rates.
    const scenario = isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local";
    const { incomeTax, contributions } = franceTax(annualIncome, { scenario, married: filing === "married" });
    const effective = annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `France IR + social contributions + CSG/CRDS (${FRANCE_TAX_YEAR_LABEL})`,
      missingFactor: "Child parts, credits and reductions not modelled; pensioner rates approximate.",
      note: "Uses the 2026 income tax scale (11% to 45%, indexed 0.9% by law 2026-103) with the 2-part quotient for married or PACS filers, the décote, and the standard 10% allowance for expenses (EUR 509 to 14,555), applied after employee contributions and the deductible CSG. Employees pay old-age insurance (6.9% to the EUR 48,060 ceiling, 0.4% on all pay), Agirc-Arrco 3.15%, CEG 0.86%, CET 0.14%, and CSG/CRDS 9.7% on 98.25% of pay; the rates above the ceiling are the standard published shares, not re-read. Remote work for a foreign employer is assumed to pay no French contributions. Not modelled: child parts (each child adds half a part), credits and reductions, the exceptional high-income contribution, and the reduced CSG for low pensions. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // ITALY, EUR
  // 2026 IRPEF (countryTaxRules/italy.ts). No joint filing. Regional (~1.23-3.33%) + municipal (~0-0.9%)
  // surtax modeled at 2% combined average.
  // -------------------------------------------------------------------------
  IT: ({ annualIncome, answers, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/italy.ts: 2026 IRPEF (33% second bracket), employee and pension deductions, INPS 9.19%.
    const itTax = italyTax(annualIncome, isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    if (answers?.it_flat_tax === "yes") {
      // Flat Tax for New Residents: €100,000/yr on all foreign-source income (fixed sum, not rate-based)
      // On Italian-source income: standard IRPEF rates apply.
      // Simplified: model as a flat €100k annual tax on foreign income (very high earner regime).
      const flatTaxAmount = ITALY_NEW_RESIDENT_FLAT_TAX; // EUR, fixed annual substitute tax (EUR 300,000 for options from 2026)
      const effectiveRate = annualIncome > 0 ? flatTaxAmount / annualIncome : 0;
      return {
        effectiveRate: clampRate(effectiveRate),
        model: "flat",
        confidence: "partial",
        label: "Italy Flat Tax for New Residents (€300k substitute tax, options from 2026)",
        missingFactor: "Italian-source income still subject to standard IRPEF; regime lasts 15 years max.",
        note: "Italy's Flat Tax for New Residents: a fixed €300,000/yr substitute tax for options exercised from 1 January 2026 (€100,000 or €200,000 for earlier arrivals; the amount comes from the 2026 budget law as reported by tax publications, not read on a government page) on all foreign-source income, regardless of the actual amount. Italian-source income is taxed at standard IRPEF rates (not modelled here). This regime lasts up to 15 years. Most relevant for high-income individuals with significant foreign income. Eligibility requires not having been Italian tax resident in 9 of the prior 10 years.",
      };
    }

    // Regional (addizionale regionale) surtax rates (% of taxable income); the base rate is 1.23% and regions may add up to 2.1 points
    // (Chamber of Deputies). The per-region rates below were set earlier and were not re-read for 2026.
    // Ranges from 1.23% (minimum, applies to regions not yet having set higher rates)
    // to 3.33% (Lazio / historically higher regions). Plus municipal (0–0.9%).
    const IT_REGION_SURTAX: Record<string, number> = {
      ABR: 0.0173, // Abruzzo
      BAS: 0.0123, // Basilicata (minimum)
      CAL: 0.0330, // Calabria (highest mainland)
      CAM: 0.0320, // Campania
      EMR: 0.0133, // Emilia-Romagna
      FVG: 0.0123, // Friuli-Venezia Giulia (minimum, autonomous)
      LAZ: 0.0330, // Lazio (Rome, highest)
      LIG: 0.0173, // Liguria
      LOM: 0.0173, // Lombardy (Milan)
      MAR: 0.0150, // Marche
      MOL: 0.0220, // Molise
      PAB: 0.0123, // Bolzano / South Tyrol (autonomous, minimum)
      PAT: 0.0123, // Trento / Trentino (autonomous, minimum)
      PIE: 0.0173, // Piedmont
      PUG: 0.0230, // Puglia
      SAR: 0.0173, // Sardinia (autonomous)
      SIC: 0.0250, // Sicily (autonomous)
      TOS: 0.0173, // Tuscany (Florence)
      UMB: 0.0173, // Umbria
      VDA: 0.0123, // Aosta Valley (autonomous, minimum)
      VEN: 0.0173, // Veneto (Venice)
    };

    const itRegion = answers?.it_region ?? "";
    const hasItRegion = !!IT_REGION_SURTAX[itRegion];
    // Municipal surtax: average 0.5% (range 0–0.9%, not region-selectable here)
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
      effectiveRate: clampRate(annualIncome > 0
        ? (itTax.irpef + (itTax.irpef > 0 ? (regionalSurtax + municipalSurtax) * itTax.taxable : 0) + itTax.inps) / annualIncome : 0),
      model: "country-plus-local",
      confidence: hasItRegion ? "partial" : "simplified",
      label: hasItRegion
        ? `Italy IRPEF + INPS + ${IT_REGION_NAMES[itRegion] ?? itRegion} surtax (${ITALY_TAX_YEAR_LABEL})`
        : `Italy IRPEF + INPS + regional/municipal surtax (${ITALY_TAX_YEAR_LABEL}, select region)`,
      missingFactor: hasItRegion
        ? "Family and other deductions, the 2025 low-income relief and the INPS 1% surcharge above about EUR 56,000 not modelled; the INPS rate and regional rates were not re-read."
        : "Regional surtax varies 1.2–3.3%, Lazio/Calabria vs Bolzano can differ by ~2 pp.",
      note: hasItRegion
        ? `2026 IRPEF (23% to EUR 28,000, 33% to EUR 50,000, 43% above, less the employee or pension deduction), employee INPS contributions of 9.19% (deductible; none for retirees or remote workers paid abroad), ${IT_REGION_NAMES[itRegion] ?? itRegion} regional surtax (${(IT_REGION_SURTAX[itRegion]! * 100).toFixed(2)}%) and an average municipal surtax (0.5%). Family deductions and the low-income relief are not modelled. Income must be passed in EUR.`
        : "2026 IRPEF with the employee or pension deduction and INPS contributions of 9.19% (not for retirees). Regional surtax ranges from 1.23% (Basilicata, autonomous regions) to 3.33% (Lazio, Calabria). Municipal surtax adds 0–0.9%. Select your region above to use the exact surtax rate. Italy's Flat Tax for New Residents (€300k/yr) is a separate regime, use the question above to model it. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // IRELAND, EUR
  // 2025 rates. Married (single-earner): standard rate band widens to €51,000.
  // USC 2025: threshold raised, revised bands.
  // PRSI 4.1% from Oct 2024 (increased from 4%).
  // Tax credits 2025: personal €1,875, PAYE employee €1,875 (working only),
  //   married person's credit €1,875 additional (married), age credit €245 (65+).
  // Retired: USC and PRSI waived.
  // -------------------------------------------------------------------------
  IE: ({ annualIncome, filing, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/ireland.ts: Revenue 2026 bands, credits and USC; PRSI 4.35% from October 2026.
    const { incomeTax, usc, prsi } = irelandTax(annualIncome, filing === "married" ? "married" : "single", isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    const effective = annualIncome > 0 ? (incomeTax + usc + prsi) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `Ireland income tax + USC + PRSI (${IRELAND_TAX_YEAR_LABEL})`,
      missingFactor: "Second-earner band increase, home carer, rent and medical credits, and pension relief not modelled; PRSI rate not read on a gov.ie page.",
      note: "Uses Revenue's 2026 rules: 20% on the first EUR 44,000 (EUR 53,000 for a married couple with one income) and 40% above, less the personal credit (EUR 2,000 single, EUR 4,000 married), the employee credit (EUR 2,000) and, for retirees, the age credit (EUR 245 or EUR 490). USC is 0.5%, 2%, 3% and 8% by band and applies to pensions too; the reduced USC rate for people 70 and over is not applied. Employees pay PRSI at 4.35% (from October 2026, 4.2% before); retirees and remote workers paid abroad pay none. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // AUSTRALIA, AUD
  // 2024-25 rates (Stage 3 tax cuts enacted from 1 July 2024).
  // No joint filing. Medicare Levy: 2% working, 1% retired.
  // -------------------------------------------------------------------------
  AU: ({ annualIncome }) => {
    // Rules in countryTaxRules/australia.ts: ATO 2026-27 resident rates, low income tax offset, 2% Medicare levy.
    const { incomeTax, medicareLevy } = australiaTax(annualIncome);
    const effective = annualIncome > 0 ? (incomeTax + medicareLevy) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "partial",
      label: `Australia income tax + Medicare Levy (${AUSTRALIA_TAX_YEAR_LABEL})`,
      missingFactor: "Medicare levy low-income reduction, surcharge and HELP repayments not applied.",
      note: "Resident rates, low income tax offset and the 2% Medicare levy are from the Australian Taxation Office for 2026-27. Employer superannuation is paid on top of salary and is not deducted. Not modelled: the Medicare levy's reduction for low incomes, the Medicare levy surcharge, HELP/HECS repayments, other offsets and deductions. Income must be passed in Australian dollars.",
    };
  },

  // -------------------------------------------------------------------------
  // NEW ZEALAND, NZD
  // 2024-25 rates. No joint filing.
  // Budget 2024 increased the 17.5% bracket threshold from NZD 48k to NZD 53.5k
  // and the 30% bracket from NZD 70k to NZD 78.1k (effective 31 Jul 2024).
  // -------------------------------------------------------------------------
  NZ: ({ annualIncome, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/newZealand.ts (same as the Asia calculator).
    const { incomeTax, acc } = newZealandTax(annualIncome, isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    return {
      effectiveRate: clampRate(annualIncome > 0 ? (incomeTax + acc) / annualIncome : 0),
      model: "progressive-country",
      confidence: "partial",
      label: `New Zealand income tax + ACC levy (${NEW_ZEALAND_TAX_YEAR_LABEL})`,
      missingFactor: "KiwiSaver, tax credits and student-loan repayments not modelled; the ACC rate comes from payroll summaries.",
      note: "Uses Inland Revenue's resident rates (10.5% to NZD 15,600, 17.5% to 53,500, 30% to 78,100, 33% to 180,000, 39% above) and, for employees, the ACC earners' levy of 1.75% up to NZD 156,641 (2026-27, from payroll summaries of the ACC regulations). NZ Superannuation is taxed at the same rates with no levy; remote workers paid abroad pay no ACC levy. Not modelled: KiwiSaver, low-income and family credits, student-loan repayments. Income must be passed in NZD.",
    };
  },

  // -------------------------------------------------------------------------
  // JAPAN, JPY
  // 2024 national rates + reconstruction surtax 2.1% of income tax.
  // Local inhabitant tax: flat 10% of income.
  // No joint filing.
  // -------------------------------------------------------------------------
  JP: ({ annualIncome, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/japan.ts: NTA rates, employment and pension deductions, basic deduction, social insurance.
    const { nationalTax, residentTax, socialInsurance } = japanTax(annualIncome, isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    const effective = annualIncome > 0 ? (nationalTax + residentTax + socialInsurance) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "country-plus-local",
      confidence: "simplified",
      label: `Japan national tax + resident tax + social insurance (${JAPAN_TAX_YEAR_LABEL})`,
      missingFactor: "Dependants and other deductions, long-term care premiums and the 2026-27 higher employment-deduction minimum not modelled; basic deduction middle rows and social insurance rates not read on a government page.",
      note: "Uses the National Tax Agency's rates (5% to 45%, plus the 2.1% reconstruction surtax), the employment income deduction (retirees: the public pension deduction for age 65 and over), the basic deduction (about JPY 1.04 million at lower incomes after the reform effective 1 December 2026), and a 10% resident tax on income after a JPY 430,000 deduction plus about JPY 5,000. Employees also pay about 14.7% in social insurance (health 4.95%, child-support levy 0.115%, pension 9.15% up to JPY 650,000 a month, employment 0.5%), which is deductible. Retirees and remote workers paid abroad are shown without social insurance premiums (National Health Insurance and National Pension are not modelled). Income must be passed in yen.",
    };
  },

  // -------------------------------------------------------------------------
  // SOUTH KOREA, KRW
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
      note: "National brackets and 10% local surtax are correct. Key omissions: National Health Insurance (~3.545% employee) and National Pension (~4.5% employee up to KRW 5,900,000/mo) together add approximately 8% to the total burden for most employees, a material gap. Employment income deduction (near income) also not applied, which overstates income tax on employment income at lower incomes. Income must be passed in KRW.",
    };
  },

  // -------------------------------------------------------------------------
  // UNITED ARAB EMIRATES, AED, No personal income tax
  // -------------------------------------------------------------------------
  AE: () => ({
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "No personal income tax",
    missingFactor: "No personal income tax, this estimate is exact.",
    note: "The UAE does not levy personal income tax on employment or investment income. A 9% corporate tax applies to businesses with profits above AED 375,000, but there is no individual income tax.",
  }),

  // -------------------------------------------------------------------------
  // SINGAPORE, SGD
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
      note: "2024 YA resident rates with basic earned income relief applied. Key gaps: non-residents pay a flat 15% or progressive rates, whichever is higher, this model assumes tax residency which requires ≥183 days in Singapore. CPF contributions (~20% employee up to SGD 6,800/mo) are a significant real deduction but partly a savings mechanism. Various personal reliefs (NSman, parent, spouse) can reduce tax by thousands of dollars. Income must be passed in SGD.",
    };
  },

  // -------------------------------------------------------------------------
  // SWITZERLAND, CHF
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
      missingFactor: "Rate varies widely by canton, Zug ~18% total, Zurich ~27%, Geneva ~37%.",
      note: "Federal brackets are exact 2024 Swiss figures (separate single/married scales). Cantonal and municipal rates use a mid-range overlay (~13%) benchmarked to Zurich. Actual combined rates range from ~18% (Zug) to ~37% (Geneva, Vaud), this estimate can be off by 10+ pp depending on location. Swiss social insurance contributions not included. Income must be passed in CHF.",
    };
  },

  // -------------------------------------------------------------------------
  // DENMARK, DKK
  // 2024 rates. AM-bidrag (labour market contribution) 8% on gross,
  // deducted before income tax. Not applicable to pension income.
  // Bottom tax + health tax (~12.5%) + top tax (15% above DKK 588,900).
  // Municipal tax average ~25.1%.
  // -------------------------------------------------------------------------
  DK: ({ annualIncome, filing, isRetired }) => {
    // Rules in countryTaxRules/denmark.ts: skat.dk 2026 brackets and allowances, Skatteministeriet average municipal rate.
    if (annualIncome <= 0) return { effectiveRate: 0, model: "progressive-country", confidence: "partial", label: `Denmark income tax (${DENMARK_TAX_YEAR_LABEL})`, missingFactor: "", note: "Enter income to calculate." };
    const { total } = denmarkTax(annualIncome, { retired: isRetired, married: filing === "married" });
    return {
      effectiveRate: clampRate(total / annualIncome),
      model: "progressive-country",
      confidence: "partial",
      label: `Denmark income tax + AM-bidrag + municipal (${DENMARK_TAX_YEAR_LABEL})`,
      missingFactor: "Your municipality's rate (23.4% to 26.3%) and church tax (about 0.9% for members) not included.",
      note: "Uses skat.dk's 2026 rules: AM-bidrag 8% (not on pensions), bottom tax 12.01% and the average municipal rate of 25.05% above the DKK 54,100 personal allowance, the new 7.5% middle-bracket tax above DKK 641,200, 7.5% top-bracket tax above DKK 777,900 and 5% additional top-bracket tax above DKK 2,592,700 (all after AM-bidrag), less the employment allowance (12.75%, max DKK 63,471) and job allowance for employees. A married filer is given both personal allowances. Not modelled: church tax, the transport deduction and other deductions. Income must be passed in kroner.",
    };
  },

  // -------------------------------------------------------------------------
  // SWEDEN, SEK
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
      missingFactor: "Jobbskatteavdrag (earned income credit) not modelled, may overstate by 3–5 pp.",
      note: "Municipal average (32.37%) and national threshold (SEK 598,500) are correct for 2024. Key omission: the jobbskatteavdrag (earned income tax credit) reduces income tax for employed residents, it is income-dependent and can be worth SEK 20,000–35,000/yr, meaning this model overstates effective income tax on employment income by roughly 3–5 pp at mid-range incomes. Municipal rates vary: Stockholm 29.83%, Gothenburg 32.35%. Income must be passed in SEK.",
    };
  },

  // -------------------------------------------------------------------------
  // NORWAY, NOK
  // 2024 rates. Ordinary income tax 22% flat + bracket tax (trinnskatt).
  // No joint filing. Personal deduction (personfradrag): NOK 88,250.
  // -------------------------------------------------------------------------
  NO: ({ annualIncome, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/norway.ts: Skatteetaten 2026 bracket tax, allowances, national insurance, pensioner credit.
    const { incomeTax, nationalInsurance } = norwayTax(annualIncome, isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    return {
      effectiveRate: clampRate(annualIncome > 0 ? (incomeTax + nationalInsurance) / annualIncome : 0),
      model: "progressive-country",
      confidence: "partial",
      label: `Norway income tax + bracket tax + national insurance (${NORWAY_TAX_YEAR_LABEL})`,
      missingFactor: "Lower rates in northern Norway, housing and pension-savings deductions not modelled.",
      note: "Uses Skatteetaten's 2026 rules: 22% ordinary income tax after the standard deduction (46% of wages up to NOK 95,700; 40% of pensions up to NOK 75,400) and the NOK 114,540 personal allowance, bracket tax of 1.7% to 17.8% on income above NOK 226,100, and national insurance of 7.6% on wages or 5.1% on pensions (capped at 25% of income above NOK 99,650). Pensioners also get the tax credit of up to NOK 37,100. Remote workers are assumed to be members of the national insurance scheme. Not modelled: the lower rates in Finnmark and northern Troms, the housing deductions and pension savings. Income must be passed in kroner.",
    };
  },

  // -------------------------------------------------------------------------
  // FINLAND, EUR
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
      note: "State brackets are 2024 figures. Municipal average (21.5%) and health insurance premium (1.5%) are correctly applied. Key gaps: municipal rates span 18% (Helsinki) to 23%+ in some rural municipalities, a 5 pp spread on a large portion of income. Employee pension (TyEL, ~7.15%) and unemployment (0.79%) contributions are not modelled. The earned income deduction (ansiotulovähennys) and work income tax credit would reduce effective rates for employed residents, meaning this model somewhat overstates income tax on employment income. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // POLAND, PLN
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
      missingFactor: isRetired ? "Free amount (PLN 30,000) applied; pension income modelled simply." : "Health contribution (składka zdrowotna, 9%) changed under 2022 reform, complex interaction with income tax.",
      note: "PIT brackets and PLN 30,000 free amount are correct. The ~23% social/health overlay is a rough composite, the actual breakdown is: ZUS pension 9.76%, disability 1.5%, sickness 2.45%, health contribution (składka zdrowotna) 9% with no cap. The health contribution changed significantly in 2022 (Polski Ład reform) and is no longer deductible from income tax, this is a major source of real-world complexity not captured here. Result could be off by 3–6 pp depending on income level and contribution base. Income must be passed in PLN.",
    };
  },

  // -------------------------------------------------------------------------
  // CZECH REPUBLIC, CZK
  // 2024: 15% on income up to 36× average wage (~CZK 1,582,812); 23% above.
  // Social + health contributions: ~11% employee share on working income.
  // -------------------------------------------------------------------------
  CZ: ({ annualIncome, isRetired }) => {
    // Rules in countryTaxRules/czechRepublic.ts: Financni sprava 2026 rates, threshold and basic credit.
    const { incomeTax, insurance } = czechTax(annualIncome, isRetired);
    const effective = annualIncome > 0 ? (incomeTax + insurance) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "partial",
      label: `Czech Republic PIT (15%/23%) + social and health insurance (${CZECH_TAX_YEAR_LABEL})`,
      missingFactor: "Child, spouse and mortgage credits and deductions not modelled.",
      note: "Income tax is 15% up to CZK 1,762,812 (36 times the 2026 average wage) and 23% above, less the CZK 30,840 basic taxpayer credit, on gross pay (the Financial Administration's 2026 figures). Employees also pay 7.1% social insurance (pension 6.5%, sickness 0.6%) up to 48 times the average wage and 4.5% health insurance with no cap; those rates are the statutory ones and the cap is derived from the official average wage, not read from a 2026 table. Not modelled: credits for children, a spouse or students, and mortgage-interest and pension-savings deductions. Income must be passed in koruna.",
    };
  },

  // -------------------------------------------------------------------------
  // HUNGARY, HUF
  // Flat 15% SZJA. No joint filing.
  // Social contributions: 18.5% working; not on pension income.
  // -------------------------------------------------------------------------
  HU: ({ annualIncome, isRetired }) => {
    // Hungarian Tax Authority (NAV), 2026: personal income tax (SZJA) 15% and employee contributions 18.5% (10% pension,
    // 7% health, 1.5% labour market), both on gross pay (https://nav.gov.hu/ado/jarulek/Fizetendo_jarulekok_2026._januar_1-jetol, read 2026-10-14).
    const socialOverlay = isRetired ? 0 : 0.185;
    return {
      effectiveRate: clampRate(annualIncome > 0 ? 0.15 + socialOverlay : 0),
      model: "flat",
      confidence: "partial",
      label: "Hungary 15% SZJA flat + social contributions (2026)",
      missingFactor: "Exemptions for under-25s and mothers, and family tax credits, not modelled.",
      note: "The 2026 rules from the Hungarian Tax Authority: 15% personal income tax and 18.5% employee contributions (pension 10%, health 7%, labour market 1.5%), both on gross pay, with no ceiling. Retirees are assumed to pay neither. Not modelled: the under-25 relief (up to HUF 715,765 a month of tax-free income), the exemptions for mothers of two or more children and of mothers under 30, and family tax credits. Income must be passed in forints.",
    };
  },

  // -------------------------------------------------------------------------
  // GREECE, EUR
  // 2024 progressive income tax. Social contributions: ~13.87% working,
  // reduced rates on pension income (~6%).
  // No joint filing.
  // -------------------------------------------------------------------------
  GR: ({ annualIncome, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/greece.ts: 2026 reform scale (Ministry of Finance), EUR 777 tax reduction, EFKA contributions.
    const { incomeTax, contributions } = greeceTax(annualIncome, isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    const effective = annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `Greece income tax + EFKA contributions (${GREECE_TAX_YEAR_LABEL} reform scale)`,
      missingFactor: "Child reductions and the youth rates not modelled; EFKA rates not re-read on an EFKA page.",
      note: "Uses the 2026 scale from the Ministry of Finance for a taxpayer without children (9% to EUR 10,000, 20% to 20,000, 26% to 30,000, 34% to 40,000, 39% to 60,000, 44% above) and the EUR 777 tax reduction that falls by EUR 20 per EUR 1,000 of income above EUR 12,000. Employees pay 13.87% EFKA contributions up to the maximum insurable earnings, deducted before tax; pensioners are assumed to pay 6%. The special solidarity contribution no longer applies to private-sector income. Not modelled: lower rates and larger reductions for families with children, the youth rates (zero up to age 25, 9% for 26 to 30) and the new-resident regimes. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // TURKEY, TRY
  // 2024 brackets (revised annually for inflation, verify each year).
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
      label: "Turkey progressive income tax (2024, thresholds unstable)",
      missingFactor: "Brackets revised mid-year for inflation, figure may be significantly outdated.",
      note: "⚠ Turkey's income tax brackets are revised annually and sometimes mid-year due to high inflation. These approximate 2024 thresholds may be significantly outdated. SGK employee social contributions (~14%: pension 9%, health 5%) are not included. Always verify current-year thresholds via the Turkish Revenue Administration (GİB) before using this for planning. This number should be treated as directional only. Income must be passed in TRY.",
    };
  },

  // -------------------------------------------------------------------------
  // CROATIA, EUR
  // 2024: Two-band national tax (20% / 30%). Surtax abolished Jan 2024.
  // Previously had local surtax up to 18%, removed from 2024.
  // -------------------------------------------------------------------------
  HR: ({ annualIncome, isRetired }) => {
    // Rules in countryTaxRules/croatia.ts: Porezna uprava 2026 threshold (EUR 60,000), default rates, allowance, MIO.
    const { incomeTax, contributions } = croatiaTax(annualIncome, isRetired);
    const effective = annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "partial",
      label: `Croatia income tax + pension contribution (${CROATIA_TAX_YEAR_LABEL})`,
      missingFactor: "Your municipality's own rate (up to 23% / 33% in Zagreb) and dependants' allowances not modelled.",
      note: "The Tax Administration's 2026 rules: 20% up to EUR 60,000 a year and 30% above, on gross pay less the 20% pension contribution and the EUR 600 monthly personal allowance. Municipalities and cities set their own rates within bands (the default, used here, is 20% and 30%; Zagreb may charge up to 23% and 33%), so the true rate can be a few points higher. Health insurance is paid by the employer. Not modelled: higher allowances for dependants and disability, and the cap on monthly contributions. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // ESTONIA, EUR
  // 2024: Flat 20% income tax. From 2025 rises to 22%.
  // Social contributions: 1.6% unemployment + 2% funded pension (employee).
  // No joint filing.
  // -------------------------------------------------------------------------
  EE: ({ annualIncome, isRetired }) => {
    // Rules in countryTaxRules/estonia.ts: EMTA 2026 rate (22%), EUR 8,400 basic exemption, 1.6% + 2% contributions.
    const { incomeTax, contributions } = estoniaTax(annualIncome, isRetired);
    const effective = annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "flat",
      confidence: "partial",
      label: `Estonia flat income tax + contributions (${ESTONIA_TAX_YEAR_LABEL})`,
      missingFactor: "Higher voluntary pension contribution (4% or 6%) and exemption application rules not modelled.",
      note: "Income tax is a flat 22% of pay after employee contributions and the basic exemption of EUR 700 a month (EUR 8,400 a year; EUR 9,312 from pensionable age), which from 2026 no longer shrinks as income rises (Estonian Tax and Customs Board). Employees pay 1.6% unemployment insurance and by default 2% to the funded pension, both deducted before tax; members may choose 4% or 6%. There is no 2% security tax on wages. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // LATVIA, EUR
  // 2024 progressive. Employee social: ~10.5% (pension 10% + unemployment 0.5%).
  // No joint filing.
  // -------------------------------------------------------------------------
  LV: ({ annualIncome, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/latvia.ts: VID 2026 rates (25.5% / 33% / +3%), EUR 550 monthly non-taxable minimum, 10.5% employee contributions.
    const { incomeTax, contributions } = latviaTax(annualIncome, isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    const effective = annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `Latvia income tax + social contributions (${LATVIA_TAX_YEAR_LABEL})`,
      missingFactor: "Dependants' relief and any separate pensioner minimum not modelled; the non-taxable minimum and contribution ceiling come from news summaries, not a VID page.",
      note: "Uses the State Revenue Service's 2026 rates: 25.5% on income up to EUR 105,300 and 33% above, plus 3% on taxable income above EUR 200,000, after a non-taxable minimum of EUR 550 a month (EUR 6,600 a year). Employees pay 10.5% social contributions up to a EUR 105,300 base, deductible from taxable income; pensions are taxed the same way with no contributions, and remote workers paid abroad pay none. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // LITHUANIA, EUR
  // 2024 progressive. Threshold ~EUR 101,094 for standard bracket.
  // Employee social: ~19.5% (GPM +12.5% social), reduced on pension.
  // No joint filing.
  // -------------------------------------------------------------------------
  LT: ({ annualIncome, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/lithuania.ts: 2026 GPM bands (20/25/32%), NPD formula, 19.5% employee contributions.
    const { incomeTax, contributions } = lithuaniaTax(annualIncome, isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    const effective = annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `Lithuania income tax + social contributions (${LITHUANIA_TAX_YEAR_LABEL})`,
      missingFactor: "Dependants' NPD, pensioner NPD rules and the VMI pages themselves (blocked to the fetch tool) not read; NPD and employee rates come from secondary summaries.",
      note: "Uses the 2026 rules as summarised from the State Tax Inspectorate: income tax of 20% up to EUR 83,237, 25% to EUR 138,729 and 32% above, after the non-taxable amount of 747 - 0.49 x (monthly pay - 1,153) a month (EUR 8,964 a year at lower pay, none from about EUR 32,000). Employees pay 19.5% contributions (social insurance 12.52% and health 6.98%) up to EUR 99,422, which are not deductible. Retirees and remote workers paid abroad pay no contributions. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // ROMANIA, RON
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
      missingFactor: "Social contributions (CAS 25% + CASS 10%) are explicitly modelled, main caveat is CASS floors/ceilings.",
      note: "The 10% flat income tax is exact. Social contributions are explicitly modelled: CAS 25% (pension) + CASS 10% (health) for working income; CASS 10% health only on pension. The combined rate is legislated and relatively stable. Main omission: CASS has a minimum floor (1× minimum wage, ~RON 3,300/yr) and a ceiling (60× minimum wage), the ceiling affects very high earners only. No joint filing. Income must be passed in RON.",
    };
  },

  // -------------------------------------------------------------------------
  // BULGARIA, EUR (the euro replaced the lev on 2026-01-01)
  // Flat 10% income tax, lowest in EU. Employee social: ~13.78%.
  // No joint filing.
  // -------------------------------------------------------------------------
  BG: ({ annualIncome, isRetired }) => {
    // Rules in countryTaxRules/bulgaria.ts: flat 10% after employee contributions, 2026 insurable-income caps (NOI).
    const { incomeTax, socialContributions } = bulgariaTax(annualIncome, isRetired);
    const effective = annualIncome > 0 ? (incomeTax + socialContributions) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "flat",
      confidence: "partial",
      label: `Bulgaria 10% flat income tax + social contributions (${BULGARIA_TAX_YEAR_LABEL})`,
      missingFactor: "2026 contribution rates assumed equal to the 2025 table; contribution categories simplified.",
      note: "Income tax is a flat 10% of pay after the employee's social contributions. Contributions are 8.38% (state pension and benefits, for people born after 1959) plus 3.2% health insurance, up to the 2026 maximum insurable income of EUR 2,111.64 a month (EUR 2,300 from August), per the National Social Security Institute; the 2025 rates are assumed unchanged because the 2026 table was not found. Retirees pay no contributions. Voluntary pension funds, labour-category rates and the exemption of Bulgarian state pensions are not modelled. Income must be passed in euros (Bulgaria adopted the euro on 1 January 2026).",
    };
  },

  // -------------------------------------------------------------------------
  // SLOVENIA, EUR
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
      label: "Slovenia Dohodnina (2024, incl. new 50% top bracket)",
      missingFactor: "Employee social contributions (~22.1%) and general relief not included.",
      note: "Brackets are 2024 figures including the new 50% top bracket (introduced 2024). Key omission: employee social contributions total approximately 22.1% (pension 15.5%, health 6.36%, unemployment 0.14%, parental care 0.1%), a major component of total deductions for employed residents, not modelled here. The general tax relief (splošna olajšava, up to €5,000/yr) is also not applied. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // SLOVAKIA, EUR
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
  // MALTA, EUR
  // 2024: Real legislated separate single and married rate scales.
  // -------------------------------------------------------------------------
  MT: ({ annualIncome, filing, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/malta.ts: 2026 single and married computations, Class 1 social security.
    const { incomeTax, contributions } = maltaTax(annualIncome, filing === "married" ? "married" : "single", isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
    return {
      effectiveRate: clampRate(annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0),
      model: "progressive-country",
      confidence: "simplified",
      label: `Malta income tax + social security (${MALTA_TAX_YEAR_LABEL})`,
      missingFactor: "New parent and family computations not modelled; rate tables and the social security cap come from PwC and secondary summaries because the MTCA site blocked the fetch.",
      note: "Uses the 2026 single computation (0% to EUR 12,000, 15% to 16,000, 25% to 60,000, 35% above) or the married computation (0% to EUR 15,000, 15% to 23,000, 25% to 60,000, 35% above, one earner). Employees pay Class 1 social security of 10% of pay up to EUR 55.93 a week; retirees and remote workers paid abroad pay none here. Not modelled: the family computations introduced for parents, remittance rules for non-domiciled residents and residence-programme rates. Income must be passed in euros.",
    };
  },

  // -------------------------------------------------------------------------
  // CYPRUS, EUR
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
      note: "Income tax brackets and GHS (GESY) rates are 2024 figures correctly applied. Key omission: the Special Defence Contribution (SDC) applies to Cyprus tax residents on passive income, dividends (17%), interest (30%), rents (2.25% on 75% of gross). For retirees or remote workers with significant investment/rental income this is a material gap. Cyprus non-domicile status (non-dom) exempts SDC on dividends and interest for 17 years, not modelled. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // PANAMA, USD
  // 2024 progressive. Territorial system, foreign-source income not taxed.
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
      label: "Panama income tax (2024, territorial system)",
      missingFactor: "Foreign-source income generally not taxed, this estimate may not apply.",
      note: "Brackets are 2024 figures and simple enough to be reliably modelled. Most important planning note: Panama's territorial system means foreign-sourced income (remote salaries paid by a non-Panamanian employer for work performed outside Panama) is generally not taxed in Panama at all, making this estimate irrelevant for most remote workers. Social security contributions (~9.75% employee up to a monthly ceiling) are not included. Income in USD.",
    };
  },

  // -------------------------------------------------------------------------
  // COLOMBIA, COP
  // 2024 UVT-based brackets. UVT value COP 47,065 (2024).
  // No joint filing.
  // -------------------------------------------------------------------------
  CO: ({ annualIncome, incomeScenario }) => {
    // Rules in countryTaxRules/colombia.ts: DIAN 2026 UVT (COP 52,374), article 241 table, 25% exemption and caps.
    const { incomeTax, contributions } = colombiaTax(annualIncome, incomeScenario === "remote" ? "remote" : incomeScenario === "retired" ? "retired" : "local");
    const effective = annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `Colombia income tax + health and pension (${COLOMBIA_TAX_YEAR_LABEL})`,
      missingFactor: "Dependants, solidarity pension contribution and non-labor income not modelled.",
      note: "The 2026 UVT of COP 52,374 is from DIAN Resolution 238 of 2025. The progressive table (0% to 39%), the 25% exempt labor income capped at 790 UVT, the 40% / 1,340 UVT limit, and the 4% health and 4% pension employee contributions are the law as amended by Law 2277 of 2022; the statute text could not be reached to re-read, so treat those as the long-standing rules rather than newly verified. Pensioners pay health only; remote work for a foreign employer is assumed to pay neither contribution. Not modelled: the extra 1% solidarity pension contribution above four minimum wages, dependants and other deductions. Income must be passed in pesos.",
    };
  },

  // -------------------------------------------------------------------------
  // BRAZIL, BRL
  // 2024 IRPF brackets (updated May 2024, new exemption thresholds).
  // No joint filing. Pension income deduction for 65+.
  // -------------------------------------------------------------------------
  BR: ({ annualIncome, incomeScenario }) => {
    // Rules in countryTaxRules/brazil.ts: Receita Federal 2026 table and Law 15.270 reducer, INSS 2026 table.
    const { incomeTax, inss } = brazilTax(annualIncome, { employee: incomeScenario === "local" });
    const effective = annualIncome > 0 ? (incomeTax + inss) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `Brazil IRPF + INSS (${BRAZIL_TAX_YEAR_LABEL})`,
      missingFactor: "13th salary, extra exemption for pensioners 65+, and the high-income minimum tax not modelled.",
      note: "Uses the Receita Federal 2026 monthly table and the Law 15.270 reducer (no tax up to R$ 5,000 a month, phasing out at R$ 7,350), the R$ 607.20 simplified discount or INSS if larger, and the 2026 INSS table (7.5% to 14%, ceiling R$ 8,475.55) for employees. Remote and self-employed income pays no INSS here, since a contributor-individual contribution is a different regime. Calculated monthly from annual pay divided by 12. Not modelled: the 13th salary, the additional exemption for pensioners aged 65 or over, the minimum tax on incomes above R$ 600,000, dependants and health or education deductions. Income must be passed in reais.",
    };
  },

  // -------------------------------------------------------------------------
  // ARGENTINA, ARS
  // Impuesto a las Ganancias, personas humanas. Annual scale of article 94 and the personal deductions of article 30,
  // both ARCA (formerly AFIP) tables for the 2026 annual settlement, updated by INDEC inflation each year:
  //   https://www.afip.gob.ar/gananciasYBienes/ganancias/personas-humanas-sucesiones-indivisas/declaracion-jurada/documentos/Tabla-Art-94-LIG-liquidacion-anual-y-final-2026.pdf
  //   https://www.afip.gob.ar/gananciasYBienes/ganancias/personas-humanas-sucesiones-indivisas/deducciones/documentos/Deducciones-personales-art-30-liq-anual-2026.pdf
  // Read 2026-10-13. Employees and retirees take special deduction apartado 2 (4.8 x the non-taxable amount); self-employed
  // take apartado 1 (3.5 x). Employees' mandatory contributions (11% pension, 3% health, 3% PAMI) are deductible.
  // -------------------------------------------------------------------------
  AR: ({ annualIncome, filing, incomeScenario }) => {
    const nonTaxable = 6019671.36;
    const spouse = 5669323.06;
    const specialEmployeeOrRetiree = 28894422.56;
    const specialSelfEmployed = 21068849.78;
    const employee = incomeScenario === "local";
    const selfEmployed = incomeScenario === "remote";
    const contributions = employee ? annualIncome * 0.17 : 0;
    const special = selfEmployed ? specialSelfEmployed : specialEmployeeOrRetiree;
    const deductions = nonTaxable + special + (filing === "married" ? spouse : 0);
    const taxable = Math.max(0, annualIncome - contributions - deductions);

    const rate = progressiveTax(taxable, [
      { upTo: 2336953.69, rate: 0.05 },
      { upTo: 4673907.36, rate: 0.09 },
      { upTo: 7010861.05, rate: 0.12 },
      { upTo: 10516291.59, rate: 0.15 },
      { upTo: 21032583.18, rate: 0.19 },
      { upTo: 31548874.77, rate: 0.23 },
      { upTo: 47323312.16, rate: 0.27 },
      { upTo: 70984968.25, rate: 0.31 },
      { upTo: Infinity, rate: 0.35 },
    ]);

    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "simplified",
      label: "Argentina Impuesto a las Ganancias (2026 annual scale)",
      missingFactor: "Monotributo, wealth and other taxes, and ceilings on contributions are not modelled.",
      note: "Scale and deductions are the ARCA tables for the 2026 annual settlement (article 94 scale; article 30 non-taxable amount, spouse and special deduction), which ARCA updates with inflation, so verify them each year. Employees: 17% mandatory contributions are deducted and the special deduction is 4.8 times the non-taxable amount; remote or self-employed income takes the 3.5 times deduction and no employee contributions; retirees take the 4.8 times deduction. Children, rent, mortgage-interest and other deductions are not modelled. Income must be passed in pesos, and an exchange rate that moves a lot makes the dollar result swing.",
    };
  },

  // -------------------------------------------------------------------------
  // CHILE, CLP
  // 2024 UTM-based brackets. UTM value CLP 67,294 (2024).
  // No joint filing.
  // -------------------------------------------------------------------------
  CL: ({ annualIncome, incomeScenario }) => {
    // Rules in countryTaxRules/chile.ts: SII 2026 monthly table in UTM, 90 UF contribution ceiling.
    const { incomeTax, contributions } = chileTax(annualIncome, incomeScenario === "remote" ? "remote" : incomeScenario === "retired" ? "retired" : "local");
    const effective = annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effective),
      model: "progressive-country",
      confidence: "simplified",
      label: `Chile wage income tax + pension and health contributions (${CHILE_TAX_YEAR_LABEL})`,
      missingFactor: "Pension fund commission, unemployment insurance and the annual tax return not modelled.",
      note: "Uses the Servicio de Impuestos Internos 2026 monthly table (exempt to 13.5 UTM, then 4% to 40%), computed monthly from annual pay divided by 12 with the October 2026 UTM of CLP 72,151. Employees also pay 10% pension and 7% health on pay up to the 90 UF ceiling (CLP 3.7 million a month), which are deducted before income tax; pensioners pay the 7% health contribution; remote work for a foreign employer is assumed to pay no Chilean contributions. The old model applied monthly thresholds to annual income. Not modelled: the pension fund's commission, unemployment insurance, voluntary savings and the annual return. Income must be passed in pesos.",
    };
  },

  // -------------------------------------------------------------------------
  // PERU, PEN
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
      missingFactor: "7 UIT employment deduction (~PEN 36,050) not applied, overstates employee tax.",
      note: "UIT brackets are 2024 figures (UIT PEN 5,150). Key omission: employment income receives a deduction of 7 UIT (~PEN 36,050/yr) before the progressive scale applies, not modelled, so this estimate overstates income tax for employees, particularly at lower incomes. EsSalud health contributions are employer-only (~9%) and do not reduce employee take-home. Income must be passed in PEN.",
    };
  },

  // -------------------------------------------------------------------------
  // THAILAND, THB
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
      label: "Thailand PIT (2024, with standard deductions)",
      missingFactor: "Foreign-income remittance rules changed Jan 2024, treatment depends on timing.",
      note: "Brackets and standard deductions are 2024 figures. Critical planning caveat: Thailand shifted to taxing foreign-source income remitted to Thailand from 1 January 2024, regardless of the year it was earned. Previously, income earned in a prior year and remitted later was exempt. This change significantly affects remote workers and investors, the actual tax treatment depends on your specific income type, residency status (≥180 days), and remittance timing in ways this model cannot capture. Income must be passed in THB.",
    };
  },

  // -------------------------------------------------------------------------
  // VIETNAM, VND
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
      note: "Brackets and personal allowance (VND 132M/yr) are 2024 figures. Key gaps: employee social insurance (~10.5% combined: social 8%, health 1.5%, unemployment 1%) is a significant deduction for locally-employed residents, not modelled. Dependent relief (VND 52.8M per dependent) is also excluded, which understates take-home for families. For remote workers maintaining foreign employment contracts, Vietnam PIT exposure depends on the tax treaty with your home country and actual days of residency. Income must be passed in VND.",
    };
  },

  // -------------------------------------------------------------------------
  // MALAYSIA, MYR
  // 2024 progressive. Each spouse files separately, no joint filing.
  // Employee EPF: 11% (compulsory, partly savings, not modeled).
  // -------------------------------------------------------------------------
  MY: ({ annualIncome, isRetired, incomeScenario }) => {
    // Rules in countryTaxRules/malaysia.ts (same as the Asia calculator).
    const scenario = isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local";
    const { incomeTax, contributions } = malaysiaTax(annualIncome, scenario);
    const exempt = scenario !== "local";
    return {
      effectiveRate: clampRate(annualIncome > 0 ? (incomeTax + contributions) / annualIncome : 0),
      model: exempt ? "none" : "progressive-country",
      confidence: "simplified",
      label: exempt ? "Malaysia, foreign-sourced or pension income" : `Malaysia income tax + EPF/SOCSO (${MALAYSIA_TAX_YEAR_LABEL})`,
      missingFactor: exempt ? "The exemption for foreign-sourced income runs to 2036 and has conditions; verify it before planning." : "Spouse, child and other reliefs not modelled; contribution rates not re-read.",
      note: exempt
        ? "Malaysia taxes individuals on income arising in Malaysia: foreign-sourced income received by a resident individual is exempt (through 2036) and approved pensions are exempt, so no Malaysian income tax is shown. Check the conditions. Income must be passed in MYR."
        : "Uses the LHDN resident rates (0% to 30%), the MYR 9,000 individual relief, EPF relief up to MYR 4,000, the MYR 400 rebate at low incomes, and employee EPF (11%), SOCSO and EIS (0.7%). Income must be passed in MYR.",
    };
  },

  // -------------------------------------------------------------------------
  // INDONESIA, IDR
  // 2024 PPh Orang Pribadi progressive brackets.
  // No joint filing (per-NPWP individual).
  // -------------------------------------------------------------------------
  ID: ({ annualIncome, filing, isRetired }) => {
    // Rules in countryTaxRules/indonesia.ts (same as the Asia calculator).
    const tax = indonesiaTax(annualIncome, filing === "married" ? "married" : "single", !!isRetired);
    return {
      effectiveRate: clampRate(annualIncome > 0 ? tax / annualIncome : 0),
      model: "progressive-country",
      confidence: "simplified",
      label: `Indonesia PPh income tax (${INDONESIA_TAX_YEAR_LABEL} rules)`,
      missingFactor: "BPJS health and employment contributions are not included.",
      note: INDONESIA_NOTE,
    };
  },

  // -------------------------------------------------------------------------
  // SOUTH AFRICA, ZAR
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
      note: "Brackets and rebates (primary ZAR 17,235; secondary ZAR 9,444 for 65+) are correct 2024-25 SARS figures, the rebates are a real strength of this model. Key omissions: medical scheme tax credits (MTC) reduce tax by ZAR 364/mo for the primary member, which is meaningful at lower incomes. UIF (1% employee, capped at UIF benefit ceiling) is also excluded. The retirement fund deduction (up to 27.5% of taxable income, max ZAR 350,000/yr) can substantially reduce taxable income for contributing residents. Income must be passed in ZAR.",
    };
  },
EC: ({ annualIncome, isRetired, incomeScenario }) => {
  // SRI table for fiscal year 2026 (Resolution NAC-DGERCGC25-00000043), in US dollars:
  // https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/58a7f4f6-ab51-48b6-b9ff-a8e97e1a28ef/Tablas%20de%20c%C3%A1lculo%20de%20Impuesto%20a%20la%20Renta.pdf (read 2026-10-14).
  // Employees pay 9.45% to IESS, which is deducted before income tax.
  const employee = !isRetired && incomeScenario !== "remote";
  const iess = employee ? 0.0945 * annualIncome : 0;
  const base = Math.max(0, annualIncome - iess);
  const rate = progressiveTax(base, [
    { upTo: 12208, rate: 0 },
    { upTo: 15549, rate: 0.05 },
    { upTo: 20188, rate: 0.10 },
    { upTo: 26700, rate: 0.12 },
    { upTo: 35136, rate: 0.15 },
    { upTo: 46575, rate: 0.20 },
    { upTo: 62005, rate: 0.25 },
    { upTo: 82679, rate: 0.30 },
    { upTo: 109956, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ]);
  const incomeTax = rate * base;
  const effective = annualIncome > 0 ? (incomeTax + iess) / annualIncome : 0;
  return {
    effectiveRate: clampRate(effective),
    model: "progressive-country",
    confidence: "simplified",
    label: "Ecuador income tax + IESS (2026 SRI table)",
    missingFactor: "Personal-expense rebate (up to 18%) and the 13th and 14th salaries not modelled.",
    note: "Uses the Servicio de Rentas Internas table for fiscal year 2026 (exempt to $12,208, then 5% to 37%, with a new top 37% band above $109,956). Employees pay 9.45% to IESS, which is deducted before income tax; retirees and remote workers are assumed to pay none. Ecuador is dollarized, so no currency conversion is needed. Not modelled: the personal-expense rebate (18% of declared expenses up to a cap), the extra salaries and dependants.",
  };
},

UY: ({ annualIncome, isRetired }) => {
  if (isRetired) {
    return {
      effectiveRate: 0.06,
      model: "flat",
      confidence: "simplified",
      label: "Uruguay IRPF, retirement income (simplified estimate)",
      missingFactor: "7-year territorial exemption for new residents not modelled, may reduce rate to 0%.",
      note: "Simplified flat 6% effective rate applied for retirement income. New tax residents may qualify for a 7-year territorial income exemption on foreign-source income, a major planning consideration. Verify eligibility with a local advisor.",
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
    label: "Uruguay IRPF, progressive (simplified, USD-equivalent brackets)",
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
      label: "Paraguay IRP, retirement income (territorial system)",
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
      label: "Paraguay IRP, below threshold",
      missingFactor: "Territorial system means foreign-source remote salary typically not taxed at all.",
      note: "Income below Paraguay's IRP personal deduction threshold (~$12,000/yr). Zero tax modelled. Paraguay also taxes only Paraguay-source income, remote workers retaining a foreign salary typically owe zero Paraguayan income tax regardless of income level.",
    };
  }
  const tax = (annualIncome - THRESHOLD) * 0.10;
  const effectiveRate = clampRate(annualIncome > 0 ? tax / annualIncome : 0);
  return {
    effectiveRate,
    model: "flat",
    confidence: "simplified",
    label: "Paraguay IRP, flat 10% above threshold (simplified)",
    missingFactor: "Territorial system: foreign-source remote salary likely not taxed, this models local-source income only.",
    note: `Effective rate ${(effectiveRate * 100).toFixed(1)}%. Paraguay's IRP is a flat 10% on income above ~$12,000/yr. Critically: Paraguay taxes only Paraguay-source income. If you retain a foreign remote salary, your effective Paraguayan rate is likely 0%, this model assumes local-source income for conservatism. Verify with a local advisor.`,
  };
},

BO: ({ annualIncome, isRetired }) => {
  if (isRetired) {
    return {
      effectiveRate: 0.05,
      model: "flat",
      confidence: "placeholder",
      label: "Bolivia RC-IVA, retirement income (simplified estimate)",
      missingFactor: "Bolivia's RC-IVA system is non-standard, retirement and foreign income treatment not well-documented.",
      note: "Simplified 5% effective rate applied for retirement income. Bolivia's tax system is non-standard, RC-IVA applies at 13% on net salary after deductions, but retirement and foreign-source income treatment varies significantly. Verify with a local advisor before planning.",
    };
  }
  if (annualIncome < 10000) {
    return {
      effectiveRate: 0.05,
      model: "flat",
      confidence: "placeholder",
      label: "Bolivia RC-IVA, lower income (simplified estimate)",
      missingFactor: "RC-IVA deductions for minimum wages and VAT receipts not modelled.",
      note: "Simplified 5% effective rate applied. Bolivia's RC-IVA is nominally 13% but deductions for minimum wages and VAT receipts significantly reduce effective liability at lower incomes. Foreign-source income treatment varies. Verify with a local advisor.",
    };
  }
  return {
    effectiveRate: 0.10,
    model: "flat",
    confidence: "placeholder",
    label: "Bolivia RC-IVA, simplified planning estimate",
    missingFactor: "RC-IVA is 13% flat on net salary after deductions, this is a conservative approximation.",
    note: "Simplified 10% effective rate applied. Bolivia uses RC-IVA (flat 13% on net salary after deductions for minimum wages and VAT receipts) rather than a standard progressive income tax. Foreign-source income, self-employment, and business income are treated differently. Verify with a local advisor.",
  };
},

GY: ({ annualIncome, isRetired, incomeScenario }) => {
  // Rules in countryTaxRules/guyana.ts: GRA 2026 notice (Income Tax (Amendment) Act No. 3 of 2026). Income is in Guyanese dollars.
  const { incomeTax, nis } = guyanaTax(annualIncome, isRetired ? "retired" : incomeScenario === "remote" ? "remote" : "local");
  const effective = annualIncome > 0 ? (incomeTax + nis) / annualIncome : 0;
  return {
    effectiveRate: clampRate(effective),
    model: "progressive-country",
    confidence: "simplified",
    label: `Guyana income tax + NIS (${GUYANA_TAX_YEAR_LABEL})`,
    missingFactor: "Child and insurance deductions not modelled.",
    note: "Uses the Guyana Revenue Authority's 2026 rules: a personal allowance of GYD 1,680,000 or one third of income if greater, 25% on chargeable income up to GYD 3,360,000 and 35% above, and the 5.6% NIS contribution on pay up to GYD 280,000 a month, which is deducted before tax. Not modelled: the GYD 10,000 a month deduction per child, insurance premiums, second-job and overtime deductions. The old model treated the income as US dollars; income must now be passed in Guyanese dollars.",
  };
},

SR: ({ annualIncome, isRetired }) => {
  if (isRetired) {
    return {
      effectiveRate: 0.06,
      model: "flat",
      confidence: "placeholder",
      label: "Suriname income tax, retirement income (simplified estimate)",
      missingFactor: "Suriname expat tax rules are not well-documented, treat as rough estimate.",
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
    label: "Suriname income tax, simplified progressive estimate",
    missingFactor: "Limited public expat tax data, brackets are approximate and may be outdated.",
    note: `Effective rate ${(clampRate(rate) * 100).toFixed(1)}%. Simplified brackets converted to approximate USD at 36.5 SRD/USD. Suriname has limited publicly available expat tax data, this is a planning estimate only. Social security contributions not modelled. Verify with a local advisor before making decisions.`,
  };
},

VE: ({ annualIncome, isRetired }) => {
  if (isRetired) {
    return {
      effectiveRate: 0.05,
      model: "flat",
      confidence: "placeholder",
      label: "Venezuela ISLR, simplified planning estimate only",
      missingFactor: "FX volatility and inflation make all Venezuelan figures unreliable.",
      note: "Venezuela's tax, FX, and economic environment makes all estimates highly unreliable. Simplified 5% flat rate applied. Exchange rate volatility and inflation can invalidate planning figures quickly. Verify all assumptions with an independent local advisor before making any decisions.",
    };
  }
  if (annualIncome < 15000) {
    return {
      effectiveRate: 0.06,
      model: "flat",
      confidence: "placeholder",
      label: "Venezuela ISLR, simplified planning estimate only",
      missingFactor: "FX volatility and inflation make all Venezuelan figures unreliable.",
      note: "Venezuela's tax, FX, and economic environment makes all estimates highly unreliable. Simplified flat rate applied. Do not use this for financial planning without independent local verification.",
    };
  }
  return {
    effectiveRate: 0.12,
    model: "flat",
    confidence: "placeholder",
    label: "Venezuela ISLR, simplified planning estimate only",
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
        { value: "yes", label: "Yes, applying for IFICI / NHR" },
        { value: "no", label: "No, standard progressive rates apply" },
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
        { value: "PV", label: "Basque Country (foral, approx.)" },
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
        { value: "NC", label: "Navarre (foral, approx.)" },
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
        { value: "yes", label: "Yes, eligible for Beckham Law" },
        { value: "no", label: "No, standard progressive rates apply" },
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
        { value: "yes", label: "Yes, employer has applied / will apply for the ruling" },
        { value: "no", label: "No, standard Box 1 rates apply" },
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
        { value: "BAS", label: "Basilicata (1.23%, minimum)" },
        { value: "CAL", label: "Calabria (3.33%, highest)" },
        { value: "CAM", label: "Campania (3.20%)" },
        { value: "EMR", label: "Emilia-Romagna (1.33%)" },
        { value: "FVG", label: "Friuli-Venezia Giulia (1.23%)" },
        { value: "LAZ", label: "Lazio, Rome (3.33%, highest)" },
        { value: "LIG", label: "Liguria (1.73%)" },
        { value: "LOM", label: "Lombardy, Milan (1.73%)" },
        { value: "MAR", label: "Marche (1.50%)" },
        { value: "MOL", label: "Molise (2.20%)" },
        { value: "PAB", label: "Bolzano / South Tyrol (1.23%)" },
        { value: "PAT", label: "Trentino (1.23%)" },
        { value: "PIE", label: "Piedmont (1.73%)" },
        { value: "PUG", label: "Puglia (2.30%)" },
        { value: "SAR", label: "Sardinia (1.73%)" },
        { value: "SIC", label: "Sicily (2.50%)" },
        { value: "TOS", label: "Tuscany, Florence (1.73%)" },
        { value: "UMB", label: "Umbria (1.73%)" },
        { value: "VDA", label: "Aosta Valley (1.23%)" },
        { value: "VEN", label: "Veneto, Venice (1.73%)" },
      ],
    },
    {
      key: "it_flat_tax",
      label: "Are you considering Italy's Flat Tax for New Residents (€100k regime)?",
      helpText:
        "Italy's Flat Tax for New Residents substitutes a fixed €100,000/yr tax for all foreign-source income taxes, regardless of amount. Relevant for high earners with significant foreign income moving to Italy.",
      when: { incomeScenario: ["remote"] },
      options: [
        { value: "yes", label: "Yes, modelling the €100k flat tax regime" },
        { value: "no", label: "No, standard IRPEF rates apply" },
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
        { value: "yes", label: "Yes, church tax applies (~8.5% of income tax)" },
        { value: "no", label: "No, not a registered church member" },
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

/** Places where the U.S. tax a person owes abroad is not modeled: the United States itself and U.S. territories, which have their own rules. */
export const NO_US_OVERLAY = new Set(["US", "PR", "VI", "GU", "AS", "MP"]);

export const US_TAX_STATUS_KEY = "us_tax_status";

export const US_TAX_STATUS_QUESTION: ConditionalQuestion = {
  key: US_TAX_STATUS_KEY,
  label: "Do you owe U.S. income tax while living there?",
  helpText:
    "U.S. citizens and green-card holders are taxed by the U.S. on worldwide income wherever they live, with credits for foreign tax paid and, for wages, an exclusion up to $132,900 in 2026 (IRS Rev. Proc. 2025-32). Choose Yes to add that to the estimate.",
  options: [
    { value: "yes", label: "Yes, I am a U.S. citizen or green-card holder" },
    { value: "no", label: "No" },
  ],
};

export const US_SELF_EMPLOYED_KEY = "us_self_employed";

export const US_SELF_EMPLOYED_QUESTION: ConditionalQuestion = {
  key: US_SELF_EMPLOYED_KEY,
  label: "Are you self-employed or a freelancer?",
  helpText:
    "Only matters if you owe U.S. tax. The foreign earned income exclusion does not remove U.S. self-employment tax (15.3% on 92.35% of net earnings, 2026), unless the country has a Social Security agreement with the U.S. that puts you under its system.",
  options: [
    { value: "yes", label: "Yes, I am self-employed or a freelancer" },
    { value: "no", label: "No, I am an employee or retired" },
  ],
};

/**
 * Countries with a U.S. Social Security (totalization) agreement in force, from the Social Security Administration's
 * list at https://www.ssa.gov/international/agreements_overview.html (read 2026-10-13). Many of these assign a
 * self-employed person's coverage to the country of residence, so the U.S. self-employment tax is treated as not owed;
 * some agreements work differently, so the estimate says to confirm.
 */
export const SSA_AGREEMENT_COUNTRIES: ReadonlySet<string> = new Set([
  "IT", "DE", "CH", "BE", "NO", "CA", "GB", "SE", "ES", "FR", "PT", "NL", "AT", "FI", "IE", "LU", "GR", "KR", "CL",
  "AU", "JP", "DK", "CZ", "PL", "SK", "HU", "BR", "UY", "SI", "IS", "RO",
]);

/**
 * U.S. self-employment tax for a year, 2026, in dollars: 12.4% Social Security on net earnings up to the wage base,
 * 2.9% Medicare on all of it, and 0.9% Additional Medicare above the threshold. Net earnings are 92.35% of income.
 * `deductible` is the half of the Social Security and Medicare parts that reduces income tax.
 */
export function usSelfEmploymentTax(incomeUsd: number, filing: FilingStatus): { tax: number; deductible: number } {
  const earnings = Math.max(0, incomeUsd) * 0.9235;
  const socialSecurity = Math.min(earnings, PAYROLL_2026.socialSecurityWageBase) * PAYROLL_2026.socialSecurityRate * 2;
  const medicare = earnings * PAYROLL_2026.medicareRate * 2;
  const additional = Math.max(0, earnings - PAYROLL_2026.additionalMedicareThreshold[filing]) * PAYROLL_2026.additionalMedicareRate;
  return { tax: socialSecurity + medicare + additional, deductible: (socialSecurity + medicare) / 2 };
}

export function getConditionalQuestionsForCountry(
  countryCode: string,
  incomeScenario: IncomeScenario
): ConditionalQuestion[] {
  const questions = (COUNTRY_TAX_QUESTIONS[countryCode] ?? []).filter((q) => {
    if (!q.when?.incomeScenario) return true;
    return q.when.incomeScenario.includes(incomeScenario);
  });
  return NO_US_OVERLAY.has(countryCode) ? questions : [...questions, US_TAX_STATUS_QUESTION, US_SELF_EMPLOYED_QUESTION];
}

/**
 * U.S. federal income tax on a year's income for someone living abroad, in dollars, and the part of the income the
 * exclusion removed. Wages (earned income) can use the foreign earned income exclusion; retirement income cannot.
 * The excluded amount still sets the rate on the rest (the stacking rule of the Foreign Earned Income Tax Worksheet).
 */
export function usFederalTaxAbroad(incomeUsd: number, filing: FilingStatus, earned: boolean): { tax: number; excluded: number } {
  const income = Math.max(0, incomeUsd);
  const brackets = FEDERAL_2026.brackets[filing];
  const tax = (amount: number) => progressiveTax(amount, brackets) * Math.max(0, amount);
  const standardDeduction = FEDERAL_2026.standardDeduction[filing];
  const excluded = earned ? Math.min(income, FOREIGN_EARNED_INCOME_EXCLUSION_2026) : 0;
  const taxable = Math.max(0, income - excluded - standardDeduction);
  return { tax: tax(taxable + excluded) - (excluded > 0 ? tax(excluded) : 0), excluded };
}

/**
 * Adds the U.S. tax a citizen or green-card holder still owes. The foreign tax is credited against U.S. tax on the
 * income that is not excluded, so the household pays the foreign tax plus any U.S. tax above it.
 */
export const US_TAX_ABROAD_MISSING_FACTOR = "U.S. state tax and income tax treaties are not included.";

/**
 * The U.S. tax a citizen or green-card holder owes on top of the foreign tax, in dollars, with the note that explains it.
 * `annualIncome` is in the destination's local currency; `foreignTaxUsd` is the foreign tax already estimated.
 */
export function usTaxAbroadAddition(args: {
  countryCode: string; annualIncome: number; filing: FilingStatus; incomeScenario: IncomeScenario; foreignTaxUsd: number;
  /** Self-employed: adds U.S. self-employment tax unless the country has a Social Security agreement with the U.S. */
  selfEmployed?: boolean;
}): { addedUsd: number; note: string } {
  const incomeUsd = args.annualIncome / (USD_TO_LOCAL[args.countryCode] ?? 1);
  const earned = args.incomeScenario !== "retired";
  if (!(incomeUsd > 0)) return { addedUsd: 0, note: "" };
  const selfEmployed = Boolean(args.selfEmployed) && earned;
  const covered = SSA_AGREEMENT_COUNTRIES.has(args.countryCode);
  const se = selfEmployed && !covered ? usSelfEmploymentTax(incomeUsd, args.filing) : { tax: 0, deductible: 0 };
  // Half of the self-employment tax is deducted before income tax; the exclusion does not remove the tax itself.
  const { tax: usTax, excluded } = usFederalTaxAbroad(incomeUsd - se.deductible, args.filing, earned);
  const foreignOnTaxedIncome = args.foreignTaxUsd * ((incomeUsd - excluded) / incomeUsd);
  const seNote = !selfEmployed ? "" : covered
    ? " Self-employment: this country has a Social Security agreement with the U.S., which for many agreements puts a self-employed resident under the local system only, so no U.S. self-employment tax is added; confirm the rule in your country's agreement."
    : " Self-employment tax is added at 15.3% on 92.35% of income (2026 rates), since there is no Social Security agreement with this country, and it is not reduced by the exclusion or the foreign tax credit.";
  return {
    addedUsd: Math.max(0, usTax - foreignOnTaxedIncome) + se.tax,
    note: seNote + ` ` + `U.S. tax added for a citizen or green-card holder: 2026 federal brackets${earned ? `, the $${FOREIGN_EARNED_INCOME_EXCLUSION_2026.toLocaleString("en-US")} foreign earned income exclusion` : ""} and a credit for foreign tax paid. It assumes the income is one person's, that you qualify for the exclusion (bona fide residence or 330 days abroad), and that U.S. state tax does not apply; income tax treaties and the Foreign Tax Credit's category limits are not modeled.`.trim(),
  };
}

export function withUsTaxAbroad(
  base: TaxEstimateResult,
  countryCode: string,
  annualIncome: number,
  filing: FilingStatus,
  incomeScenario: IncomeScenario,
  selfEmployed = false,
): TaxEstimateResult {
  const incomeUsd = annualIncome / (USD_TO_LOCAL[countryCode] ?? 1);
  if (!(incomeUsd > 0)) return base;
  const foreignTaxUsd = base.effectiveRate * incomeUsd;
  const { addedUsd, note } = usTaxAbroadAddition({ countryCode, annualIncome, filing, incomeScenario, foreignTaxUsd, selfEmployed });
  const confidence: TaxConfidence = base.confidence === "verified" ? "partial" : base.confidence;
  return {
    ...base,
    effectiveRate: clampRate((foreignTaxUsd + addedUsd) / incomeUsd),
    confidence,
    label: `${base.label} + U.S. tax`,
    missingFactor: US_TAX_ABROAD_MISSING_FACTOR,
    note: `${base.note} ${note}`,
  };
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

  const base = estimator({
    annualIncome,
    filing,
    isRetired,
    incomeScenario,
    answers,
  });
  if (answers[US_TAX_STATUS_KEY] === "yes" && !NO_US_OVERLAY.has(countryCode)) {
    return withUsTaxAbroad(base, countryCode, annualIncome, filing, incomeScenario, answers[US_SELF_EMPLOYED_KEY] === "yes");
  }
  return base;
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