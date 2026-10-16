export const QR_PII_FIELDS = ["email", "phone", "customerName", "address"] as const;

export function buildQrPayload(token: string) {
  return token;
}

export function qrContainsPii(payload: string, customer: Record<string, string>) {
  return QR_PII_FIELDS.some((field) => {
    const value = customer[field];
    return Boolean(value) && payload.includes(value);
  });
}

export type TicketLifecycleStatus =
  | "VALID"
  | "USED"
  | "REVOKED"
  | "CANCELLED"
  | "REFUNDED";

export type OrderLifecycleStatus =
  | "PENDING"
  | "PENDING_VERIFICATION"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "REFUNDED"
  | "CANCELLED";

export function evaluateCheckIn(input: {
  found: boolean;
  ticketStatus?: TicketLifecycleStatus;
  orderStatus?: OrderLifecycleStatus;
}) {
  if (!input.found || !input.ticketStatus || !input.orderStatus) {
    return { outcome: "INVALID" as const, reason: "Ticket not found" };
  }
  if (
    input.orderStatus === "CANCELLED" ||
    input.orderStatus === "REFUNDED" ||
    input.ticketStatus === "CANCELLED" ||
    input.ticketStatus === "REFUNDED"
  ) {
    return { outcome: "DENIED" as const, reason: "Ticket is cancelled or refunded" };
  }
  if (input.ticketStatus === "REVOKED") {
    return { outcome: "DENIED" as const, reason: "Ticket has been revoked" };
  }
  if (input.ticketStatus === "USED") {
    return { outcome: "ALREADY_USED" as const, reason: "Ticket already used" };
  }
  if (input.ticketStatus !== "VALID" || input.orderStatus !== "PAID") {
    return { outcome: "DENIED" as const, reason: "Ticket is not valid for entry" };
  }
  return { outcome: "VALID" as const, nextStatus: "USED" as const };
}

export function claimTicket(
  current: TicketLifecycleStatus,
): { ok: true; next: "USED" } | { ok: false; reason: "ALREADY_USED" } {
  if (current !== "VALID") {
    return { ok: false, reason: "ALREADY_USED" };
  }
  return { ok: true, next: "USED" };
}

/** Camera frames often fire the same QR twice; treat a fresh check-in as the same scan. */
export const REPEAT_SCAN_ECHO_MS = 8_000;

export function isRepeatScanEcho(
  checkedInAt: Date | string | null | undefined,
  now: Date = new Date(),
  windowMs = REPEAT_SCAN_ECHO_MS,
) {
  if (!checkedInAt) return false;
  const at = typeof checkedInAt === "string" ? new Date(checkedInAt) : checkedInAt;
  const ts = at.getTime();
  if (Number.isNaN(ts)) return false;
  const delta = now.getTime() - ts;
  return delta >= 0 && delta < windowMs;
}
