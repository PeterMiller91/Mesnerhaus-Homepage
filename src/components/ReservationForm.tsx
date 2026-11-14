"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { EMAIL, WHATSAPP } from "@/data/site";
import { slotFor } from "@/lib/hours";
import Icon from "./Icon";

const field = "w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-line)] bg-white text-[var(--color-dark)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-light)]";
const label = "grid gap-1 text-xs font-bold text-[var(--color-mid)]";

export default function ReservationForm() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [persons, setPersons] = useState("4");
  const [area, setArea] = useState("egal");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const minDate = useSyncExternalStore(() => () => {}, () => new Date().toISOString().slice(0, 10), () => "");

  const slot = date ? slotFor(new Date(date + "T12:00")).slot : null;
  const closed = Boolean(date) && !slot;
  // Halbstündliche Zeiten innerhalb der Öffnungszeit, letzte Ankunft 1 h vor Schluss
  const times = useMemo(() => {
    const s = slot ?? { open: "11:00", close: "17:00" };
    const toM = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const out: string[] = [];
    for (let m = toM(s.open); m <= toM(s.close) - 60; m += 30)
      out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
    return out;
  }, [slot]);
  const timeValue = times.includes(time) ? time : times[0] ?? time;

  const message = useMemo(() => {
    const d = date
      ? new Date(date + "T12:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : "(Datum)";
    return [
      "Grüß Gott, ich möchte gerne einen Tisch im Mesnerhaus anfragen:",
      `Datum: ${d}`,
      `Uhrzeit: ${timeValue} Uhr`,
      `Personen: ${persons}`,
      `Bereich: ${area}`,
      `Name: ${name || "(Name)"}`,
      note ? `Anmerkung: ${note}` : "",
    ].filter(Boolean).join("\n");
  }, [date, timeValue, persons, area, name, note]);

  const ready = Boolean(date && name.trim() && !closed);
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  const mail = `mailto:${EMAIL}?subject=${encodeURIComponent("Tischanfrage Mesnerhaus")}&body=${encodeURIComponent(message)}`;

  return (
    <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); if (ready) window.open(wa, "_blank", "noopener"); }}>
      <label className={label}>Datum
        <input id="res-date" type="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </label>
      <label className={label}>Uhrzeit
        <select id="res-time" value={timeValue} onChange={(e) => setTime(e.target.value)} className={field}>
          {times.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className={label}>Personen
        <select id="res-persons" value={persons} onChange={(e) => setPersons(e.target.value)} className={field}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10 oder mehr (Gruppe)"].map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>
      <label className={label}>Bereich
        <select id="res-area" value={area} onChange={(e) => setArea(e.target.value)} className={field}>
          <option>egal</option><option>Terrasse</option><option>Gaststube</option>
        </select>
      </label>
      <label className={`${label} col-span-2`}>Name
        <input id="res-name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Vor- und Nachname" />
      </label>
      <label className={`${label} col-span-2`}>Anmerkung (optional)
        <input id="res-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} className={field} placeholder="z. B. Kinderstuhl, Geburtstag, Hund" />
      </label>

      {closed && (
        <p className="col-span-2 text-sm text-[#A6452F]">An diesem Tag haben wir geschlossen. Bitte wählen Sie einen Öffnungstag.</p>
      )}

      <div className="col-span-2 flex flex-wrap gap-2.5 pt-1">
        <button type="submit" disabled={!ready}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-brand)] text-white font-bold text-sm hover:bg-[var(--color-brand-dark)] transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
          <Icon name="message" size={17} /> Per WhatsApp anfragen
        </button>
        <a href={ready ? mail : undefined} aria-disabled={!ready}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--color-brand)] text-[var(--color-brand-dark)] font-bold text-sm transition-colors ${ready ? "hover:bg-[var(--color-brand-pale)]" : "opacity-45 pointer-events-none"}`}>
          <Icon name="mail" size={17} /> Per E-Mail
        </a>
      </div>
      <p className="col-span-2 text-xs text-[var(--color-muted)] leading-relaxed">
        Die Anfrage wird in Ihrer WhatsApp- bzw. E-Mail-App vorbereitet und erst mit Ihrem Absenden verschickt.
        Wir bestätigen Ihre Reservierung persönlich. Diese Seite speichert keine Daten.
      </p>
    </form>
  );
}
