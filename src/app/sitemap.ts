import { MetadataRoute } from "next";
import { majorCities } from "@/lib/cities";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.relocationbynumbers.com";
  const now = new Date();

  const calculators = [
    "/fire-calculator",
    "/coast-fire-calculator",
    "/barista-fire-calculator",
    "/lean-fire-calculator",
  ];

  const salaryPages = [
    "/fire-with-70k-salary",
    "/fire-with-80k-salary",
    "/fire-with-90k-salary",
    "/fire-with-100k-salary",
    "/fire-with-120k-salary",
    "/fire-with-150k-salary",
  ];

  const rankingPages = [
    "/best-cities-for-fire",
    "/best-states-for-fire",
  ];

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
  ];

  const staticPages = [
    ...calculators,
    ...salaryPages,
    ...rankingPages,
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
  }));

  const comparePages = compareRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
  }));

  const cityPages = majorCities().map((city) => ({
    url: `${baseUrl}/fire-in/${city.id}`,
    lastModified: now,
  }));

  const salaryNeededPages = majorCities().map((city) => ({
    url: `${baseUrl}/salary-needed-in/${city.id}`,
    lastModified: now,
  }));

  const costOfLivingPages = majorCities().map((city) => ({
    url: `${baseUrl}/cost-of-living-in/${city.id}`,
    lastModified: now,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
    },
    ...staticPages,
    ...comparePages,
    ...cityPages,
    ...salaryNeededPages,
    ...costOfLivingPages,
  ];
}