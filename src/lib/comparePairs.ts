export type ComparePair = {
  from: string; // city id
  to: string;   // city id
};

export const COMPARE_PAIRS: ComparePair[] = [
  { from: "nyc-ny", to: "raleigh-nc" },
  // add more later:
  // { from: "nyc-ny", to: "durham-nc" },
  // { from: "nyc-ny", to: "chapel-hill-nc" },
];