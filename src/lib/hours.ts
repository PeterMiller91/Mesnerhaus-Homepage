import { OPENING_HOURS, SPECIAL_DAYS, type Slot } from "@/data/site";

export const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

/* Uhrzeit am Armesberg (Europe/Berlin), unabhängig von der Zeitzone des Besuchers. */
export function berlinNow(): Date {
  const s = new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" });
  return new Date(s);
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const mins = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

export function slotFor(d: Date): { slot: Slot; note?: string } {
  const special = SPECIAL_DAYS.find((s) => s.date === ymd(d));
  if (special) return { slot: special.slot, note: special.note };
  return { slot: OPENING_HOURS[d.getDay()] };
}

export type OpenState = { open: boolean; text: string };

export function openState(now = berlinNow()): OpenState {
  const cur = now.getHours() * 60 + now.getMinutes();
  const { slot } = slotFor(now);
  if (slot && cur >= mins(slot.open) && cur < mins(slot.close)) {
    return { open: true, text: `Jetzt geöffnet · bis ${slot.close} Uhr` };
  }
  if (slot && cur < mins(slot.open)) {
    return { open: false, text: `Geschlossen · öffnet heute um ${slot.open} Uhr` };
  }
  for (let k = 1; k <= 14; k++) {
    const d = new Date(now); d.setDate(d.getDate() + k);
    const next = slotFor(d).slot;
    if (next) {
      const when = k === 1 ? "morgen" : DAY_NAMES[d.getDay()];
      return { open: false, text: `Geschlossen · öffnet ${when} um ${next.open} Uhr` };
    }
  }
  return { open: false, text: "Derzeit geschlossen" };
}

export const fmtSlot = (s: Slot) => (s ? `${s.open} – ${s.close} Uhr` : "Ruhetag");
