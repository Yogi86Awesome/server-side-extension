import { getTodaysMenu, formatYen, type MenuEntry } from "@/lib/menu";

// Always render fresh so stock counts are current.
export const dynamic = "force-dynamic";

function StockBadge({ entry }: { entry: MenuEntry }) {
  if (entry.soldOut) {
    return <span className="stock-badge stock-out">Sold out · 売切</span>;
  }
  if (entry.stockRemaining <= 5) {
    return (
      <span className="stock-badge stock-low">
        Only {entry.stockRemaining} left · 残り{entry.stockRemaining}
      </span>
    );
  }
  return (
    <span className="stock-badge stock-ok">
      {entry.stockRemaining} available · 在庫{entry.stockRemaining}
    </span>
  );
}

export default async function MenuPage() {
  const menu = await getTodaysMenu();

  return (
    <>
      <h1>本日のお弁当 · Today&apos;s Bento</h1>

      {menu.length === 0 ? (
        <p>本日のメニューはまだ準備中です。 (Today&apos;s menu isn&apos;t set yet.)</p>
      ) : (
        <div className="menu-grid">
          {menu.map((entry) => (
            <article
              key={entry.availabilityId}
              className={`bento-card${entry.soldOut ? " sold-out" : ""}`}
            >
              <div>
                <div className="bento-name">
                  {entry.nameJa}
                  <span className="en">{entry.nameEn}</span>
                </div>
                {entry.description && (
                  <p className="bento-desc">{entry.description}</p>
                )}
                {entry.allergens.length > 0 && (
                  <div className="allergens">
                    アレルゲン / allergens: {entry.allergens.join(", ")}
                  </div>
                )}
                <StockBadge entry={entry} />
              </div>
              <div className="price">{formatYen(entry.priceYen)}</div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
