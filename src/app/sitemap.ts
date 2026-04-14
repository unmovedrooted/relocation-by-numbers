import { MetadataRoute } from "next";
import { majorCities } from "@/lib/cities";
import { STATES } from "@/lib/states";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.relocationbynumbers.com";
  const now = new Date();

  // ── Core pages ─────────────────────────────────────────────────────────────
  const corePages = [
    { url: baseUrl, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/explore`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/compare`, priority: 0.8, changeFrequency: "weekly" as const },
  ];

  // ── FIRE & retirement calculators ──────────────────────────────────────────
  const calculatorPages = [
    "/mortgage-calculator",
    "/one-income-relocation-calculator",
    "/fire-calculator",
    "/fire-number-calculator",
    "/coast-fire-calculator",
    "/barista-fire-calculator",
    "/lean-fire-calculator",
    "/how-much-do-i-need-to-retire",
    "/savings-rate-for-fire",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    priority: 0.9,
    changeFrequency: "monthly" as const,
  }));

  // ── International relocation calculators ───────────────────────────────────
  const internationalCalculatorPages = [
    "/international-relocation",
    "/europe-relocation-calculator",
    "/asia-relocation-calculator",
    "/caribbean-relocation-calculator",
    "/south-america-relocation-calculator",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    priority: 0.9,
    changeFrequency: "monthly" as const,
  }));

  // ── FIRE by salary ─────────────────────────────────────────────────────────
  const salaryPages = [
    "/fire-with-50k-salary",
    "/fire-with-60k-salary",
    "/fire-with-70k-salary",
    "/fire-with-80k-salary",
    "/fire-with-90k-salary",
    "/fire-with-100k-salary",
    "/fire-with-120k-salary",
    "/fire-with-150k-salary",
    "/fire-with-200k-salary",
    "/fire-with-220k-salary",
    "/fire-with-250k-salary",
    "/fire-with-300k-salary",
    "/fire-with-320k-salary",
    "/fire-with-350k-salary",
    "/fire-with-400k-salary",
    "/fire-with-420k-salary",
    "/fire-with-450k-salary",
    "/fire-with-500k-salary",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  // ── Ranking hub pages ──────────────────────────────────────────────────────
  const rankingHubPages = [
    "/best-cities-for-fire",
    "/best-states-for-fire",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: "monthly" as const,
  }));

  // ── Compare routes ─────────────────────────────────────────────────────────
  const compareRoutes = [
    "/compare/nyc-ny/charlotte-nc",
    "/compare/nyc-ny/austin-tx",
    "/compare/nyc-ny/la-ca",
    "/compare/la-ca/nyc-ny",
    "/compare/la-ca/austin-tx",
    "/compare/la-ca/charlotte-nc",
    "/compare/austin-tx/nyc-ny",
    "/compare/austin-tx/la-ca",
    "/compare/austin-tx/seattle-wa",
    "/compare/seattle-wa/nyc-ny",
    "/compare/seattle-wa/austin-tx",
    "/compare/seattle-wa/boston-ma",
    "/compare/boston-ma/nyc-ny",
    "/compare/boston-ma/seattle-wa",
    "/compare/boston-ma/miami-fl",
    "/compare/charlotte-nc/nyc-ny",
    "/compare/charlotte-nc/austin-tx",
    "/compare/charlotte-nc/miami-fl",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  // ── City-level pages ───────────────────────────────────────────────────────
  const cities = majorCities();

  const fireInPages = cities.map((city) => ({
    url: `${baseUrl}/fire-in/${city.id}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  const salaryNeededPages = cities.map((city) => ({
    url: `${baseUrl}/salary-needed-in/${city.id}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  const costOfLivingPages = cities.map((city) => ({
    url: `${baseUrl}/cost-of-living/${city.id}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const bestCitiesFirePages = cities.map((city) => ({
    url: `${baseUrl}/best-cities-for-fire/${city.id}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  // ── State-level pages ──────────────────────────────────────────────────────
  const bestStatesFirePages = STATES.map((s) => ({
    url: `${baseUrl}/best-states-for-fire/${s.name.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  const moveToStatePages = STATES.map((s) => ({
    url: `${baseUrl}/move-to/${s.code}`,
    lastModified: now,
    priority: 0.5,
    changeFrequency: "monthly" as const,
  }));

  return [
    ...corePages.map((p) => ({ ...p, lastModified: now })),
    ...calculatorPages,
    ...internationalCalculatorPages,
    ...salaryPages,
    ...rankingHubPages,
    ...compareRoutes,
    ...fireInPages,
    ...salaryNeededPages,
    ...costOfLivingPages,
    ...bestCitiesFirePages,
    ...bestStatesFirePages,
    ...moveToStatePages,
  ];
}
