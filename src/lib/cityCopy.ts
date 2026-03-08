export type CityCopy = {
  intro: string;
  neighborhoods: string[]; // 3 bullets
  goodFor: string[]; // 2 bullets
  considerIf: string[]; // 2 bullets
};

export const CITY_COPY: Record<string, CityCopy> = {
  "nyc-ny": {
    intro:
      "New York City’s cost of living is driven primarily by housing and taxes. For many households, rent and day-to-day expenses can vary widely by neighborhood, lifestyle, and commute.",
    neighborhoods: ["More affordable: Upper Manhattan, parts of Queens", "Popular: Brooklyn brownstone areas", "Families: Riverdale, parts of Staten Island"],
    goodFor: ["Career growth and dense walkability", "Public transit + urban amenities"],
    considerIf: ["Housing budget is tight", "You prefer driving-centric living"],
  },
  "charlotte-nc": {
    intro:
      "Charlotte’s cost of living is often more manageable than larger coastal metros, with housing typically the biggest budget lever. Neighborhood choice and commute patterns can meaningfully change your monthly spend.",
    neighborhoods: ["More affordable: North/East Charlotte pockets", "Popular: South End, NoDa", "Families: Ballantyne, South Charlotte suburbs"],
    goodFor: ["Lower housing costs with city amenities", "Remote workers seeking value"],
    considerIf: ["You need subway-style transit", "You want a very dense urban core"],
  },
  "austin-tx": {
    intro:
      "Austin’s cost of living is heavily shaped by housing demand and neighborhood proximity to downtown. Rent can vary significantly depending on commute preference and whether you prioritize nightlife, schools, or space.",
    neighborhoods: ["More affordable: North Austin, far East Austin", "Popular: South Congress area, East Austin", "Families: Cedar Park, Round Rock"],
    goodFor: ["Tech/creative scene and outdoor lifestyle", "No state income tax advantages"],
    considerIf: ["You want consistently low rent close-in", "You dislike traffic-heavy commuting"],
  },
  "la-ca": {
    intro:
      "Los Angeles cost of living is driven by housing and transportation. Rent can be high, and commute time can influence where people choose to live and what they pay each month.",
    neighborhoods: ["More affordable: Parts of the Valley", "Popular: Westside pockets, Silver Lake", "Families: Pasadena/SGV depending on budget"],
    goodFor: ["Entertainment/creative careers and weather", "Neighborhood variety and lifestyle options"],
    considerIf: ["You want minimal driving", "You need a lower monthly housing budget"],
  },
  "seattle-wa": {
    intro:
      "Seattle’s cost of living is strongly influenced by housing and utilities, with meaningful neighborhood differences. Many people balance rent vs commute and prioritize access to transit and tech job centers.",
    neighborhoods: ["More affordable: South Seattle pockets", "Popular: Capitol Hill, Ballard", "Families: West Seattle, Shoreline"],
    goodFor: ["Tech opportunities and walkable neighborhoods", "No state income tax benefits"],
    considerIf: ["You’re sensitive to higher housing costs", "You prefer hot climates"],
  },
  "boston-ma": {
    intro:
      "Boston’s cost of living is shaped by housing, taxes, and demand near transit and universities. Rent can rise quickly close to downtown and key transit lines.",
    neighborhoods: ["More affordable: Outer neighborhoods depending on transit", "Popular: South End, Cambridge/Somerville areas", "Families: Brookline/Arlington (budget permitting)"],
    goodFor: ["Education/healthcare hubs", "Historic walkable neighborhoods"],
    considerIf: ["You need low rent near downtown", "You want mild winters"],
  },
  "miami-fl": {
    intro:
      "Miami’s cost of living depends heavily on housing and insurance costs, especially near the water. Neighborhood selection and building type can meaningfully change your monthly budget.",
    neighborhoods: ["More affordable: West Miami/Doral edges", "Popular: Brickell, Wynwood", "Families: Coral Gables / suburbs depending on budget"],
    goodFor: ["Warm climate and nightlife", "No state income tax benefits"],
    considerIf: ["You’re sensitive to insurance-driven costs", "You prefer cooler weather"],
  },
};