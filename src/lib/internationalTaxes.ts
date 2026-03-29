// ---------------------------------------------------------------------------
// internationalTaxes.ts
//
// CONTRACT:
//   annualIncome must always be passed in LOCAL CURRENCY for the destination
//   country. The caller is responsible for FX conversion before calling
//   estimateInternationalTax(). No internal FX conversion is performed here.
//
// Local currencies by country:
//   US=USD, GB=GBP, PT=EUR, ES=EUR, MX=MXN, CA=CAD, DE=EUR, NL=EUR,
//   CR=CRC, FR=EUR, IT=EUR, IE=EUR, AU=AUD, NZ=NZD, JP=JPY, KR=KRW,
//   AE=AED, SG=SGD, CH=CHF, DK=DKK, SE=SEK, NO=NOK, FI=EUR, PL=PLN,
//   CZ=CZK, HU=HUF, GR=EUR, TR=TRY, HR=EUR, EE=EUR, LV=EUR, LT=EUR,
//   RO=RON, BG=BGN, SI=EUR, SK=EUR, MT=EUR, CY=EUR, PA=USD, CO=COP,
//   BR=BRL, AR=ARS, CL=CLP, PE=PEN, TH=THB, VN=VND, MY=MYR, ID=IDR,
//   ZA=ZAR
// ---------------------------------------------------------------------------

export type FilingStatus = "single" | "married";

export type TaxModelKind =
  | "none"
  | "progressive-country"
  | "country-plus-province"
  | "country-plus-local"
  | "flat"
  | "placeholder";

export type TaxConfidence = "verified" | "partial" | "placeholder";

export type TaxEstimateResult = {
  effectiveRate: number;
  model: TaxModelKind;
  confidence: TaxConfidence;
  label: string;
  note: string;
};

type TaxEstimator = (args: {
  annualIncome: number; // always in local currency — caller converts
  filing: FilingStatus;
  isRetired: boolean;
}) => TaxEstimateResult;

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
  // UNITED STATES — USD — Federal only
  // Real separate brackets for single vs married filing jointly.
  // -------------------------------------------------------------------------
  US: ({ annualIncome, filing, isRetired }) => {
    if (isRetired) {
      const rate = progressiveTax(annualIncome, [
        { upTo: 25000, rate: 0.00 },
        { upTo: 34000, rate: 0.085 },
        { upTo: 80000, rate: 0.15 },
        { upTo: 150000, rate: 0.22 },
        { upTo: Infinity, rate: 0.24 },
      ]);
      return {
        effectiveRate: clampRate(rate),
        model: "progressive-country",
        confidence: "partial",
        label: "Federal tax estimate only",
        note: "Uses a U.S. federal tax estimate for planning. State and city taxes are not included.",
      };
    }
    const brackets =
      filing === "married"
        ? [
            { upTo: 23200, rate: 0.10 },
            { upTo: 94300, rate: 0.12 },
            { upTo: 201050, rate: 0.22 },
            { upTo: 383900, rate: 0.24 },
            { upTo: 487450, rate: 0.32 },
            { upTo: 731200, rate: 0.35 },
            { upTo: Infinity, rate: 0.37 },
          ]
        : [
            { upTo: 11600, rate: 0.10 },
            { upTo: 47150, rate: 0.12 },
            { upTo: 100525, rate: 0.22 },
            { upTo: 191950, rate: 0.24 },
            { upTo: 243725, rate: 0.32 },
            { upTo: 609350, rate: 0.35 },
            { upTo: Infinity, rate: 0.37 },
          ];
    return {
      effectiveRate: clampRate(progressiveTax(annualIncome, brackets)),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: US federal tax only",
      note: "2024 federal brackets (single or MFJ). State and local taxes not included.",
    };
  },

  // -------------------------------------------------------------------------
  // UNITED KINGDOM — GBP
  // UK has no joint filing — married rate is identical to single.
  // -------------------------------------------------------------------------
  GB: ({ annualIncome, isRetired }) => {
    const personalAllowance = isRetired ? 13000 : 12570;
    const taxable = Math.max(0, annualIncome - personalAllowance);
    const incomeTaxRate = annualIncome > 0
      ? (progressiveTax(taxable, [
          { upTo: 37700, rate: 0.20 },
          { upTo: 125140, rate: 0.40 },
          { upTo: Infinity, rate: 0.45 },
        ]) * taxable) / annualIncome
      : 0;
    const ni = isRetired ? 0 : 0.06;
    return {
      effectiveRate: clampRate(incomeTaxRate + ni),
      model: "progressive-country",
      confidence: "partial",
     label: "UK tax and NI estimate",
note: "Uses a simplified UK income tax and National Insurance estimate for planning. Scotland uses different rates, and some location-specific rules are not fully modeled.",
    };
  },

  // -------------------------------------------------------------------------
  // PORTUGAL — EUR
  // No formal joint filing benefit modeled (household split is complex).
  // -------------------------------------------------------------------------
  PT: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 8000, rate: 0.13 },
      { upTo: 12000, rate: 0.165 },
      { upTo: 17000, rate: 0.22 },
      { upTo: 22000, rate: 0.25 },
      { upTo: 28000, rate: 0.32 },
      { upTo: 41000, rate: 0.355 },
      { upTo: 44000, rate: 0.43 },
      { upTo: 80000, rate: 0.45 },
      { upTo: Infinity, rate: 0.48 },
    ]);
    const retiredAdj = isRetired ? -0.03 : 0;
 return {
  effectiveRate: clampRate(rate + retiredAdj),
  model: "progressive-country",
  confidence: "placeholder",
  label: "Simplified Portugal tax estimate",
  note: "Uses a simplified Portugal tax estimate for planning. Household splitting, detailed deductions, and some residency-specific rules are not fully modeled.",
};
  },

  // -------------------------------------------------------------------------
  // SPAIN — EUR
  // Joint filing: declaración conjunta applies a fixed EUR 3,400 deduction.
  // -------------------------------------------------------------------------
  ES: ({ annualIncome, filing, isRetired: _isRetired }) => {
    const jointDeduction = filing === "married" ? 3400 : 0;
    const taxable = Math.max(0, annualIncome - jointDeduction);
    const rate = progressiveTax(taxable, [
      { upTo: 12450, rate: 0.19 },
      { upTo: 20200, rate: 0.24 },
      { upTo: 35200, rate: 0.30 },
      { upTo: 60000, rate: 0.37 },
      { upTo: 300000, rate: 0.45 },
      { upTo: Infinity, rate: 0.47 },
    ]);
    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "partial",
     label: "Spain tax estimate",
note: "Uses a simplified Spain income tax estimate for planning. Joint filing is modeled with a basic deduction, but regional surcharges and some detailed rules are not fully included.",
    };
  },

  // -------------------------------------------------------------------------
  // MEXICO — MXN
  // No joint filing. Same brackets for all statuses.
  // -------------------------------------------------------------------------
  MX: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 8952, rate: 0.0192 },
      { upTo: 75984, rate: 0.064 },
      { upTo: 133536, rate: 0.1088 },
      { upTo: 155232, rate: 0.16 },
      { upTo: 185852, rate: 0.1792 },
      { upTo: 374838, rate: 0.2136 },
      { upTo: 590796, rate: 0.2352 },
      { upTo: 1127926, rate: 0.30 },
      { upTo: 1503902, rate: 0.32 },
      { upTo: Infinity, rate: 0.35 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Mexico ISR federal income tax",
      note: "No joint filing in Mexico. Same ISR brackets apply to all statuses and retirement. Income must be passed in MXN.",
    };
  },

  // -------------------------------------------------------------------------
  // CANADA — CAD
  // Federal brackets + broad provincial overlay.
  // Married: spousal amount credit (~CAD 2,400 tax credit equivalent).
  // Retired: age amount credit (~CAD 1,800 tax credit equivalent).
  // -------------------------------------------------------------------------
  CA: ({ annualIncome, filing, isRetired }) => {
    const federalRate = progressiveTax(annualIncome, [
      { upTo: 57375, rate: 0.15 },
      { upTo: 114750, rate: 0.205 },
      { upTo: 177882, rate: 0.26 },
      { upTo: 253414, rate: 0.29 },
      { upTo: Infinity, rate: 0.33 },
    ]);
    const provincialOverlay = 0.08;
    const spousalCredit = filing === "married" && annualIncome > 0 ? 2400 / annualIncome : 0;
    const ageCredit = isRetired && annualIncome > 0 ? 1800 / annualIncome : 0;
    return {
      effectiveRate: clampRate(federalRate + provincialOverlay - spousalCredit - ageCredit),
      model: "country-plus-province",
      confidence: "partial",
      label: "Canada federal and provincial estimate",
note: "Uses a simplified Canada tax estimate for planning. Provincial taxes vary widely, so this uses a broad provincial adjustment rather than a province-specific calculation.",
    };
  },

  // -------------------------------------------------------------------------
  // GERMANY — EUR
  // Ehegattensplitting: income halved, tax computed, then doubled.
  // -------------------------------------------------------------------------
  DE: ({ annualIncome, filing }) => {
    const taxablePerUnit = filing === "married" ? annualIncome / 2 : annualIncome;
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
    const solidarityThresholdTax = filing === "married" ? 34086 : 17543;
    const solidarity = totalTax > solidarityThresholdTax ? baseTaxRate * 0.055 : 0;
    return {
      effectiveRate: clampRate(baseTaxRate + solidarity),
      model: "progressive-country",
      confidence: "partial",
      label: "Germany tax estimate",
note: "Uses a simplified Germany tax estimate for planning. Married filing includes income splitting, but church tax, social contributions, and some detailed rules are not fully modeled.",
    };
  },

  // -------------------------------------------------------------------------
  // NETHERLANDS — EUR
  // No joint filing. Retired: AOW-recipient reduced rate below ~EUR 38k.
  // -------------------------------------------------------------------------
  NL: ({ annualIncome, isRetired }) => {
    const brackets = isRetired
      ? [
          { upTo: 38098, rate: 0.1936 },
          { upTo: Infinity, rate: 0.495 },
        ]
      : [
          { upTo: 75518, rate: 0.3697 },
          { upTo: Infinity, rate: 0.495 },
        ];
    return {
      effectiveRate: clampRate(progressiveTax(annualIncome, brackets)),
      model: "progressive-country",
      confidence: "partial",
     label: "Netherlands income tax estimate",
note: "Uses a simplified Netherlands Box 1 tax estimate for planning. Joint filing is not modeled, and Box 2 and Box 3 taxes are not included.",
    };
  },

  // -------------------------------------------------------------------------
  // COSTA RICA — CRC
  // No joint filing. Same brackets for all statuses.
  // -------------------------------------------------------------------------
  CR: ({ annualIncome }) => {
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
      confidence: "partial",
      label: "Partial: Costa Rica progressive income tax",
      note: "No joint filing in Costa Rica. Same brackets apply to all statuses and retirement. Income must be passed in CRC.",
    };
  },

  // -------------------------------------------------------------------------
  // FRANCE — EUR
  // Quotient familial: income / parts, tax × parts.
  // Single = 1 part, married = 2 parts.
  // Retired: CSG at reduced 6.6% instead of 9.2%.
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
    const socialCharges = isRetired ? 0.066 : 0.092;
    return {
      effectiveRate: clampRate(incomeTaxRate + socialCharges),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: France quotient familial + social charges",
      note: "Married uses 2-part quotient familial. Retired uses reduced CSG rate (6.6%). Child parts and deductions not modeled. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // ITALY — EUR
  // No joint filing. Same brackets for all statuses and retirement.
  // -------------------------------------------------------------------------
  IT: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 28000, rate: 0.23 },
      { upTo: 50000, rate: 0.35 },
      { upTo: Infinity, rate: 0.43 },
    ]);
    return {
      effectiveRate: clampRate(rate + 0.02),
      model: "country-plus-local",
      confidence: "partial",
      label: "Partial: Italy IRPEF + regional overlay",
      note: "No joint filing in Italy. Regional add-on modeled at 2% average. Same brackets apply to retirement income. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // IRELAND — EUR
  // Married: standard rate band widens from EUR 42k to EUR 51k (single earner).
  // USC and PRSI waived in retirement.
  // -------------------------------------------------------------------------
  IE: ({ annualIncome, filing, isRetired }) => {
    const standardBand = filing === "married" ? 51000 : 42000;
    const payeRate = progressiveTax(annualIncome, [
      { upTo: standardBand, rate: 0.20 },
      { upTo: Infinity, rate: 0.40 },
    ]);
    const uscRate = isRetired ? 0 : progressiveTax(annualIncome, [
      { upTo: 12012, rate: 0.005 },
      { upTo: 25760, rate: 0.02 },
      { upTo: 70044, rate: 0.04 },
      { upTo: Infinity, rate: 0.08 },
    ]);
    const prsi = isRetired ? 0 : 0.04;
    return {
      effectiveRate: clampRate(payeRate + uscRate + prsi),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Ireland PAYE + USC + PRSI",
      note: "Married widens standard rate band to EUR 51k (single-earner couple). USC and PRSI waived in retirement. Tax credits not modeled. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // AUSTRALIA — AUD
  // No joint filing. Medicare Levy reduced for retirees.
  // -------------------------------------------------------------------------
  AU: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 18200, rate: 0.00 },
      { upTo: 45000, rate: 0.19 },
      { upTo: 120000, rate: 0.325 },
      { upTo: 180000, rate: 0.37 },
      { upTo: Infinity, rate: 0.45 },
    ]);
    const medicareLevy = isRetired ? 0.01 : 0.02;
    return {
      effectiveRate: clampRate(rate + medicareLevy),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Australia progressive + Medicare Levy",
      note: "No joint filing in Australia. Medicare Levy modeled at 1% for retired. Income must be passed in AUD.",
    };
  },

  // -------------------------------------------------------------------------
  // NEW ZEALAND — NZD
  // No joint filing. NZ Super is taxable at same rates.
  // -------------------------------------------------------------------------
  NZ: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 14000, rate: 0.105 },
      { upTo: 48000, rate: 0.175 },
      { upTo: 70000, rate: 0.30 },
      { upTo: 180000, rate: 0.33 },
      { upTo: Infinity, rate: 0.39 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: New Zealand PAYE",
      note: "No joint filing in NZ. NZ Super is taxable income at the same rates. ACC levies not included. Income must be passed in NZD.",
    };
  },

  // -------------------------------------------------------------------------
  // JAPAN — JPY
  // No joint filing. Reconstruction surtax + flat 10% local inhabitant tax.
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
    const pensionDeduction = isRetired ? -0.02 : 0;
    return {
      effectiveRate: clampRate(nationalRate + reconstructionSurtax + localTax + pensionDeduction),
      model: "country-plus-local",
      confidence: "partial",
      label: "Partial: Japan national + reconstruction surtax + local",
      note: "No joint filing in Japan. Local inhabitant tax modeled as flat 10% overlay. Retirement uses modest pension deduction estimate. Income must be passed in JPY.",
    };
  },

  // -------------------------------------------------------------------------
  // SOUTH KOREA — KRW
  // No joint filing. Local income tax = 10% of national tax.
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
      confidence: "partial",
      label: "Partial: Korea national + local surtax",
      note: "No joint filing in Korea. Local income tax is 10% of national tax liability. Income must be passed in KRW.",
    };
  },

  // -------------------------------------------------------------------------
  // UNITED ARAB EMIRATES — AED — No income tax
  // -------------------------------------------------------------------------
  AE: () => ({
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
   label: "No personal income tax",
note: "The UAE does not levy personal income tax on employment income in this planning model.",
  }),

  // -------------------------------------------------------------------------
  // SINGAPORE — SGD
  // No joint filing. Retired: SGD 8,000 earned income / senior relief.
  // -------------------------------------------------------------------------
  SG: ({ annualIncome, isRetired }) => {
    const seniorRelief = isRetired ? 8000 : 0;
    const taxable = Math.max(0, annualIncome - seniorRelief);
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
      confidence: "partial",
      label: "Partial: Singapore resident progressive",
      note: "No joint filing in Singapore. Retired models SGD 8,000 senior relief. Tax residency significantly affects actual liability. Income must be passed in SGD.",
    };
  },

  // -------------------------------------------------------------------------
  // SWITZERLAND — CHF
  // Real separate federal scales for single vs married.
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
    return {
      effectiveRate: clampRate(federalRate + 0.12),
      model: "country-plus-province",
      confidence: "partial",
      label: "Partial: Switzerland federal + broad cantonal estimate",
      note: "Married uses Swiss federal married scale. Cantonal overlay mid-range estimate (Zug ~12%, Geneva ~24%). Income must be passed in CHF.",
    };
  },

  // -------------------------------------------------------------------------
  // DENMARK — DKK
  // No joint filing. AM-bidrag (8%) not payable in retirement.
  // -------------------------------------------------------------------------
  DK: ({ annualIncome, isRetired }) => {
    const amBidrag = isRetired ? 0 : annualIncome * 0.08;
    const taxableAfterAM = Math.max(0, annualIncome - amBidrag);
    const taxRate = progressiveTax(taxableAfterAM, [
      { upTo: 50000, rate: 0.37 },
      { upTo: Infinity, rate: 0.52 },
    ]);
    const effectiveRate = annualIncome > 0
      ? (taxRate * taxableAfterAM) / annualIncome + (isRetired ? 0 : 0.08)
      : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Denmark income tax + AM-bidrag",
      note: "No joint filing in Denmark. AM-bidrag (8%) not payable in retirement. Income must be passed in DKK.",
    };
  },

  // -------------------------------------------------------------------------
  // SWEDEN — SEK
  // No joint filing. Municipal + state tax.
  // -------------------------------------------------------------------------
  SE: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 22208, rate: 0.00 },
      { upTo: 598500, rate: 0.32 },
      { upTo: Infinity, rate: 0.52 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Sweden municipal + state tax",
      note: "No joint filing in Sweden. Income must be passed in SEK.",
    };
  },

  // -------------------------------------------------------------------------
  // NORWAY — NOK
  // No joint filing.
  // -------------------------------------------------------------------------
  NO: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 70000, rate: 0.22 },
      { upTo: 197000, rate: 0.237 },
      { upTo: 279000, rate: 0.267 },
      { upTo: 643800, rate: 0.337 },
      { upTo: 969200, rate: 0.437 },
      { upTo: Infinity, rate: 0.477 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Norway general income + bracket tax",
      note: "No joint filing in Norway. National Insurance contributions not included. Income must be passed in NOK.",
    };
  },

  // -------------------------------------------------------------------------
  // FINLAND — EUR
  // No joint filing. State tax + municipal overlay (~8.5% average).
  // -------------------------------------------------------------------------
  FI: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 20500, rate: 0.126 },
      { upTo: 30500, rate: 0.19 },
      { upTo: 50400, rate: 0.30 },
      { upTo: 88200, rate: 0.34 },
      { upTo: Infinity, rate: 0.355 },
    ]);
    return {
      effectiveRate: clampRate(rate + 0.085),
      model: "country-plus-local",
      confidence: "partial",
      label: "Partial: Finland state + municipal tax",
      note: "No joint filing in Finland. Municipal overlay at 8.5% average. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // POLAND — PLN
  // Joint income splitting allowed for married couples.
  // Social contributions not payable on pension.
  // -------------------------------------------------------------------------
  PL: ({ annualIncome, filing, isRetired }) => {
    const taxablePerUnit = filing === "married" ? annualIncome / 2 : annualIncome;
    const ratePerUnit = progressiveTax(taxablePerUnit, [
      { upTo: 30000, rate: 0.00 },
      { upTo: 120000, rate: 0.12 },
      { upTo: Infinity, rate: 0.32 },
    ]);
    const totalIncomeTax = ratePerUnit * (filing === "married" ? 2 : 1);
    const incomeTaxRate = annualIncome > 0 ? totalIncomeTax / annualIncome : 0;
    const socialOverlay = isRetired ? 0 : 0.135;
    return {
      effectiveRate: clampRate(incomeTaxRate + socialOverlay),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Poland PIT + social contributions",
      note: "Married uses income splitting. Social contributions (~13.5%) not payable on pension income. Income must be passed in PLN.",
    };
  },

  // -------------------------------------------------------------------------
  // CZECH REPUBLIC — CZK
  // Flat 15%; solidarity surcharge (8%) above CZK 1,935,552.
  // No joint filing.
  // -------------------------------------------------------------------------
  CZ: ({ annualIncome, isRetired }) => {
    const solidarityThreshold = 1935552;
    const baseTax = annualIncome * 0.15;
    const solidarityTax = annualIncome > solidarityThreshold
      ? (annualIncome - solidarityThreshold) * 0.08
      : 0;
    const incomeTaxRate = annualIncome > 0 ? (baseTax + solidarityTax) / annualIncome : 0;
    const socialOverlay = isRetired ? 0 : 0.11;
    return {
      effectiveRate: clampRate(incomeTaxRate + socialOverlay),
      model: "flat",
      confidence: "partial",
      label: "Partial: Czech 15% flat (23% above threshold) + social",
      note: "No joint filing in CZ. Solidarity surcharge (8%) above CZK 1,935,552. Social/health contributions not payable on pension. Income must be passed in CZK.",
    };
  },

  // -------------------------------------------------------------------------
  // HUNGARY — HUF
  // Flat 15%. No joint filing.
  // -------------------------------------------------------------------------
  HU: ({ annualIncome, isRetired }) => {
    const socialOverlay = isRetired ? 0 : 0.185;
    const effectiveRate = annualIncome > 0 ? 0.15 + socialOverlay : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "flat",
      confidence: "partial",
      label: "Partial: Hungary 15% flat + social contributions",
      note: "No joint filing in Hungary. Social contributions (~18.5%) not payable on pension. Income must be passed in HUF.",
    };
  },

  // -------------------------------------------------------------------------
  // GREECE — EUR
  // No joint filing. Retired: reduced social contribution rate (6%).
  // -------------------------------------------------------------------------
  GR: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 10000, rate: 0.09 },
      { upTo: 20000, rate: 0.22 },
      { upTo: 30000, rate: 0.28 },
      { upTo: 40000, rate: 0.36 },
      { upTo: Infinity, rate: 0.44 },
    ]);
    const socialOverlay = isRetired ? 0.06 : 0.14;
    return {
      effectiveRate: clampRate(rate + socialOverlay),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Greece progressive + social contributions",
      note: "No joint filing in Greece. Retired uses reduced social contribution rate (6%). Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // TURKEY — TRY
  // No joint filing. Brackets subject to frequent annual revision.
  // -------------------------------------------------------------------------
  TR: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 110000, rate: 0.15 },
      { upTo: 230000, rate: 0.20 },
      { upTo: 580000, rate: 0.27 },
      { upTo: 3000000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Turkey progressive income tax",
      note: "No joint filing in Turkey. Brackets revised annually — verify for current year. Income must be passed in TRY.",
    };
  },

  // -------------------------------------------------------------------------
  // CROATIA — EUR
  // No joint filing. Local surtax averaged at 6%.
  // -------------------------------------------------------------------------
  HR: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 50400, rate: 0.20 },
      { upTo: Infinity, rate: 0.30 },
    ]);
    return {
      effectiveRate: clampRate(rate + 0.06),
      model: "country-plus-local",
      confidence: "partial",
      label: "Partial: Croatia progressive + surtax",
      note: "No joint filing in Croatia. Local surtax averaged at 6% (Zagreb 18%, most others lower). Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // ESTONIA — EUR
  // Flat 20%. No joint filing. Social contributions not payable on pension.
  // -------------------------------------------------------------------------
  EE: ({ annualIncome, isRetired }) => {
    const socialOverlay = isRetired ? 0 : 0.13;
    const effectiveRate = annualIncome > 0 ? 0.20 + socialOverlay : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "flat",
      confidence: "partial",
      label: "Partial: Estonia 20% flat + social contributions",
      note: "No joint filing in Estonia. Employee social contributions (~13%) not payable on pension. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // LATVIA — EUR
  // Progressive. No joint filing.
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
      confidence: "partial",
      label: "Partial: Latvia progressive + social contributions",
      note: "No joint filing in Latvia. Social contributions (~10.5%) not payable on pension. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // LITHUANIA — EUR
  // Progressive. No joint filing.
  // -------------------------------------------------------------------------
  LT: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 101094, rate: 0.20 },
      { upTo: Infinity, rate: 0.32 },
    ]);
    const socialOverlay = isRetired ? 0 : 0.125;
    return {
      effectiveRate: clampRate(rate + socialOverlay),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Lithuania progressive + social contributions",
      note: "No joint filing in Lithuania. Social insurance (~12.5%) not payable on pension. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // ROMANIA — RON
  // Flat 10%. High social contributions. Retired: health contribution only.
  // -------------------------------------------------------------------------
  RO: ({ annualIncome, isRetired }) => {
    const socialOverlay = isRetired ? 0.10 : 0.35;
    const effectiveRate = annualIncome > 0 ? 0.10 + socialOverlay : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "flat",
      confidence: "partial",
      label: "Partial: Romania 10% flat + social contributions",
      note: "No joint filing in Romania. Employee social contributions are substantial (~35%). Retired pays 10% income tax + health contribution (~10%). Income must be passed in RON.",
    };
  },

  // -------------------------------------------------------------------------
  // BULGARIA — BGN
  // Flat 10%. No joint filing. Social contributions not payable on pension.
  // -------------------------------------------------------------------------
  BG: ({ annualIncome, isRetired }) => {
    const socialOverlay = isRetired ? 0 : 0.1378;
    const effectiveRate = annualIncome > 0 ? 0.10 + socialOverlay : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "flat",
      confidence: "partial",
      label: "Partial: Bulgaria 10% flat + social contributions",
      note: "No joint filing in Bulgaria. Income must be passed in BGN.",
    };
  },

  // -------------------------------------------------------------------------
  // SLOVENIA — EUR
  // Progressive. No joint filing.
  // -------------------------------------------------------------------------
  SI: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 9066, rate: 0.16 },
      { upTo: 27322, rate: 0.26 },
      { upTo: 54641, rate: 0.33 },
      { upTo: 81862, rate: 0.39 },
      { upTo: Infinity, rate: 0.50 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Slovenia progressive income tax",
      note: "No joint filing in Slovenia. Employee social contributions not included. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // SLOVAKIA — EUR
  // Progressive. No joint filing. Social contributions not payable on pension.
  // -------------------------------------------------------------------------
  SK: ({ annualIncome, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 41445, rate: 0.19 },
      { upTo: Infinity, rate: 0.25 },
    ]);
    const socialOverlay = isRetired ? 0 : 0.138;
    return {
      effectiveRate: clampRate(rate + socialOverlay),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Slovakia progressive + social contributions",
      note: "No joint filing in Slovakia. Health and social contributions not payable on pension. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // MALTA — EUR
  // Real separate single and married rate scales (legislated).
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
      label: "Partial: Malta progressive (separate single/married scales)",
      note: "Malta has legislated separate tax scales for single and married filers. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // CYPRUS — EUR
  // Progressive. No joint filing.
  // -------------------------------------------------------------------------
  CY: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 19500, rate: 0.00 },
      { upTo: 28000, rate: 0.20 },
      { upTo: 36300, rate: 0.25 },
      { upTo: 60000, rate: 0.30 },
      { upTo: Infinity, rate: 0.35 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Cyprus progressive income tax",
      note: "No joint filing in Cyprus. Special Defence Contribution on passive income not included. Income must be passed in EUR.",
    };
  },

  // -------------------------------------------------------------------------
  // PANAMA — USD
  // Progressive. No joint filing. Territorial tax system.
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
      label: "Partial: Panama progressive income tax",
      note: "No joint filing in Panama. Territorial system — foreign-sourced income generally not taxed. Income in USD.",
    };
  },

  // -------------------------------------------------------------------------
  // COLOMBIA — COP
  // UVT-based brackets. No joint filing.
  // -------------------------------------------------------------------------
  CO: ({ annualIncome }) => {
    const uvtValue = 47065; // 1 UVT = COP 47,065 (2024)
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
      confidence: "partial",
      label: "Partial: Colombia UVT-based progressive tax",
      note: "No joint filing in Colombia. UVT value COP 47,065 (2024). Income must be passed in COP.",
    };
  },

  // -------------------------------------------------------------------------
  // BRAZIL — BRL
  // Progressive. No joint filing. Retired (65+): pension deduction applies.
  // -------------------------------------------------------------------------
  BR: ({ annualIncome, isRetired }) => {
    const pensionDeduction = isRetired ? 24751.74 : 0;
    const taxable = Math.max(0, annualIncome - pensionDeduction);
    const rate = progressiveTax(taxable, [
      { upTo: 28559.7, rate: 0.00 },
      { upTo: 42750, rate: 0.075 },
      { upTo: 57022.5, rate: 0.15 },
      { upTo: 85500, rate: 0.225 },
      { upTo: Infinity, rate: 0.275 },
    ]);
    const effectiveRate = annualIncome > 0 ? (rate * taxable) / annualIncome : 0;
    return {
      effectiveRate: clampRate(effectiveRate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Brazil IRPF progressive",
      note: "No joint filing in Brazil. Retired (65+) models BRL 24,751.74 annual pension deduction. Income must be passed in BRL.",
    };
  },

  // -------------------------------------------------------------------------
  // ARGENTINA — ARS
  // Progressive. Brackets updated frequently due to inflation.
  // Retired: approximate pension exemption threshold.
  // -------------------------------------------------------------------------
  AR: ({ annualIncome, isRetired }) => {
    const pensionExemption = isRetired ? 1500000 : 0;
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
      label: "Simplified: Argentina progressive tax",
      note: "ARS brackets updated frequently due to inflation — verify annually. Retired models approximate pension exemption. Income must be passed in ARS.",
    };
  },

  // -------------------------------------------------------------------------
  // CHILE — CLP
  // UTM-based brackets. No joint filing.
  // -------------------------------------------------------------------------
  CL: ({ annualIncome }) => {
    const utmValue = 67294; // 1 UTM = CLP 67,294 (2024)
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
      confidence: "partial",
      label: "Partial: Chile UTM-based progressive tax",
      note: "No joint filing in Chile. UTM value CLP 67,294 (2024). AFP pension income taxed as general income. Income must be passed in CLP.",
    };
  },

  // -------------------------------------------------------------------------
  // PERU — PEN
  // UIT-based brackets. No joint filing.
  // -------------------------------------------------------------------------
  PE: ({ annualIncome }) => {
    const uitValue = 5150; // 1 UIT = PEN 5,150 (2024)
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
      confidence: "partial",
      label: "Partial: Peru UIT-based progressive tax",
      note: "No joint filing in Peru. UIT value PEN 5,150 (2024). Income must be passed in PEN.",
    };
  },

  // -------------------------------------------------------------------------
  // THAILAND — THB
  // Progressive. No joint filing.
  // -------------------------------------------------------------------------
  TH: ({ annualIncome }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 150000, rate: 0.00 },
      { upTo: 300000, rate: 0.05 },
      { upTo: 500000, rate: 0.10 },
      { upTo: 750000, rate: 0.15 },
      { upTo: 1000000, rate: 0.20 },
      { upTo: 2000000, rate: 0.25 },
      { upTo: 5000000, rate: 0.30 },
      { upTo: Infinity, rate: 0.35 },
    ]);
    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: Thailand progressive PIT",
      note: "No joint filing in Thailand. Foreign income remittance rules apply for non-residents. Income must be passed in THB.",
    };
  },

  // -------------------------------------------------------------------------
  // VIETNAM — VND
  // Progressive with annual personal allowance (VND 132M).
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
      confidence: "partial",
      label: "Partial: Vietnam progressive PIT",
      note: "No joint filing in Vietnam. Personal allowance VND 132M/year. Dependent deductions not modeled. Income must be passed in VND.",
    };
  },

  // -------------------------------------------------------------------------
  // MALAYSIA — MYR
  // Progressive. Each spouse files separately — no joint filing.
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
      confidence: "partial",
      label: "Partial: Malaysia progressive income tax",
      note: "No joint filing in Malaysia. EPF contributions not included. Income must be passed in MYR.",
    };
  },

  // -------------------------------------------------------------------------
  // INDONESIA — IDR
  // Progressive. No joint filing (per-NPWP individual).
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
      confidence: "partial",
      label: "Partial: Indonesia progressive PPh",
      note: "No joint filing in Indonesia. BPJS contributions not included. Income must be passed in IDR.",
    };
  },

  // -------------------------------------------------------------------------
  // SOUTH AFRICA — ZAR
  // Progressive with primary/secondary rebates. No joint filing.
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
    const rebateZAR = isRetired ? 25425 : 17235;
    const rebateRate = annualIncome > 0 ? rebateZAR / annualIncome : 0;
    return {
      effectiveRate: clampRate(Math.max(0, rate - rebateRate)),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: South Africa SARS progressive + rebate",
      note: "No joint filing in South Africa. Primary rebate ZAR 17,235 (ZAR 25,425 for 65+). Medical aid credits and UIF not included. Income must be passed in ZAR.",
    };
  },
};

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export function estimateInternationalTax(args: {
  countryCode: string;
  annualIncome: number; // LOCAL CURRENCY — caller must convert before calling
  filing: FilingStatus;
  isRetired: boolean;
}): TaxEstimateResult {
  const { countryCode, annualIncome, filing, isRetired } = args;
  const estimator = TAX_ESTIMATORS[countryCode];

  if (estimator) {
    return estimator({ annualIncome, filing, isRetired });
  }

  return {
    effectiveRate: 0.25,
    model: "placeholder",
    confidence: "placeholder",
    label: "Simplified tax estimate",
    note: `No tax model configured for country code: ${countryCode}. Income must be in local currency.`,
  };
}

export function getTaxModelStatus(countryCode: string): {
  model: TaxModelKind;
  confidence: TaxConfidence;
  label: string;
  note: string;
} {
  const estimator = TAX_ESTIMATORS[countryCode];
  if (!estimator) {
    return {
      model: "placeholder",
      confidence: "placeholder",
      label: "Simplified",
      note: "No tax model configured for this country.",
    };
  }
  const sample = estimator({ annualIncome: 50000, filing: "single", isRetired: false });
  return {
    model: sample.model,
    confidence: sample.confidence,
    label: sample.label,
    note: sample.note,
  };
}
