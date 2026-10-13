"use client";

import { useEffect } from "react";

export function CampaignTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ambassador = params.get("ref") || params.get("ambassador");
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    if (!ambassador && !utmSource && !utmCampaign) return;

    const payload = {
      ambassadorCode: ambassador,
      utmSource,
      utmMedium,
      utmCampaign,
    };
    window.sessionStorage.setItem("ht-campaign", JSON.stringify(payload));

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, path: window.location.pathname }),
    });
  }, []);

  return null;
}

export function readCampaign() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem("ht-campaign") ?? "{}") as {
      ambassadorCode?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };
  } catch {
    return {};
  }
}
