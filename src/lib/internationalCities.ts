export type InternationalCity = {
  code: string;
  countryCode: string;
  name: string;
  featured?: boolean;
};



export const INTERNATIONAL_CITIES: InternationalCity[] = [
  // United States
 // United States
{ code: "US-NYC", countryCode: "US", name: "New York City", featured: true },
{ code: "US-LAX", countryCode: "US", name: "Los Angeles", featured: true },
{ code: "US-MIA", countryCode: "US", name: "Miami", featured: true },
{ code: "US-CHI", countryCode: "US", name: "Chicago", featured: true },
{ code: "US-ATL", countryCode: "US", name: "Atlanta", featured: true },
{ code: "US-AUS", countryCode: "US", name: "Austin", featured: true },
{ code: "US-DAL", countryCode: "US", name: "Dallas", featured: true },
{ code: "US-SEA", countryCode: "US", name: "Seattle", featured: true },
{ code: "US-BNA", countryCode: "US", name: "Nashville", featured: true },
{ code: "US-CLT", countryCode: "US", name: "Charlotte", featured: true },

  // United Kingdom
  { code: "GB-LON", countryCode: "GB", name: "London", featured: true },
  { code: "GB-BIR", countryCode: "GB", name: "Birmingham" },
  { code: "GB-MAN", countryCode: "GB", name: "Manchester" },
  { code: "GB-LIV", countryCode: "GB", name: "Liverpool" },

  // Portugal
  { code: "PT-LIS", countryCode: "PT", name: "Lisbon", featured: true },
  { code: "PT-OPO", countryCode: "PT", name: "Porto" },
  { code: "PT-FAO", countryCode: "PT", name: "Faro" },
  { code: "PT-BRG", countryCode: "PT", name: "Braga" },

  // Spain
  { code: "ES-MAD", countryCode: "ES", name: "Madrid", featured: true },
  { code: "ES-BCN", countryCode: "ES", name: "Barcelona", featured: true },
  { code: "ES-VLC", countryCode: "ES", name: "Valencia" },
  { code: "ES-SVQ", countryCode: "ES", name: "Seville" },

  // Mexico
  { code: "MX-MEX", countryCode: "MX", name: "Mexico City", featured: true },
  { code: "MX-GDL", countryCode: "MX", name: "Guadalajara" },
  { code: "MX-MTY", countryCode: "MX", name: "Monterrey" },
  { code: "MX-CUN", countryCode: "MX", name: "Cancún" },

  // Canada
  { code: "CA-TOR", countryCode: "CA", name: "Toronto", featured: true },
  { code: "CA-YVR", countryCode: "CA", name: "Vancouver" },
  { code: "CA-YUL", countryCode: "CA", name: "Montreal" },
  { code: "CA-YYC", countryCode: "CA", name: "Calgary" },

  // Germany
  { code: "DE-BER", countryCode: "DE", name: "Berlin", featured: true },
  { code: "DE-MUC", countryCode: "DE", name: "Munich" },
  { code: "DE-FRA", countryCode: "DE", name: "Frankfurt" },
  { code: "DE-HAM", countryCode: "DE", name: "Hamburg" },

  // Netherlands
  { code: "NL-AMS", countryCode: "NL", name: "Amsterdam", featured: true },
  { code: "NL-RTM", countryCode: "NL", name: "Rotterdam" },
  { code: "NL-UTR", countryCode: "NL", name: "Utrecht" },
  { code: "NL-EIN", countryCode: "NL", name: "Eindhoven" },

  // Costa Rica
  { code: "CR-SJO", countryCode: "CR", name: "San José", featured: true },
  { code: "CR-LIR", countryCode: "CR", name: "Liberia" },
  { code: "CR-HER", countryCode: "CR", name: "Heredia" },
  { code: "CR-ALA", countryCode: "CR", name: "Alajuela" },

  // France
  { code: "FR-PAR", countryCode: "FR", name: "Paris", featured: true },
  { code: "FR-LYO", countryCode: "FR", name: "Lyon" },
  { code: "FR-MRS", countryCode: "FR", name: "Marseille" },
  { code: "FR-NCE", countryCode: "FR", name: "Nice" },

  // Italy
  { code: "IT-ROM", countryCode: "IT", name: "Rome", featured: true },
  { code: "IT-MIL", countryCode: "IT", name: "Milan" },
  { code: "IT-FLR", countryCode: "IT", name: "Florence" },
  { code: "IT-NAP", countryCode: "IT", name: "Naples" },

  // Ireland
  { code: "IE-DUB", countryCode: "IE", name: "Dublin", featured: true },
  { code: "IE-CRK", countryCode: "IE", name: "Cork" },
  { code: "IE-GWY", countryCode: "IE", name: "Galway" },
  { code: "IE-LMK", countryCode: "IE", name: "Limerick" },

  // Australia
  { code: "AU-SYD", countryCode: "AU", name: "Sydney", featured: true },
  { code: "AU-MEL", countryCode: "AU", name: "Melbourne" },
  { code: "AU-BNE", countryCode: "AU", name: "Brisbane" },
  { code: "AU-PER", countryCode: "AU", name: "Perth" },

  // New Zealand
  { code: "NZ-AKL", countryCode: "NZ", name: "Auckland", featured: true },
  { code: "NZ-WLG", countryCode: "NZ", name: "Wellington" },
  { code: "NZ-CHC", countryCode: "NZ", name: "Christchurch" },

  // Japan
  { code: "JP-TYO", countryCode: "JP", name: "Tokyo", featured: true },
  { code: "JP-OSA", countryCode: "JP", name: "Osaka" },
  { code: "JP-KYO", countryCode: "JP", name: "Kyoto" },
  { code: "JP-FUK", countryCode: "JP", name: "Fukuoka" },

  // South Korea
  { code: "KR-SEL", countryCode: "KR", name: "Seoul", featured: true },
  { code: "KR-BUS", countryCode: "KR", name: "Busan" },
  { code: "KR-ICN", countryCode: "KR", name: "Incheon" },

  // United Arab Emirates
  { code: "AE-DXB", countryCode: "AE", name: "Dubai", featured: true },
  { code: "AE-AUH", countryCode: "AE", name: "Abu Dhabi" },

  // Singapore
  { code: "SG-SIN", countryCode: "SG", name: "Singapore", featured: true },

  // Switzerland
  { code: "CH-ZRH", countryCode: "CH", name: "Zurich", featured: true },
  { code: "CH-GVA", countryCode: "CH", name: "Geneva" },
  { code: "CH-BSL", countryCode: "CH", name: "Basel" },

  // Denmark
  { code: "DK-CPH", countryCode: "DK", name: "Copenhagen", featured: true },
  { code: "DK-AAR", countryCode: "DK", name: "Aarhus" },

  // Sweden
  { code: "SE-STO", countryCode: "SE", name: "Stockholm", featured: true },
  { code: "SE-GOT", countryCode: "SE", name: "Gothenburg" },
  { code: "SE-MMA", countryCode: "SE", name: "Malmö" },

  // Norway
  { code: "NO-OSL", countryCode: "NO", name: "Oslo", featured: true },
  { code: "NO-BGO", countryCode: "NO", name: "Bergen" },

  // Finland
  { code: "FI-HEL", countryCode: "FI", name: "Helsinki", featured: true },
  { code: "FI-TMP", countryCode: "FI", name: "Tampere" },

  // Poland
  { code: "PL-WAW", countryCode: "PL", name: "Warsaw", featured: true },
  { code: "PL-KRK", countryCode: "PL", name: "Kraków" },
  { code: "PL-WRO", countryCode: "PL", name: "Wrocław" },

  // Czech Republic
  { code: "CZ-PRG", countryCode: "CZ", name: "Prague", featured: true },
  { code: "CZ-BRQ", countryCode: "CZ", name: "Brno" },

  // Hungary
  { code: "HU-BUD", countryCode: "HU", name: "Budapest", featured: true },

  // Greece
  { code: "GR-ATH", countryCode: "GR", name: "Athens", featured: true },
  { code: "GR-THS", countryCode: "GR", name: "Thessaloniki" },

  // Turkey
  { code: "TR-IST", countryCode: "TR", name: "Istanbul", featured: true },
  { code: "TR-ANK", countryCode: "TR", name: "Ankara" },
  { code: "TR-IZM", countryCode: "TR", name: "Izmir" },

  // Croatia
  { code: "HR-ZAG", countryCode: "HR", name: "Zagreb", featured: true },
  { code: "HR-SPU", countryCode: "HR", name: "Split" },

  // Estonia
  { code: "EE-TLL", countryCode: "EE", name: "Tallinn", featured: true },

  // Latvia
  { code: "LV-RIX", countryCode: "LV", name: "Riga", featured: true },

  // Lithuania
  { code: "LT-VNO", countryCode: "LT", name: "Vilnius", featured: true },

  // Romania
  { code: "RO-BUH", countryCode: "RO", name: "Bucharest", featured: true },
  { code: "RO-CLJ", countryCode: "RO", name: "Cluj-Napoca" },

  // Bulgaria
  { code: "BG-SOF", countryCode: "BG", name: "Sofia", featured: true },

  // Slovenia
  { code: "SI-LJU", countryCode: "SI", name: "Ljubljana", featured: true },

  // Slovakia
  { code: "SK-BTS", countryCode: "SK", name: "Bratislava", featured: true },

  // Malta
  { code: "MT-VLT", countryCode: "MT", name: "Valletta", featured: true },

  // Cyprus
  { code: "CY-NIC", countryCode: "CY", name: "Nicosia", featured: true },
  { code: "CY-LMS", countryCode: "CY", name: "Limassol" },

  // Panama
  { code: "PA-PTY", countryCode: "PA", name: "Panama City", featured: true },

  // Colombia
  { code: "CO-BOG", countryCode: "CO", name: "Bogotá", featured: true },
  { code: "CO-MDE", countryCode: "CO", name: "Medellín" },
  { code: "CO-CTG", countryCode: "CO", name: "Cartagena" },

  // Brazil
  { code: "BR-SAO", countryCode: "BR", name: "São Paulo", featured: true },
  { code: "BR-RIO", countryCode: "BR", name: "Rio de Janeiro" },

  // Argentina
  { code: "AR-BUE", countryCode: "AR", name: "Buenos Aires", featured: true },
  { code: "AR-COR", countryCode: "AR", name: "Córdoba" },

  // Chile
  { code: "CL-SCL", countryCode: "CL", name: "Santiago", featured: true },
  { code: "CL-VAP", countryCode: "CL", name: "Valparaíso" },

  // Peru
  { code: "PE-LIM", countryCode: "PE", name: "Lima", featured: true },
  { code: "PE-CUZ", countryCode: "PE", name: "Cusco" },

  // Thailand
  { code: "TH-BKK", countryCode: "TH", name: "Bangkok", featured: true },
  { code: "TH-CNX", countryCode: "TH", name: "Chiang Mai" },
  { code: "TH-HKT", countryCode: "TH", name: "Phuket" },

  // Vietnam
  { code: "VN-SGN", countryCode: "VN", name: "Ho Chi Minh City", featured: true },
  { code: "VN-HAN", countryCode: "VN", name: "Hanoi" },
  { code: "VN-DAD", countryCode: "VN", name: "Da Nang" },

  // Malaysia
  { code: "MY-KUL", countryCode: "MY", name: "Kuala Lumpur", featured: true },
  { code: "MY-PEN", countryCode: "MY", name: "Penang" },

  // Indonesia
  { code: "ID-JKT", countryCode: "ID", name: "Jakarta", featured: true },
  { code: "ID-DPS", countryCode: "ID", name: "Bali / Denpasar" },

  // South Africa
  { code: "ZA-CPT", countryCode: "ZA", name: "Cape Town", featured: true },
  { code: "ZA-JNB", countryCode: "ZA", name: "Johannesburg" },
];

export function citiesForCountry(countryCode: string) {
  return INTERNATIONAL_CITIES.filter((city) => city.countryCode === countryCode);
}

export function getInternationalCityByCode(code: string) {
  return INTERNATIONAL_CITIES.find((city) => city.code === code);
}