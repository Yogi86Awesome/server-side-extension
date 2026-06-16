import { prisma } from "@/lib/db";

/** Midnight today — the key for "today's" availability rows. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type MenuEntry = {
  availabilityId: string;
  bentoId: string;
  nameJa: string;
  nameEn: string;
  description: string | null;
  priceYen: number;
  allergens: string[];
  stockRemaining: number;
  stockTotal: number;
  soldOut: boolean;
};

/** Today's customer-facing menu: active bentos with stock for today. */
export async function getTodaysMenu(): Promise<MenuEntry[]> {
  const rows = await prisma.dailyAvailability.findMany({
    where: { date: startOfToday(), bento: { active: true } },
    include: { bento: true },
    orderBy: { bento: { priceYen: "asc" } },
  });

  return rows.map((r) => ({
    availabilityId: r.id,
    bentoId: r.bentoId,
    nameJa: r.bento.nameJa,
    nameEn: r.bento.nameEn,
    description: r.bento.description,
    priceYen: r.bento.priceYen,
    allergens: r.bento.allergens,
    stockRemaining: r.stockRemaining,
    stockTotal: r.stockTotal,
    soldOut: r.stockRemaining <= 0,
  }));
}

export function formatYen(yen: number): string {
  return `¥${yen.toLocaleString("ja-JP")}`;
}
