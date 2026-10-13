import type { MetadataRoute } from "next";

const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/tickets", "/faq", "/contact", "/terms", "/privacy", "/refund"];
  return routes.map((route) => ({
    url: `${appUrl}${route || "/"}`,
    lastModified: new Date("2026-10-13"),
  }));
}
