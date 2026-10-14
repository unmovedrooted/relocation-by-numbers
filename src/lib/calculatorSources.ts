import type { StateCode } from "./states";

/**
 * Sources and known limits for each calculator, shown on the calculator page and the methodology page.
 * Every link was opened or confirmed during the 2026-10-13 tax refresh unless noted; see STATE-WAGE-RULES-DRAFT.md.
 * Keep the statements here to what the calculators actually do.
 */
export type SourceRef = Readonly<{ label: string; url: string }>;

export const SOURCES_REVIEWED_ON = "2026-10-13";

const RP_2025_32: SourceRef = { label: "IRS Rev. Proc. 2025-32: 2026 tax brackets and standard deduction", url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf" };
const PUB_15: SourceRef = { label: "IRS Publication 15 (2026): Social Security wage base and payroll tax rates", url: "https://www.irs.gov/publications/p15" };
const FORM_8959: SourceRef = { label: "IRS Instructions for Form 8959: Additional Medicare Tax thresholds", url: "https://www.irs.gov/instructions/i8959" };
const NOTICE_2025_67: SourceRef = { label: "IRS Notice 2025-67: 2026 401(k), IRA and catch-up limits", url: "https://www.irs.gov/pub/irs-drop/n-25-67.pdf" };
const RP_2025_19: SourceRef = { label: "IRS Rev. Proc. 2025-19: 2026 HSA limits and high-deductible plan limits", url: "https://www.irs.gov/pub/irs-drop/rp-25-19.pdf" };
const PUB_969: SourceRef = { label: "IRS Publication 969: Health Savings Accounts", url: "https://www.irs.gov/publications/p969" };
const PUB_590B: SourceRef = { label: "IRS Publication 590-B: Uniform Lifetime Table and RMD rules", url: "https://www.irs.gov/publications/p590b" };
const IRB_2024_33: SourceRef = { label: "IRS Internal Revenue Bulletin 2024-33: final RMD regulations (start age by birth year)", url: "https://www.irs.gov/irb/2024-33_IRB" };
const STATE_SOURCES_LINK: SourceRef = { label: "State income tax rules: the state agency or legislature documents listed by state", url: "/methodology#state-sources" };
const LOCAL_SOURCES_LINK: SourceRef = { label: "Local income taxes modeled and their sources", url: "/methodology#tax-year-and-sources" };

const HOUSING_NOTE =
  "City rent, home-price and property-tax defaults come from the Census Bureau American Community Survey 2020-2024 (tables B25113, B25109, B25058, B25064, B25077 and B25103). City price levels for housing, goods, utilities and other services come from BEA Regional Price Parities 2024. Insurance and closing-cost defaults, and the dollar budgets for groceries, utilities, transportation, healthcare and childcare, are planning assumptions, not government data; the price-level indexes only scale them by city.";
const MOVE_NOTE =
  "The move comparison subtracts what the household keeps now from what it would keep after the move, and splits the change into pay, taxes, housing and other costs. First-year impact is twelve months of that change minus the one-time costs that are spent; a refundable deposit and a down payment count toward cash needed but not toward cost. Ranges move only the figures this site estimated, by 10% for housing, 15% for living costs and 25% for one-time costs. Those spreads, the one-time cost defaults and the living-cost budgets are planning assumptions, not government data.";
const TREASURY_FX: SourceRef = { label: "U.S. Treasury Reporting Rates of Exchange, as of September 30, 2026 (exchange rates)", url: "https://fiscaldata.treasury.gov/datasets/treasury-reporting-rates-exchange/treasury-reporting-rates-of-exchange" };
const FEIE_2026: SourceRef = { label: "IRS Rev. Proc. 2025-32, section 3.39: 2026 foreign earned income exclusion ($132,900)", url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf" };
const INTERNATIONAL_SOURCES = [TREASURY_FX, FEIE_2026, RP_2025_32] as const;
const INTERNATIONAL_NOTE =
  "Exchange rates are the U.S. Treasury's quarterly reporting rates (September 30, 2026), not live market rates. U.S. tax uses the 2026 IRS figures. Tax rules for other countries are 2024 and 2025 figures from the sources named in the code (each country's tax authority, OECD and PwC summaries), last reviewed in March 2026, and many are labeled simplified. Rent, grocery, utility, transport, healthcare and setup defaults are planning estimates labeled 'City default estimate': they are not from a government statistical source. Verify them locally before a major decision.";
const INTERNATIONAL_EXCLUSIONS = [
  "Planning estimates only; visa, residency and tax-treaty effects are not modeled in full.",
  "U.S. tax owed while living abroad (for citizens and green-card holders) is added only when you answer Yes to the U.S. tax question: 2026 federal brackets, the foreign earned income exclusion for wages and a credit for foreign tax. U.S. self-employment, Social Security and state taxes, treaties and totalization agreements are not modeled.",
];

const US_TAX_EXCLUSIONS = [
  "Wages only: no self-employment, investment, capital-gain or other non-wage income.",
  "Standard deduction only; no itemized deductions, tax credits (dependents, education, earned income and others) or alternative minimum tax.",
  "Single and married-filing-jointly only; no head of household or married filing separately.",
  "Employers may pay some or all of a state paid-leave program's employee share; the calculators assume the largest employee share the law allows.",
  "Local income taxes cover a resident who works in the same city; commuter taxes and credits for tax paid to another city are not included.",
];

export type CalculatorInfo = Readonly<{
  name: string;
  /** True when the calculator's results depend on the U.S. tax rules refreshed for the tax year. */
  taxDriven: boolean;
  sources: readonly SourceRef[];
  /** Plain statements shown beside the sources. */
  notes?: readonly string[];
  exclusions: readonly string[];
}>;


/** All FIRE calculators run on the same engine (FireCalculator), including its state tax model. */
const FIRE_INFO = (name: string): CalculatorInfo => ({
  name,
  taxDriven: true,
  sources: [RP_2025_32, PUB_15, STATE_SOURCES_LINK, PAYROLL_PROGRAMS_LINK],
  notes: ["Savings, returns, inflation, spending and withdrawal rate are your assumptions."],
  exclusions: [
    "Taxes use a simplified state-specific model, not a filing-ready return.",
    ...US_TAX_EXCLUSIONS.slice(0, 3),
    "Planning estimates, not guarantees; taxes, assumptions and future spending can change the result.",
  ],
});

const PAYROLL_PROGRAMS_LINK: SourceRef = { label: "Employee-paid state payroll programs included, with rates and sources", url: "/methodology#state-payroll" };
const TAXES = [RP_2025_32, PUB_15, FORM_8959, STATE_SOURCES_LINK, LOCAL_SOURCES_LINK, PAYROLL_PROGRAMS_LINK];

export const CALCULATOR_INFO: Readonly<Record<string, CalculatorInfo>> = Object.freeze({
  "/": { name: "US Relocation & Take-Home Calculator", taxDriven: true, sources: TAXES, notes: [HOUSING_NOTE, MOVE_NOTE],
    exclusions: [...US_TAX_EXCLUSIONS, "Moving costs not entered default to planning averages, and the date the lease or home sale closes is not modeled."] },
  "/one-income-relocation-calculator": { name: "One vs Two Income Relocation", taxDriven: true, sources: TAXES, notes: [HOUSING_NOTE, MOVE_NOTE],
    exclusions: [...US_TAX_EXCLUSIONS, "Taxes follow the state and city you move to; working in a different state or city from where you live is not modeled."] },
  "/retirement-state-tax": { name: "Retirement Tax by State", taxDriven: true, sources: [RP_2025_32, PUB_590B, STATE_SOURCES_LINK],
    notes: ["Each state's tax comes from its own 2026 rules, read from the state documents listed by state. \"Adds\" is the state tax the household would not owe without that income, so it includes effects such as a pension deduction reduced by Social Security received."],
    exclusions: [
      "Resident state income tax only; local income taxes, property and sales taxes are not included.",
      "Standard deduction and one pension from a private employer; no itemized deductions, credits, investment income or capital gains.",
      "Withdrawals are modeled as traditional IRA withdrawals taken after age 59½; a few states treat employer plans differently.",
      "Both spouses are assumed to be the same age, with Social Security and withdrawals split equally.",
    ] },
  "/paycheck-calculator": { name: "Paycheck Calculator", taxDriven: true, sources: TAXES,
    exclusions: [...US_TAX_EXCLUSIONS, "Health-premium and HSA pre-tax deductions, additional withholding and bonus withholding rules are not modeled; this estimates the tax owed for the year, not employer withholding."] },
  "/income-tax-calculator": { name: "Income Tax Calculator", taxDriven: true, sources: [RP_2025_32, STATE_SOURCES_LINK],
    exclusions: ["Federal income tax only (state is an optional add-on); no Social Security or Medicare tax.", "No credits, qualified business income deduction, alternative minimum tax or capital-gain rates.", US_TAX_EXCLUSIONS[2], US_TAX_EXCLUSIONS[4]] },
  "/401k-calculator": { name: "401(k) Calculator", taxDriven: true, sources: [NOTICE_2025_67, RP_2025_32, PUB_15, STATE_SOURCES_LINK],
    exclusions: ["The rule that requires higher earners' catch-up contributions to be Roth is not modeled.", "Plan-specific limits, vesting and compensation caps are not modeled.", "Investment returns are assumptions, and the Monte Carlo range is illustrative, not a forecast.", ...US_TAX_EXCLUSIONS.slice(0, 2)] },
  "/hsa-calculator": { name: "HSA Calculator", taxDriven: true, sources: [RP_2025_19, PUB_969, RP_2025_32, PUB_15, STATE_SOURCES_LINK],
    exclusions: ["Eligibility (qualifying high-deductible coverage, Medicare enrollment, partial-year coverage) is not checked.", "California and New Jersey are modeled as not following the federal HSA exemption; other state details are not modeled.", ...US_TAX_EXCLUSIONS.slice(0, 2)] },
  "/rmd-calculator": { name: "RMD Calculator", taxDriven: true, sources: [IRB_2024_33, PUB_590B, RP_2025_32, STATE_SOURCES_LINK],
    exclusions: ["Uses the Uniform Lifetime Table only; a spouse more than 10 years younger as sole beneficiary and inherited accounts use different tables.", "The still-working exception for employer plans is not modeled.", "The tax estimate treats the distribution as your only ordinary income.", "Returns are an assumption, not a forecast."] },
  "/roth-conversion-calculator": { name: "Roth Conversion Calculator", taxDriven: true, sources: [RP_2025_32, STATE_SOURCES_LINK],
    exclusions: ["The converted balance is treated as fully pre-tax (no after-tax basis or pro-rata blending) and uses one assumed retirement tax rate.", "Taxes treat the conversion as your only ordinary income; Social Security, Medicare surcharges and benefit phase-outs are not modeled.", "Returns are an assumption, not a forecast."] },
  "/retirement-withdrawal-calculator": { name: "Retirement Withdrawal", taxDriven: true, sources: [RP_2025_32, STATE_SOURCES_LINK],
    exclusions: ["Taxes treat withdrawals as your only ordinary income with the standard deduction; Social Security and other income are not included.", "Payroll tax does not apply to distributions; states that do not tax qualified retirement income are modeled as exempt.", "The average-return view does not model market volatility; the optional Monte Carlo view is illustrative."] },
  "/retirement-calculator": { name: "Retirement Calculator", taxDriven: false, sources: [],
    notes: ["Projects balances from the inputs you enter in today's dollars; no external data source is used."],
    exclusions: ["A smooth average-return projection that does not model market volatility.", "Taxes on withdrawals follow the simplified treatment described on the Methodology page."] },
  ...Object.fromEntries(([
    ["/fire-calculator", "FIRE Calculator"],
    ["/fire-number-calculator", "FIRE Number Calculator"],
    ["/lean-fire-calculator", "Lean FIRE Calculator"],
    ["/barista-fire-calculator", "Barista FIRE Calculator"],
    ["/coast-fire-calculator", "Coast FIRE Calculator"],
    ["/chubby-fire-calculator", "Chubby FIRE Calculator"],
    ["/fat-fire-calculator", "Fat FIRE Calculator"],
    ["/savings-rate-for-fire", "Savings Rate for FIRE"],
  ] as const).map(([path, name]) => [path, FIRE_INFO(name)] as const)),
  "/investment-calculator": { name: "Investment Calculator", taxDriven: false, sources: [], notes: ["Projects growth from the inputs you enter; no external data source is used."], exclusions: ["A projection, not investment advice; it does not include taxes on gains."] },
  "/mortgage-calculator": { name: "Mortgage Calculator", taxDriven: false, sources: [], notes: [HOUSING_NOTE],
    exclusions: ["Does not include moving costs, currency conversion fees or cash reserve requirements.", "Property tax, insurance and closing costs are estimates unless you enter your own."] },
  "/rent-vs-buy-calculator": { name: "Rent vs. Buy Calculator", taxDriven: false, sources: [], notes: [HOUSING_NOTE],
    exclusions: ["Does not model income-tax effects (mortgage-interest or SALT deductions, investment taxes), PMI or moving costs.", "Results are highly sensitive to the appreciation and investment-return assumptions."] },
  "/housing-affordability-calculator": { name: "Housing Affordability", taxDriven: false, sources: [], notes: [HOUSING_NOTE],
    exclusions: ["A planning guideline, not lending advice; PMI is estimated automatically when the down payment is below 20%."] },
  "/compare-cities": { name: "Compare Cities Side by Side", taxDriven: false, sources: INTERNATIONAL_SOURCES, notes: [INTERNATIONAL_NOTE],
    exclusions: ["U.S. tax owed while living abroad is not included here; the regional calculators ask about it.", "Housing and living costs use each destination's typical values and tax uses a simplified estimate; use the matching regional calculator for a country-specific breakdown.", "Tax assumes remote or foreign-sourced income where applicable."] },
  "/international-relocation": { name: "International Relocation", taxDriven: false, sources: INTERNATIONAL_SOURCES, notes: [INTERNATIONAL_NOTE], exclusions: INTERNATIONAL_EXCLUSIONS },
  "/europe-relocation-calculator": { name: "Europe Relocation", taxDriven: false, sources: INTERNATIONAL_SOURCES, notes: [INTERNATIONAL_NOTE], exclusions: INTERNATIONAL_EXCLUSIONS },
  "/asia-relocation-calculator": { name: "Asia Relocation", taxDriven: false, sources: INTERNATIONAL_SOURCES, notes: [INTERNATIONAL_NOTE], exclusions: INTERNATIONAL_EXCLUSIONS },
  "/caribbean-relocation-calculator": { name: "Caribbean Relocation", taxDriven: false, sources: INTERNATIONAL_SOURCES, notes: [INTERNATIONAL_NOTE], exclusions: INTERNATIONAL_EXCLUSIONS },
  "/south-america-relocation-calculator": { name: "South America Relocation", taxDriven: false, sources: INTERNATIONAL_SOURCES, notes: [INTERNATIONAL_NOTE], exclusions: INTERNATIONAL_EXCLUSIONS },
});

/**
 * The state documents behind each state's income tax rules, as read for the 2026 refresh.
 * No-income-tax states link to the agency or constitutional page that confirms it.
 */
export const STATE_TAX_SOURCES: Readonly<Record<StateCode, readonly SourceRef[]>> = Object.freeze({
  al: [{ label: "Alabama Department of Revenue, 2025 Form 40 booklet", url: "https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f40bk.pdf" }],
  ak: [{ label: "Alaska Department of Revenue, Tax Division", url: "https://tax.alaska.gov/programs/programs/index.aspx?10001" }],
  az: [{ label: "Arizona Revised Statutes 43-1041 (standard deduction)", url: "https://www.azleg.gov/ars/43/01041.htm" }],
  ar: [{ label: "Arkansas HB 1001 (2026 first extraordinary session)", url: "https://arkleg.state.ar.us/Home/FTPDocument?path=%2FBills%2F2026S1%2FPublic%2FHB1001.pdf" }],
  ca: [{ label: "California Franchise Tax Board, 2025 Form 540 booklet", url: "https://www.ftb.ca.gov/forms/2025/2025-540-booklet.pdf" }],
  co: [{ label: "Colorado Department of Revenue, individual income tax guide", url: "https://tax.colorado.gov/individual-income-tax-guide" }],
  ct: [{ label: "Connecticut DRS, IP 2026(7)", url: "https://portal.ct.gov/-/media/drs/publications/pubsip/2026/ip-2026-7.pdf" }],
  dc: [{ label: "DC Office of Tax and Revenue, 2026 D-40ES booklet", url: "https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2026_D40ES_Book_wLinks04012026.pdf" }],
  de: [{ label: "Delaware Division of Revenue, personal income tax FAQs", url: "https://revenue.delaware.gov/frequently-asked-questions/personal-income-tax-faqs/" }],
  fl: [{ label: "Florida Constitution, Article VII, section 5", url: "https://leg.state.fl.us/Statutes/index.cfm?Mode=Constitution&Submenu=3" }],
  ga: [{ label: "Georgia HB 463 (2026)", url: "https://gov.georgia.gov/document/2026-signed-legislation/hb-463/download" }],
  hi: [{ label: "Hawaii Act 46 (2024), HB 2404 CD1", url: "https://data.capitol.hawaii.gov/sessions/session2024/bills/HB2404_CD1_.HTM" }],
  id: [{ label: "Idaho State Tax Commission, withholding computation", url: "https://tax.idaho.gov/taxes/income-tax/withholding/computing/" }],
  il: [{ label: "Illinois Department of Revenue, Informational Bulletin FY 2026-15", url: "https://tax.illinois.gov/research/publications/bulletins/fy-2026-15.html" }],
  in: [{ label: "Indiana DOR, income tax rates", url: "https://www.in.gov/dor/resources/tax-rates-and-reports/rates-fees-and-penalties/" }, { label: "Indiana DOR, Departmental Notice 1 (county rates)", url: "https://www.in.gov/dor/files/dn01.pdf" }],
  ia: [{ label: "Iowa Department of Revenue, 2026 individual income tax rate", url: "https://revenue.iowa.gov/press-release/2025-10-21/idr-announces-2026-individual-income-tax-and-interest-rates" }],
  ks: [{ label: "Kansas Department of Revenue, 2025 individual income tax booklet", url: "https://www.ksrevenue.gov/pdf/ip25.pdf" }],
  ky: [{ label: "Kentucky Department of Revenue, 2026 withholding formula", url: "https://revenue.ky.gov/Forms/2026%20Withholding%20Formula.pdf" }],
  la: [{ label: "Louisiana Department of Revenue, 2026 withholding tables", url: "https://dam.ldr.la.gov/taxforms/1306-1-26.pdf" }],
  me: [{ label: "Maine Revenue Services, 2026 income tax rate schedule", url: "https://www.maine.gov/revenue/sites/maine.gov.revenue/files/2026-05/ind_tax_rate_sched_2026_rev.pdf" }],
  md: [{ label: "Comptroller of Maryland, 2026 state and local withholding information", url: "https://www.marylandcomptroller.gov/content/dam/mdcomp/md/state-payroll/memos/2026/2026-maryland-state-and-local-withholding-information.pdf" }],
  ma: [{ label: "Massachusetts DOR, tax rates", url: "https://www.mass.gov/info-details/tax-rates" }, { label: "Massachusetts DOR, personal income tax exemptions", url: "https://www.mass.gov/info-details/personal-income-tax-exemptions" }],
  mi: [{ label: "Michigan Department of Treasury, 2026 withholding guide", url: "https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/SUW/TY2026/446_Withholding-Guide_2026.pdf" }],
  mn: [{ label: "Minnesota Department of Revenue, 2026 brackets and standard deduction", url: "https://www.revenue.state.mn.us/press-release/2025-12-16/minnesota-income-tax-brackets-standard-deduction-and-dependent-exemption" }],
  ms: [{ label: "Mississippi HB 1 (2025)", url: "https://billstatus.ls.state.ms.us/documents/2025/pdf/HB/0001-0099/HB0001SG.pdf" }],
  mo: [{ label: "Missouri Department of Revenue, 2026 withholding formula", url: "https://dor.mo.gov/forms/Withholding%20Formula_2026.pdf" }],
  mt: [{ label: "Montana Department of Revenue, HB 337", url: "https://revenue.mt.gov/news/recent-news/HB-337" }],
  ne: [{ label: "Nebraska Department of Revenue, 2026 estimated income tax form", url: "https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_1040N-ES.pdf" }],
  nv: [{ label: "Nevada Department of Taxation, income tax in Nevada", url: "https://tax.nv.gov/about-nevada-department-of-taxation/income-tax-in-nevada" }],
  nh: [{ label: "New Hampshire Department of Revenue Administration, interest and dividends tax repeal", url: "https://www.revenue.nh.gov/news-and-media/repeal-nh-interest-and-dividends-tax-now-effect" }],
  nj: [{ label: "New Jersey Division of Taxation, tax rate schedules", url: "https://www.nj.gov/treasury/taxation/pdf/current/njtaxratesch.pdf" }],
  nm: [{ label: "New Mexico HB 252 (2024)", url: "https://nmlegis.gov/sessions/24%20Regular/bills/house/HB0252.PDF" }],
  ny: [{ label: "New York State Department of Taxation and Finance, NYS-50-T-NYS (1/26)", url: "https://www.tax.ny.gov/pdf/publications/withholding/nys50_t_nys.pdf" }, { label: "New York IT-201 instructions (tax computation worksheets)", url: "https://www.tax.ny.gov/pdf/current_forms/it/it201i.pdf" }],
  nc: [{ label: "North Carolina Department of Revenue, tax rate schedules", url: "https://www.ncdor.gov/taxes-forms/individual-income-tax/tax-rate-schedules" }],
  nd: [{ label: "North Dakota Office of State Tax Commissioner, 2026 Form ND-1ES", url: "https://www.tax.nd.gov/sites/www/files/documents/forms/software-developer/individual-income-forms/28709-form-nd-1es-2026%20final.pdf" }],
  oh: [{ label: "Ohio Revised Code 5747.02", url: "https://codes.ohio.gov/ohio-revised-code/section-5747.02" }, { label: "Ohio Revised Code 5747.025 (personal exemptions)", url: "https://codes.ohio.gov/ohio-revised-code/section-5747.025" }],
  ok: [{ label: "Oklahoma HB 2764 (enrolled)", url: "https://www.oklegislature.gov/cf_pdf/2025-26%20ENR/hB/HB2764%20ENR.PDF" }],
  or: [{ label: "Oregon Department of Revenue, 2026 withholding tax formulas", url: "https://www.oregon.gov/dor/forms/FormsPubs/withholding-tax-formulas_206-436_2026.pdf" }],
  pa: [{ label: "Pennsylvania Department of Revenue, 2025 PA-40", url: "https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2025/2025_pa-40.pdf" }],
  ri: [{ label: "Rhode Island Division of Taxation, ADV 2025-22 (tax year 2026 amounts)", url: "https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf" }],
  sc: [{ label: "South Carolina DOR, Information Letter 26-20", url: "https://dor.sc.gov/sites/dor/files/policies/IL26-20.pdf" }],
  sd: [{ label: "South Dakota Department of Revenue", url: "https://dor.sd.gov/individuals/taxes/" }],
  tn: [{ label: "Tennessee Department of Revenue, Hall income tax repeal", url: "https://www.tn.gov/revenue/taxes/hall-income-tax.html" }],
  tx: [{ label: "Texas Constitution, Article VIII, section 24-a", url: "https://tcss.legis.texas.gov/resources/CN/htm/CN.8.htm" }],
  ut: [{ label: "Utah Code 59-10-104", url: "https://le.utah.gov/xcode/Title59/Chapter10/59-10-S104.html" }],
  vt: [{ label: "Vermont Department of Taxes, 2026 withholding guide GB-1210", url: "https://tax.vermont.gov/sites/tax/files/documents/GB-1210-2026.pdf" }],
  va: [{ label: "Virginia Tax, 2025 Form 760 instructions", url: "https://www.tax.virginia.gov/sites/default/files/vatax-pdf/2025-760-instructions.pdf" }, { label: "Virginia Tax, 2026 legislative summary", url: "https://www.tax.virginia.gov/sites/default/files/inline-files/2026-legislative-summary.pdf" }],
  wa: [{ label: "Washington Senate final bill report, ESSB 6346 (tax begins with 2028 income)", url: "https://lawfilesext.leg.wa.gov/biennium/2025-26/Pdf/Bill%20Reports/Senate/6346-S.E%20SBR%20FBR%2026.pdf" }],
  wv: [{ label: "West Virginia State Tax Department, 2026 income tax rate cut", url: "https://tax.wv.gov/Individuals/Pages/PersonalIncomeTaxReductionBill.aspx" }],
  wi: [{ label: "Wisconsin Department of Revenue, 2026 Form 1-ES instructions", url: "https://www.revenue.wi.gov/TaxForms2026/2026-Form1-ES-Inst.pdf" }],
  wy: [{ label: "Wyoming Department of Revenue", url: "https://revenue.wyo.gov/" }],
});

/** Local income tax sources, shown with the state list. */
export const LOCAL_TAX_SOURCES: readonly SourceRef[] = Object.freeze([
  { label: "Philadelphia Department of Revenue, Wage Tax rates", url: "https://www.phila.gov/services/payments-assistance-taxes/taxes/business-taxes/business-taxes-by-type/wage-tax-employers/" },
  { label: "City of Pittsburgh, taxes", url: "https://www.pittsburghpa.gov/City-Government/Finance-Budget/Taxes" },
  { label: "City of Columbus Income Tax Division", url: "https://www.columbus.gov/Government/City-Auditor/Income-Tax-Division" },
  { label: "Cleveland Central Collection Agency, tax rates", url: "http://ccatax.ci.cleveland.oh.us/?p=effective" },
  { label: "City of Cincinnati, income tax FAQ", url: "https://www.cincinnati-oh.gov/finance/frequently-asked-questions/" },
  { label: "Ohio Revised Code 718.01 (municipal income tax base)", url: "https://codes.ohio.gov/ohio-revised-code/section-718.01" },
  { label: "Michigan Department of Treasury, 2026 City of Detroit withholding guide", url: "https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/City-Withholding/TY2026/5469_ty2026.pdf" },
  { label: "Kansas City, Missouri, tax FAQs (earnings tax)", url: "https://www.kcmo.gov/city-hall/departments/finance/tax-home/tax-faqs" },
  { label: "City of St. Louis Collector of Revenue, taxable and non-taxable items", url: "https://www.stlouis-mo.gov/government/departments/collector/earnings-tax/taxable-items.cfm" },
  { label: "Comptroller of Maryland, county income tax rates (2026 withholding information)", url: "https://www.marylandcomptroller.gov/content/dam/mdcomp/md/state-payroll/memos/2026/2026-maryland-state-and-local-withholding-information.pdf" },
  { label: "Indiana DOR, Departmental Notice 1 (county rates)", url: "https://www.in.gov/dor/files/dn01.pdf" },
  { label: "New York State Department of Taxation and Finance, NYC resident tax (IT-201 instructions)", url: "https://www.tax.ny.gov/pdf/current_forms/it/it201i.pdf" },
]);
