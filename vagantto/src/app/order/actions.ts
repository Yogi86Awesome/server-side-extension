"use server";

import { revalidatePath } from "next/cache";
import { createOrder, type PlaceOrderInput, type PlaceOrderResult } from "@/lib/orders";

/** Server action wrapper: place the order, then refresh stock-dependent views. */
export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const result = await createOrder(input);
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/staff");
  }
  return result;
}
