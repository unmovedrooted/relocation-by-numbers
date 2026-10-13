import type { StateCode } from "./states";
import { governmentCity, governmentState, ratio, type PriceParities } from "./governmentData";

/* ======================================================
   TYPES
   ====================================================== */

export type City = {
  id: string;
  name: string;
  state: StateCode;

  /** Monthly rent excluding utilities, from the Census Bureau (see src/lib/governmentData.ts). */
  defaultRent?: number;
  /** Home price from the Census Bureau: owner-reported value of recently bought homes where reliable. */
  medianHomePrice?: number;

  /** Effective property tax rate in percent: median real estate taxes paid divided by median home value (Census Bureau). */
  propertyTaxPct?: number;
  /** True when the rate is the state's rather than this city's own. */
  propertyTaxIsEstimate?: boolean;

  /** Where this city's figures come from, for display. */
  dataSource?: {
    rent: "recent-movers" | "all-renters" | null;
    homePrice: "recent-movers" | "all-owners" | null;
    priceLevel: "metro" | "state" | null;
    priceLevelArea?: string;
  };

  /** Price levels relative to the national average (1.00), from BEA Regional Price Parities. */
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
   RAW CITY DATA (cleaned – only NYC has tax override)
   ====================================================== */

const RAW_CITIES: City[] = [

  // AL
{ id: "birmingham-al", name: "Birmingham", state: "al", tier: "major" },
{ id: "montgomery-al", name: "Montgomery", state: "al" },
{ id: "huntsville-al", name: "Huntsville", state: "al" },
makeOther("al"),

// AK
{ id: "anchorage-ak", name: "Anchorage", state: "ak", tier: "major" },
{ id: "fairbanks-ak", name: "Fairbanks", state: "ak" },
{ id: "juneau-ak", name: "Juneau", state: "ak" },
makeOther("ak"),

// AZ
{ id: "phoenix-az", name: "Phoenix", state: "az", tier: "major" },
{ id: "tucson-az", name: "Tucson", state: "az" },
{ id: "mesa-az", name: "Mesa", state: "az" },
makeOther("az"),

// AR
{ id: "little-rock-ar", name: "Little Rock", state: "ar", tier: "major" },
{ id: "fayetteville-ar", name: "Fayetteville", state: "ar" },
{ id: "fort-smith-ar", name: "Fort Smith", state: "ar" },
makeOther("ar"),

// CA
{ id: "la-ca", name: "Los Angeles", state: "ca", tier: "major" },
{ id: "sf-ca", name: "San Francisco", state: "ca" },
{ id: "sd-ca", name: "San Diego", state: "ca" },
makeOther("ca"),

// CO
{ id: "denver-co", name: "Denver", state: "co", tier: "major" },
{ id: "colorado-springs-co", name: "Colorado Springs", state: "co" },
{ id: "aurora-co", name: "Aurora", state: "co" },
makeOther("co"),

// CT
{ id: "bridgeport-ct", name: "Bridgeport", state: "ct", tier: "major" },
{ id: "new-haven-ct", name: "New Haven", state: "ct" },
{ id: "hartford-ct", name: "Hartford", state: "ct" },
makeOther("ct"),

// DE
{ id: "wilmington-de", name: "Wilmington", state: "de", tier: "major" },
{ id: "dover-de", name: "Dover", state: "de" },
{ id: "newark-de", name: "Newark", state: "de" },
makeOther("de"),

// DC
{ id: "washington-dc", name: "Washington", state: "dc", tier: "major" },
makeOther("dc"),

// FL
{ id: "miami-fl", name: "Miami", state: "fl", tier: "major" },
{ id: "orlando-fl", name: "Orlando", state: "fl" },
{ id: "tampa-fl", name: "Tampa", state: "fl" },
makeOther("fl"),

// GA
{ id: "atlanta-ga", name: "Atlanta", state: "ga", tier: "major" },
{ id: "augusta-ga", name: "Augusta", state: "ga" },
{ id: "savannah-ga", name: "Savannah", state: "ga" },
makeOther("ga"),

// HI
{ id: "honolulu-hi", name: "Honolulu", state: "hi", tier: "major" },
{ id: "hilo-hi", name: "Hilo", state: "hi" },
{ id: "kahului-hi", name: "Kahului", state: "hi" },
makeOther("hi"),

// ID
{ id: "boise-id", name: "Boise", state: "id", tier: "major" },
{ id: "meridian-id", name: "Meridian", state: "id" },
{ id: "nampa-id", name: "Nampa", state: "id" },
makeOther("id"),

// IL
{ id: "chicago-il", name: "Chicago", state: "il", tier: "major" },
{ id: "aurora-il", name: "Aurora", state: "il" },
{ id: "naperville-il", name: "Naperville", state: "il" },
makeOther("il"),

// IN
{ id: "indianapolis-in", name: "Indianapolis", state: "in", tier: "major" },
{ id: "fort-wayne-in", name: "Fort Wayne", state: "in" },
{ id: "evansville-in", name: "Evansville", state: "in" },
makeOther("in"),

// IA
{ id: "des-moines-ia", name: "Des Moines", state: "ia", tier: "major" },
{ id: "cedar-rapids-ia", name: "Cedar Rapids", state: "ia" },
{ id: "davenport-ia", name: "Davenport", state: "ia" },
makeOther("ia"),

// KS
{ id: "wichita-ks", name: "Wichita", state: "ks", tier: "major" },
{ id: "overland-park-ks", name: "Overland Park", state: "ks" },
{ id: "kansas-city-ks", name: "Kansas City", state: "ks" },
makeOther("ks"),

// KY
{ id: "louisville-ky", name: "Louisville", state: "ky", tier: "major" },
{ id: "lexington-ky", name: "Lexington", state: "ky" },
{ id: "bowling-green-ky", name: "Bowling Green", state: "ky" },
makeOther("ky"),

// LA
{ id: "new-orleans-la", name: "New Orleans", state: "la", tier: "major" },
{ id: "baton-rouge-la", name: "Baton Rouge", state: "la" },
{ id: "shreveport-la", name: "Shreveport", state: "la" },
makeOther("la"),

// ME
{ id: "portland-me", name: "Portland", state: "me", tier: "major" },
{ id: "lewiston-me", name: "Lewiston", state: "me" },
{ id: "bangor-me", name: "Bangor", state: "me" },
makeOther("me"),

// MD
{ id: "baltimore-md", name: "Baltimore", state: "md", tier: "major" },
{ id: "frederick-md", name: "Frederick", state: "md" },
{ id: "rockville-md", name: "Rockville", state: "md" },
makeOther("md"),

// MA
{ id: "boston-ma", name: "Boston", state: "ma", tier: "major" },
{ id: "worcester-ma", name: "Worcester", state: "ma" },
{ id: "springfield-ma", name: "Springfield", state: "ma" },
makeOther("ma"),

// MI
{ id: "detroit-mi", name: "Detroit", state: "mi", tier: "major" },
{ id: "grand-rapids-mi", name: "Grand Rapids", state: "mi" },
{ id: "ann-arbor-mi", name: "Ann Arbor", state: "mi" },
makeOther("mi"),

// MN
{ id: "minneapolis-mn", name: "Minneapolis", state: "mn", tier: "major"},
{ id: "saint-paul-mn", name: "Saint Paul", state: "mn" },
{ id: "rochester-mn", name: "Rochester", state: "mn" },
makeOther("mn"),

// MS
{ id: "jackson-ms", name: "Jackson", state: "ms", tier: "major" },
{ id: "gulfport-ms", name: "Gulfport", state: "ms" },
{ id: "hattiesburg-ms", name: "Hattiesburg", state: "ms" },
makeOther("ms"),

// MO
{ id: "kansas-city-mo", name: "Kansas City", state: "mo", tier: "major" },
{ id: "st-louis-mo", name: "St. Louis", state: "mo" },
{ id: "springfield-mo", name: "Springfield", state: "mo" },
makeOther("mo"),

// MT
{ id: "billings-mt", name: "Billings", state: "mt", tier: "major" },
{ id: "missoula-mt", name: "Missoula", state: "mt" },
{ id: "bozeman-mt", name: "Bozeman", state: "mt" },
makeOther("mt"),

// NE
{ id: "omaha-ne", name: "Omaha", state: "ne", tier: "major" },
{ id: "lincoln-ne", name: "Lincoln", state: "ne" },
{ id: "bellevue-ne", name: "Bellevue", state: "ne" },
makeOther("ne"),

// NV
{ id: "las-vegas-nv", name: "Las Vegas", state: "nv", tier: "major" },
{ id: "henderson-nv", name: "Henderson", state: "nv" },
{ id: "reno-nv", name: "Reno", state: "nv" },
makeOther("nv"),

// NH
{ id: "manchester-nh", name: "Manchester", state: "nh", tier: "major"  },
{ id: "nashua-nh", name: "Nashua", state: "nh" },
{ id: "concord-nh", name: "Concord", state: "nh" },
makeOther("nh"),

// NJ
{ id: "newark-nj", name: "Newark", state: "nj", tier: "major" },
{ id: "jersey-city-nj", name: "Jersey City", state: "nj" },
{ id: "paterson-nj", name: "Paterson", state: "nj" },
makeOther("nj"),

// NM
{ id: "albuquerque-nm", name: "Albuquerque", state: "nm", tier: "major" },
{ id: "santa-fe-nm", name: "Santa Fe", state: "nm" },
{ id: "las-cruces-nm", name: "Las Cruces", state: "nm" },
makeOther("nm"),

// NY
{ id: "nyc-ny", name: "New York City", state: "ny", tier: "major" },
{ id: "buffalo-ny", name: "Buffalo", state: "ny" },
{ id: "albany-ny", name: "Albany", state: "ny" },
makeOther("ny"),

// NC
{ id: "charlotte-nc", name: "Charlotte", state: "nc", tier: "major" },
{ id: "raleigh-nc", name: "Raleigh", state: "nc" },
{ id: "durham-nc", name: "Durham", state: "nc" },
makeOther("nc"),

// ND
{ id: "fargo-nd", name: "Fargo", state: "nd", tier: "major" },
{ id: "bismarck-nd", name: "Bismarck", state: "nd" },
{ id: "grand-forks-nd", name: "Grand Forks", state: "nd" },
makeOther("nd"),

// OH
{ id: "columbus-oh", name: "Columbus", state: "oh", tier: "major" },
{ id: "cleveland-oh", name: "Cleveland", state: "oh" },
{ id: "cincinnati-oh", name: "Cincinnati", state: "oh" },
makeOther("oh"),

// OK
{ id: "oklahoma-city-ok", name: "Oklahoma City", state: "ok", tier: "major" },
{ id: "tulsa-ok", name: "Tulsa", state: "ok" },
{ id: "norman-ok", name: "Norman", state: "ok" },
makeOther("ok"),

// OR
{ id: "portland-or", name: "Portland", state: "or", tier: "major" },
{ id: "eugene-or", name: "Eugene", state: "or" },
{ id: "salem-or", name: "Salem", state: "or" },
makeOther("or"),

// PA
{ id: "philadelphia-pa", name: "Philadelphia", state: "pa", tier: "major" },
{ id: "pittsburgh-pa", name: "Pittsburgh", state: "pa" },
{ id: "allentown-pa", name: "Allentown", state: "pa" },
makeOther("pa"),

// RI
{ id: "providence-ri", name: "Providence", state: "ri", tier: "major"  },
{ id: "warwick-ri", name: "Warwick", state: "ri" },
{ id: "cranston-ri", name: "Cranston", state: "ri" },
makeOther("ri"),

// SC
{ id: "charleston-sc", name: "Charleston", state: "sc", tier: "major" },
{ id: "columbia-sc", name: "Columbia", state: "sc" },
{ id: "greenville-sc", name: "Greenville", state: "sc" },
makeOther("sc"),

// SD
{ id: "sioux-falls-sd", name: "Sioux Falls", state: "sd", tier: "major" },
{ id: "rapid-city-sd", name: "Rapid City", state: "sd" },
{ id: "aberdeen-sd", name: "Aberdeen", state: "sd" },
makeOther("sd"),

// TN
{ id: "nashville-tn", name: "Nashville", state: "tn", tier: "major" },
{ id: "memphis-tn", name: "Memphis", state: "tn" },
{ id: "knoxville-tn", name: "Knoxville", state: "tn" },
makeOther("tn"),

// TX
{ id: "austin-tx", name: "Austin", state: "tx", tier: "major" },
{ id: "dallas-tx", name: "Dallas", state: "tx" },
{ id: "houston-tx", name: "Houston", state: "tx" },
makeOther("tx"),

// UT
{ id: "salt-lake-city-ut", name: "Salt Lake City", state: "ut", tier: "major" },
{ id: "provo-ut", name: "Provo", state: "ut" },
{ id: "ogden-ut", name: "Ogden", state: "ut" },
makeOther("ut"),

// VT
{ id: "burlington-vt", name: "Burlington", state: "vt", tier: "major" },
{ id: "south-burlington-vt", name: "South Burlington", state: "vt" },
{ id: "rutland-vt", name: "Rutland", state: "vt" },
makeOther("vt"),

// VA
{ id: "virginia-beach-va", name: "Virginia Beach", state: "va", tier: "major" },
{ id: "richmond-va", name: "Richmond", state: "va" },
{ id: "arlington-va", name: "Arlington", state: "va" },
makeOther("va"),

// WA
{ id: "seattle-wa", name: "Seattle", state: "wa", tier: "major" },
{ id: "spokane-wa", name: "Spokane", state: "wa" },
{ id: "tacoma-wa", name: "Tacoma", state: "wa" },
makeOther("wa"),

// WV
{ id: "charleston-wv", name: "Charleston", state: "wv", tier: "major" },
{ id: "huntington-wv", name: "Huntington", state: "wv" },
{ id: "morgantown-wv", name: "Morgantown", state: "wv" },
makeOther("wv"),

// WI
{ id: "milwaukee-wi", name: "Milwaukee", state: "wi", tier: "major" },
{ id: "madison-wi", name: "Madison", state: "wi" },
{ id: "green-bay-wi", name: "Green Bay", state: "wi" },
makeOther("wi"),

// WY
{ id: "cheyenne-wy", name: "Cheyenne", state: "wy", tier: "major" },
{ id: "casper-wy", name: "Casper", state: "wy" },
{ id: "laramie-wy", name: "Laramie", state: "wy" },
makeOther("wy"),


];

/* ======================================================
   ENRICHMENT FROM GOVERNMENT DATA
   ====================================================== */

type COL = NonNullable<City["col"]>;
type Tier = NonNullable<City["tier"]>;

// 3 cities + Other pattern per state:
// index 0 => major, index 1 => mid, index 2 => small, index 3 => Other(small)
function inferTier(indexInState: number): Tier {
  const pos = indexInState % 4;
  if (pos === 0) return "major";
  if (pos === 1) return "mid";
  return "small";
}

// BEA publishes price parities for goods, housing, utilities and other services. Groceries and transportation use
// the goods index and healthcare uses the other-services index, so those three are the closest published match
// rather than category-specific indexes. When an index is missing the national average (1.00) is used.
function colFromParities(p: PriceParities | null | undefined): COL | undefined {
  if (!p) return undefined;
  const goods = ratio(p.goods) ?? 1;
  return {
    housing: ratio(p.housing) ?? 1,
    groceries: goods,
    utilities: ratio(p.utilities) ?? 1,
    transport: goods,
    healthcare: ratio(p.otherServices) ?? 1,
  };
}

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
    indexInState++;

    const cityGov = isOther ? undefined : governmentCity(c.id);
    const stateGov = governmentState(c.state);
    // A city uses its own Census figures; "Other" uses the state's.
    const census = cityGov?.census ?? stateGov?.census ?? undefined;
    const parities = cityGov?.rpp ?? stateGov?.rpp ?? undefined;

    const cityRate = cityGov?.census?.propertyTaxRatePct ?? null;
    const stateRate = stateGov?.census?.propertyTaxRatePct ?? null;
    const propertyTaxPct = cityRate ?? stateRate ?? undefined;

    return {
      ...c,
      tier,
      defaultRent: census?.rentUsed ?? undefined,
      medianHomePrice: census?.homeValueUsed ?? undefined,
      col: colFromParities(parities),
      propertyTaxPct,
      propertyTaxIsEstimate: cityRate == null,
      dataSource: {
        rent: census?.rentBasis ?? null,
        homePrice: census?.homeValueBasis ?? null,
        priceLevel: parities?.level ?? null,
        priceLevelArea: parities?.geoName?.replace(/\s*\(?Metropolitan Statistical Area\)?\s*$/, ""),
      },
    };
  });
}


/* ======================================================
   EXPORTS
   ====================================================== */

export const CITIES: City[] = enrichCities(RAW_CITIES);

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