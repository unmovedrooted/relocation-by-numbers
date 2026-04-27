import { FEE_NOTE } from "@/lib/relocationConstants";

export type VisaRegion =
  | "Caribbean"
  | "Central America"
  | "South America"
  | "North America"
  | "Europe"
  | "Asia";

export type VisaRiskLevel = "low" | "medium" | "high" | "restricted";

export type VisaFeeType =
  | "processing"
  | "minimumContribution"
  | "minimumInvestment"
  | "legalOrServiceEstimate"
  | "unknown";

export type VisaContext = {
  icon: string;
  countryName: string;
  region: VisaRegion;
  program: string;
  highlight?: string;
  summary: string;
  requirements?: string[];
  benefits?: string[];
  cautions?: string[];
  estimatedFeeUsd?: number;
  feeType: VisaFeeType;
  feeNote: string;
  riskLevel: VisaRiskLevel;
  restricted?: boolean;
  territoryOf?: string;
  lastVerified: string;
  sourceUrls?: string[];
};

export type VisaCountryCode =
  | "PA"
  | "CR"
  | "MX"
  | "CO"
  | "DO"
  | "JM"
  | "BB"
  | "TT"
  | "PR"
  | "LC"
  | "GD"
  | "KY"
  | "BS"
  | "TC"
  | "AG"
  | "KN"
  | "VC"
  | "DM"
  | "MS"
  | "VG"
  | "VI"
  | "AW"
  | "CW"
  | "SX"
  | "HT"
  | "CU";

export const VISA_CONTEXT: Record<VisaCountryCode, VisaContext> = {
  PA: {
    countryName: "Panama",
    region: "Central America",
    icon: "🇵🇦",
    program: "Pensionado Visa / Friendly Nations Visa",
    highlight: "Pensionado Visa",
    summary:
      "Panama is popular with retirees and long-term expats because of its Pensionado Visa, dollarized economy, and established expat infrastructure.",
    requirements: [
      "Pensionado Visa generally requires proof of pension income.",
      "Friendly Nations residency is available to citizens of qualifying countries with economic ties to Panama.",
      "Requirements can vary based on nationality and application route.",
    ],
    benefits: [
      "Uses the US dollar.",
      "Established expat infrastructure.",
      "Popular retirement visa program.",
      "Potential discounts for qualifying Pensionado residents.",
    ],
    cautions: [
      "Income thresholds and documentation rules can change.",
      "Verify current requirements before making relocation decisions.",
    ],
    estimatedFeeUsd: 180,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "low",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  CR: {
    countryName: "Costa Rica",
    region: "Central America",
    icon: "🇨🇷",
    program: "Rentista / Pensionado / Digital Nomad Visa",
    highlight: "Rentista Visa",
    summary:
      "Costa Rica is a stable and popular relocation destination with retirement, income-based, and remote-worker visa options.",
    requirements: [
      "Rentista applicants generally need proof of guaranteed recurring income.",
      "Pensionado applicants generally need proof of pension income.",
      "Digital nomad applicants generally need proof of remote income.",
    ],
    benefits: [
      "Known for political stability.",
      "Popular with retirees and remote workers.",
      "Strong healthcare reputation in the region.",
      "Clear long-term residency pathways.",
    ],
    cautions: [
      "Income requirements can change.",
      "Processing timelines and documentation requirements should be verified before applying.",
    ],
    estimatedFeeUsd: 200,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "low",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  MX: {
    countryName: "Mexico",
    region: "North America",
    icon: "🇲🇽",
    program: "Temporary Resident Visa / Permanent Resident Visa",
    highlight: "Temporary Resident Visa",
    summary:
      "Mexico is one of the most accessible relocation options for North Americans, with temporary and permanent residency routes based on income or savings.",
    requirements: [
      "Temporary residency usually requires proof of monthly income or savings.",
      "Permanent residency may require higher income, higher savings, or qualifying retirement status.",
      "Requirements vary by consulate.",
    ],
    benefits: [
      "Large expat communities.",
      "Many major cities and beach towns to choose from.",
      "Strong food, culture, and travel access.",
      "Temporary residency can often lead to permanent residency.",
    ],
    cautions: [
      "Financial thresholds vary by consulate and exchange rate.",
      "There is no single official digital nomad visa category.",
      "Tourist stays should not be treated as a replacement for proper residency.",
    ],
    estimatedFeeUsd: 150,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "low",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  CO: {
    countryName: "Colombia",
    region: "South America",
    icon: "🇨🇴",
    program: "Digital Nomad Visa / Pensionado / Migrant Visa",
    highlight: "Digital Nomad Visa",
    summary:
      "Colombia offers several relocation paths, including digital nomad, pensionado, and migrant visa options for longer-term residents.",
    requirements: [
      "Digital nomad applicants generally need proof of remote income.",
      "Pensionado applicants generally need proof of pension income.",
      "Longer-term migrant visas may require additional qualifying ties.",
    ],
    benefits: [
      "Popular with North American remote workers.",
      "Medellín and Bogotá are major expat hubs.",
      "Lower cost of living than many US cities.",
      "Multiple visa categories are available.",
    ],
    cautions: [
      "Safety and neighborhood quality vary significantly by city and area.",
      "Visa requirements and income thresholds should be verified before applying.",
    ],
    estimatedFeeUsd: 160,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  DO: {
    countryName: "Dominican Republic",
    region: "Caribbean",
    icon: "🇩🇴",
    program: "Pensionado / Rentista / Investor Residency",
    highlight: "Rentista Visa",
    summary:
      "The Dominican Republic offers several residency routes for retirees, passive-income applicants, and investors.",
    requirements: [
      "Rentista applicants generally need proof of passive income.",
      "Pensionado applicants generally need proof of pension or retirement income.",
      "Investor residency usually requires a significant qualifying investment.",
    ],
    benefits: [
      "Popular Caribbean relocation destination.",
      "Santo Domingo and Las Terrenas are common expat bases.",
      "Multiple residency routes are available.",
    ],
    cautions: [
      "Legal help is usually recommended for residency applications.",
      "Tax treatment should be verified with a qualified tax professional.",
    ],
    estimatedFeeUsd: 1000,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  JM: {
    countryName: "Jamaica",
    region: "Caribbean",
    icon: "🇯🇲",
    program: "Temporary Residence Permit / CARICOM Free Movement",
    highlight: "Temporary Residence Permit",
    summary:
      "Jamaica does not have a dedicated digital nomad or retirement visa, so long-term stays usually depend on temporary residence, employment, family ties, investment, or CARICOM eligibility.",
    requirements: [
      "Non-CARICOM nationals usually need a temporary residence permit for long-term stays.",
      "Common qualifying grounds include employment, family ties, or investment.",
      "CARICOM nationals may have additional movement rights.",
    ],
    benefits: [
      "English-speaking environment.",
      "Strong cultural identity.",
      "Kingston and Montego Bay are the main expat hubs.",
    ],
    cautions: [
      "Residence permits are case-specific.",
      "Applicants should verify current Ministry of National Security requirements.",
    ],
    estimatedFeeUsd: 500,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  BB: {
    countryName: "Barbados",
    region: "Caribbean",
    icon: "🇧🇧",
    program: "Welcome Stamp / Barbados Retirement Visa",
    highlight: "Welcome Stamp",
    summary:
      "Barbados is a polished Caribbean relocation option with a well-known remote work program and retirement pathways.",
    requirements: [
      "Welcome Stamp applicants generally need proof of remote income.",
      "Retirement visa applicants generally need sufficient retirement income or assets.",
    ],
    benefits: [
      "English-speaking environment.",
      "Strong infrastructure by Caribbean standards.",
      "Formal remote work program.",
      "Attractive lifestyle destination.",
    ],
    cautions: [
      "Cost of living is high.",
      "US citizens remain subject to US tax obligations.",
      "Income and renewal rules should be verified before applying.",
    ],
    estimatedFeeUsd: 2000,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "low",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  TT: {
    countryName: "Trinidad and Tobago",
    region: "Caribbean",
    icon: "🇹🇹",
    program: "Temporary Work Permit / Investor Residency",
    highlight: "Investor Residency",
    summary:
      "Trinidad and Tobago does not offer a simple retirement or digital nomad route, so long-term relocation is usually tied to work, investment, or family connections.",
    requirements: [
      "Work permits are usually employer-sponsored.",
      "Investor residency generally requires significant capital investment.",
      "Family or spousal connections may provide another route.",
    ],
    benefits: [
      "Tobago may appeal to lifestyle-focused expats.",
      "Foreign-source income treatment may be favorable in some cases.",
      "English-speaking environment.",
    ],
    cautions: [
      "Processing can be lengthy.",
      "A local immigration attorney is recommended.",
      "No dedicated digital nomad visa is available.",
    ],
    estimatedFeeUsd: 1500,
    feeType: "legalOrServiceEstimate",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  PR: {
    countryName: "Puerto Rico",
    region: "Caribbean",
    icon: "🇵🇷",
    program: "No Visa Required for US Citizens / Act 60 Tax Incentives",
    highlight: "Act 60 Incentives",
    territoryOf: "United States",
    summary:
      "Puerto Rico is a US territory, so US citizens can move there without a visa. Its major relocation appeal is lifestyle access plus potential Act 60 tax incentives for qualifying residents and businesses.",
    requirements: [
      "US citizens do not need a visa.",
      "Act 60 benefits require bona fide Puerto Rico residency.",
      "Tax incentive eligibility depends on meeting presence, business, and tie-breaking rules.",
    ],
    benefits: [
      "No visa needed for US citizens.",
      "Uses the US dollar.",
      "Potential tax incentives for qualifying residents and businesses.",
      "San Juan is the primary expat and business hub.",
    ],
    cautions: [
      "Act 60 is complex and should not be handled without tax guidance.",
      "US federal tax obligations may still apply depending on income type and residency facts.",
    ],
    estimatedFeeUsd: 5000,
    feeType: "legalOrServiceEstimate",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  LC: {
    countryName: "Saint Lucia",
    region: "Caribbean",
    icon: "🇱🇨",
    program: "Citizenship by Investment / Residency by Investment",
    highlight: "Citizenship by Investment",
    summary:
      "Saint Lucia offers citizenship by investment and residency options for applicants seeking a Caribbean second citizenship or investment-based relocation path.",
    requirements: [
      "Citizenship by investment generally requires a qualifying contribution, real estate investment, or other approved investment.",
      "Applicants must pass due diligence checks.",
      "Residency options may require property or investment ties.",
    ],
    benefits: [
      "Potential second citizenship.",
      "No capital gains tax, inheritance tax, or wealth tax in many cases.",
      "Rodney Bay and Cap Estate are popular expat areas.",
    ],
    cautions: [
      "CBI programs require careful legal review.",
      "Government fees, due diligence fees, and professional fees can materially increase total cost.",
    ],
    estimatedFeeUsd: 100000,
    feeType: "minimumContribution",
    feeNote: FEE_NOTE.minimumContribution,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  GD: {
    countryName: "Grenada",
    region: "Caribbean",
    icon: "🇬🇩",
    program: "Citizenship by Investment / Residency by Investment",
    highlight: "Citizenship by Investment",
    summary:
      "Grenada offers a citizenship by investment program that is notable for investors because Grenadian citizenship may support eligibility for the US E-2 Treaty Investor Visa route.",
    requirements: [
      "Applicants generally need a qualifying government contribution or approved real estate investment.",
      "Applicants must pass due diligence checks.",
      "Real estate investments usually have holding-period rules.",
    ],
    benefits: [
      "Potential second citizenship.",
      "Possible US E-2 Treaty Investor Visa eligibility route.",
      "Visa-free or visa-on-arrival access to many countries.",
      "No capital gains tax or inheritance tax in many cases.",
    ],
    cautions: [
      "E-2 eligibility is not automatic and requires a separate US visa process.",
      "CBI costs often exceed the headline minimum contribution.",
    ],
    estimatedFeeUsd: 150000,
    feeType: "minimumContribution",
    feeNote: FEE_NOTE.minimumContribution,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  KY: {
    countryName: "Cayman Islands",
    region: "Caribbean",
    icon: "🇰🇾",
    program: "Global Citizen Concierge Program / Permanent Residency by Investment",
    highlight: "Global Citizen Concierge",
    territoryOf: "United Kingdom",
    summary:
      "The Cayman Islands is a high-cost, tax-favorable British Overseas Territory with remote-worker and investment-based residency routes.",
    requirements: [
      "Remote-worker programs usually require proof of high income.",
      "Permanent residency by investment generally requires significant investment in real estate or business.",
      "Applicants may need health insurance and clean background checks.",
    ],
    benefits: [
      "No income tax, capital gains tax, or inheritance tax.",
      "Strong financial infrastructure.",
      "Cayman Islands Dollar is pegged to the US dollar.",
    ],
    cautions: [
      "Cost of living is very high.",
      "British Overseas Territory status does not automatically create a path to British citizenship.",
      "Program availability and requirements should be verified.",
    ],
    estimatedFeeUsd: 1500,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "low",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  BS: {
    countryName: "Bahamas",
    region: "Caribbean",
    icon: "🇧🇸",
    program: "Extended Access Permit / Permanent Residency by Investment",
    highlight: "Extended Access Permit",
    summary:
      "The Bahamas offers remote-worker access and investment-based permanent residency in a tax-favorable Caribbean environment.",
    requirements: [
      "Remote workers generally need proof of employment or self-employment outside the Bahamas.",
      "Permanent residency by investment usually requires a qualifying real estate investment.",
      "Applicants may need background checks and proof of financial self-sufficiency.",
    ],
    benefits: [
      "No income tax, capital gains tax, or inheritance tax.",
      "Bahamian dollar is pegged to the US dollar.",
      "Nassau and Exuma are popular with expats.",
    ],
    cautions: [
      "Cost of living is high.",
      "Hurricane exposure and insurance costs should be considered.",
      "Investment thresholds should be verified before planning.",
    ],
    estimatedFeeUsd: 1000,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "low",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  TC: {
    countryName: "Turks and Caicos",
    region: "Caribbean",
    icon: "🇹🇨",
    program: "Permanent Residency by Investment / Temporary Residency",
    highlight: "Residency by Investment",
    territoryOf: "United Kingdom",
    summary:
      "Turks and Caicos is a high-cost British Overseas Territory with temporary residence and investment-based permanent residency options.",
    requirements: [
      "Temporary residency usually requires proof of sufficient income and a clean background.",
      "Permanent residency may require a qualifying real estate investment.",
      "Requirements vary based on island and investment category.",
    ],
    benefits: [
      "No income tax, capital gains tax, or inheritance tax.",
      "Uses the US dollar.",
      "Providenciales is the main expat hub.",
      "Grace Bay is a globally known beach destination.",
    ],
    cautions: [
      "Cost of living is high.",
      "Investment thresholds and permit categories should be verified.",
      "British Overseas Territory status does not automatically create UK citizenship rights.",
    ],
    estimatedFeeUsd: 25000,
    feeType: "minimumInvestment",
    feeNote: FEE_NOTE.minimumInvestment,
    riskLevel: "low",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  AG: {
    countryName: "Antigua and Barbuda",
    region: "Caribbean",
    icon: "🇦🇬",
    program: "Citizenship by Investment / Digital Nomad Visa",
    highlight: "Citizenship by Investment",
    summary:
      "Antigua and Barbuda offers both citizenship by investment and a remote-worker residency option for people seeking Caribbean access.",
    requirements: [
      "CBI applicants generally need a qualifying contribution, real estate purchase, or approved investment.",
      "Digital nomad applicants generally need proof of remote income.",
      "CBI applicants must pass due diligence checks.",
    ],
    benefits: [
      "Potential second citizenship.",
      "Remote work option available.",
      "No capital gains tax or inheritance tax in many cases.",
      "Low physical presence requirement for CBI.",
    ],
    cautions: [
      "CBI costs can exceed headline minimums after government and professional fees.",
      "Remote-worker visa rules should be verified before applying.",
    ],
    estimatedFeeUsd: 100000,
    feeType: "minimumContribution",
    feeNote: FEE_NOTE.minimumContribution,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  KN: {
    countryName: "Saint Kitts and Nevis",
    region: "Caribbean",
    icon: "🇰🇳",
    program: "Citizenship by Investment",
    highlight: "Citizenship by Investment",
    summary:
      "Saint Kitts and Nevis has one of the oldest citizenship by investment programs in the world and is aimed at applicants seeking second citizenship through contribution or investment.",
    requirements: [
      "Applicants generally need a qualifying government contribution or approved real estate investment.",
      "Applicants must pass due diligence checks.",
      "Real estate investment routes may have holding-period rules.",
    ],
    benefits: [
      "Potential second citizenship.",
      "No physical presence requirement in many cases.",
      "No income tax, capital gains tax, or inheritance tax in many cases.",
      "Visa-free or visa-on-arrival access to many countries.",
    ],
    cautions: [
      "CBI rules and minimums change over time.",
      "Total cost can be much higher than the headline minimum.",
    ],
    estimatedFeeUsd: 250000,
    feeType: "minimumContribution",
    feeNote: FEE_NOTE.minimumContribution,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  VC: {
    countryName: "Saint Vincent and the Grenadines",
    region: "Caribbean",
    icon: "🇻🇨",
    program: "Residency Permit / Citizenship by Investment",
    highlight: "Residency Permit",
    summary:
      "Saint Vincent and the Grenadines may appeal to quieter, sailing-focused expats, but its residency and citizenship routes are less mainstream than larger Caribbean programs.",
    requirements: [
      "Residency permits generally require proof of sufficient income or local ties.",
      "Investment-based routes may require qualifying contributions or real estate investment.",
      "Applicants may need background checks and proof of financial self-sufficiency.",
    ],
    benefits: [
      "Quiet lifestyle appeal.",
      "The Grenadines attract sailing-oriented expats.",
      "No capital gains tax or inheritance tax in many cases.",
    ],
    cautions: [
      "Infrastructure is more limited than larger Caribbean islands.",
      "CBI information should be verified carefully because the program is less established.",
    ],
    estimatedFeeUsd: 2000,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  DM: {
    countryName: "Dominica",
    region: "Caribbean",
    icon: "🇩🇲",
    program: "Citizenship by Investment / Dominica Retirement Scheme",
    highlight: "Citizenship by Investment",
    summary:
      "Dominica offers one of the more affordable Caribbean citizenship by investment programs, along with retirement-oriented residence options.",
    requirements: [
      "CBI applicants generally need a qualifying government contribution or approved real estate investment.",
      "Applicants must pass due diligence checks.",
      "Retirement routes generally require proof of recurring income.",
    ],
    benefits: [
      "Relatively affordable CBI option compared with some Caribbean peers.",
      "Known for natural beauty.",
      "No capital gains tax in many cases.",
    ],
    cautions: [
      "Dominica is less commercially developed than many Caribbean islands.",
      "CBI total costs can exceed headline minimums.",
      "Program rules should be verified before planning.",
    ],
    estimatedFeeUsd: 100000,
    feeType: "minimumContribution",
    feeNote: FEE_NOTE.minimumContribution,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  MS: {
    countryName: "Montserrat",
    region: "Caribbean",
    icon: "🇲🇸",
    program: "British Overseas Territory Residency",
    highlight: "Residency Permit",
    territoryOf: "United Kingdom",
    summary:
      "Montserrat is a small British Overseas Territory where long-term residence is usually tied to work, family, retirement, or demonstrated financial self-sufficiency.",
    requirements: [
      "Long-term residency may require a work permit, family connection, or financial self-sufficiency.",
      "Applicants may need health, police, and financial documentation.",
    ],
    benefits: [
      "Small, quiet island environment.",
      "Eastern Caribbean Dollar is the local currency.",
      "May appeal to people seeking a slower pace.",
    ],
    cautions: [
      "Infrastructure is limited.",
      "The island is still shaped by the Soufrière Hills volcano impact.",
      "Residency rules should be verified directly before planning.",
    ],
    estimatedFeeUsd: 1500,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  VG: {
    countryName: "British Virgin Islands",
    region: "Caribbean",
    icon: "🇻🇬",
    program: "Residence Certificate / Belonger Status",
    highlight: "Residency Permit",
    territoryOf: "United Kingdom",
    summary:
      "The British Virgin Islands is a high-cost British Overseas Territory where long-term residence is usually tied to employment, property, business, or long-term local ties.",
    requirements: [
      "Long-term residency generally requires a work permit or residence certificate.",
      "Belonger Status usually requires a long period of continuous residence.",
      "Applicants may need employment, property, or business ties.",
    ],
    benefits: [
      "No income tax, capital gains tax, or inheritance tax in many cases.",
      "Uses the US dollar.",
      "Strong offshore financial services sector.",
      "Major sailing destination.",
    ],
    cautions: [
      "Cost of living is high.",
      "Permanent status is difficult and slow.",
      "British Overseas Territory status does not automatically create UK citizenship rights.",
    ],
    estimatedFeeUsd: 3000,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  VI: {
    countryName: "US Virgin Islands",
    region: "Caribbean",
    icon: "🇻🇮",
    program: "No Visa Required for US Citizens / Economic Development Program",
    highlight: "Economic Development Program",
    territoryOf: "United States",
    summary:
      "The US Virgin Islands is a US territory, so US citizens can move there without a visa. Its Economic Development Program may offer tax incentives for qualifying businesses.",
    requirements: [
      "US citizens do not need a visa.",
      "Economic Development Program applicants must establish a qualifying business.",
      "Applicants must meet presence, employment, and local business requirements.",
    ],
    benefits: [
      "No visa needed for US citizens.",
      "Uses the US dollar.",
      "Potential tax incentives for qualifying businesses.",
      "Saint Thomas, Saint John, and Saint Croix offer different lifestyle options.",
    ],
    cautions: [
      "Tax incentives are complex and require professional guidance.",
      "US tax obligations may still apply depending on facts and income type.",
    ],
    estimatedFeeUsd: 2500,
    feeType: "legalOrServiceEstimate",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  AW: {
    countryName: "Aruba",
    region: "Caribbean",
    icon: "🇦🇼",
    program: "ONE Happy Workcation / Aruba Residence Permit",
    highlight: "ONE Happy Workcation",
    territoryOf: "Netherlands",
    summary:
      "Aruba offers a short-term remote work option and longer-term residence permits through employment, investment, or family connections.",
    requirements: [
      "Short-term remote workers may qualify under Aruba's workcation-style program.",
      "Longer-term residents usually need a residence permit.",
      "Employment, investment, or family ties are common grounds for residence.",
    ],
    benefits: [
      "Outside the main hurricane belt.",
      "Aruban Florin is pegged to the US dollar.",
      "Stable tourism economy.",
      "Dutch nationals may have easier relocation rights.",
    ],
    cautions: [
      "Short-term workcation programs are not the same as permanent residency.",
      "Long-term permit requirements should be verified before planning.",
    ],
    estimatedFeeUsd: 800,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "low",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  CW: {
    countryName: "Curaçao",
    region: "Caribbean",
    icon: "🇨🇼",
    program: "Remote Work Permit / Curaçao Residence Permit",
    highlight: "Remote Work Permit",
    territoryOf: "Netherlands",
    summary:
      "Curaçao offers remote work and longer-term residence routes under the Dutch Kingdom framework.",
    requirements: [
      "Remote work applicants generally need proof of foreign employment or self-employment.",
      "Long-term residency may be based on investment, employment, or family connections.",
      "Dutch nationals may have easier movement rights.",
    ],
    benefits: [
      "Outside the main hurricane belt.",
      "Willemstad is a UNESCO World Heritage city.",
      "Territorial tax treatment may be favorable in some cases.",
      "Formal remote work route available.",
    ],
    cautions: [
      "Remote permits are usually temporary.",
      "Local tax treatment should be verified with a professional.",
    ],
    estimatedFeeUsd: 700,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "low",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  SX: {
    countryName: "Sint Maarten",
    region: "Caribbean",
    icon: "🇸🇽",
    program: "Sint Maarten Residence Permit",
    highlight: "Residence Permit",
    territoryOf: "Netherlands",
    summary:
      "Sint Maarten does not have a dedicated digital nomad visa, so long-term residence is usually based on employment, investment, or family connections.",
    requirements: [
      "Non-Dutch nationals generally need a residence permit.",
      "Common grounds include employment, investment, or family ties.",
      "Dutch nationals may have easier movement rights.",
    ],
    benefits: [
      "US dollars are widely accepted.",
      "Philipsburg is the capital and main commercial hub.",
      "Shared-island access with the French side of Saint Martin.",
    ],
    cautions: [
      "No dedicated digital nomad visa exists.",
      "Hurricane risk should be considered.",
      "Permit rules should be verified before applying.",
    ],
    estimatedFeeUsd: 1000,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "medium",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  HT: {
    countryName: "Haiti",
    region: "Caribbean",
    icon: "🇭🇹",
    program: "Haitian Residency Permit",
    highlight: "Residency Permit",
    restricted: true,
    summary:
      "Haiti has a residency process, but the current security and political environment makes long-term expat relocation extremely difficult.",
    requirements: [
      "Residency typically requires immigration documentation through Haitian authorities.",
      "Applicants may need local legal support due to administrative complexity.",
    ],
    benefits: [
      "Potential long-term residence route exists in theory.",
    ],
    cautions: [
      "Most relocation planning should be paused unless there is a serious reason to move.",
      "Security conditions are a major concern.",
      "Government travel advisories should be checked before any travel or relocation planning.",
    ],
    estimatedFeeUsd: 500,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "restricted",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },

  CU: {
    countryName: "Cuba",
    region: "Caribbean",
    icon: "🇨🇺",
    program: "Cuban Long-Stay Visa / Prórroga",
    highlight: "Long-Stay Visa",
    restricted: true,
    summary:
      "Cuba has strict entry and residency rules, and US citizens face additional restrictions under US law.",
    requirements: [
      "Longer stays may require extensions or specific visa categories.",
      "Residency may be possible through family or marriage routes.",
      "US nationals must comply with applicable US travel and financial restrictions.",
    ],
    benefits: [
      "Long-stay options may exist for qualifying applicants.",
    ],
    cautions: [
      "US citizens face additional legal restrictions.",
      "Banking, internet, and financial infrastructure can be difficult.",
      "Applicants should verify both Cuban requirements and their home-country restrictions before planning.",
    ],
    estimatedFeeUsd: 300,
    feeType: "processing",
    feeNote: FEE_NOTE.processing,
    riskLevel: "restricted",
    lastVerified: "2026-04-26",
    sourceUrls: [],
  },
};

export const VISA_DISCLAIMER =
  "Visa, tax, residency, and immigration rules change frequently. This information is for general planning only and is not legal, tax, or immigration advice. Always verify details with official government sources or a qualified professional before making relocation decisions.";

export function isVisaCountryCode(code: string): code is VisaCountryCode {
  return code.toUpperCase() in VISA_CONTEXT;
}

export function getVisaContext(code: string): VisaContext | undefined {
  const normalizedCode = code.toUpperCase();

  if (!isVisaCountryCode(normalizedCode)) {
    return undefined;
  }

  return VISA_CONTEXT[normalizedCode];
}

export function getVisaContextsByRegion(region: VisaRegion): VisaContext[] {
  return Object.values(VISA_CONTEXT).filter(
    (context) => context.region === region
  );
}

export function getRestrictedVisaContexts(): VisaContext[] {
  return Object.values(VISA_CONTEXT).filter((context) => context.restricted);
}

export function getAffordableVisaContexts(maxFeeUsd: number): VisaContext[] {
  return Object.values(VISA_CONTEXT).filter((context) => {
    if (!context.estimatedFeeUsd) return false;
    return context.estimatedFeeUsd <= maxFeeUsd;
  });
}