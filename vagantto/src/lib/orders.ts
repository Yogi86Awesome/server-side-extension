import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { reserveStock, SoldOutError } from "@/lib/inventory";
import { isValidPickupSlot } from "@/lib/pickup";

export type PlaceOrderInput = {
  items: { availabilityId: string; qty: number }[];
  pickupWindow: string;
  customerName?: string;
  customerPhone?: string;
};

export type PlaceOrderResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

// Pickup codes: short, spoken at the counter. No ambiguous chars (I/O/0/1).
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(len = 4): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

/**
 * Place an order: atomically reserve stock for every line and persist the order
 * in one transaction. If any item can't be reserved, the whole order rolls back
 * and no stock is consumed. This is the M3 core, kept free of framework concerns
 * (no revalidate) so it's directly testable; the server action wraps it.
 */
export async function createOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const items = (input.items ?? []).filter((i) => i.qty > 0);
  if (items.length === 0) return { ok: false, error: "Your cart is empty." };
  if (!isValidPickupSlot(input.pickupWindow)) {
    return {
      ok: false,
      error: "That pickup time is no longer available. Please pick another.",
    };
  }

  try {
    const code = await prisma.$transaction(async (tx) => {
      let totalYen = 0;
      const lines: {
        bentoId: string;
        qty: number;
        priceYenSnapshot: number;
      }[] = [];

      for (const it of items) {
        const av = await tx.dailyAvailability.findUnique({
          where: { id: it.availabilityId },
          include: { bento: true },
        });
        if (!av) throw new Error("Item no longer on the menu.");

        await reserveStock(tx, av.id, it.qty); // atomic; throws SoldOutError
        totalYen += av.bento.priceYen * it.qty;
        lines.push({
          bentoId: av.bentoId,
          qty: it.qty,
          priceYenSnapshot: av.bento.priceYen,
        });
      }

      // Generate a unique pickup code (retry on the rare collision).
      let code = randomCode();
      for (let i = 0; i < 5; i++) {
        const clash = await tx.order.findUnique({ where: { code } });
        if (!clash) break;
        code = randomCode();
      }

      await tx.order.create({
        data: {
          code,
          status: "CONFIRMED",
          pickupWindow: input.pickupWindow,
          customerName: input.customerName?.trim() || null,
          customerPhone: input.customerPhone?.trim() || null,
          totalYen,
          items: { create: lines },
        },
      });

      return code;
    });

    return { ok: true, code };
  } catch (e) {
    if (e instanceof SoldOutError) {
      return {
        ok: false,
        error: "Sorry — one of your items just sold out. Please adjust your order.",
      };
    }
    return { ok: false, error: "Couldn't place your order. Please try again." };
  }
}

export async function getOrderByCode(code: string) {
  return prisma.order.findUnique({
    where: { code },
    include: { items: { include: { bento: true } } },
  });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed · 受付済",
  PREPARING: "Preparing · 調理中",
  READY: "Ready for pickup · 受取可",
  PICKED_UP: "Picked up · 受取済",
  CANCELLED: "Cancelled · キャンセル",
};
