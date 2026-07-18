"use client";

import { useEffect } from "react";

export default function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Ask for an updated worker on each fresh visit. A new worker remains
        // waiting until existing tabs close, so an active calculation is not
        // interrupted or silently switched to different formulas.
        await registration.update();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Service worker registration failed", error);
        }
      }
    };

    void register();
  }, []);

  return null;
}
