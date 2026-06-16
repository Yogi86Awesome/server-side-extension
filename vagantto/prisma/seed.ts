import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Midnight today, used as the `date` for today's availability rows.
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const BENTOS = [
  {
    nameJa: "うなぎ弁当",
    nameEn: "Unagi Bento",
    description: "Grilled eel over rice with tamagoyaki and pickles.",
    priceYen: 1280,
    category: "bento",
    allergens: ["soy", "wheat", "egg"],
    stock: 12,
  },
  {
    nameJa: "唐揚げ弁当",
    nameEn: "Karaage Bento",
    description: "Juicy fried chicken, rice, and seasonal vegetables.",
    priceYen: 780,
    category: "bento",
    allergens: ["soy", "wheat"],
    stock: 30,
  },
  {
    nameJa: "鮭弁当",
    nameEn: "Grilled Salmon Bento",
    description: "Salt-grilled salmon, rice, and umeboshi.",
    priceYen: 850,
    category: "bento",
    allergens: ["fish"],
    stock: 20,
  },
  {
    nameJa: "幕の内弁当",
    nameEn: "Makunouchi Bento",
    description: "Classic assortment: fish, egg, simmered vegetables, rice.",
    priceYen: 980,
    category: "bento",
    allergens: ["fish", "soy", "egg", "wheat"],
    stock: 18,
  },
];

async function main() {
  const date = today();

  for (const b of BENTOS) {
    const bento = await prisma.bento.upsert({
      where: { id: `seed-${b.nameEn.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-${b.nameEn.toLowerCase().replace(/\s+/g, "-")}`,
        nameJa: b.nameJa,
        nameEn: b.nameEn,
        description: b.description,
        priceYen: b.priceYen,
        category: b.category,
        allergens: b.allergens,
      },
    });

    await prisma.dailyAvailability.upsert({
      where: { date_bentoId: { date, bentoId: bento.id } },
      update: { stockTotal: b.stock, stockRemaining: b.stock },
      create: {
        date,
        bentoId: bento.id,
        stockTotal: b.stock,
        stockRemaining: b.stock,
      },
    });
  }

  console.log(`Seeded ${BENTOS.length} bentos with today's availability.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
