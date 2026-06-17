import { notFound } from "next/navigation";
import { getOrderByCode, STATUS_LABEL } from "@/lib/orders";
import { formatYen } from "@/lib/menu";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const order = await getOrderByCode(code.toUpperCase());
  if (!order) notFound();

  return (
    <>
      <h1>ご注文ありがとうございます · Order confirmed</h1>

      <div className="card pickup-code">
        <span className="label">受取番号 · Pickup code</span>
        <span className="code">{order.code}</span>
        <span className="label">{STATUS_LABEL[order.status]}</span>
      </div>

      <div className="card">
        <div className="order-row">
          <span>お受取り時間 · Pickup window</span>
          <strong>{order.pickupWindow}</strong>
        </div>
        {order.customerName && (
          <div className="order-row">
            <span>お名前 · Name</span>
            <strong>{order.customerName}</strong>
          </div>
        )}

        <ul className="cart-list">
          {order.items.map((item) => (
            <li key={item.id}>
              <span>
                {item.bento.nameJa}{" "}
                <span className="en">{item.bento.nameEn}</span> × {item.qty}
              </span>
              <span>{formatYen(item.priceYenSnapshot * item.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="order-row total">
          <span>合計 · Total</span>
          <strong>{formatYen(order.totalYen)}</strong>
        </div>
      </div>

      <p className="bento-desc">
        Show this pickup code at the Vagantto stall at 西可児駅 during your window.
        お支払いは店頭で。 (Pay at the counter.)
      </p>
      <a href="/">← 戻る · Back to menu</a>
    </>
  );
}
