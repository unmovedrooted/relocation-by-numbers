import { MetadataRoute } from "next";
import { findCity } from "@/lib/cities";
import { STATES } from "@/lib/states";
import {
  ALLOWED_FIRE_CITY_PAGES,
  ALLOWED_STATE_CODES,
} from "@/lib/seo-allowlists";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.relocationbynumbers.com";
  const now = new Date();

  const corePages = [
    { url: baseUrl, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/explore`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/compare`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${baseUrl}/about`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${baseUrl}/disclaimer`, priority: 0.4, changeFrequency: "yearly" as const },
    { url: `${baseUrl}/privacy`, priority: 0.4, changeFrequency: "yearly" as const },
    { url: `${baseUrl}/terms`, priority: 0.4, changeFrequency: "yearly" as const },
  ].map((page) => ({
    ...page,
    lastModified: now,
  }));

  const calculatorPages = [
    "/mortgage-calculator",
    "/one-income-relocation-calculator",
     "/blog",
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

  const rankingHubPages = [
    "/best-cities-for-fire",
    "/best-states-for-fire",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    priority: 0.8,
    changeFrequency: "monthly" as const,
  }));

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

  const fireCities = ALLOWED_FIRE_CITY_PAGES
    .map((cityId) => findCity(cityId))
    .filter((city): city is NonNullable<typeof city> => Boolean(city));

  const fireInPages = fireCities.map((city) => ({
    url: `${baseUrl}/fire-in/${city.id}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  const costOfLivingPages = fireCities.map((city) => ({
    url: `${baseUrl}/cost-of-living/${city.id}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  }));

  const bestCitiesFirePages = fireCities.map((city) => ({
    url: `${baseUrl}/best-cities-for-fire/${city.id}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));

  const bestStatesFirePages = STATES
    .filter((state) => ALLOWED_STATE_CODES.includes(state.code))
    .map((state) => ({
      url: `${baseUrl}/best-states-for-fire/${state.name.toLowerCase().replace(/\s+/g, "-")}`,
      lastModified: now,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    }));


  return [
    ...corePages,
    ...calculatorPages,
    ...internationalCalculatorPages,
    ...salaryPages,
    ...rankingHubPages,
    ...compareRoutes,
    ...fireInPages,
    ...costOfLivingPages,
    ...bestCitiesFirePages,
    ...bestStatesFirePages,
  
  ];
}