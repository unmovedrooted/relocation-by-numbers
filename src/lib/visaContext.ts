import { FEE_NOTE } from "@/lib/relocationConstants";

export type VisaContext = {
  icon:         string;
  program:      string;
  highlight?:   string;
  notes:        string;
  estimatedFee: number;
  feeNote:      string;
  region:       "Caribbean" | "Central America" | "South America" | "Europe" | "Asia";
  restricted?:  boolean;
  territoryOf?: string;
};

export const VISA_CONTEXT: Record<string, VisaContext> = {

  // ---------------------------------------------------------------------------
  // CENTRAL AMERICA
  // ---------------------------------------------------------------------------
  PA: {
    region: "Central America",
    icon: "🇵🇦",
    program: "Pensionado Visa / Friendly Nations Visa",
    highlight: "Pensionado Visa",
    notes: "Panama's Pensionado Visa is one of the world's best retirement programs — requires $1,000/mo pension income and comes with significant discounts on healthcare, entertainment, and utilities. The Friendly Nations Visa grants permanent residency to citizens of 50+ designated countries with proof of economic ties. No minimum stay required to maintain residency. Panama uses USD, eliminating currency risk.",
    estimatedFee: 180,
    feeNote: FEE_NOTE.processing,
  },
  CR: {
    region: "Central America",
    icon: "🇨🇷",
    program: "Rentista / Pensionado / Digital Nomad Visa",
    highlight: "Rentista Visa",
    notes: "Costa Rica's Rentista Visa requires $2,500/mo in guaranteed income for 2 years. Pensionado Visa needs $1,000/mo from a pension. Digital Nomad Visa (launched 2022): $3,000/mo income, 1-year renewable. All visa categories lead to a path toward permanent residency after 3 years. Costa Rica is known for its stability, healthcare, and natural beauty.",
    estimatedFee: 200,
    feeNote: FEE_NOTE.processing,
  },
  MX: {
    region: "Central America",
    icon: "🇲🇽",
    program: "Temporary Resident Visa / Permanent Resident Visa",
    highlight: "Temporary Resident Visa",
    notes: "Mexico's Temporary Resident Visa (1–4 years) requires ~$2,600/mo income or ~$43,000 in savings. After 4 years you can apply for Permanent Residency. No official digital nomad visa — many remote workers enter on tourist status (180 days) and renew. Mexico has no capital gains tax on primary residence sales. Popular destinations: Mexico City, Guadalajara, Oaxaca, and the Riviera Maya.",
    estimatedFee: 150,
    feeNote: FEE_NOTE.processing,
  },

  // ---------------------------------------------------------------------------
  // SOUTH AMERICA
  // ---------------------------------------------------------------------------
  CO: {
    region: "South America",
    icon: "🇨🇴",
    program: "Digital Nomad Visa / Pensionado / Migrant Visa",
    highlight: "Digital Nomad Visa",
    notes: "Colombia's Digital Nomad Visa (V): remote workers with $800+/mo income, 2-year renewable. Pensionado Visa for retirees with $700+/mo pension. Migrant Visa (M) for long-term stays leads to permanent residency after 5 years. Medellín and Bogotá are major expat hubs. Colombia's infrastructure and culture have improved dramatically — very popular with North American remote workers.",
    estimatedFee: 160,
    feeNote: FEE_NOTE.processing,
  },

  // ---------------------------------------------------------------------------
  // CARIBBEAN
  // ---------------------------------------------------------------------------
  DO: {
    region: "Caribbean",
    icon: "🇩🇴",
    program: "Pensionado / Rentista / Investor Residency",
    highlight: "Rentista Visa",
    notes: "The Dominican Republic offers several residency paths. The Rentista Visa requires $1,500/mo in verifiable passive income. The Pensionado Visa requires $1,500/mo from a pension or retirement fund. Investor Residency requires a $200,000+ investment in property or a local business. Foreign-source income is generally exempt from Dominican tax for the first three years of residency. Santo Domingo and Las Terrenas are popular expat bases. Processing typically takes 3–6 months.",
    estimatedFee: 1000,
    feeNote: FEE_NOTE.processing,
  },
  JM: {
    region: "Caribbean",
    icon: "🇯🇲",
    program: "Temporary Residence Permit / CARICOM Free Movement",
    highlight: "Temporary Residence Permit",
    notes: "Jamaica does not have a dedicated digital nomad or retirement visa. Non-CARICOM nationals typically apply for a Temporary Residence Permit through the Ministry of National Security, granted on a case-by-case basis — employment, family ties, or substantial investment are the most common grounds. CARICOM nationals have free movement rights. Jamaica uses a territorial tax system; foreign-source income is generally not taxed for non-residents. Montego Bay and Kingston are the main expat hubs.",
    estimatedFee: 500,
    feeNote: FEE_NOTE.processing,
  },
  BB: {
    region: "Caribbean",
    icon: "🇧🇧",
    program: "Welcome Stamp (Digital Nomad) / Barbados Retirement Visa",
    highlight: "Welcome Stamp",
    notes: "Barbados launched the Welcome Stamp in 2020 — one of the earliest digital nomad visas globally. It allows remote workers to live in Barbados for 12 months (renewable) with a minimum income of $50,000/year. A Retirement Visa is also available for those 60+ with sufficient pension income. Barbados has a high cost of living for the Caribbean but strong infrastructure and an English-speaking environment. Note: US citizens remain liable for US taxes regardless of residency.",
    estimatedFee: 2000,
    feeNote: FEE_NOTE.processing,
  },
  TT: {
    region: "Caribbean",
    icon: "🇹🇹",
    program: "Temporary Work Permit / Investor Residency",
    highlight: "Investor Residency",
    notes: "Trinidad and Tobago does not offer a dedicated expat retirement or digital nomad visa. Long-term stays are typically facilitated through work permits (employer-sponsored), investor residency (significant capital investment required), or spousal/family connections. Tobago is more popular with lifestyle-focused expats due to its quieter pace and natural beauty. T&T has a territorial tax system — foreign-source income is generally not taxed for non-residents. Processing timelines can be lengthy; a local immigration attorney is recommended.",
    estimatedFee: 1500,
    feeNote: FEE_NOTE.processing,
  },
  PR: {
    region: "Caribbean",
    icon: "🇵🇷",
    program: "No visa required (US Territory) / Act 60 Tax Incentives",
    highlight: "Act 60 Incentives",
    territoryOf: "United States",
    notes: "Puerto Rico is a US territory — US citizens require no visa and can move freely. The major draw is Act 60 (formerly Acts 20/22): 0% capital gains tax on appreciation accrued after becoming a bona fide resident, and 4% corporate tax for qualifying export services businesses. To qualify, you must spend at least 183 days/year in Puerto Rico and sever significant ties to the mainland. You remain subject to US federal taxes on all earned income. San Juan is the primary expat hub.",
    estimatedFee: 5000,
    feeNote: FEE_NOTE.processing,
  },
  LC: {
    region: "Caribbean",
    icon: "🇱🇨",
    program: "Citizenship by Investment / Residency by Investment",
    highlight: "Citizenship by Investment",
    notes: "Saint Lucia's CBI program grants full citizenship via a $100,000+ National Economic Fund contribution, a $200,000+ real estate investment, or other approved options. Citizenship includes a passport with visa-free access to 140+ countries. No capital gains tax, no inheritance tax, no wealth tax. Residency without citizenship is also available through property investment. Rodney Bay and Cap Estate are popular expat areas.",
    estimatedFee: 100000,
    feeNote: FEE_NOTE.minimumContribution,
  },
  GD: {
    region: "Caribbean",
    icon: "🇬🇩",
    program: "Citizenship by Investment / Residency by Investment",
    highlight: "Citizenship by Investment",
    notes: "Grenada's CBI program is the only Caribbean program that includes E-2 Treaty Investor Visa eligibility with the United States — a significant advantage for US-bound business investors. Minimum investment is $150,000 (National Transformation Fund) or $220,000 (approved real estate). Citizens enjoy visa-free or visa-on-arrival access to 140+ countries including the UK, EU Schengen area, and China. No capital gains tax, no inheritance tax, no foreign income tax.",
    estimatedFee: 150000,
    feeNote: FEE_NOTE.minimumContribution,
  },
  KY: {
    region: "Caribbean",
    icon: "🇰🇾",
    program: "Global Citizen Concierge Program / Permanent Residency by Investment",
    highlight: "Global Citizen Concierge",
    territoryOf: "United Kingdom",
    notes: "The Cayman Islands launched the Global Citizen Concierge Program in 2020, allowing remote workers to live there for up to 24 months. Permanent Residency by Investment requires a $1,000,000+ investment in real estate or a local business. Zero income tax, zero capital gains tax, zero inheritance tax — one of the most favorable tax environments in the world. Cost of living is very high. The Caymans use the Cayman Islands Dollar, pegged to USD. British Overseas Territory — no path to British citizenship.",
    estimatedFee: 1500,
    feeNote: FEE_NOTE.processing,
  },
  BS: {
    region: "Caribbean",
    icon: "🇧🇸",
    program: "Extended Access Permit / Permanent Residency by Investment",
    highlight: "Extended Access Permit",
    notes: "The Bahamas introduced the Extended Access Permit in 2020, allowing remote workers and retirees to live there for up to 1 year (renewable). Permanent Residency is available through a $750,000+ real estate investment (expedited at $1.5M+). No income tax, no capital gains tax, no inheritance tax. Nassau and Exuma are popular with expats. Cost of living is high — similar to or exceeding South Florida. The Bahamian Dollar is pegged 1:1 with USD.",
    estimatedFee: 1000,
    feeNote: FEE_NOTE.processing,
  },
  TC: {
    region: "Caribbean",
    icon: "🇹🇨",
    program: "Permanent Residency by Investment / Temporary Residency",
    highlight: "Residency by Investment",
    territoryOf: "United Kingdom",
    notes: "Turks and Caicos is a British Overseas Territory with no income tax, capital gains tax, or inheritance tax. Permanent Residency is available through a $300,000+ real estate investment. A Temporary Residency Permit can be obtained with proof of sufficient income and a clean background. The US Dollar is the official currency. Providenciales (Provo) is the main hub and home to Grace Bay, consistently rated one of the world's best beaches.",
    estimatedFee: 25000,
    feeNote: FEE_NOTE.minimumInvestment,
  },
  AG: {
    region: "Caribbean",
    icon: "🇦🇬",
    program: "Citizenship by Investment / Digital Nomad Visa",
    highlight: "Citizenship by Investment",
    notes: "Antigua and Barbuda's CBI program requires a $100,000+ National Development Fund contribution (single applicant, up to 4 family members) or $200,000+ in approved real estate. A Digital Nomad Visa (Nomad Digital Residence) launched in 2021 allows remote workers to live there for up to 2 years with proof of $50,000/year income. No capital gains tax, no inheritance tax, no foreign income tax. Citizenship requires just 5 days spent in Antigua within the first 5 years. Passport grants visa-free access to 150+ countries.",
    estimatedFee: 100000,
    feeNote: FEE_NOTE.minimumContribution,
  },
  KN: {
    region: "Caribbean",
    icon: "🇰🇳",
    program: "Citizenship by Investment (oldest CBI program globally)",
    highlight: "Citizenship by Investment",
    notes: "Saint Kitts and Nevis launched the world's first Citizenship by Investment program in 1984. Current minimum is $250,000 (Sustainable Island State Contribution) or $400,000+ in approved real estate. No physical presence required to maintain citizenship. No income tax, no capital gains tax, no inheritance tax. Kittitian/Nevisian passport grants visa-free or visa-on-arrival access to 150+ countries including the UK and EU Schengen area.",
    estimatedFee: 250000,
    feeNote: FEE_NOTE.minimumContribution,
  },
  VC: {
    region: "Caribbean",
    icon: "🇻🇨",
    program: "Residency Permit / Citizenship by Investment",
    highlight: "Residency Permit",
    notes: "Saint Vincent and the Grenadines offers residency permits for those with sufficient income or investment ties to the country. A CBI program exists but is less developed than neighboring islands — minimum $110,000 (government fund) or $220,000 (real estate). No income tax on foreign-source income, no capital gains tax, no inheritance tax. The Grenadines (Bequia, Mustique, Canouan) attract a quieter, sailing-oriented expat crowd. Infrastructure is more limited than larger Caribbean islands.",
    estimatedFee: 2000,
    feeNote: FEE_NOTE.processing,
  },
  DM: {
    region: "Caribbean",
    icon: "🇩🇲",
    program: "Citizenship by Investment / Dominica Retirement Scheme",
    highlight: "Citizenship by Investment",
    notes: "Dominica has one of the most affordable CBI programs in the Caribbean — $100,000 minimum (single applicant) or $175,000 for a family of 4 via the Economic Diversification Fund. Known as the 'Nature Isle,' Dominica is less commercially developed than many Caribbean islands but offers dramatic natural beauty. No income tax on foreign-source income, no capital gains tax. A Retirement Scheme allows those 55+ to reside with proof of $2,000/month income.",
    estimatedFee: 100000,
    feeNote: FEE_NOTE.minimumContribution,
  },
  MS: {
    region: "Caribbean",
    icon: "🇲🇸",
    program: "British Overseas Territory Residency",
    highlight: "Residency Permit",
    territoryOf: "United Kingdom",
    notes: "Montserrat is a British Overseas Territory with a small population (~5,000). Long-term residency is available through work permits, spousal connections, or retirement with demonstrated financial self-sufficiency. No income tax on foreign-source income for non-residents. The island is rebuilding after the Soufrière Hills volcano devastated the south in the 1990s — the northern half is safe and inhabited. Infrastructure is limited. The Eastern Caribbean Dollar (XCD) is the currency.",
    estimatedFee: 1500,
    feeNote: FEE_NOTE.processing,
  },
  VG: {
    region: "Caribbean",
    icon: "🇻🇬",
    program: "Residence Certificate / Belonger Status",
    highlight: "Residency Permit",
    territoryOf: "United Kingdom",
    notes: "The British Virgin Islands is a British Overseas Territory and major offshore financial center. Long-term residency requires a work permit or residence certificate — typically tied to employment or property ownership. Belonger Status (permanent residency equivalent) requires 20 years of continuous residency. No income tax, no capital gains tax, no inheritance tax. The US Dollar is the official currency. Road Town on Tortola is the capital; the BVI is a sailing mecca.",
    estimatedFee: 3000,
    feeNote: FEE_NOTE.processing,
  },
  VI: {
    region: "Caribbean",
    icon: "🇻🇮",
    program: "No visa required (US Territory) / USVI Economic Development Program",
    highlight: "Economic Development Program",
    territoryOf: "United States",
    notes: "The US Virgin Islands is a US territory — US citizens require no visa. The USVI Economic Development Program (EDA) offers up to 90% reduction in income tax, exemption from gross receipts tax, and excise tax exemptions for qualifying businesses. To qualify, you must establish a genuine business in the USVI and meet presence and employment requirements. Saint Thomas and Saint John attract lifestyle-focused expats; Saint Croix is quieter and more affordable. US citizens remain subject to federal tax obligations.",
    estimatedFee: 2500,
    feeNote: FEE_NOTE.processing,
  },
  AW: {
    region: "Caribbean",
    icon: "🇦🇼",
    program: "ONE Happy Workcation / Aruba Residence Permit",
    highlight: "ONE Happy Workcation",
    territoryOf: "Netherlands",
    notes: "Aruba, a constituent country of the Netherlands, launched the ONE Happy Workcation program for remote workers — up to 90 days, extendable. Long-term residency requires a permit via immigration, typically tied to employment, investment, or spousal connections. Aruba has a stable, dollarized economy (the Aruban Florin is pegged to USD) and is outside the hurricane belt — a significant advantage. Dutch nationals can relocate freely. Healthcare is good by Caribbean standards.",
    estimatedFee: 800,
    feeNote: FEE_NOTE.processing,
  },
  CW: {
    region: "Caribbean",
    icon: "🇨🇼",
    program: "Remote Work Permit / Curaçao Residence Permit",
    highlight: "Remote Work Permit",
    territoryOf: "Netherlands",
    notes: "Curaçao is a Dutch constituent country with a formal Remote Work Permit introduced in 2021, allowing remote workers to live there for 6 months. Long-term residency is available through investment, employment, or family connections under the Dutch Kingdom framework. Dutch nationals have free movement rights. Curaçao has a territorial tax system — income earned outside the island is generally not taxed locally. Willemstad is a UNESCO World Heritage city. Outside the main hurricane belt.",
    estimatedFee: 700,
    feeNote: FEE_NOTE.processing,
  },
  SX: {
    region: "Caribbean",
    icon: "🇸🇽",
    program: "Sint Maarten Residence Permit",
    highlight: "Residence Permit",
    territoryOf: "Netherlands",
    notes: "Sint Maarten (Dutch side) is a constituent country of the Netherlands sharing the island of Saint Martin with France. Dutch nationals have free movement rights. Others must apply for a residence permit through Immigration, typically on grounds of employment, investment, or family. No dedicated digital nomad visa exists. US Dollars are widely accepted. The island was severely impacted by Hurricane Irma in 2017 and has largely rebuilt. Philipsburg is the capital.",
    estimatedFee: 1000,
    feeNote: FEE_NOTE.processing,
  },
  HT: {
    region: "Caribbean",
    icon: "🇭🇹",
    program: "Haitian Residency Permit",
    restricted: true,
    notes: "Haiti has a residency permit process through the Direction de l'Immigration et de l'Émigration, but the current political and security environment makes long-term expat relocation extremely difficult. Most international advisories currently recommend against travel to Haiti. Administrative processes are inconsistently enforced. Consult your government's travel advisory and a local legal expert before making any plans.",
    estimatedFee: 500,
    feeNote: FEE_NOTE.processing,
  },
  CU: {
    region: "Caribbean",
    icon: "🇨🇺",
    program: "Cuban Long-Stay Visa / Prorroga",
    restricted: true,
    notes: "Cuba has strict entry and residency rules. US citizens face additional legal restrictions under US Treasury OFAC regulations — most travel to Cuba remains prohibited for US nationals except under specific licensed categories. Non-US nationals can obtain a long-stay visa (prorroga) extendable in-country, or pursue residency through marriage to a Cuban national. Internet access, banking, and financial infrastructure are severely limited. US citizens must consult OFAC guidance before making any plans.",
    estimatedFee: 300,
    feeNote: FEE_NOTE.processing,
  },
};

export function getVisaContext(code: string): VisaContext | undefined {
  return VISA_CONTEXT[code];
}