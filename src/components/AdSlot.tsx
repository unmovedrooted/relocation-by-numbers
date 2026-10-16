"use client";

import { useEffect } from "react";

type AdSlotProps = {
  slot: string;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Ad slots are hidden everywhere for now. Set NEXT_PUBLIC_ADS_ENABLED=1 to show them again.
const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "1";

export default function AdSlot({ slot, className = "" }: AdSlotProps) {
  useEffect(() => {
    if (!ADS_ENABLED) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense can throw during dev or duplicate renders. Safe to ignore.
    }
  }, []);

  if (!ADS_ENABLED || !slot) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5257549146198249"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}