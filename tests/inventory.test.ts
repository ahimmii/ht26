import { describe, expect, it } from "vitest";
import {
  applyConfirmation,
  applyRefundConfirmed,
  applyRelease,
  applyReservation,
  availableTickets,
  InventoryError,
  runExclusive,
  type InventoryState,
} from "@/lib/inventory-math";

const empty: InventoryState = { capacity: 160, reservedCount: 0, confirmedCount: 0 };

describe("inventory", () => {
  it("never sells more than capacity", () => {
    const reserved = applyReservation(empty, 6);
    expect(availableTickets(reserved)).toBe(154);
    expect(() => applyReservation({ ...empty, reservedCount: 158 }, 4)).toThrow(InventoryError);
  });

  it("moves reserved inventory to confirmed on payment", () => {
    const reserved = applyReservation(empty, 3);
    const paid = applyConfirmation(reserved, 3);
    expect(paid.reservedCount).toBe(0);
    expect(paid.confirmedCount).toBe(3);
    expect(availableTickets(paid)).toBe(157);
  });

  it("releases unpaid reservations back to availability", () => {
    const reserved = applyReservation(empty, 5);
    const expired = applyRelease(reserved, 5);
    expect(expired.reservedCount).toBe(0);
    expect(availableTickets(expired)).toBe(160);
  });

  it("returns confirmed inventory after refunds", () => {
    const paid = applyConfirmation(applyReservation(empty, 2), 2);
    const refunded = applyRefundConfirmed(paid, 2);
    expect(refunded.confirmedCount).toBe(0);
    expect(availableTickets(refunded)).toBe(160);
  });

  it("prevents oversell under concurrent reservations", async () => {
    const lock = { current: Promise.resolve() };
    let state = { capacity: 10, reservedCount: 0, confirmedCount: 0 };
    const attempts = Array.from({ length: 20 }, () =>
      runExclusive(lock, () => {
        try {
          state = applyReservation(state, 1);
          return true;
        } catch {
          return false;
        }
      }),
    );
    const results = await Promise.all(attempts);
    expect(results.filter(Boolean)).toHaveLength(10);
    expect(state.reservedCount + state.confirmedCount).toBe(10);
  });
});
