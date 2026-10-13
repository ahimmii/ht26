import { createHash, randomBytes, randomInt, timingSafeEqual as cryptoTimingSafeEqual } from "node:crypto";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function generateOrderReference() {
  return `HT26-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function generateTicketToken() {
  return randomBytes(32).toString("base64url");
}

export function generatePublicCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "HT-";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[randomInt(alphabet.length)];
  }
  return code;
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function timingSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return cryptoTimingSafeEqual(left, right);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function formatDate(date: Date, locale: "en" | "fr" = "en") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-MA" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Casablanca",
  }).format(date);
}

export function formatShortDate(date: Date, locale: "en" | "fr" = "en") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-MA" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Casablanca",
  }).format(date);
}

export function getClientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

export function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
