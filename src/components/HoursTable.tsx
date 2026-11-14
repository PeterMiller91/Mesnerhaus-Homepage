"use client";

import { useSyncExternalStore } from "react";
import { OPENING_HOURS, SPECIAL_DAYS } from "@/data/site";
import { DAY_NAMES, berlinNow, fmtSlot } from "@/lib/hours";
import OpenStatus from "./OpenStatus";

const noop = () => () => {};
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mo … So

export default function HoursTable() {
  // null beim statischen Rendern, im Browser der heutige Wochentag
  const today = useSyncExternalStore(noop, () => berlinNow().getDay(), () => null);

  const upcoming = SPECIAL_DAYS.filter((s) => s.date >= new Date().toISOString().slice(0, 10)).slice(0, 4);

  return (
    <div>
      <div className="mb-5"><OpenStatus variant="dark" /></div>
      <div>
        {ORDER.map((d) => {
          const slot = OPENING_HOURS[d];
          const isToday = d === today;
          return (
            <div key={d}
              className={`flex justify-between items-center py-3.5 px-3 -mx-3 border-b border-[var(--color-line)] rounded-lg ${isToday ? "bg-[var(--color-brand-pale)]" : ""}`}>
              <span className="font-bold text-[var(--color-dark)] text-sm">
                {DAY_NAMES[d]}{isToday && <span className="ml-2 text-[0.65rem] uppercase tracking-widest text-[var(--color-brand-dark)]">heute</span>}
              </span>
              <span className={`text-sm tabular-nums ${slot ? "text-[var(--color-brand-dark)] font-bold" : "text-[var(--color-muted)] italic"}`}>
                {fmtSlot(slot)}
              </span>
            </div>
          );
        })}
      </div>
      {upcoming.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-[var(--color-brand-pale)] border border-[var(--color-brand-light)] text-sm">
          <p className="font-bold text-[var(--color-brand-dark)] mb-2">Abweichende Öffnungszeiten</p>
          <ul className="space-y-1 text-[var(--color-mid)]">
            {upcoming.map((s) => (
              <li key={s.date} className="flex justify-between gap-4">
                <span>{new Date(s.date + "T12:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long" })}{s.note ? ` · ${s.note}` : ""}</span>
                <span className="tabular-nums">{s.slot ? fmtSlot(s.slot) : "geschlossen"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
