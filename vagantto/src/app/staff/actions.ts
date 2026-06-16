"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { startOfToday } from "@/lib/menu";

function num(value: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Create a new bento and put it on today's menu with an initial stock count.
 */
export async function createBento(formData: FormData) {
  const nameJa = String(formData.get("nameJa") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const priceYen = num(formData.get("priceYen"));
  const stock = num(formData.get("stock"));
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!nameJa || !nameEn || priceYen <= 0) {
    throw new Error("Name (JA/EN) and a positive price are required.");
  }

  const bento = await prisma.bento.create({
    data: { nameJa, nameEn, priceYen, description },
  });

  if (stock > 0) {
    await prisma.dailyAvailability.create({
      data: {
        date: startOfToday(),
        bentoId: bento.id,
        stockTotal: stock,
        stockRemaining: stock,
      },
    });
  }

  revalidatePath("/staff");
  revalidatePath("/");
}

/**
 * Set (or reset) today's stock for an existing bento. Creates the availability
 * row if today's menu didn't include it yet.
 */
export async function setTodaysStock(formData: FormData) {
  const bentoId = String(formData.get("bentoId") ?? "");
  const stock = num(formData.get("stock"));
  if (!bentoId || stock < 0) throw new Error("Invalid stock update.");

  await prisma.dailyAvailability.upsert({
    where: { date_bentoId: { date: startOfToday(), bentoId } },
    update: { stockTotal: stock, stockRemaining: stock },
    create: {
      date: startOfToday(),
      bentoId,
      stockTotal: stock,
      stockRemaining: stock,
    },
  });

  revalidatePath("/staff");
  revalidatePath("/");
}

/** Toggle whether a bento is active (shown to customers at all). */
export async function toggleBentoActive(formData: FormData) {
  const bentoId = String(formData.get("bentoId") ?? "");
  const active = formData.get("active") === "true";
  if (!bentoId) throw new Error("Missing bento id.");

  await prisma.bento.update({ where: { id: bentoId }, data: { active } });

  revalidatePath("/staff");
  revalidatePath("/");
}
