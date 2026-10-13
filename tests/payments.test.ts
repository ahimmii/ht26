import { describe, expect, it } from "vitest";
import {
  assertNotClientRedirectConfirmation,
  canConfirmPayment,
  isPayableStatus,
  shouldProcessWebhook,
} from "@/lib/payment-rules";

describe("payments", () => {
  it("does not treat browser redirects as payment confirmation", () => {
    expect(() => assertNotClientRedirectConfirmation("browser_redirect")).toThrow(
      /browser redirect/,
    );
    expect(() => canConfirmPayment("okUrl", "PENDING")).toThrow(/browser redirect/);
  });

  it("only confirms through authorized server-side sources", () => {
    expect(canConfirmPayment("admin_verify", "PENDING_VERIFICATION")).toBe("confirm");
    expect(canConfirmPayment("cmi_callback", "PENDING")).toBe("confirm");
    expect(canConfirmPayment("admin_verify", "PAID")).toBe("idempotent");
    expect(() => canConfirmPayment("client_hope", "PENDING")).toThrow(/not authorized/);
    expect(() => canConfirmPayment("cmi_callback", "EXPIRED")).toThrow(/cannot be paid/);
  });

  it("keeps unpaid reservations in pending states until verification", () => {
    expect(isPayableStatus("PENDING")).toBe(true);
    expect(isPayableStatus("PENDING_VERIFICATION")).toBe(true);
    expect(isPayableStatus("PAID")).toBe(false);
  });

  it("is idempotent when a webhook is retried with the same external id", () => {
    const seen = new Set<string>();
    expect(shouldProcessWebhook(seen, "cmi:abc")).toBe(true);
    expect(shouldProcessWebhook(seen, "cmi:abc")).toBe(false);
    expect(shouldProcessWebhook(seen, "cmi:def")).toBe(true);
  });
});
