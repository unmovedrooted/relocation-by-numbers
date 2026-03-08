"use client";

type Props = {
  stateCode?: string;
  stateName?: string;
  cityName?: string;
  mode?: "rent" | "buy";
};

export default function AffiliateCard({
  stateCode,
  stateName,
  cityName,
  mode = "rent",
}: Props) {
  const placeLabel = cityName || stateName || "this area";
  const isRent = mode === "rent";

  const LINKS = {
    apartments: process.env.NEXT_PUBLIC_APARTMENTS!,
    realtorRent: process.env.NEXT_PUBLIC_REALTOR_RENT!,
    zumper: process.env.NEXT_PUBLIC_ZUMPER!,
    mortgage: process.env.NEXT_PUBLIC_MORTGAGE!,
    homes: process.env.NEXT_PUBLIC_HOMES!,
    insurance: process.env.NEXT_PUBLIC_INSURANCE!,
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">
        {isRent
          ? `Best rental sites for ${placeLabel}`
          : `Next steps after choosing ${placeLabel}`}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {isRent
          ? "Explore rental platforms and listing sites."
          : "Compare home-buying and move-related services."}
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        {isRent ? (
          <>
            <a
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              href={LINKS.apartments}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
            >
              <span className="font-medium text-slate-800">🏢 Apartments.com</span>
              <span className="text-slate-400">Search →</span>
            </a>

            <a
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              href={LINKS.realtorRent}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
            >
              <span className="font-medium text-slate-800">🏠 Realtor.com Rentals</span>
              <span className="text-slate-400">View →</span>
            </a>

            <a
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              href={LINKS.zumper}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
            >
              <span className="font-medium text-slate-800">📱 Zumper</span>
              <span className="text-slate-400">Browse →</span>
            </a>
          </>
        ) : (
          <>
            <a
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              href={LINKS.mortgage}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
            >
              <span className="font-medium text-slate-800">🏦 Compare mortgage rates</span>
              <span className="text-slate-400">Check →</span>
            </a>

            <a
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              href={LINKS.homes}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
            >
              <span className="font-medium text-slate-800">
                🏡 Browse homes in {placeLabel}
              </span>
              <span className="text-slate-400">Explore →</span>
            </a>

            <a
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              href={LINKS.insurance}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
            >
              <span className="font-medium text-slate-800">🛡️ Get insurance quotes</span>
              <span className="text-slate-400">Compare →</span>
            </a>
          </>
        )}
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Disclosure: some links may earn a commission at no cost to you.
      </div>
    </div>
  );
}