"use server";

import { cookies } from "next/headers";

export async function setTrackingConsent(accepted: boolean) {
  const store = await cookies();
  store.set("tracking_consent", accepted ? "granted" : "denied", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
