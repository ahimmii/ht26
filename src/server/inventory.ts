import "server-only";
import type { Prisma } from "@prisma/client";
import { InventoryError, type InventoryState } from "@/lib/inventory-math";

export {
  InventoryError,
  availableTickets,
  applyReservation,
  applyConfirmation,
  applyRelease,
  applyRefundConfirmed,
} from "@/lib/inventory-math";
export type { InventoryState } from "@/lib/inventory-math";

export async function reserveInventory(
  tx: Prisma.TransactionClient,
  quantity: number,
) {
  const rows = await tx.$queryRaw<Array<InventoryState & { id: string }>>`
    UPDATE "EventSettings"
    SET "reservedCount" = "reservedCount" + ${quantity}
    WHERE id = 'default'
      AND "reservedCount" + "confirmedCount" + ${quantity} <= "capacity"
    RETURNING id, capacity, "reservedCount", "confirmedCount"
  `;

  if (!rows[0]) {
    throw new InventoryError("SOLD_OUT", "Not enough tickets remaining");
  }
  return rows[0];
}

export async function confirmReservedInventory(
  tx: Prisma.TransactionClient,
  quantity: number,
) {
  const rows = await tx.$queryRaw<Array<InventoryState>>`
    UPDATE "EventSettings"
    SET "reservedCount" = "reservedCount" - ${quantity},
        "confirmedCount" = "confirmedCount" + ${quantity}
    WHERE id = 'default'
      AND "reservedCount" >= ${quantity}
    RETURNING capacity, "reservedCount", "confirmedCount"
  `;

  if (!rows[0]) {
    throw new InventoryError("INVENTORY_INCONSISTENT", "Could not confirm reserved inventory");
  }
  return rows[0];
}

export async function releaseReservedInventory(
  tx: Prisma.TransactionClient,
  quantity: number,
) {
  const rows = await tx.$queryRaw<Array<InventoryState>>`
    UPDATE "EventSettings"
    SET "reservedCount" = "reservedCount" - ${quantity}
    WHERE id = 'default'
      AND "reservedCount" >= ${quantity}
    RETURNING capacity, "reservedCount", "confirmedCount"
  `;

  if (!rows[0]) {
    throw new InventoryError("INVENTORY_INCONSISTENT", "Could not release reserved inventory");
  }
  return rows[0];
}

export async function releaseConfirmedInventory(
  tx: Prisma.TransactionClient,
  quantity: number,
) {
  const rows = await tx.$queryRaw<Array<InventoryState>>`
    UPDATE "EventSettings"
    SET "confirmedCount" = "confirmedCount" - ${quantity}
    WHERE id = 'default'
      AND "confirmedCount" >= ${quantity}
    RETURNING capacity, "reservedCount", "confirmedCount"
  `;

  if (!rows[0]) {
    throw new InventoryError("INVENTORY_INCONSISTENT", "Could not release confirmed inventory");
  }
  return rows[0];
}
