"use client";

import { useEffect, useRef, useState } from "react";
import { TEL_DISPLAY, TEL_HREF, WHATSAPP } from "@/data/site";
import Icon from "./Icon";
import ReservationForm from "./ReservationForm";

type Day = { date: string; label: string; status: "frei" | "wenige" | "voll" };
type Slot = { time: string; free: boolean };

const API = "/api/reservierung.php";
const field = "w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-line)] bg-white text-[var(--color-dark)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-light)]";
const lbl = "grid gap-1 text-xs font-bold text-[var(--color-mid)]";

const shortDay = (d: string) =>
  new Date(d + "T12:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });

/* Online-Buchung mit Live-Verfügbarkeit. Ist der Server nicht erreichbar,
   erscheint das bisherige Formular (WhatsApp / E-Mail) als Rückfall.     */
export default function OnlineBooking() {
  const [mode, setMode] = useState<"loading" | "online" | "fallback" | "paused">("loading");
  const [pausedMsg, setPausedMsg] = useState("");
  const [maxOnline, setMaxOnline] = useState(8);
  const [days, setDays] = useState<Day[]>([]);
  const [day, setDay] = useState("");
  const [persons, setPersons] = useState(2);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ message: string; mailed: boolean } | null>(null);
  const started = useRef<number>(0);

  // Tage laden (abhängig von der Personenzahl)
  useEffect(() => {
    let alive = true;
    fetch(`${API}?tage&persons=${persons}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        if (!alive) return;
        if (j.disabled) { setPausedMsg(j.message); setMode("paused"); return; }
        if (!j.ok) { setMode("fallback"); return; }
        setMaxOnline(j.max_online);
        setDays(j.days);
        setDay((cur) => (j.days.some((d: Day) => d.date === cur && d.status !== "voll") ? cur : (j.days.find((d: Day) => d.status !== "voll")?.date ?? "")));
        setMode("online");
        if (!started.current) started.current = Date.now();
      })
      .catch(() => alive && setMode("fallback"));
    return () => { alive = false; };
  }, [persons]);

  // Uhrzeiten laden
  useEffect(() => {
    if (mode !== "online" || !day) return;
    let alive = true;
    fetch(`${API}?zeiten&date=${day}&persons=${persons}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        setSlots(j.slots ?? []);
        setTime((cur) => (j.slots?.some((s: Slot) => s.time === cur && s.free) ? cur : ""));
      })
      .catch(() => alive && setSlots([]));
    return () => { alive = false; setSlots(null); };
  }, [day, persons, mode]);

  if (mode === "loading") return <div className="h-80 rounded-xl bg-white/60 animate-pulse" aria-busy="true" />;
  if (mode === "fallback") return <ReservationForm />;
  if (mode === "paused") {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-[var(--color-mid)]">{pausedMsg}</p>
        <ReservationForm />
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-6 grid gap-3 justify-items-center" role="status">
        <span className="w-14 h-14 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center"><Icon name="check" size={28} strokeWidth={2.5} /></span>
        <p className="text-lg font-bold text-[var(--color-dark)]" style={{ fontFamily: "var(--font-playfair)" }}>{done.message}</p>
        <p className="text-sm text-[var(--color-mid)] max-w-sm">
          {done.mailed ? "Die Bestätigung ist unterwegs in Ihr E-Mail-Postfach. Dort finden Sie auch einen Link, falls Sie stornieren müssen." : "Wir freuen uns auf Sie!"}
        </p>
        <button type="button" onClick={() => { setDone(null); setTime(""); setName(""); setNote(""); }} className="text-sm font-bold text-[var(--color-brand-dark)] underline">
          Weitere Reservierung
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!day || !time) { setError("Bitte Tag und Uhrzeit wählen."); return; }
    if (name.trim().length < 2) { setError("Bitte Ihren Namen angeben."); document.getElementById("ob-name")?.focus(); return; }
    if (phone.replace(/\D/g, "").length < 6) { setError("Bitte eine Telefonnummer angeben. Sie ist Pflicht, damit wir Sie bei Rückfragen erreichen."); document.getElementById("ob-phone")?.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setError("Bitte eine gültige E-Mail-Adresse angeben. Dorthin schicken wir die Bestätigung."); document.getElementById("ob-mail")?.focus(); return; }
    setBusy(true);
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: day, time, persons, name, phone, email, note, website: hp, elapsed: Date.now() - started.current }),
      });
      const j = await r.json();
      if (j.ok) setDone({ message: j.message, mailed: !!j.mailed });
      else {
        setError(j.message || "Das hat leider nicht geklappt. Bitte rufen Sie uns an.");
        if (j.full) setSlots((s) => s?.map((x) => (x.time === time ? { ...x, free: false } : x)) ?? null);
      }
    } catch {
      setError("Keine Verbindung. Bitte versuchen Sie es erneut oder rufen Sie uns an.");
    }
    setBusy(false);
  };

  const chip = (on: boolean, disabled = false) =>
    `min-h-[44px] rounded-xl border text-sm font-bold transition-colors ${disabled
      ? "bg-[#F1F0EA] text-[#8E8E86] border-[var(--color-line)] cursor-not-allowed"
      : on ? "bg-[var(--color-brand-dark)] text-white border-[var(--color-brand-dark)]" : "bg-white text-[var(--color-dark)] border-[var(--color-brand-light)] hover:border-[var(--color-brand)]"}`;

  return (
    <form onSubmit={submit} className="grid gap-5">
      <fieldset className="grid gap-2">
        <legend className="text-sm font-bold text-[var(--color-dark)] mb-2">1. Personen</legend>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Eine Person weniger" onClick={() => setPersons((p) => Math.max(1, p - 1))}
            className="w-11 h-11 rounded-full border-2 border-[var(--color-brand-light)] bg-white text-xl font-bold text-[var(--color-brand-dark)]">−</button>
          <output className="text-xl font-black w-10 text-center tabular-nums" aria-live="polite">{persons}</output>
          <button type="button" aria-label="Eine Person mehr" onClick={() => setPersons((p) => Math.min(maxOnline, p + 1))} disabled={persons >= maxOnline}
            className="w-11 h-11 rounded-full border-2 border-[var(--color-brand-light)] bg-white text-xl font-bold text-[var(--color-brand-dark)] disabled:opacity-40">+</button>
          <span className="text-xs text-[var(--color-muted)] leading-snug">
            Ab {maxOnline + 1} Personen bitte <a href={TEL_HREF} className="underline">anrufen</a> oder per{" "}
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a>.
          </span>
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-bold text-[var(--color-dark)] mb-2">2. Tag</legend>
        {days.length === 0 ? (
          <p className="text-sm text-[var(--color-mid)]">Online sind gerade keine Termine frei. Rufen Sie uns gerne an: <a href={TEL_HREF} className="font-bold underline">{TEL_DISPLAY}</a></p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {days.map((d) => (
              <button key={d.date} type="button" disabled={d.status === "voll"} onClick={() => setDay(d.date)} aria-pressed={day === d.date}
                className={`${chip(day === d.date, d.status === "voll")} px-1 py-1.5 leading-tight`}>
                <span className="block">{shortDay(d.date)}</span>
                <span className="block text-[0.7rem] font-normal opacity-80">{d.status === "voll" ? "ausgebucht" : d.status === "wenige" ? "wenige Plätze" : "frei"}</span>
              </button>
            ))}
          </div>
        )}
      </fieldset>

      {day && (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold text-[var(--color-dark)] mb-2">3. Uhrzeit</legend>
          {slots === null ? (
            <div className="h-24 rounded-xl bg-white/60 animate-pulse" />
          ) : slots.length === 0 ? (
            <p className="text-sm text-[var(--color-mid)]">An diesem Tag ist online nichts mehr frei.</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button key={s.time} type="button" disabled={!s.free} onClick={() => setTime(s.time)} aria-pressed={time === s.time}
                    aria-label={s.free ? `${s.time} Uhr` : `${s.time} Uhr, ausgebucht`}
                    className={`${chip(time === s.time, !s.free)} tabular-nums ${s.free ? "" : "line-through"}`}>{s.time}</button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-muted)]">Durchgestrichen = ausgebucht. Ihr Tisch ist für 2 Stunden reserviert.</p>
            </>
          )}
        </fieldset>
      )}

      {time && (
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="text-sm font-bold text-[var(--color-dark)] mb-2">4. Ihre Daten <span className="font-normal text-xs text-[var(--color-muted)]">(* Pflichtfeld)</span></legend>
          <label className={`${lbl} col-span-2`}>Name *
            <input id="ob-name" required aria-required="true" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Vor- und Nachname" />
          </label>
          <label className={lbl}>Telefon *
            <input id="ob-phone" required aria-required="true" minLength={6} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} placeholder="Für Rückfragen" />
          </label>
          <label className={lbl}>E-Mail *
            <input id="ob-mail" required aria-required="true" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="Für die Bestätigung" />
          </label>
          <label className={`${lbl} col-span-2`}>Wunsch (optional)
            <input id="ob-note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className={field} placeholder="z. B. Kinderstuhl, Geburtstag, Hund" />
          </label>
          {/* Spamschutz: für Menschen unsichtbar */}
          <label aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">Website
            <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
          </label>
        </fieldset>
      )}

      {error && <p className="text-sm text-[#A6452F]" role="alert">{error}</p>}

      <div className="grid gap-2">
        <button type="submit" disabled={busy || !time}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[var(--color-brand-dark)] text-white font-bold text-sm hover:bg-[var(--color-brand-deeper)] transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
          <Icon name="calendar" size={17} strokeWidth={2} />
          {busy ? "Wird gesendet …" : time ? `Tisch reservieren: ${shortDay(day)}, ${time} Uhr, ${persons} ${persons === 1 ? "Person" : "Personen"}` : "Tisch reservieren"}
        </button>
        <p className="text-xs text-[var(--color-muted)] leading-relaxed">
          Ist Platz frei, ist Ihr Tisch sofort reserviert. Sie erhalten eine Bestätigung per E-Mail. Ihre Angaben nutzen wir nur für diese Reservierung, siehe <a href="/datenschutz/#reservierung" className="underline">Datenschutz</a>.
        </p>
      </div>
    </form>
  );
}
