import { describe, expect, it } from "vitest";
import { STATES, type StateCode } from "./states";
import { CITIES } from "./cities";
import { sumBrackets } from "./tax";
import {
  buildWageHouseholdInput,
  EMPLOYEE_401K_LIMIT,
  estimateNetAnnual,
  estimateNetBreakdown,
  getFederalBrackets,
  getFederalStandardDeduction,
  TAX_YEAR,
} from "./wageTax";
import { estimateHouseholdTax } from "./retirementPlan/householdTax";
import { CONTRIBUTION_LIMITS_2026 } from "./taxYear2026";
import { STATE_RULE_NOTES } from "./taxRuleNotes";

/**
 * Expected values below are calculated by hand from the figures each agency publishes (the documents named in
 * STATE-WAGE-RULES-DRAFT.md and STEP2-INVENTORY.md, read 2026-10-13), not from the code under test.
 * Cases use wages only, standard deduction, no dependents, no 401(k) unless stated.
 */

const stateOnly = (state: StateCode, gross: number, filing: "single" | "married" = "single", k401Pct = 0) =>
  estimateNetBreakdown({ grossAnnual: gross, state, filing, k401Pct }).state;

describe("federal 2026 (IRS Rev. Proc. 2025-32)", () => {
  it("uses the 2026 standard deduction and tax year", () => {
    expect(TAX_YEAR).toBe(2026);
    expect(getFederalStandardDeduction("single")).toBe(16_100);
    expect(getFederalStandardDeduction("married")).toBe(32_200);
  });

  it("reproduces the IRS published tax at each bracket top (section 4.01 tables)", () => {
    const single = getFederalBrackets("single");
    const married = getFederalBrackets("married");
    expect(sumBrackets(12_400, single)).toBeCloseTo(1_240, 2);
    expect(sumBrackets(50_400, single)).toBeCloseTo(5_800, 2);
    expect(sumBrackets(105_700, single)).toBeCloseTo(17_966, 2);
    expect(sumBrackets(201_775, single)).toBeCloseTo(41_024, 2);
    expect(sumBrackets(256_225, single)).toBeCloseTo(58_448, 2);
    expect(sumBrackets(640_600, single)).toBeCloseTo(192_979.25, 2);
    expect(sumBrackets(24_800, married)).toBeCloseTo(2_480, 2);
    expect(sumBrackets(100_800, married)).toBeCloseTo(11_600, 2);
    expect(sumBrackets(211_400, married)).toBeCloseTo(35_932, 2);
    expect(sumBrackets(403_550, married)).toBeCloseTo(82_048, 2);
    expect(sumBrackets(512_450, married)).toBeCloseTo(116_896, 2);
    expect(sumBrackets(768_700, married)).toBeCloseTo(206_583.5, 2);
  });

  it("hand-calculates a Florida single filer at 100,000", () => {
    // Taxable 100,000 - 16,100 = 83,900: 1,240 + 4,560 + 22% x 33,500 = 13,170. FICA 6,200 + 1,450.
    const r = estimateNetBreakdown({ grossAnnual: 100_000, state: "fl", filing: "single", k401Pct: 0 });
    expect(r.taxableFederal).toBe(83_900);
    expect(r.federal).toBeCloseTo(13_170, 2);
    expect(r.fica).toBeCloseTo(7_650, 2);
    expect(r.state).toBe(0);
    expect(r.net).toBeCloseTo(79_180, 2);
  });

  it("hand-calculates a married couple at 200,000 in Texas", () => {
    // Taxable 167,800: 2,480 + 9,120 + 22% x 67,000 = 26,340.
    const r = estimateNetBreakdown({ grossAnnual: 200_000, state: "tx", filing: "married", k401Pct: 0 });
    expect(r.federal).toBeCloseTo(26_340, 2);
  });
});

describe("payroll tax boundaries (IRS Pub. 15 2026; Form 8959 instructions)", () => {
  const fica = (gross: number, filing: "single" | "married" = "single") =>
    estimateNetBreakdown({ grossAnnual: gross, state: "tx", filing, k401Pct: 0 }).fica;

  it("caps Social Security at the 184,500 wage base", () => {
    expect(fica(184_500)).toBeCloseTo(184_500 * 0.062 + 184_500 * 0.0145, 2);
    expect(fica(184_501) - fica(184_500)).toBeCloseTo(0.0145, 4);
    expect(fica(300_000) - fica(250_000)).toBeCloseTo(50_000 * (0.0145 + 0.009), 2);
  });

  it("starts the Additional Medicare tax at 200,000 single and 250,000 joint", () => {
    expect(fica(200_001) - fica(200_000)).toBeCloseTo(0.0145 + 0.009, 4);
    expect(fica(200_000)).toBeCloseTo(11_439 + 2_900, 2);
    expect(fica(250_001, "married") - fica(250_000, "married")).toBeCloseTo(0.0145 + 0.009, 4);
    expect(fica(250_000, "married") - fica(249_999, "married")).toBeCloseTo(0.0145, 4);
  });
});

describe("401(k) treatment", () => {
  it("excludes traditional deferrals from federal and state income tax but not FICA", () => {
    const withK = estimateNetBreakdown({ grossAnnual: 100_000, state: "fl", filing: "single", k401Pct: 10 });
    expect(withK.k401).toBe(10_000);
    expect(withK.taxableFederal).toBe(73_900);
    expect(withK.fica).toBeCloseTo(7_650, 2);
  });

  it("caps the percentage path at the 2026 limit and honors a dollar override", () => {
    expect(EMPLOYEE_401K_LIMIT).toBe(24_500);
    expect(CONTRIBUTION_LIMITS_2026.catchUp50).toBe(8_000);
    expect(estimateNetBreakdown({ grossAnnual: 300_000, state: "tx", filing: "single", k401Pct: 50 }).k401).toBe(24_500);
    expect(estimateNetBreakdown({ grossAnnual: 300_000, state: "tx", filing: "married", k401Pct: 0, k401Dollar: 49_000 }).k401).toBe(49_000);
  });

  it("treats California deferrals as excluded (FTB conformity; the old engine taxed them)", () => {
    // CA AGI 90,000 after a 10,000 deferral: TI 90,000 - 5,706 = 84,294.
    const expectedNoDeferral = (ti: number) =>
      0.01 * 11_079 + 0.02 * (26_264 - 11_079) + 0.04 * (41_452 - 26_264) + 0.06 * (57_542 - 41_452)
      + 0.08 * (72_724 - 57_542) + 0.093 * (ti - 72_724) - 153;
    expect(stateOnly("ca", 100_000, "single", 10)).toBeCloseTo(expectedNoDeferral(84_294), 2);
  });

  it("taxes Pennsylvania deferrals (state wages stay at 100,000)", () => {
    expect(stateOnly("pa", 100_000, "single", 10)).toBeCloseTo(3_070, 2);
  });
});

describe("state income tax: hand-calculated expected results, single filer", () => {
  // [state, gross wages, expected state tax, source of the figures used]
  const cases: Array<[StateCode, number, number, string]> = [
    ["al", 100_000, 4_101.5, "AL 2025 Form 40 booklet (federal tax paid 13,170 deducted; std ded 2,500; exemption 1,500; 2/4/5%)"],
    ["az", 100_000, 2_097.5, "ARS 43-1041(H) indexed deduction 16,100 (derived); 2.5% flat"],
    ["ar", 150_000, 5_349.71, "Act 1 of 2026S1 / HB 1001 upper table (2% of first 4,700, 3.7% above) on 147,530; $29 credit"],
    ["ca", 100_000, 5_054.98, "FTB 2025 Form 540 Schedule X on 94,294 (std ded 5,706), less 153 exemption credit"],
    ["co", 100_000, 3_691.6, "4.4% of federal taxable income 83,900"],
    ["dc", 100_000, 5_531.5, "DC D-40ES 2026 schedule on 83,900"],
    ["ga", 100_000, 4_241.5, "HB 463: 4.99% of AGI less 15,000"],
    ["hi", 100_000, 5_796.26, "Act 46 (2024) 2026 schedule on 90,856 (std ded 8,000, exemption 1,144)"],
    ["il", 100_000, 4_805.21, "IL Bulletin FY 2026-15: 4.95% of AGI less 2,925"],
    ["in", 100_000, 2_920.5, "IN DOR: 2.95% of AGI less 1,000 exemption (county tax is local)"],
    ["ia", 100_000, 3_148.2, "Iowa DOR: 3.8% flat on 83,900, less the 40 personal credit (credit amount as encoded by the planner; not re-read)"],
    ["ks", 100_000, 4_780.31, "KS 2025 booklet: 5.2% to 23,000, 5.58% above on 87,235"],
    ["ky", 100_000, 3_382.4, "KY 2026 withholding formula: 3.5% after 3,360 standard deduction"],
    ["la", 100_000, 2_613.75, "LA 2026 withholding publication: 3% after 12,875"],
    ["me", 100_000, 5_128.8, "MRS 2026 schedule on 79,000 (std 15,700, exemption 5,300; base 4,117 at 64,850)"],
    ["md", 90_000, 3_909, "MD 2026 withholding memo brackets on 83,400 (std 3,400, exemption 3,200)"],
    ["ma", 100_000, 4_780, "mass.gov: 5% after 4,400 exemption"],
    ["mi", 100_000, 3_999.25, "MI Treasury guide 446: 4.25% after 5,900 exemption"],
    ["mn", 100_000, 5_276.61, "MN DOR 2026: 5.35% to 33,310, 6.8% above, std 15,300"],
    ["ms", 100_000, 3_268, "HB 1 (2025): 4% for 2026 after first 10,000 exempt; std 2,300, exemption 6,000"],
    ["mo", 100_000, 3_762.67, "MO 2026 withholding formula on 83,900"],
    ["mt", 100_000, 4_289.1, "MT HB 337: 4.7% to 47,500, 5.65% above, on 83,900"],
    ["ne", 100_000, 3_670.46, "NE 2026 Form 1040N-ES (Rev. 11-2025): 2.46% to 4,130, 3.51% to 24,760, 4.55% above on 91,150 (std 8,850), less 176 credit"],
    ["nj", 100_000, 4_180.05, "NJ rate schedule on 99,000 (exemption 1,000)"],
    ["nm", 100_000, 3_569.1, "NM HB 252 schedule on 83,900"],
    ["ny", 100_000, 4_859.75, "NYS-50-T-NYS (1/26) 2026 rates on 92,000 (std 8,000); AGI below the 107,650 recapture start"],
    ["nc", 100_000, 3_481.28, "NCDOR: 3.99% after 12,750 standard deduction"],
    ["nd", 100_000, 669.34, "ND-1ES 2026: 1.95% above 49,575 on 83,900"],
    ["oh", 100_000, 2_313.38, "ORC 5747.02: 332 + 2.75% above 26,050 on 98,100 (exemption 1,900)"],
    ["ok", 100_000, 3_954.5, "HB 2764 tax year 2026 schedule on 92,650 (std 6,350, exemption 1,000)"],
    ["or", 90_000, 6_272.75, "OR DOR 2026: federal tax subtraction capped at 8,750, std 2,910, 263 credit"],
    ["pa", 100_000, 3_070, "PA-40: 3.07% of compensation"],
    ["ri", 100_000, 3_148.13, "RI ADV 2025-22: 3.75% to 82,050, 4.75% above, std 11,200, exemption 5,250"],
    ["sc", 100_000, 4_244, "SC IL 26-20: 5.21% x TI - 966, SCIAD fully phased out"],
    ["ut", 40_000, 1_090.95, "UCA 59-10-104 4.45% less taxpayer credit 966 - 1.3% x (40,000 - 18,696)"],
    ["vt", 100_000, 4_076.13, "VT 2026 withholding-table brackets (derived) on 86,750"],
    ["va", 100_000, 4_935.9, "VA Form 760: 2/3/5/5.75% after 8,750 deduction and 930 exemption"],
    ["wv", 100_000, 3_690.9, "WV SB 392: 1,950.50 + 4.58% over 60,000 on 98,000"],
    ["wi", 100_000, 4_427.52, "WI 1-ES 2026 Schedule A on 94,925.60 (std deduction phase-out, 700 exemption)"],
    ["id", 100_000, 4_185, "Idaho 5.3% above the derived 4,938 zero bracket on 83,900"],
    ["de", 100_000, 5_259, "Delaware brackets and deduction as encoded; not independently confirmed (see STATE-WAGE-RULES-DRAFT.md)"],
    ["ct", 100_000, 4_975, "CT brackets on 100,000 (IP 2026(7)) plus the 225 add-back as encoded by the planner"],
  ];

  it.each(cases)("%s at %d wages", (state, gross, expected) => {
    expect(stateOnly(state, gross)).toBeCloseTo(expected, 1);
  });

  it("charges no state income tax on wages in the eight no-tax states and Washington", () => {
    for (const s of ["ak", "fl", "nv", "nh", "sd", "tn", "tx", "wy", "wa"] as StateCode[]) {
      expect(stateOnly(s, 250_000)).toBe(0);
      expect(stateOnly(s, 250_000, "married")).toBe(0);
    }
  });
});

describe("state income tax: hand-calculated expected results, married filing jointly at 200,000", () => {
  const cases: Array<[StateCode, number]> = [
    ["ca", 10_109.96],
    ["nj", 8_570.1],
    ["ma", 9_560],
    ["mn", 10_813.05],
    ["wi", 9_721.11],
    ["ga", 8_483],
    ["va", 10_129.3],
    ["wv", 8_179.3],
    ["ks", 9_503.15],
    ["dc", 12_663],
    ["me", 10_256.93],
  ];
  it.each(cases)("%s", (state, expected) => {
    expect(stateOnly(state, 200_000, "married")).toBeCloseTo(expected, 1);
  });
});

describe("agency-published tax at a bracket top", () => {
  it("matches the West Virginia 2026 schedule: 1,950.50 at 60,000 of taxable income", () => {
    expect(stateOnly("wv", 62_000)).toBeCloseTo(1_950.5, 2);
  });
  it("matches the Maine 2026 schedule: 4,117 at 64,850 of taxable income", () => {
    expect(stateOnly("me", 64_850 + 15_700 + 5_300)).toBeCloseTo(4_117.08, 1);
  });
  it("matches the South Carolina letter: 1.99% below 30,000, 5.21% x TI minus 966 from 30,000", () => {
    // SCIAD per IL 26-20: 15,000 base, reduced from 40,000 of AGI over a 55,000 width (rounded down to 10).
    const sciad = (agi: number) => Math.max(0, 15_000 - Math.floor((15_000 * Math.max(0, agi - 40_000) / 55_000) / 10) * 10);
    for (const agi of [20_000, 40_000, 43_000, 44_000, 60_000, 100_000]) {
      const ti = agi - sciad(agi);
      const expected = ti < 30_000 ? ti * 0.0199 : ti * 0.0521 - 966;
      expect(stateOnly("sc", agi)).toBeCloseTo(expected, 2);
    }
  });
  it("matches the Connecticut table: 14,000 of tax at 250,000 of taxable income (before add-backs)", () => {
    // 2% x 10,000 + 4.5% x 40,000 + 5.5% x 50,000 + 6% x 100,000 + 6.5% x 50,000 = 14,000.
    const r = stateOnly("ct", 250_000);
    expect(r).toBeGreaterThanOrEqual(14_000);
    expect(r).toBeLessThan(14_000 + 250 + 3_500);
  });
});

describe("Washington and future law", () => {
  it("does not apply the 2028 Washington income tax to 2026 wages", () => {
    expect(stateOnly("wa", 5_000_000)).toBe(0);
  });
});

describe("local income taxes", () => {
  const local = (state: StateCode, cityId: string, gross: number, filing: "single" | "married" = "single", k401Pct = 0) =>
    estimateNetBreakdown({ grossAnnual: gross, state, filing, k401Pct, cityId }).local;

  it("taxes Kansas City and St. Louis earnings at 1% of wages after pre-tax deferrals, with no state deduction", () => {
    expect(local("mo", "kansas-city-mo", 100_000, "single", 10)).toBeCloseTo(900, 2);
    expect(local("mo", "st-louis-mo", 100_000, "single", 10)).toBeCloseTo(900, 2);
  });
  it("taxes Ohio city wages without removing 401(k) deferrals or any deduction (ORC 718.01(R))", () => {
    expect(local("oh", "columbus-oh", 100_000, "single", 10)).toBeCloseTo(2_500, 2);
    expect(local("oh", "cleveland-oh", 100_000, "single", 10)).toBeCloseTo(2_500, 2);
    expect(local("oh", "cincinnati-oh", 100_000, "single", 10)).toBeCloseTo(1_800, 2);
  });
  it("taxes Philadelphia compensation without removing deferrals", () => {
    expect(local("pa", "philadelphia-pa", 100_000, "single", 10)).toBeCloseTo(3_740, 2);
    expect(local("pa", "pittsburgh-pa", 100_000, "single", 10)).toBeCloseTo(3_000, 2);
  });
  it("applies Detroit's 2.4% to income after deferrals and the 600 exemption", () => {
    expect(local("mi", "detroit-mi", 100_000, "single", 10)).toBeCloseTo((90_000 - 600) * 0.024, 2);
  });
  it("uses the Indiana county rates in the January 2026 Departmental Notice 1", () => {
    // Taxable income 99,000 (100,000 less the 1,000 exemption).
    expect(local("in", "indianapolis-in", 100_000)).toBeCloseTo(99_000 * 0.0202, 2);
    expect(local("in", "fort-wayne-in", 100_000)).toBeCloseTo(99_000 * 0.0159, 2);
    expect(local("in", "evansville-in", 100_000)).toBeCloseTo(99_000 * 0.0125, 2);
  });
  it("uses the Maryland county schedules on Maryland taxable income, including the joint Frederick tiers", () => {
    expect(local("md", "baltimore-md", 90_000)).toBeCloseTo(83_400 * 0.032, 2);
    expect(local("md", "rockville-md", 90_000)).toBeCloseTo(83_400 * 0.032, 2);
    const frederick = (ti: number) => 0.0225 * 25_000 + 0.0275 * 25_000 + 0.0296 * (ti - 50_000);
    expect(local("md", "frederick-md", 90_000)).toBeCloseTo(frederick(83_400), 2);
    // Joint tiers are 25,000 / 100,000 / 250,000, not 50,000 / 100,000 / 150,000.
    // Exemption Amount Chart 10A: joint filers at 175,000-200,000 of AGI get 800 per exemption.
    const jointTaxable = 200_000 - 6_800 - 2 * 800;
    const expectedJoint = 0.0225 * 25_000 + 0.0275 * 75_000 + 0.0296 * (jointTaxable - 100_000);
    expect(local("md", "frederick-md", 200_000, "married")).toBeCloseTo(expectedJoint, 0);
  });
  it("charges NYC residents the NYC schedule and nobody else in New York", () => {
    expect(local("ny", "nyc-ny", 100_000)).toBeGreaterThan(3_000);
    expect(local("ny", "buffalo-ny", 100_000)).toBe(0);
    expect(local("ny", "albany-ny", 100_000)).toBe(0);
  });
  it("adds Portland's Metro and Multnomah County taxes only above their thresholds", () => {
    expect(local("or", "portland-or", 100_000)).toBe(0);
    expect(local("or", "portland-or", 400_000)).toBeGreaterThan(0);
    expect(local("or", "eugene-or", 400_000)).toBe(0);
  });
});

describe("every state and city runs, and tax never falls as wages rise", () => {
  it("returns finite results for every state, filing status and wage level", () => {
    for (const s of STATES) {
      for (const filing of ["single", "married"] as const) {
        for (const gross of [0, 1, 30_000, 85_000, 250_000, 1_500_000]) {
          const r = estimateNetBreakdown({ grossAnnual: gross, state: s.code, filing, k401Pct: 10 });
          for (const v of [r.federal, r.fica, r.state, r.local, r.net]) expect(Number.isFinite(v)).toBe(true);
          expect(r.state).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("returns finite results for every selectable city", () => {
    for (const c of CITIES) {
      for (const filing of ["single", "married"] as const) {
        const r = estimateNetBreakdown({ grossAnnual: 90_000, state: c.state, filing, k401Pct: 6, cityId: c.id });
        expect(Number.isFinite(r.state + r.local + r.net)).toBe(true);
      }
    }
  });

  it("never lowers total state and local tax as wages rise by 500 (no cliffs that reduce tax)", () => {
    for (const s of STATES) {
      let previous = -1;
      for (let gross = 0; gross <= 400_000; gross += 500) {
        const r = estimateNetBreakdown({ grossAnnual: gross, state: s.code, filing: "single", k401Pct: 0 });
        const total = r.state;
        expect(total).toBeGreaterThanOrEqual(previous - 1e-6);
        previous = total;
      }
    }
  });

  it("returns zero tax and zero net for zero or negative wages", () => {
    for (const gross of [0, -5_000]) {
      const r = estimateNetBreakdown({ grossAnnual: gross, state: "ca", filing: "single", k401Pct: 5, cityId: undefined });
      expect(r.totalTax).toBe(0);
      expect(r.net).toBe(0);
    }
  });

  it("estimateNetAnnual matches the breakdown", () => {
    expect(estimateNetAnnual({ grossAnnual: 90_000, state: "ny", filing: "single", k401Pct: 5, cityId: "nyc-ny" }))
      .toBe(estimateNetBreakdown({ grossAnnual: 90_000, state: "ny", filing: "single", k401Pct: 5, cityId: "nyc-ny" }).net);
  });
});

describe("agrees with the retirement planner's own household engine for wage-only households", () => {
  const neutral: Partial<Record<StateCode, string>> = {
    pa: "allentown-pa", in: "indianapolis-in", md: "baltimore-md", ny: "ny-outside-nyc-yonkers",
  };
  it.each(STATES.map((s) => s.code))("%s", (state) => {
    for (const filing of ["single", "married"] as const) {
      for (const gross of [40_000, 100_000, 300_000]) {
        const deferrals = Math.min(gross * 0.06, EMPLOYEE_401K_LIMIT);
        const planner = estimateHouseholdTax({
          ...buildWageHouseholdInput(state, filing, gross, deferrals, neutral[state]),
          stateTreatment: "verified-resident-location",
        });
        const mine = estimateNetBreakdown({ grossAnnual: gross, state, filing, k401Pct: 6, cityId: neutral[state] });
        expect(mine.federal).toBeCloseTo(planner.regularFederal, 2);
        expect(mine.state).toBeCloseTo(planner.stateTax, 2);
      }
    }
  });
});

describe("published-versus-held labels", () => {
  it("only labels real states and gives each a non-empty note", () => {
    for (const [code, item] of Object.entries(STATE_RULE_NOTES)) {
      expect(STATES.some((s) => s.code === code)).toBe(true);
      expect(item.note.length).toBeGreaterThan(20);
    }
  });
});
