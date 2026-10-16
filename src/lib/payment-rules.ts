export const PAYABLE_STATUSES = ["PENDING", "PENDING_VERIFICATION"] as const;
export type PayableStatus = (typeof PAYABLE_STATUSES)[number];

export function isPayableStatus(status: string): status is PayableStatus {
  return PAYABLE_STATUSES.includes(status as PayableStatus);
}

export function assertNotClientRedirectConfirmation(source: string) {
  if (source === "browser_redirect" || source === "okUrl" || source === "failUrl") {
    throw new Error("Orders cannot be marked paid from a browser redirect");
  }
}

export function canConfirmPayment(source: string, status: string) {
  assertNotClientRedirectConfirmation(source);
  if (source !== "admin_verify" && source !== "cmi_callback" && source !== "stripe_webhook") {
    throw new Error("Payment source is not authorized");
  }
  if (status === "PAID") return "idempotent";
  if (!isPayableStatus(status)) {
    throw new Error(`Order cannot be paid from status ${status}`);
  }
  return "confirm";
}

export function shouldProcessWebhook(seenExternalIds: Set<string>, externalId: string) {
  if (seenExternalIds.has(externalId)) return false;
  seenExternalIds.add(externalId);
  return true;
}
