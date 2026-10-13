export class InventoryError extends Error {
  constructor(
    public code: "SOLD_OUT" | "INVENTORY_INCONSISTENT" | "INVALID_QUANTITY",
    message: string,
  ) {
    super(message);
    this.name = "InventoryError";
  }
}

export type InventoryState = {
  capacity: number;
  reservedCount: number;
  confirmedCount: number;
};

export function availableTickets(state: InventoryState) {
  return Math.max(0, state.capacity - state.reservedCount - state.confirmedCount);
}

export function assertReservable(state: InventoryState, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new InventoryError("INVALID_QUANTITY", "Quantity must be a positive integer");
  }
  if (availableTickets(state) < quantity) {
    throw new InventoryError("SOLD_OUT", "Not enough tickets remaining");
  }
}

export function applyReservation(state: InventoryState, quantity: number): InventoryState {
  assertReservable(state, quantity);
  return { ...state, reservedCount: state.reservedCount + quantity };
}

export function applyConfirmation(state: InventoryState, quantity: number): InventoryState {
  if (state.reservedCount < quantity) {
    throw new InventoryError("INVENTORY_INCONSISTENT", "Reserved inventory is insufficient");
  }
  return {
    ...state,
    reservedCount: state.reservedCount - quantity,
    confirmedCount: state.confirmedCount + quantity,
  };
}

export function applyRelease(state: InventoryState, quantity: number): InventoryState {
  if (state.reservedCount < quantity) {
    throw new InventoryError("INVENTORY_INCONSISTENT", "Reserved inventory is insufficient");
  }
  return { ...state, reservedCount: state.reservedCount - quantity };
}

export function applyRefundConfirmed(state: InventoryState, quantity: number): InventoryState {
  if (state.confirmedCount < quantity) {
    throw new InventoryError("INVENTORY_INCONSISTENT", "Confirmed inventory is insufficient");
  }
  return { ...state, confirmedCount: state.confirmedCount - quantity };
}

export async function runExclusive<T>(
  lock: { current: Promise<void> },
  work: () => T,
) {
  const previous = lock.current;
  let release: () => void = () => undefined;
  lock.current = new Promise((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return work();
  } finally {
    release();
  }
}
