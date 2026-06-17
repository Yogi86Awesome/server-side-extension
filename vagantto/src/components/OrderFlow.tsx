"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MenuEntry } from "@/lib/menu";
import { placeOrder } from "@/app/order/actions";

function yen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

function StockBadge({ entry }: { entry: MenuEntry }) {
  if (entry.soldOut) return <span className="stock-badge stock-out">Sold out · 売切</span>;
  if (entry.stockRemaining <= 5)
    return (
      <span className="stock-badge stock-low">
        Only {entry.stockRemaining} left · 残り{entry.stockRemaining}
      </span>
    );
  return (
    <span className="stock-badge stock-ok">
      {entry.stockRemaining} available · 在庫{entry.stockRemaining}
    </span>
  );
}

export default function OrderFlow({
  menu,
  slots,
}: {
  menu: MenuEntry[];
  slots: string[];
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"menu" | "checkout">("menu");
  const [pickupWindow, setPickupWindow] = useState(slots[0] ?? "");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const setItem = (entry: MenuEntry, next: number) => {
    const capped = Math.max(0, Math.min(next, entry.stockRemaining));
    setQty((q) => ({ ...q, [entry.availabilityId]: capped }));
  };

  const cart = useMemo(
    () =>
      menu
        .map((e) => ({ e, n: qty[e.availabilityId] ?? 0 }))
        .filter((x) => x.n > 0),
    [menu, qty],
  );
  const count = cart.reduce((s, x) => s + x.n, 0);
  const total = cart.reduce((s, x) => s + x.n * x.e.priceYen, 0);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({
        items: cart.map((x) => ({ availabilityId: x.e.availabilityId, qty: x.n })),
        pickupWindow,
        customerName: name,
      });
      if (res.ok) router.push(`/order/${res.code}`);
      else setError(res.error);
    });
  };

  return (
    <>
      {step === "menu" && (
        <div className="menu-grid">
          {menu.map((entry) => {
            const n = qty[entry.availabilityId] ?? 0;
            return (
              <article
                key={entry.availabilityId}
                className={`bento-card${entry.soldOut ? " sold-out" : ""}`}
              >
                <div>
                  <div className="bento-name">
                    {entry.nameJa}
                    <span className="en">{entry.nameEn}</span>
                  </div>
                  {entry.description && <p className="bento-desc">{entry.description}</p>}
                  {entry.allergens.length > 0 && (
                    <div className="allergens">
                      アレルゲン / allergens: {entry.allergens.join(", ")}
                    </div>
                  )}
                  <StockBadge entry={entry} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="price">{yen(entry.priceYen)}</div>
                  {!entry.soldOut && (
                    <div className="stepper">
                      <button
                        type="button"
                        className="secondary"
                        aria-label="remove one"
                        onClick={() => setItem(entry, n - 1)}
                        disabled={n === 0}
                      >
                        −
                      </button>
                      <span className="qty">{n}</span>
                      <button
                        type="button"
                        className="secondary"
                        aria-label="add one"
                        onClick={() => setItem(entry, n + 1)}
                        disabled={n >= entry.stockRemaining}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {step === "checkout" && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>受取 · Pickup &amp; confirm</h2>
          <ul className="cart-list">
            {cart.map((x) => (
              <li key={x.e.availabilityId}>
                <span>
                  {x.e.nameJa} <span className="en">{x.e.nameEn}</span> × {x.n}
                </span>
                <span>{yen(x.n * x.e.priceYen)}</span>
              </li>
            ))}
          </ul>

          <div style={{ margin: "0.75rem 0" }}>
            <label htmlFor="pickup">お受取り時間 · Pickup window</label>
            {slots.length === 0 ? (
              <p className="bento-desc">No pickup times available right now.</p>
            ) : (
              <select
                id="pickup"
                value={pickupWindow}
                onChange={(e) => setPickupWindow(e.target.value)}
              >
                {slots.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ margin: "0.75rem 0" }}>
            <label htmlFor="name">お名前 · Name (optional)</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="checkout-actions">
            <button type="button" className="secondary" onClick={() => setStep("menu")}>
              ← Back
            </button>
            <button type="button" onClick={submit} disabled={pending || slots.length === 0}>
              {pending ? "Placing…" : `Place order · ${yen(total)}`}
            </button>
          </div>
        </div>
      )}

      {step === "menu" && count > 0 && (
        <div className="cart-bar">
          <span>
            {count} item{count > 1 ? "s" : ""} · {yen(total)}
          </span>
          <button type="button" onClick={() => setStep("checkout")}>
            Checkout →
          </button>
        </div>
      )}
    </>
  );
}
