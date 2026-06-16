import { prisma } from "@/lib/db";
import { startOfToday, formatYen } from "@/lib/menu";
import { createBento, setTodaysStock, toggleBentoActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const date = startOfToday();

  const bentos = await prisma.bento.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      availabilities: { where: { date } },
    },
  });

  return (
    <>
      <h1>Staff Dashboard · 本日の在庫管理</h1>
      <p className="bento-desc">
        Manage today&apos;s menu and stock. Sold-out bentos hide their order
        button on the customer page automatically.
      </p>

      <table>
        <thead>
          <tr>
            <th>Bento</th>
            <th>Price</th>
            <th>Today&apos;s stock</th>
            <th>Set stock</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {bentos.map((b) => {
            const avail = b.availabilities[0];
            return (
              <tr key={b.id}>
                <td>
                  <strong>{b.nameJa}</strong>
                  <br />
                  <span className="allergens">{b.nameEn}</span>
                </td>
                <td>{formatYen(b.priceYen)}</td>
                <td>
                  {avail
                    ? `${avail.stockRemaining} / ${avail.stockTotal}`
                    : "— not on today's menu"}
                </td>
                <td>
                  <form action={setTodaysStock} className="inline">
                    <input type="hidden" name="bentoId" value={b.id} />
                    <input
                      type="number"
                      name="stock"
                      min={0}
                      defaultValue={avail?.stockTotal ?? 0}
                      style={{ width: "5rem" }}
                    />
                    <button type="submit">Set</button>
                  </form>
                </td>
                <td>
                  <form action={toggleBentoActive} className="inline">
                    <input type="hidden" name="bentoId" value={b.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={(!b.active).toString()}
                    />
                    <button type="submit" className="secondary">
                      {b.active ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
          {bentos.length === 0 && (
            <tr>
              <td colSpan={5}>No bentos yet — add one below.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Add a bento</h2>
        <form action={createBento}>
          <div className="field-row">
            <div>
              <label htmlFor="nameJa">名前 (JA)</label>
              <input id="nameJa" name="nameJa" placeholder="唐揚げ弁当" required />
            </div>
            <div>
              <label htmlFor="nameEn">Name (EN)</label>
              <input id="nameEn" name="nameEn" placeholder="Karaage Bento" required />
            </div>
            <div>
              <label htmlFor="priceYen">Price (¥)</label>
              <input id="priceYen" name="priceYen" type="number" min={1} required />
            </div>
            <div>
              <label htmlFor="stock">Today&apos;s stock</label>
              <input id="stock" name="stock" type="number" min={0} defaultValue={0} />
            </div>
          </div>
          <div>
            <label htmlFor="description">Description</label>
            <input
              id="description"
              name="description"
              placeholder="Juicy fried chicken, rice, seasonal vegetables."
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <button type="submit">Add bento</button>
          </div>
        </form>
      </div>
    </>
  );
}
