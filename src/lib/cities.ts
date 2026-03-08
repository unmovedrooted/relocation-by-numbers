import type { StateCode } from "./states";

/* ======================================================
   TYPES
   ====================================================== */

export type City = {
  id: string;
  name: string;
  state: StateCode;

  defaultRent?: number;
  medianHomePrice?: number;

  propertyTaxPct?: number;
  // ✅ tells UI if the value is an estimate (state default) or custom override
  propertyTaxIsEstimate?: boolean;

  col?: {
    housing: number;
    groceries: number;
    utilities: number;
    transport: number;
    healthcare: number;
  };

  tier?: "major" | "mid" | "small";

  // ✅ OPTIONAL STATS (merged in later if available)
  colIndex?: number;
  rentIndex?: number;
  medianRent?: number;
};

function makeOther(state: StateCode): City {
  return {
    id: `other-${state}`,
    name: "Other",
    state,
    tier: "small",
  };
}

/* ======================================================
   DEFAULT PROPERTY TAX (STATE-LEVEL EFFECTIVE RATE %)
   ====================================================== */

const STATE_PROPERTY_TAX_PCT: Record<StateCode, number> = {
  al: 0.38, ak: 1.14, az: 0.52, ar: 0.57, ca: 0.71, co: 0.49, ct: 1.92, de: 0.53,
  fl: 0.79, ga: 0.81, hi: 0.27, id: 0.53, il: 2.07, in: 0.74, ia: 1.43, ks: 1.30,
  ky: 0.77, la: 0.55, me: 1.10, md: 1.00, ma: 1.11, mi: 1.28, mn: 1.04, ms: 0.74,
  mo: 0.88, mt: 0.75, ne: 1.50, nv: 0.49, nh: 1.77, nj: 2.23, nm: 0.72, ny: 1.60,
  nc: 0.70, nd: 0.99, oh: 1.36, ok: 0.82, or: 0.83, pa: 1.35, ri: 1.32, sc: 0.51,
  sd: 1.09, tn: 0.55, tx: 1.58, ut: 0.53, vt: 1.71, va: 0.74, wa: 0.84, wv: 0.54,
  wi: 1.51, wy: 0.58,
};

/* ======================================================
   RAW CITY DATA (cleaned – only NYC has tax override)
   ====================================================== */

const RAW_CITIES: City[] = [

  // AL
{ id: "birmingham-al", name: "Birmingham", state: "al", defaultRent: 1400, medianHomePrice: 280000, tier: "major" },
{ id: "montgomery-al", name: "Montgomery", state: "al", defaultRent: 1200, medianHomePrice: 230000 },
{ id: "huntsville-al", name: "Huntsville", state: "al", defaultRent: 1500, medianHomePrice: 320000 },
makeOther("al"),

// AK
{ id: "anchorage-ak", name: "Anchorage", state: "ak", defaultRent: 1800, medianHomePrice: 410000, tier: "major" },
{ id: "fairbanks-ak", name: "Fairbanks", state: "ak", defaultRent: 1600, medianHomePrice: 300000 },
{ id: "juneau-ak", name: "Juneau", state: "ak", defaultRent: 1700, medianHomePrice: 420000 },
makeOther("ak"),

// AZ
{ id: "phoenix-az", name: "Phoenix", state: "az", defaultRent: 1900, medianHomePrice: 480000, tier: "major" },
{ id: "tucson-az", name: "Tucson", state: "az", defaultRent: 1500, medianHomePrice: 340000 },
{ id: "mesa-az", name: "Mesa", state: "az", defaultRent: 1700, medianHomePrice: 400000 },
makeOther("az"),

// AR
{ id: "little-rock-ar", name: "Little Rock", state: "ar", defaultRent: 1300, medianHomePrice: 240000, tier: "major" },
{ id: "fayetteville-ar", name: "Fayetteville", state: "ar", defaultRent: 1400, medianHomePrice: 320000 },
{ id: "fort-smith-ar", name: "Fort Smith", state: "ar", defaultRent: 1200, medianHomePrice: 190000 },
makeOther("ar"),

// CA
{ id: "la-ca", name: "Los Angeles", state: "ca", defaultRent: 2800, medianHomePrice: 900000, tier: "major" },
{ id: "sf-ca", name: "San Francisco", state: "ca", defaultRent: 3200, medianHomePrice: 1300000 },
{ id: "sd-ca", name: "San Diego", state: "ca", defaultRent: 2700, medianHomePrice: 950000 },
makeOther("ca"),

// CO
{ id: "denver-co", name: "Denver", state: "co", defaultRent: 2100, medianHomePrice: 580000, tier: "major" },
{ id: "colorado-springs-co", name: "Colorado Springs", state: "co", defaultRent: 1900, medianHomePrice: 460000 },
{ id: "aurora-co", name: "Aurora", state: "co", defaultRent: 1950, medianHomePrice: 480000 },
makeOther("co"),

// CT
{ id: "bridgeport-ct", name: "Bridgeport", state: "ct", defaultRent: 2100, medianHomePrice: 390000, tier: "major" },
{ id: "new-haven-ct", name: "New Haven", state: "ct", defaultRent: 2000, medianHomePrice: 370000 },
{ id: "hartford-ct", name: "Hartford", state: "ct", defaultRent: 1900, medianHomePrice: 310000 },
makeOther("ct"),

// DE
{ id: "wilmington-de", name: "Wilmington", state: "de", defaultRent: 1800, medianHomePrice: 340000, tier: "major" },
{ id: "dover-de", name: "Dover", state: "de", defaultRent: 1500, medianHomePrice: 290000 },
{ id: "newark-de", name: "Newark", state: "de", defaultRent: 1600, medianHomePrice: 360000 },
makeOther("de"),

// FL
{ id: "miami-fl", name: "Miami", state: "fl", defaultRent: 2600, medianHomePrice: 600000, tier: "major" },
{ id: "orlando-fl", name: "Orlando", state: "fl", defaultRent: 2000, medianHomePrice: 420000 },
{ id: "tampa-fl", name: "Tampa", state: "fl", defaultRent: 2100, medianHomePrice: 450000 },
makeOther("fl"),

// GA
{ id: "atlanta-ga", name: "Atlanta", state: "ga", defaultRent: 2000, medianHomePrice: 430000, tier: "major" },
{ id: "augusta-ga", name: "Augusta", state: "ga", defaultRent: 1500, medianHomePrice: 240000 },
{ id: "savannah-ga", name: "Savannah", state: "ga", defaultRent: 1700, medianHomePrice: 330000 },
makeOther("ga"),

// HI
{ id: "honolulu-hi", name: "Honolulu", state: "hi", defaultRent: 2800, medianHomePrice: 850000, tier: "major" },
{ id: "hilo-hi", name: "Hilo", state: "hi", defaultRent: 2100, medianHomePrice: 420000 },
{ id: "kahului-hi", name: "Kahului", state: "hi", defaultRent: 2300, medianHomePrice: 780000 },
makeOther("hi"),

// ID
{ id: "boise-id", name: "Boise", state: "id", defaultRent: 1700, medianHomePrice: 480000, tier: "major" },
{ id: "meridian-id", name: "Meridian", state: "id", defaultRent: 1750, medianHomePrice: 470000 },
{ id: "nampa-id", name: "Nampa", state: "id", defaultRent: 1600, medianHomePrice: 390000 },
makeOther("id"),

// IL
{ id: "chicago-il", name: "Chicago", state: "il", defaultRent: 2200, medianHomePrice: 350000, tier: "major" },
{ id: "aurora-il", name: "Aurora", state: "il", defaultRent: 1900, medianHomePrice: 320000 },
{ id: "naperville-il", name: "Naperville", state: "il", defaultRent: 2100, medianHomePrice: 550000 },
makeOther("il"),

// IN
{ id: "indianapolis-in", name: "Indianapolis", state: "in", defaultRent: 1500, medianHomePrice: 280000, tier: "major" },
{ id: "fort-wayne-in", name: "Fort Wayne", state: "in", defaultRent: 1300, medianHomePrice: 230000 },
{ id: "evansville-in", name: "Evansville", state: "in", defaultRent: 1250, medianHomePrice: 210000 },
makeOther("in"),

// IA
{ id: "des-moines-ia", name: "Des Moines", state: "ia", defaultRent: 1300, medianHomePrice: 260000, tier: "major" },
{ id: "cedar-rapids-ia", name: "Cedar Rapids", state: "ia", defaultRent: 1200, medianHomePrice: 220000 },
{ id: "davenport-ia", name: "Davenport", state: "ia", defaultRent: 1150, medianHomePrice: 200000 },
makeOther("ia"),

// KS
{ id: "wichita-ks", name: "Wichita", state: "ks", defaultRent: 1150, medianHomePrice: 230000, tier: "major" },
{ id: "overland-park-ks", name: "Overland Park", state: "ks", defaultRent: 1400, medianHomePrice: 420000 },
{ id: "kansas-city-ks", name: "Kansas City", state: "ks", defaultRent: 1350, medianHomePrice: 280000 },
makeOther("ks"),

// KY
{ id: "louisville-ky", name: "Louisville", state: "ky", defaultRent: 1400, medianHomePrice: 260000, tier: "major" },
{ id: "lexington-ky", name: "Lexington", state: "ky", defaultRent: 1350, medianHomePrice: 300000 },
{ id: "bowling-green-ky", name: "Bowling Green", state: "ky", defaultRent: 1200, medianHomePrice: 250000 },
makeOther("ky"),

// LA
{ id: "new-orleans-la", name: "New Orleans", state: "la", defaultRent: 1700, medianHomePrice: 320000, tier: "major" },
{ id: "baton-rouge-la", name: "Baton Rouge", state: "la", defaultRent: 1400, medianHomePrice: 250000 },
{ id: "shreveport-la", name: "Shreveport", state: "la", defaultRent: 1250, medianHomePrice: 190000 },
makeOther("la"),

// ME
{ id: "portland-me", name: "Portland", state: "me", defaultRent: 2100, medianHomePrice: 520000, tier: "major" },
{ id: "lewiston-me", name: "Lewiston", state: "me", defaultRent: 1600, medianHomePrice: 300000 },
{ id: "bangor-me", name: "Bangor", state: "me", defaultRent: 1500, medianHomePrice: 280000 },
makeOther("me"),

// MD
{ id: "baltimore-md", name: "Baltimore", state: "md", defaultRent: 1900, medianHomePrice: 360000, tier: "major" },
{ id: "frederick-md", name: "Frederick", state: "md", defaultRent: 2100, medianHomePrice: 500000 },
{ id: "rockville-md", name: "Rockville", state: "md", defaultRent: 2400, medianHomePrice: 650000 },
makeOther("md"),

// MA
{ id: "boston-ma", name: "Boston", state: "ma", defaultRent: 3000, medianHomePrice: 780000, tier: "major" },
{ id: "worcester-ma", name: "Worcester", state: "ma", defaultRent: 2100, medianHomePrice: 420000 },
{ id: "springfield-ma", name: "Springfield", state: "ma", defaultRent: 1800, medianHomePrice: 300000 },
makeOther("ma"),

// MI
{ id: "detroit-mi", name: "Detroit", state: "mi", defaultRent: 1500, medianHomePrice: 220000, tier: "major" },
{ id: "grand-rapids-mi", name: "Grand Rapids", state: "mi", defaultRent: 1600, medianHomePrice: 340000 },
{ id: "ann-arbor-mi", name: "Ann Arbor", state: "mi", defaultRent: 2100, medianHomePrice: 500000 },
makeOther("mi"),

// MN
{ id: "minneapolis-mn", name: "Minneapolis", state: "mn", defaultRent: 1900, medianHomePrice: 390000, tier: "major"},
{ id: "saint-paul-mn", name: "Saint Paul", state: "mn", defaultRent: 1800, medianHomePrice: 360000 },
{ id: "rochester-mn", name: "Rochester", state: "mn", defaultRent: 1700, medianHomePrice: 320000 },
makeOther("mn"),

// MS
{ id: "jackson-ms", name: "Jackson", state: "ms", defaultRent: 1200, medianHomePrice: 190000, tier: "major" },
{ id: "gulfport-ms", name: "Gulfport", state: "ms", defaultRent: 1300, medianHomePrice: 220000 },
{ id: "hattiesburg-ms", name: "Hattiesburg", state: "ms", defaultRent: 1150, medianHomePrice: 210000 },
makeOther("ms"),

// MO
{ id: "kansas-city-mo", name: "Kansas City", state: "mo", defaultRent: 1600, medianHomePrice: 300000, tier: "major" },
{ id: "st-louis-mo", name: "St. Louis", state: "mo", defaultRent: 1500, medianHomePrice: 250000 },
{ id: "springfield-mo", name: "Springfield", state: "mo", defaultRent: 1300, medianHomePrice: 220000 },
makeOther("mo"),

// MT
{ id: "billings-mt", name: "Billings", state: "mt", defaultRent: 1500, medianHomePrice: 400000, tier: "major" },
{ id: "missoula-mt", name: "Missoula", state: "mt", defaultRent: 1600, medianHomePrice: 520000 },
{ id: "bozeman-mt", name: "Bozeman", state: "mt", defaultRent: 1900, medianHomePrice: 650000 },
makeOther("mt"),

// NE
{ id: "omaha-ne", name: "Omaha", state: "ne", defaultRent: 1500, medianHomePrice: 300000, tier: "major" },
{ id: "lincoln-ne", name: "Lincoln", state: "ne", defaultRent: 1400, medianHomePrice: 280000 },
{ id: "bellevue-ne", name: "Bellevue", state: "ne", defaultRent: 1450, medianHomePrice: 290000 },
makeOther("ne"),

// NV
{ id: "las-vegas-nv", name: "Las Vegas", state: "nv", defaultRent: 1900, medianHomePrice: 420000, tier: "major" },
{ id: "henderson-nv", name: "Henderson", state: "nv", defaultRent: 2000, medianHomePrice: 500000 },
{ id: "reno-nv", name: "Reno", state: "nv", defaultRent: 1900, medianHomePrice: 520000 },
makeOther("nv"),

// NH
{ id: "manchester-nh", name: "Manchester", state: "nh", defaultRent: 2000, medianHomePrice: 420000, tier: "major"  },
{ id: "nashua-nh", name: "Nashua", state: "nh", defaultRent: 2100, medianHomePrice: 450000 },
{ id: "concord-nh", name: "Concord", state: "nh", defaultRent: 1900, medianHomePrice: 400000 },
makeOther("nh"),

// NJ
{ id: "newark-nj", name: "Newark", state: "nj", defaultRent: 2400, medianHomePrice: 450000, tier: "major" },
{ id: "jersey-city-nj", name: "Jersey City", state: "nj", defaultRent: 3000, medianHomePrice: 750000 },
{ id: "paterson-nj", name: "Paterson", state: "nj", defaultRent: 2200, medianHomePrice: 420000 },
makeOther("nj"),

// NM
{ id: "albuquerque-nm", name: "Albuquerque", state: "nm", defaultRent: 1500, medianHomePrice: 340000, tier: "major" },
{ id: "santa-fe-nm", name: "Santa Fe", state: "nm", defaultRent: 1900, medianHomePrice: 620000 },
{ id: "las-cruces-nm", name: "Las Cruces", state: "nm", defaultRent: 1350, medianHomePrice: 260000 },
makeOther("nm"),

// NY
{ id: "nyc-ny", name: "New York City", state: "ny", defaultRent: 5227, medianHomePrice: 750000, propertyTaxPct: 0.9, tier: "major" },
{ id: "buffalo-ny", name: "Buffalo", state: "ny", defaultRent: 1414, medianHomePrice: 220000 },
{ id: "albany-ny", name: "Albany", state: "ny", defaultRent: 1743, medianHomePrice: 280000 },
makeOther("ny"),

// NC
{ id: "charlotte-nc", name: "Charlotte", state: "nc", defaultRent: 1900, medianHomePrice: 420000, tier: "major" },
{ id: "raleigh-nc", name: "Raleigh", state: "nc", defaultRent: 1579, medianHomePrice: 450000 },
{ id: "durham-nc", name: "Durham", state: "nc", defaultRent: 1540, medianHomePrice: 430000 },
makeOther("nc"),

// ND
{ id: "fargo-nd", name: "Fargo", state: "nd", defaultRent: 1200, medianHomePrice: 290000, tier: "major" },
{ id: "bismarck-nd", name: "Bismarck", state: "nd", defaultRent: 1250, medianHomePrice: 310000 },
{ id: "grand-forks-nd", name: "Grand Forks", state: "nd", defaultRent: 1150, medianHomePrice: 260000 },
makeOther("nd"),

// OH
{ id: "columbus-oh", name: "Columbus", state: "oh", defaultRent: 1600, medianHomePrice: 300000, tier: "major" },
{ id: "cleveland-oh", name: "Cleveland", state: "oh", defaultRent: 1400, medianHomePrice: 210000 },
{ id: "cincinnati-oh", name: "Cincinnati", state: "oh", defaultRent: 1500, medianHomePrice: 260000 },
makeOther("oh"),

// OK
{ id: "oklahoma-city-ok", name: "Oklahoma City", state: "ok", defaultRent: 1400, medianHomePrice: 260000, tier: "major" },
{ id: "tulsa-ok", name: "Tulsa", state: "ok", defaultRent: 1350, medianHomePrice: 240000 },
{ id: "norman-ok", name: "Norman", state: "ok", defaultRent: 1500, medianHomePrice: 310000 },
makeOther("ok"),

// OR
{ id: "portland-or", name: "Portland", state: "or", defaultRent: 2100, medianHomePrice: 550000, tier: "major" },
{ id: "eugene-or", name: "Eugene", state: "or", defaultRent: 1700, medianHomePrice: 420000 },
{ id: "salem-or", name: "Salem", state: "or", defaultRent: 1650, medianHomePrice: 380000 },
makeOther("or"),

// PA
{ id: "philadelphia-pa", name: "Philadelphia", state: "pa", defaultRent: 2000, medianHomePrice: 320000, tier: "major" },
{ id: "pittsburgh-pa", name: "Pittsburgh", state: "pa", defaultRent: 1700, medianHomePrice: 250000 },
{ id: "allentown-pa", name: "Allentown", state: "pa", defaultRent: 1600, medianHomePrice: 280000 },
makeOther("pa"),

// RI
{ id: "providence-ri", name: "Providence", state: "ri", defaultRent: 2100, medianHomePrice: 450000, tier: "major"  },
{ id: "warwick-ri", name: "Warwick", state: "ri", defaultRent: 2000, medianHomePrice: 400000 },
{ id: "cranston-ri", name: "Cranston", state: "ri", defaultRent: 1950, medianHomePrice: 380000 },
makeOther("ri"),

// SC
{ id: "charleston-sc", name: "Charleston", state: "sc", defaultRent: 2100, medianHomePrice: 480000, tier: "major" },
{ id: "columbia-sc", name: "Columbia", state: "sc", defaultRent: 1500, medianHomePrice: 280000 },
{ id: "greenville-sc", name: "Greenville", state: "sc", defaultRent: 1650, medianHomePrice: 340000 },
makeOther("sc"),

// SD
{ id: "sioux-falls-sd", name: "Sioux Falls", state: "sd", defaultRent: 1350, medianHomePrice: 310000, tier: "major" },
{ id: "rapid-city-sd", name: "Rapid City", state: "sd", defaultRent: 1300, medianHomePrice: 290000 },
{ id: "aberdeen-sd", name: "Aberdeen", state: "sd", defaultRent: 1150, medianHomePrice: 220000 },
makeOther("sd"),

// TN
{ id: "nashville-tn", name: "Nashville", state: "tn", defaultRent: 2000, medianHomePrice: 470000, tier: "major" },
{ id: "memphis-tn", name: "Memphis", state: "tn", defaultRent: 1500, medianHomePrice: 220000 },
{ id: "knoxville-tn", name: "Knoxville", state: "tn", defaultRent: 1600, medianHomePrice: 330000 },
makeOther("tn"),

// TX
{ id: "austin-tx", name: "Austin", state: "tx", defaultRent: 2100, medianHomePrice: 520000, tier: "major" },
{ id: "dallas-tx", name: "Dallas", state: "tx", defaultRent: 1900, medianHomePrice: 420000 },
{ id: "houston-tx", name: "Houston", state: "tx", defaultRent: 1750, medianHomePrice: 330000 },
makeOther("tx"),

// UT
{ id: "salt-lake-city-ut", name: "Salt Lake City", state: "ut", defaultRent: 1900, medianHomePrice: 540000, tier: "major" },
{ id: "provo-ut", name: "Provo", state: "ut", defaultRent: 1700, medianHomePrice: 500000 },
{ id: "ogden-ut", name: "Ogden", state: "ut", defaultRent: 1600, medianHomePrice: 360000 },
makeOther("ut"),

// VT
{ id: "burlington-vt", name: "Burlington", state: "vt", defaultRent: 2000, medianHomePrice: 520000, tier: "major" },
{ id: "south-burlington-vt", name: "South Burlington", state: "vt", defaultRent: 1900, medianHomePrice: 500000 },
{ id: "rutland-vt", name: "Rutland", state: "vt", defaultRent: 1600, medianHomePrice: 260000 },
makeOther("vt"),

// VA
{ id: "virginia-beach-va", name: "Virginia Beach", state: "va", defaultRent: 1900, medianHomePrice: 380000, tier: "major" },
{ id: "richmond-va", name: "Richmond", state: "va", defaultRent: 1700, medianHomePrice: 350000 },
{ id: "arlington-va", name: "Arlington", state: "va", defaultRent: 2600, medianHomePrice: 750000 },
makeOther("va"),

// WA
{ id: "seattle-wa", name: "Seattle", state: "wa", defaultRent: 2500, medianHomePrice: 800000, tier: "major" },
{ id: "spokane-wa", name: "Spokane", state: "wa", defaultRent: 1600, medianHomePrice: 330000 },
{ id: "tacoma-wa", name: "Tacoma", state: "wa", defaultRent: 1900, medianHomePrice: 420000 },
makeOther("wa"),

// WV
{ id: "charleston-wv", name: "Charleston", state: "wv", defaultRent: 1200, medianHomePrice: 190000, tier: "major" },
{ id: "huntington-wv", name: "Huntington", state: "wv", defaultRent: 1150, medianHomePrice: 170000 },
{ id: "morgantown-wv", name: "Morgantown", state: "wv", defaultRent: 1400, medianHomePrice: 300000 },
makeOther("wv"),

// WI
{ id: "milwaukee-wi", name: "Milwaukee", state: "wi", defaultRent: 1500, medianHomePrice: 290000, tier: "major" },
{ id: "madison-wi", name: "Madison", state: "wi", defaultRent: 1800, medianHomePrice: 420000 },
{ id: "green-bay-wi", name: "Green Bay", state: "wi", defaultRent: 1400, medianHomePrice: 260000 },
makeOther("wi"),

// WY
{ id: "cheyenne-wy", name: "Cheyenne", state: "wy", defaultRent: 1500, medianHomePrice: 320000, tier: "major" },
{ id: "casper-wy", name: "Casper", state: "wy", defaultRent: 1400, medianHomePrice: 280000 },
{ id: "laramie-wy", name: "Laramie", state: "wy", defaultRent: 1600, medianHomePrice: 310000 },
makeOther("wy"),


];

/* ======================================================
   AUTO ENRICHMENT (tier + col)
   ====================================================== */

type COL = NonNullable<City["col"]>;
type Tier = NonNullable<City["tier"]>;

const DEFAULT_COL_BY_TIER: Record<Tier, COL> = {
  major: { housing: 1.25, groceries: 1.10, utilities: 1.05, transport: 1.10, healthcare: 1.05 },
  mid:   { housing: 1.05, groceries: 1.02, utilities: 1.00, transport: 1.00, healthcare: 1.00 },
  small: { housing: 0.95, groceries: 0.98, utilities: 0.98, transport: 0.98, healthcare: 0.98 },
};

const STATE_COL_NUDGE: Partial<Record<StateCode, Partial<COL>>> = {
  ny: { housing: 1.10, transport: 1.05 },
  ca: { housing: 1.12, groceries: 1.05 },
  nj: { housing: 1.08 },
  ma: { housing: 1.08 },
  hi: { housing: 1.12, groceries: 1.06 },
  tx: { housing: 0.98 },
  nc: { housing: 0.98 },
  fl: { housing: 1.02 },
};

function applyNudge(base: COL, nudge?: Partial<COL>): COL {
  if (!nudge) return base;
  return {
    housing: base.housing * (nudge.housing ?? 1),
    groceries: base.groceries * (nudge.groceries ?? 1),
    utilities: base.utilities * (nudge.utilities ?? 1),
    transport: base.transport * (nudge.transport ?? 1),
    healthcare: base.healthcare * (nudge.healthcare ?? 1),
  };
}

// 3 cities + Other pattern per state:
// index 0 => major, index 1 => mid, index 2 => small, index 3 => Other(small)
function inferTier(indexInState: number): Tier {
  const pos = indexInState % 4;
  if (pos === 0) return "major";
  if (pos === 1) return "mid";
  return "small";
}

/* ======================================================
   ENRICHMENT (tier + col + propertyTaxPct)
   ====================================================== */

function enrichCities(raw: City[]): City[] {
  let currentState: StateCode | null = null;
  let indexInState = 0;

  return raw.map((c) => {
    if (c.state !== currentState) {
      currentState = c.state;
      indexInState = 0;
    }

    const isOther = c.id.startsWith("other-");

    const tier: Tier = c.tier ?? (isOther ? "small" : inferTier(indexInState));
    const baseCol: COL = c.col ?? DEFAULT_COL_BY_TIER[tier];
    const col = applyNudge(baseCol, STATE_COL_NUDGE[c.state]);

    const stateDefaultTax = STATE_PROPERTY_TAX_PCT[c.state];
    const propertyTaxPct = c.propertyTaxPct ?? stateDefaultTax;
    const propertyTaxIsEstimate = c.propertyTaxPct == null;

    indexInState++;

    return {
      ...c,
      tier,
      col,
      propertyTaxPct,
      propertyTaxIsEstimate,
    };
  });
}

/* ======================================================
   OPTIONAL: STATS DATASET + attachStats
   ====================================================== */

// RentCafe: US average rent (Last updated Feb 09, 2026)
const US_AVG_RENT = 1737;

const CITY_STATS = [
  { id: "nyc-ny", medianRent: 5227, medianHomePrice: 865000 },
  { id: "raleigh-nc", medianRent: 1579, medianHomePrice: 395000 },
  { id: "buffalo-ny", medianRent: 1414 },
  { id: "albany-ny", medianRent: 1743 },
  { id: "durham-nc", medianRent: 1540 },
] as const;

type CityStats = (typeof CITY_STATS)[number];

const CITY_STATS_BY_ID: Record<string, CityStats> = Object.fromEntries(
  CITY_STATS.map((s) => [s.id, s])
);

function attachStats(cities: City[]): City[] {
  return cities.map((c) => {
    const s = CITY_STATS_BY_ID[c.id];
    if (!s) return c;

    const medianRent = (s as any).medianRent ?? c.medianRent ?? c.defaultRent;
    const rentIndex =
      typeof medianRent === "number" && medianRent > 0
        ? Math.round((medianRent / US_AVG_RENT) * 100)
        : undefined;

    return {
      ...c,
      ...s,
      rentIndex,
    };
  });
}

/* ======================================================
   EXPORTS
   ====================================================== */

export const CITIES: City[] = attachStats(enrichCities(RAW_CITIES));

export function citiesForState(state: StateCode) {
  return CITIES.filter((c) => c.state === state);
}

export function findCity(id: string) {
  return CITIES.find((c) => c.id === id);
}

// ======================================================
// Major-only helpers (for compare pages + dropdowns)
// ======================================================

export function isMajorCity(c: City | undefined | null) {
  return !!c && (c.tier ?? "small") === "major";
}

export function majorCitiesForState(state: StateCode) {
  return CITIES.filter((c) => c.state === state && (c.tier ?? "small") === "major");
}

export function majorCities() {
  return CITIES.filter((c) => (c.tier ?? "small") === "major");
}