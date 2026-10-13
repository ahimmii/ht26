import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { EventSettings, Order } from "@prisma/client";
import { getAppUrl, getCmiConfig, isCmiConfigured } from "@/lib/env";
import type { PaymentInitiation, PaymentProvider, PaymentVerification } from "./types";

function formatCmiAmount(cents: number) {
  return (cents / 100).toFixed(2);
}

function hashCmiPayload(fields: Record<string, string>, storeKey: string, algorithm: string) {
  const keys = Object.keys(fields)
    .filter((key) => key !== "HASH" && fields[key] !== undefined)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const serialized = keys
    .map((key) => {
      const escaped = String(fields[key]).replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
      return `${key}|${escaped}`;
    })
    .join("|");

  const payload = `${serialized}|${storeKey}`;
  const digest = createHash(algorithm.toLowerCase() === "sha256" ? "sha256" : "sha512")
    .update(payload, "utf8")
    .digest("base64");
  return digest;
}

export const cmiProvider: PaymentProvider = {
  id: "CMI",
  enabled() {
    return isCmiConfigured();
  },
  async initiate(order: Order, event: EventSettings): Promise<PaymentInitiation> {
    const config = getCmiConfig();
    if (!config) {
      throw new Error("CMI is not configured. Online card payment is disabled.");
    }

    const appUrl = getAppUrl();
    const fields: Record<string, string> = {
      clientid: config.clientId,
      storetype: config.storeType,
      hashAlgorithm: config.hashAlgorithm,
      islemtipi: "Auth",
      amount: formatCmiAmount(order.totalCents),
      currency: config.currency,
      oid: order.reference,
      okUrl: `${appUrl}/orders/${order.reference}/pending?provider=cmi`,
      failUrl: `${appUrl}/orders/${order.reference}/pending?provider=cmi&failed=1`,
      callbackUrl: `${appUrl}/api/payments/cmi/callback`,
      lang: order.locale === "fr" ? "fr" : "en",
      BillToName: order.customerName,
      email: order.email,
      tel: order.phone,
      refreshtime: "5",
      encoding: "UTF-8",
      shopurl: appUrl,
      description: `${event.title} x${order.quantity}`,
    };

    fields.HASH = hashCmiPayload(fields, config.storeKey, config.hashAlgorithm);

    return {
      kind: "redirect",
      provider: "CMI",
      url: config.gatewayUrl,
      method: "POST",
      fields,
    };
  },
};

export function verifyCmiCallback(payload: Record<string, string>): PaymentVerification {
  const config = getCmiConfig();
  if (!config) {
    return { ok: false, reason: "CMI is not configured" };
  }

  const providedHash = payload.HASH;
  if (!providedHash) {
    return { ok: false, reason: "Missing HASH" };
  }

  const expected = hashCmiPayload(payload, config.storeKey, config.hashAlgorithm);
  const a = Buffer.from(providedHash);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "Invalid HASH" };
  }

  const procReturnCode = payload.ProcReturnCode;
  const response = payload.Response;
  const approved = procReturnCode === "00" || response === "Approved";
  if (!approved) {
    return { ok: false, reason: payload.ErrMsg || payload.Response || "Payment not approved" };
  }

  if (!payload.oid) {
    return { ok: false, reason: "Missing order reference" };
  }

  return {
    ok: true,
    orderReference: payload.oid,
    externalId: payload.TransId || payload.HostRefNum || `${payload.oid}:${payload.rnd ?? "cmi"}`,
  };
}
