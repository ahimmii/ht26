import { describe, expect, it } from "vitest";
import { generateTicketToken } from "@/lib/utils";
import { buildQrPayload, claimTicket, evaluateCheckIn, qrContainsPii } from "@/lib/ticket-rules";
import { runExclusive } from "@/lib/inventory-math";

describe("tickets and QR validation", () => {
  it("issues a non-guessable token without customer PII in the QR payload", () => {
    const token = generateTicketToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    const payload = buildQrPayload(token);
    expect(payload).toBe(token);
    expect(
      qrContainsPii(payload, {
        email: "guest@example.com",
        phone: "+212600000000",
        customerName: "Amina Guest",
      }),
    ).toBe(false);
  });

  it("accepts a valid paid ticket once", () => {
    expect(
      evaluateCheckIn({ found: true, ticketStatus: "VALID", orderStatus: "PAID" }),
    ).toEqual({ outcome: "VALID", nextStatus: "USED" });
    expect(claimTicket("VALID")).toEqual({ ok: true, next: "USED" });
    expect(claimTicket("USED")).toEqual({ ok: false, reason: "ALREADY_USED" });
  });

  it("rejects used, invalid, cancelled and refunded tickets", () => {
    expect(
      evaluateCheckIn({ found: true, ticketStatus: "USED", orderStatus: "PAID" }).outcome,
    ).toBe("ALREADY_USED");
    expect(evaluateCheckIn({ found: false }).outcome).toBe("INVALID");
    expect(
      evaluateCheckIn({ found: true, ticketStatus: "VALID", orderStatus: "CANCELLED" }).outcome,
    ).toBe("DENIED");
    expect(
      evaluateCheckIn({ found: true, ticketStatus: "REFUNDED", orderStatus: "REFUNDED" }).outcome,
    ).toBe("DENIED");
    expect(
      evaluateCheckIn({ found: true, ticketStatus: "REVOKED", orderStatus: "PAID" }).outcome,
    ).toBe("DENIED");
  });

  it("allows only one concurrent check-in to succeed", async () => {
    const lock = { current: Promise.resolve() };
    let status: "VALID" | "USED" = "VALID";
    const attempts = Array.from({ length: 8 }, () =>
      runExclusive(lock, () => {
        const claimed = claimTicket(status);
        if (claimed.ok) {
          status = claimed.next;
          return "VALID";
        }
        return "ALREADY_USED";
      }),
    );
    const results = await Promise.all(attempts);
    expect(results.filter((result) => result === "VALID")).toHaveLength(1);
    expect(results.filter((result) => result === "ALREADY_USED")).toHaveLength(7);
  });
});
