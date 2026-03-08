// src/lib/majorCities.ts
export const MAJOR_CITIES = [
  { id: "nyc-ny", name: "New York City", state: "ny" },
  { id: "charlotte-nc", name: "Charlotte", state: "nc" },
  { id: "austin-tx", name: "Austin", state: "tx" },
  { id: "boston-ma", name: "Boston", state: "ma" },

  // add these if you use them in pairs
  { id: "la-ca", name: "Los Angeles", state: "ca" },
  { id: "miami-fl", name: "Miami", state: "fl" },
  { id: "seattle-wa", name: "Seattle", state: "wa" },
  { id: "dallas-tx", name: "Dallas", state: "tx" },
] as const;

export const majorCityPairs = [
  { from: "boston-ma", to: "nyc-ny" },
  { from: "charlotte-nc", to: "nyc-ny" },
  { from: "charlotte-nc", to: "austin-tx" },
  { from: "la-ca", to: "miami-fl" },         
  { from: "seattle-wa", to: "dallas-tx" },    
  { from: "austin-tx", to: "boston-ma" },     
] as const;