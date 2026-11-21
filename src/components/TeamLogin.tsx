"use client";

import { useState, useSyncExternalStore } from "react";

const MSG: Record<string, { text: string; ok?: boolean }> = {
  fehler: { text: "Name oder Passwort stimmt nicht." },
  gesperrt: { text: "Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen." },
  bitte: { text: "Bitte melden Sie sich an." },
  abgemeldet: { text: "Sie sind abgemeldet.", ok: true },
};

const field = "w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-line)] bg-white text-[var(--color-dark)] text-sm focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-light)]";

/* Dezentes Login fürs Team. Sendet an /reservierungen/verwaltung/ (PHP),
   das bei Erfolg die Verwaltung öffnet und sonst hierher zurückleitet. */
export default function TeamLogin() {
  // Rückmeldung aus der Adresse (?login=fehler …), nur im Browser bekannt
  const code = useSyncExternalStore(() => () => {}, () => new URLSearchParams(window.location.search).get("login") ?? "", () => "");
  const msg = MSG[code] ?? null;
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? !!msg;

  return (
    <details id="team-login" open={open} onToggle={(e) => setUserOpen((e.target as HTMLDetailsElement).open)}
      className="max-w-md mx-auto rounded-2xl border border-[var(--color-line)] bg-white">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-[var(--color-mid)] flex items-center justify-between gap-3 min-h-[44px]">
        Anmeldung für das Mesnerhaus-Team
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
      </summary>
      <form method="post" action="/reservierungen/verwaltung/" className="grid gap-3 px-5 pb-5">
        <input type="hidden" name="do" value="login" />
        {msg && (
          <p role="alert" className={`text-sm rounded-xl px-3 py-2 ${msg.ok ? "bg-[#E3F0D3] text-[#2F5A12]" : "bg-[#F8E6E0] text-[#A6452F]"}`}>{msg.text}</p>
        )}
        <label className="grid gap-1 text-xs font-bold text-[var(--color-mid)]">Name
          <input id="tl-user" name="user" required autoComplete="username" autoCapitalize="none" className={field} />
        </label>
        <label className="grid gap-1 text-xs font-bold text-[var(--color-mid)]">Passwort
          <input id="tl-pass" name="pass" type="password" required autoComplete="current-password" className={field} />
        </label>
        <button type="submit" className="min-h-[44px] rounded-full bg-[var(--color-dark)] text-white font-bold text-sm hover:opacity-90">
          Anmelden
        </button>
      </form>
    </details>
  );
}
