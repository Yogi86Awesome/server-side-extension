import { getTodaysMenu } from "@/lib/menu";
import { getPickupSlots } from "@/lib/pickup";
import OrderFlow from "@/components/OrderFlow";

// Always render fresh so stock counts and pickup windows are current.
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const menu = await getTodaysMenu();
  const slots = getPickupSlots();

  return (
    <>
      <h1>本日のお弁当 · Today&apos;s Bento</h1>

      {menu.length === 0 ? (
        <p>本日のメニューはまだ準備中です。 (Today&apos;s menu isn&apos;t set yet.)</p>
      ) : (
        <OrderFlow menu={menu} slots={slots} />
      )}
    </>
  );
}
