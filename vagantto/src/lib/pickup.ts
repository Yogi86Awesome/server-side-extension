// Pickup-window generation for Nishi-Kani Station.
//
// Product decisions (M3): fixed 15-minute slots within a daily service window,
// with a minimum lead time so the kitchen can prep. Times are computed in JST
// since the stall is in Japan.

export const LEAD_MIN = 15; // earliest pickup is now + this
export const SLOT_MIN = 15; // slot length
const SERVICE_START_MIN = 6 * 60; // 06:00 JST
const SERVICE_END_MIN = 21 * 60; // 21:00 JST
const JST_OFFSET_MIN = 9 * 60;
const MAX_SLOTS = 16;

function fmt(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Available pickup windows for the rest of today, e.g. ["15:45-16:00", ...]. */
export function getPickupSlots(now: Date = new Date()): string[] {
  const jstMinuteOfDay = Math.floor(now.getTime() / 60000 + JST_OFFSET_MIN) % 1440;
  let start = Math.ceil((jstMinuteOfDay + LEAD_MIN) / SLOT_MIN) * SLOT_MIN;
  if (start < SERVICE_START_MIN) start = SERVICE_START_MIN;

  const slots: string[] = [];
  for (
    let m = start;
    m + SLOT_MIN <= SERVICE_END_MIN && slots.length < MAX_SLOTS;
    m += SLOT_MIN
  ) {
    slots.push(`${fmt(m)}-${fmt(m + SLOT_MIN)}`);
  }
  return slots;
}

/** Guard against stale/forged pickup windows submitted from the client. */
export function isValidPickupSlot(slot: string, now: Date = new Date()): boolean {
  return getPickupSlots(now).includes(slot);
}
