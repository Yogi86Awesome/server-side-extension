import { Prisma } from "@prisma/client";

/**
 * Thrown when a bento can't be reserved because not enough stock remains.
 * Callers (the order flow in M3) should surface this as a "sold out" message.
 */
export class SoldOutError extends Error {
  constructor(public readonly availabilityId: string) {
    super(`Not enough stock for availability ${availabilityId}`);
    this.name = "SoldOutError";
  }
}

/**
 * Atomically reserve `qty` units of a bento for a given day.
 *
 * This is the single most correctness-critical operation in Vagantto: during
 * the rush, many commuters may try to buy the last few of a popular bento at
 * the same moment. We must never oversell.
 *
 * The guarantee comes from a single conditional UPDATE:
 *   UPDATE ... SET stockRemaining = stockRemaining - qty
 *   WHERE id = ? AND stockRemaining >= qty
 * If two requests race, the database serializes the row update and exactly one
 * of them sees `count === 0` and is rejected.
 *
 * Pass a transaction client (`tx`) when reserving as part of placing an order,
 * so stock and order rows commit together.
 */
export async function reserveStock(
  tx: Prisma.TransactionClient,
  availabilityId: string,
  qty: number,
): Promise<void> {
  if (qty <= 0) throw new Error("qty must be positive");

  const result = await tx.dailyAvailability.updateMany({
    where: { id: availabilityId, stockRemaining: { gte: qty } },
    data: { stockRemaining: { decrement: qty } },
  });

  if (result.count === 0) {
    throw new SoldOutError(availabilityId);
  }
}

/**
 * Release previously reserved stock (e.g. on order cancellation), capped at the
 * day's total so we never exceed what was prepared.
 */
export async function releaseStock(
  tx: Prisma.TransactionClient,
  availabilityId: string,
  qty: number,
): Promise<void> {
  if (qty <= 0) throw new Error("qty must be positive");

  const availability = await tx.dailyAvailability.findUniqueOrThrow({
    where: { id: availabilityId },
  });

  const restored = Math.min(
    availability.stockRemaining + qty,
    availability.stockTotal,
  );

  await tx.dailyAvailability.update({
    where: { id: availabilityId },
    data: { stockRemaining: restored },
  });
}
