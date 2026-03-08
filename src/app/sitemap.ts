import { MetadataRoute } from "next"
import { majorCities } from "@/lib/cities"

export default function sitemap(): MetadataRoute.Sitemap {

  const baseUrl = "https://www.relocationbynumbers.com"

  const calculators = [
    "/fire-calculator",
    "/coast-fire-calculator",
    "/barista-fire-calculator",
    "/lean-fire-calculator",
  ]

  const salaryPages = [
    "/fire-with-70k-salary",
    "/fire-with-80k-salary",
    "/fire-with-90k-salary",
    "/fire-with-100k-salary",
    "/fire-with-120k-salary",
    "/fire-with-150k-salary",
  ]

  const rankingPages = [
    "/best-cities-for-fire",
    "/best-states-for-fire",
  ]

  const salaryNeededPages = majorCities().map((city) => ({
    url: `${baseUrl}/salary-needed-in/${city.id}`,
    lastModified: new Date(),
  }))

  const cityPages = majorCities().map((city) => ({
    url: `${baseUrl}/fire-in/${city.id}`,
    lastModified: new Date(),
  }))

  const costOfLivingPages = majorCities().map((city) => ({
    url: `${baseUrl}/cost-of-living-in/${city.id}`,
    lastModified: new Date(),
  }))

  const staticPages = [
    ...calculators,
    ...salaryPages,
    ...rankingPages,
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    ...staticPages,
    ...cityPages,
    ...salaryNeededPages,
    ...costOfLivingPages,
  ]
}