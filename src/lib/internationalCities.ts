export type InternationalCity = {
  code: string;
  countryCode: string;
  name: string;
  featured?: boolean;
};

export const INTERNATIONAL_CITIES: InternationalCity[] = [

  // United States (10 → keep as-is, already 10)
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

  // United Kingdom (4 → 5)
  { code: "GB-LON", countryCode: "GB", name: "London", featured: true },
  { code: "GB-BIR", countryCode: "GB", name: "Birmingham" },
  { code: "GB-MAN", countryCode: "GB", name: "Manchester" },
  { code: "GB-LIV", countryCode: "GB", name: "Liverpool" },
  { code: "GB-EDI", countryCode: "GB", name: "Edinburgh" },

  // Portugal (4 → 5)
  { code: "PT-LIS", countryCode: "PT", name: "Lisbon", featured: true },
  { code: "PT-OPO", countryCode: "PT", name: "Porto" },
  { code: "PT-FAO", countryCode: "PT", name: "Faro" },
  { code: "PT-BRG", countryCode: "PT", name: "Braga" },
  { code: "PT-SET", countryCode: "PT", name: "Setúbal" },

  // Austria
{ code: "AT-VIE", countryCode: "AT", name: "Vienna", featured: true },
{ code: "AT-SZG", countryCode: "AT", name: "Salzburg" },
{ code: "AT-GRZ", countryCode: "AT", name: "Graz" },
{ code: "AT-LNZ", countryCode: "AT", name: "Linz" },
{ code: "AT-INN", countryCode: "AT", name: "Innsbruck" },

// Belgium
{ code: "BE-BRU", countryCode: "BE", name: "Brussels", featured: true },
{ code: "BE-ANR", countryCode: "BE", name: "Antwerp" },
{ code: "BE-GNT", countryCode: "BE", name: "Ghent" },
{ code: "BE-BGE", countryCode: "BE", name: "Bruges" },
{ code: "BE-LGG", countryCode: "BE", name: "Liège" },

  // Spain (4 → 5)
  { code: "ES-MAD", countryCode: "ES", name: "Madrid", featured: true },
  { code: "ES-BCN", countryCode: "ES", name: "Barcelona", featured: true },
  { code: "ES-VLC", countryCode: "ES", name: "Valencia" },
  { code: "ES-SVQ", countryCode: "ES", name: "Seville" },
  { code: "ES-BIO", countryCode: "ES", name: "Bilbao" },

  // Mexico (4 → 5)
  { code: "MX-MEX", countryCode: "MX", name: "Mexico City", featured: true },
  { code: "MX-GDL", countryCode: "MX", name: "Guadalajara" },
  { code: "MX-MTY", countryCode: "MX", name: "Monterrey" },
  { code: "MX-CUN", countryCode: "MX", name: "Cancún" },
  { code: "MX-OAX", countryCode: "MX", name: "Oaxaca" },

  // Canada (4 → 5)
  { code: "CA-TOR", countryCode: "CA", name: "Toronto", featured: true },
  { code: "CA-YVR", countryCode: "CA", name: "Vancouver" },
  { code: "CA-YUL", countryCode: "CA", name: "Montreal" },
  { code: "CA-YYC", countryCode: "CA", name: "Calgary" },
  { code: "CA-YOW", countryCode: "CA", name: "Ottawa" },

  // Germany (4 → 5)
  { code: "DE-BER", countryCode: "DE", name: "Berlin", featured: true },
  { code: "DE-MUC", countryCode: "DE", name: "Munich" },
  { code: "DE-FRA", countryCode: "DE", name: "Frankfurt" },
  { code: "DE-HAM", countryCode: "DE", name: "Hamburg" },
  { code: "DE-DUS", countryCode: "DE", name: "Düsseldorf" },

  // Netherlands (4 → 5)
  { code: "NL-AMS", countryCode: "NL", name: "Amsterdam", featured: true },
  { code: "NL-RTM", countryCode: "NL", name: "Rotterdam" },
  { code: "NL-UTR", countryCode: "NL", name: "Utrecht" },
  { code: "NL-EIN", countryCode: "NL", name: "Eindhoven" },
  { code: "NL-HAG", countryCode: "NL", name: "The Hague" },

  // Costa Rica (4 → 5)
  { code: "CR-SJO", countryCode: "CR", name: "San José", featured: true },
  { code: "CR-LIR", countryCode: "CR", name: "Liberia" },
  { code: "CR-HER", countryCode: "CR", name: "Heredia" },
  { code: "CR-ALA", countryCode: "CR", name: "Alajuela" },
  { code: "CR-CAR", countryCode: "CR", name: "Cartago" },

  // France (4 → 5)
  { code: "FR-PAR", countryCode: "FR", name: "Paris", featured: true },
  { code: "FR-LYO", countryCode: "FR", name: "Lyon" },
  { code: "FR-MRS", countryCode: "FR", name: "Marseille" },
  { code: "FR-NCE", countryCode: "FR", name: "Nice" },
  { code: "FR-BDX", countryCode: "FR", name: "Bordeaux" },

  // Italy (4 → 5)
  { code: "IT-ROM", countryCode: "IT", name: "Rome", featured: true },
  { code: "IT-MIL", countryCode: "IT", name: "Milan" },
  { code: "IT-FLR", countryCode: "IT", name: "Florence" },
  { code: "IT-NAP", countryCode: "IT", name: "Naples" },
  { code: "IT-BOL", countryCode: "IT", name: "Bologna" },

  // Ireland (4 → 5)
  { code: "IE-DUB", countryCode: "IE", name: "Dublin", featured: true },
  { code: "IE-CRK", countryCode: "IE", name: "Cork" },
  { code: "IE-GWY", countryCode: "IE", name: "Galway" },
  { code: "IE-LMK", countryCode: "IE", name: "Limerick" },
  { code: "IE-WAT", countryCode: "IE", name: "Waterford" },

  // Australia (4 → 5)
  { code: "AU-SYD", countryCode: "AU", name: "Sydney", featured: true },
  { code: "AU-MEL", countryCode: "AU", name: "Melbourne" },
  { code: "AU-BNE", countryCode: "AU", name: "Brisbane" },
  { code: "AU-PER", countryCode: "AU", name: "Perth" },
  { code: "AU-ADL", countryCode: "AU", name: "Adelaide" },

  // New Zealand (3 → 5)
  { code: "NZ-AKL", countryCode: "NZ", name: "Auckland", featured: true },
  { code: "NZ-WLG", countryCode: "NZ", name: "Wellington" },
  { code: "NZ-CHC", countryCode: "NZ", name: "Christchurch" },
  { code: "NZ-HAM", countryCode: "NZ", name: "Hamilton" },
  { code: "NZ-DUD", countryCode: "NZ", name: "Dunedin" },

  // Japan (4 → 5)
  { code: "JP-TYO", countryCode: "JP", name: "Tokyo", featured: true },
  { code: "JP-OSA", countryCode: "JP", name: "Osaka" },
  { code: "JP-KYO", countryCode: "JP", name: "Kyoto" },
  { code: "JP-FUK", countryCode: "JP", name: "Fukuoka" },
  { code: "JP-SAP", countryCode: "JP", name: "Sapporo" },

  // South Korea (3 → 5)
  { code: "KR-SEL", countryCode: "KR", name: "Seoul", featured: true },
  { code: "KR-BUS", countryCode: "KR", name: "Busan" },
  { code: "KR-ICN", countryCode: "KR", name: "Incheon" },
  { code: "KR-DAE", countryCode: "KR", name: "Daegu" },
  { code: "KR-DJN", countryCode: "KR", name: "Daejeon" },

  // United Arab Emirates (2 → 5)
  { code: "AE-DXB", countryCode: "AE", name: "Dubai", featured: true },
  { code: "AE-AUH", countryCode: "AE", name: "Abu Dhabi" },
  { code: "AE-SHJ", countryCode: "AE", name: "Sharjah" },
  { code: "AE-AJM", countryCode: "AE", name: "Ajman" },
  { code: "AE-RAK", countryCode: "AE", name: "Ras Al Khaimah" },

  // Singapore (1 → 5 districts treated as areas)
  { code: "SG-SIN", countryCode: "SG", name: "Singapore (Central)", featured: true },
  { code: "SG-ORC", countryCode: "SG", name: "Singapore (Orchard)" },
  { code: "SG-JUR", countryCode: "SG", name: "Singapore (Jurong)" },
  { code: "SG-WDL", countryCode: "SG", name: "Singapore (Woodlands)" },
  { code: "SG-TMP", countryCode: "SG", name: "Singapore (Tampines)" },

  // Switzerland (3 → 5)
  { code: "CH-ZRH", countryCode: "CH", name: "Zurich", featured: true },
  { code: "CH-GVA", countryCode: "CH", name: "Geneva" },
  { code: "CH-BSL", countryCode: "CH", name: "Basel" },
  { code: "CH-BRN", countryCode: "CH", name: "Bern" },
  { code: "CH-LUZ", countryCode: "CH", name: "Lucerne" },

  // Denmark (2 → 5)
  { code: "DK-CPH", countryCode: "DK", name: "Copenhagen", featured: true },
  { code: "DK-AAR", countryCode: "DK", name: "Aarhus" },
  { code: "DK-ODE", countryCode: "DK", name: "Odense" },
  { code: "DK-AAL", countryCode: "DK", name: "Aalborg" },
  { code: "DK-EBJ", countryCode: "DK", name: "Esbjerg" },

  // Sweden (3 → 5)
  { code: "SE-STO", countryCode: "SE", name: "Stockholm", featured: true },
  { code: "SE-GOT", countryCode: "SE", name: "Gothenburg" },
  { code: "SE-MMA", countryCode: "SE", name: "Malmö" },
  { code: "SE-UPP", countryCode: "SE", name: "Uppsala" },
  { code: "SE-LKP", countryCode: "SE", name: "Linköping" },

  // Norway (2 → 5)
  { code: "NO-OSL", countryCode: "NO", name: "Oslo", featured: true },
  { code: "NO-BGO", countryCode: "NO", name: "Bergen" },
  { code: "NO-TRD", countryCode: "NO", name: "Trondheim" },
  { code: "NO-SVG", countryCode: "NO", name: "Stavanger" },
  { code: "NO-TRO", countryCode: "NO", name: "Tromsø" },

  // Finland (2 → 5)
  { code: "FI-HEL", countryCode: "FI", name: "Helsinki", featured: true },
  { code: "FI-TMP", countryCode: "FI", name: "Tampere" },
  { code: "FI-TKU", countryCode: "FI", name: "Turku" },
  { code: "FI-OUL", countryCode: "FI", name: "Oulu" },
  { code: "FI-JYV", countryCode: "FI", name: "Jyväskylä" },

  // Poland (3 → 5)
  { code: "PL-WAW", countryCode: "PL", name: "Warsaw", featured: true },
  { code: "PL-KRK", countryCode: "PL", name: "Kraków" },
  { code: "PL-WRO", countryCode: "PL", name: "Wrocław" },
  { code: "PL-GDN", countryCode: "PL", name: "Gdańsk" },
  { code: "PL-POZ", countryCode: "PL", name: "Poznań" },

  // Czech Republic (2 → 5)
  { code: "CZ-PRG", countryCode: "CZ", name: "Prague", featured: true },
  { code: "CZ-BRQ", countryCode: "CZ", name: "Brno" },
  { code: "CZ-OSR", countryCode: "CZ", name: "Ostrava" },
  { code: "CZ-PLZ", countryCode: "CZ", name: "Plzeň" },
  { code: "CZ-LBR", countryCode: "CZ", name: "Liberec" },

  // Hungary (1 → 5)
  { code: "HU-BUD", countryCode: "HU", name: "Budapest", featured: true },
  { code: "HU-DEB", countryCode: "HU", name: "Debrecen" },
  { code: "HU-MIS", countryCode: "HU", name: "Miskolc" },
  { code: "HU-PEC", countryCode: "HU", name: "Pécs" },
  { code: "HU-GYO", countryCode: "HU", name: "Győr" },

  // Greece (2 → 5)
  { code: "GR-ATH", countryCode: "GR", name: "Athens", featured: true },
  { code: "GR-THS", countryCode: "GR", name: "Thessaloniki" },
  { code: "GR-PAT", countryCode: "GR", name: "Patras" },
  { code: "GR-HER", countryCode: "GR", name: "Heraklion" },
  { code: "GR-LAR", countryCode: "GR", name: "Larissa" },

  // Turkey (3 → 5)
  { code: "TR-IST", countryCode: "TR", name: "Istanbul", featured: true },
  { code: "TR-ANK", countryCode: "TR", name: "Ankara" },
  { code: "TR-IZM", countryCode: "TR", name: "Izmir" },
  { code: "TR-ANT", countryCode: "TR", name: "Antalya" },
  { code: "TR-BUR", countryCode: "TR", name: "Bursa" },

  // Croatia (2 → 5)
  { code: "HR-ZAG", countryCode: "HR", name: "Zagreb", featured: true },
  { code: "HR-SPU", countryCode: "HR", name: "Split" },
  { code: "HR-RJK", countryCode: "HR", name: "Rijeka" },
  { code: "HR-OSJ", countryCode: "HR", name: "Osijek" },
  { code: "HR-DBV", countryCode: "HR", name: "Dubrovnik" },

  // Estonia (1 → 5)
  { code: "EE-TLL", countryCode: "EE", name: "Tallinn", featured: true },
  { code: "EE-TAR", countryCode: "EE", name: "Tartu" },
  { code: "EE-NAR", countryCode: "EE", name: "Narva" },
  { code: "EE-PRN", countryCode: "EE", name: "Pärnu" },
  { code: "EE-VLJ", countryCode: "EE", name: "Viljandi" },

  // Latvia (1 → 5)
  { code: "LV-RIX", countryCode: "LV", name: "Riga", featured: true },
  { code: "LV-DGV", countryCode: "LV", name: "Daugavpils" },
  { code: "LV-JLG", countryCode: "LV", name: "Jelgava" },
  { code: "LV-JRM", countryCode: "LV", name: "Jūrmala" },
  { code: "LV-VNT", countryCode: "LV", name: "Ventspils" },

  // Lithuania (1 → 5)
  { code: "LT-VNO", countryCode: "LT", name: "Vilnius", featured: true },
  { code: "LT-KAU", countryCode: "LT", name: "Kaunas" },
  { code: "LT-KLP", countryCode: "LT", name: "Klaipėda" },
  { code: "LT-SIA", countryCode: "LT", name: "Šiauliai" },
  { code: "LT-PAV", countryCode: "LT", name: "Panevėžys" },

  // Romania (2 → 5)
  { code: "RO-BUH", countryCode: "RO", name: "Bucharest", featured: true },
  { code: "RO-CLJ", countryCode: "RO", name: "Cluj-Napoca" },
  { code: "RO-TIM", countryCode: "RO", name: "Timișoara" },
  { code: "RO-IAS", countryCode: "RO", name: "Iași" },
  { code: "RO-BRV", countryCode: "RO", name: "Brașov" },

  // Bulgaria (1 → 5)
  { code: "BG-SOF", countryCode: "BG", name: "Sofia", featured: true },
  { code: "BG-PLV", countryCode: "BG", name: "Plovdiv" },
  { code: "BG-VAR", countryCode: "BG", name: "Varna" },
  { code: "BG-BUR", countryCode: "BG", name: "Burgas" },
  { code: "BG-RSE", countryCode: "BG", name: "Ruse" },

  // Slovenia (1 → 5)
  { code: "SI-LJU", countryCode: "SI", name: "Ljubljana", featured: true },
  { code: "SI-MBX", countryCode: "SI", name: "Maribor" },
  { code: "SI-CEL", countryCode: "SI", name: "Celje" },
  { code: "SI-KOP", countryCode: "SI", name: "Koper" },
  { code: "SI-KRJ", countryCode: "SI", name: "Kranj" },

  // Slovakia (1 → 5)
  { code: "SK-BTS", countryCode: "SK", name: "Bratislava", featured: true },
  { code: "SK-KSC", countryCode: "SK", name: "Košice" },
  { code: "SK-PRE", countryCode: "SK", name: "Prešov" },
  { code: "SK-ZIL", countryCode: "SK", name: "Žilina" },
  { code: "SK-BBY", countryCode: "SK", name: "Banská Bystrica" },

  // Malta (1 → 5)
  { code: "MT-VLT", countryCode: "MT", name: "Valletta", featured: true },
  { code: "MT-SLM", countryCode: "MT", name: "Sliema" },
  { code: "MT-STJ", countryCode: "MT", name: "St. Julian's" },
  { code: "MT-MDN", countryCode: "MT", name: "Mdina" },
  { code: "MT-MST", countryCode: "MT", name: "Mosta" },

  // Cyprus (2 → 5)
  { code: "CY-NIC", countryCode: "CY", name: "Nicosia", featured: true },
  { code: "CY-LMS", countryCode: "CY", name: "Limassol" },
  { code: "CY-LAR", countryCode: "CY", name: "Larnaca" },
  { code: "CY-PAF", countryCode: "CY", name: "Paphos" },
  { code: "CY-FMG", countryCode: "CY", name: "Famagusta" },

  // Panama (1 → 5)
  { code: "PA-PTY", countryCode: "PA", name: "Panama City", featured: true },
  { code: "PA-CHT", countryCode: "PA", name: "Chitré" },
  { code: "PA-SAN", countryCode: "PA", name: "Santiago" },
  { code: "PA-DAV", countryCode: "PA", name: "David" },
  { code: "PA-COL", countryCode: "PA", name: "Colón" },

  // Colombia (3 → 5)
  { code: "CO-BOG", countryCode: "CO", name: "Bogotá", featured: true },
  { code: "CO-MDE", countryCode: "CO", name: "Medellín" },
  { code: "CO-CTG", countryCode: "CO", name: "Cartagena" },
  { code: "CO-CLO", countryCode: "CO", name: "Cali" },
  { code: "CO-BAQ", countryCode: "CO", name: "Barranquilla" },

  // Brazil (2 → 5)
  { code: "BR-SAO", countryCode: "BR", name: "São Paulo", featured: true },
  { code: "BR-RIO", countryCode: "BR", name: "Rio de Janeiro" },
  { code: "BR-BSB", countryCode: "BR", name: "Brasília" },
  { code: "BR-FOR", countryCode: "BR", name: "Fortaleza" },
  { code: "BR-CUR", countryCode: "BR", name: "Curitiba" },

  // Argentina (2 → 5)
  { code: "AR-BUE", countryCode: "AR", name: "Buenos Aires", featured: true },
  { code: "AR-COR", countryCode: "AR", name: "Córdoba" },
  { code: "AR-ROS", countryCode: "AR", name: "Rosario" },
  { code: "AR-MZA", countryCode: "AR", name: "Mendoza" },
  { code: "AR-BAR", countryCode: "AR", name: "Bariloche" },

  // Chile (2 → 5)
  { code: "CL-SCL", countryCode: "CL", name: "Santiago", featured: true },
  { code: "CL-VAP", countryCode: "CL", name: "Valparaíso" },
  { code: "CL-CON", countryCode: "CL", name: "Concepción" },
  { code: "CL-LAR", countryCode: "CL", name: "La Serena" },
  { code: "CL-ANT", countryCode: "CL", name: "Antofagasta" },

  // Peru (2 → 5)
  { code: "PE-LIM", countryCode: "PE", name: "Lima", featured: true },
  { code: "PE-CUZ", countryCode: "PE", name: "Cusco" },
  { code: "PE-AQP", countryCode: "PE", name: "Arequipa" },
  { code: "PE-TRU", countryCode: "PE", name: "Trujillo" },
  { code: "PE-IQT", countryCode: "PE", name: "Iquitos" },

  // Thailand (3 → 5)
  { code: "TH-BKK", countryCode: "TH", name: "Bangkok", featured: true },
  { code: "TH-CNX", countryCode: "TH", name: "Chiang Mai" },
  { code: "TH-HKT", countryCode: "TH", name: "Phuket" },
  { code: "TH-PAT", countryCode: "TH", name: "Pattaya" },
  { code: "TH-KSM", countryCode: "TH", name: "Koh Samui" },

  // Vietnam (3 → 5)
  { code: "VN-SGN", countryCode: "VN", name: "Ho Chi Minh City", featured: true },
  { code: "VN-HAN", countryCode: "VN", name: "Hanoi" },
  { code: "VN-DAD", countryCode: "VN", name: "Da Nang" },
  { code: "VN-HPH", countryCode: "VN", name: "Hai Phong" },
  { code: "VN-HOI", countryCode: "VN", name: "Hội An" },

  // Malaysia (2 → 5)
  { code: "MY-KUL", countryCode: "MY", name: "Kuala Lumpur", featured: true },
  { code: "MY-PEN", countryCode: "MY", name: "Penang" },
  { code: "MY-JHB", countryCode: "MY", name: "Johor Bahru" },
  { code: "MY-KCH", countryCode: "MY", name: "Kuching" },
  { code: "MY-KKB", countryCode: "MY", name: "Kota Kinabalu" },

  // Indonesia (2 → 5)
  { code: "ID-JKT", countryCode: "ID", name: "Jakarta", featured: true },
  { code: "ID-DPS", countryCode: "ID", name: "Bali / Denpasar" },
  { code: "ID-SBY", countryCode: "ID", name: "Surabaya" },
  { code: "ID-BDG", countryCode: "ID", name: "Bandung" },
  { code: "ID-YOG", countryCode: "ID", name: "Yogyakarta" },

  // South Africa (2 → 5)
  { code: "ZA-CPT", countryCode: "ZA", name: "Cape Town", featured: true },
  { code: "ZA-JNB", countryCode: "ZA", name: "Johannesburg" },
  { code: "ZA-DUR", countryCode: "ZA", name: "Durban" },
  { code: "ZA-PRE", countryCode: "ZA", name: "Pretoria" },
  { code: "ZA-PLZ", countryCode: "ZA", name: "Port Elizabeth" },

  // Philippines
{ code: "PH-MNL", countryCode: "PH", name: "Manila", featured: true },
{ code: "PH-CEB", countryCode: "PH", name: "Cebu" },
{ code: "PH-DVO", countryCode: "PH", name: "Davao" },
{ code: "PH-BAG", countryCode: "PH", name: "Baguio" },

// Taiwan
{ code: "TW-TPE", countryCode: "TW", name: "Taipei", featured: true },
{ code: "TW-TXG", countryCode: "TW", name: "Taichung" },
{ code: "TW-TNN", countryCode: "TW", name: "Tainan" },
{ code: "TW-KHH", countryCode: "TW", name: "Kaohsiung" },

// Hong Kong
{ code: "HK-CEN", countryCode: "HK", name: "Hong Kong (Central)", featured: true },
{ code: "HK-KOW", countryCode: "HK", name: "Hong Kong (Kowloon)" },
{ code: "HK-NTW", countryCode: "HK", name: "Hong Kong (New Territories)" },
{ code: "HK-TCW", countryCode: "HK", name: "Hong Kong (Tung Chung)" },

// India
{ code: "IN-BLR", countryCode: "IN", name: "Bangalore", featured: true },
{ code: "IN-BOM", countryCode: "IN", name: "Mumbai" },
{ code: "IN-HYD", countryCode: "IN", name: "Hyderabad" },
{ code: "IN-DEL", countryCode: "IN", name: "Delhi NCR" },

// China
{ code: "CN-SHA", countryCode: "CN", name: "Shanghai", featured: true },
{ code: "CN-BJS", countryCode: "CN", name: "Beijing" },
{ code: "CN-SZX", countryCode: "CN", name: "Shenzhen" },
{ code: "CN-CTU", countryCode: "CN", name: "Chengdu" },

// Qatar
{ code: "QA-DOH", countryCode: "QA", name: "Doha", featured: true },
{ code: "QA-WAK", countryCode: "QA", name: "Al Wakrah" },
{ code: "QA-LUS", countryCode: "QA", name: "Lusail" },
{ code: "QA-RAY", countryCode: "QA", name: "Al Rayyan" },

// Saudi Arabia
{ code: "SA-RUH", countryCode: "SA", name: "Riyadh", featured: true },
{ code: "SA-JED", countryCode: "SA", name: "Jeddah" },
{ code: "SA-DMM", countryCode: "SA", name: "Dammam" },
{ code: "SA-KHO", countryCode: "SA", name: "Khobar" },

// Oman
{ code: "OM-MCT", countryCode: "OM", name: "Muscat", featured: true },
{ code: "OM-SLL", countryCode: "OM", name: "Salalah" },
{ code: "OM-SOH", countryCode: "OM", name: "Sohar" },
{ code: "OM-NZW", countryCode: "OM", name: "Nizwa" },

// Ecuador (4 cities)
{ code: "EC-UIO", countryCode: "EC", name: "Quito", featured: true },
{ code: "EC-GYE", countryCode: "EC", name: "Guayaquil" },
{ code: "EC-CUE", countryCode: "EC", name: "Cuenca" },
{ code: "EC-MEC", countryCode: "EC", name: "Manta" },

// Uruguay (4 cities)
{ code: "UY-MVD", countryCode: "UY", name: "Montevideo", featured: true },
{ code: "UY-PDE", countryCode: "UY", name: "Punta del Este" },
{ code: "UY-COL", countryCode: "UY", name: "Colonia del Sacramento" },
{ code: "UY-SLV", countryCode: "UY", name: "Salto" },

// Paraguay (4 cities)
{ code: "PY-ASU", countryCode: "PY", name: "Asunción", featured: true },
{ code: "PY-CDE", countryCode: "PY", name: "Ciudad del Este" },
{ code: "PY-ENR", countryCode: "PY", name: "Encarnación" },
{ code: "PY-SLO", countryCode: "PY", name: "San Lorenzo" },

// Bolivia (4 cities)
{ code: "BO-LPB", countryCode: "BO", name: "La Paz", featured: true },
{ code: "BO-SRZ", countryCode: "BO", name: "Santa Cruz de la Sierra" },
{ code: "BO-CBB", countryCode: "BO", name: "Cochabamba" },
{ code: "BO-SUC", countryCode: "BO", name: "Sucre" },

// Guyana (3 cities)
{ code: "GY-GEO", countryCode: "GY", name: "Georgetown", featured: true },
{ code: "GY-LIN", countryCode: "GY", name: "Linden" },
{ code: "GY-NIA", countryCode: "GY", name: "New Amsterdam" },

// Suriname (3 cities)
{ code: "SR-PBM", countryCode: "SR", name: "Paramaribo", featured: true },
{ code: "SR-NIC", countryCode: "SR", name: "Nieuw Nickerie" },
{ code: "SR-STO", countryCode: "SR", name: "Stoelmanseiland" },

// Venezuela (4 cities)
{ code: "VE-CCS", countryCode: "VE", name: "Caracas", featured: true },
{ code: "VE-MAR", countryCode: "VE", name: "Maracaibo" },
{ code: "VE-VLC", countryCode: "VE", name: "Valencia" },
{ code: "VE-BAR", countryCode: "VE", name: "Barquisimeto" },
];

export function citiesForCountry(countryCode: string) {
  return INTERNATIONAL_CITIES.filter((city) => city.countryCode === countryCode);
}

export function getInternationalCityByCode(code: string) {
  return INTERNATIONAL_CITIES.find((city) => city.code === code);
}
