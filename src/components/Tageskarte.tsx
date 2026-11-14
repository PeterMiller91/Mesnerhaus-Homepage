"use client";

import { useEffect, useState } from "react";
import { TAGESKARTE_URL, TEL_HREF, TEL_DISPLAY, WHATSAPP } from "@/data/site";
import Icon from "./Icon";

type Info = { available: boolean; updated: string; caption: string; image: boolean; stale?: boolean };

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/* Zeigt die aktuelle Tageskarte (über den Telegram-Bot hochgeladen).
   Ohne Karte auf dem Server erscheint ein freundlicher Hinweis.      */
export default function Tageskarte() {
  const [info, setInfo] = useState<Info | null | undefined>(undefined); // undefined = lädt

  useEffect(() => {
    fetch(`${TAGESKARTE_URL}?info`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Info | null) => setInfo(j?.available
        ? { ...j, stale: (Date.now() - new Date(j.updated).getTime()) / 86_400_000 > 7 }
        : null))
      .catch(() => setInfo(null));
  }, []);

  if (info === undefined) {
    return <div className="max-w-3xl mx-auto h-72 rounded-2xl bg-white/60 border border-[var(--color-line)] animate-pulse" />;
  }

  if (!info) {
    return (
      <div className="max-w-xl mx-auto text-center bg-white rounded-2xl border border-[var(--color-line)] p-7 md:p-9">
        <span className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[var(--color-brand-pale)] text-[var(--color-brand-dark)] flex items-center justify-center">
          <Icon name="file" size={24} />
        </span>
        <h3 className="text-xl text-[var(--color-dark)] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          Die nächste Tageskarte folgt in Kürze
        </h3>
        <p className="text-sm text-[var(--color-mid)] leading-relaxed mb-5">
          Unsere Karte wechselt jede Woche. Was es am Sonntag gibt, verraten wir Ihnen gerne am Telefon oder per WhatsApp.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <a href={TEL_HREF} className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-brand)] text-white font-bold text-sm hover:bg-[var(--color-brand-dark)] transition-colors">
            <Icon name="phone" size={16} strokeWidth={2} /> {TEL_DISPLAY}
          </a>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 border-[var(--color-brand)] text-[var(--color-brand-dark)] font-bold text-sm hover:bg-[var(--color-brand-pale)] transition-colors">
            <Icon name="message" size={16} strokeWidth={2} /> WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const stale = Boolean(info.stale);
  const v = encodeURIComponent(info.updated); // Cache-Buster pro Upload

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-[minmax(0,1fr)_280px] gap-6 md:gap-8 items-start">
      <a href={`${TAGESKARTE_URL}?v=${v}`} target="_blank" rel="noopener"
        className="group block bg-white rounded-2xl border border-[var(--color-line)] p-2.5 shadow-md hover:shadow-xl transition-shadow">
        {info.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- Bild kommt zur Laufzeit vom Server
          <img src={`${TAGESKARTE_URL}?bild&v=${v}`} alt={`Tageskarte vom ${fmt(info.updated)}`}
            className="w-full h-auto max-h-[78vh] object-contain rounded-xl bg-[var(--color-cream)]" loading="lazy" />
        ) : (
          <div className="aspect-[3/4] rounded-xl bg-[var(--color-brand-pale)] flex flex-col items-center justify-center gap-3 text-[var(--color-brand-dark)]">
            <Icon name="file" size={48} strokeWidth={1.3} />
            <span className="font-bold text-sm">Tageskarte als PDF öffnen</span>
          </div>
        )}
      </a>

      <div className="flex flex-col gap-4 md:sticky md:top-24">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-muted)] mb-1">
            {stale ? "Letzte Tageskarte" : "Aktuelle Tageskarte"}
          </p>
          <p className="text-xl text-[var(--color-dark)] leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>
            {info.caption || fmt(info.updated)}
          </p>
          {info.caption && <p className="text-xs text-[var(--color-muted)] mt-1">Hochgeladen am {fmt(info.updated)}</p>}
        </div>
        <a href={`${TAGESKARTE_URL}?v=${v}`} target="_blank" rel="noopener"
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[var(--color-brand)] text-white font-bold text-sm hover:bg-[var(--color-brand-dark)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <Icon name="download" size={17} strokeWidth={2} /> Als PDF herunterladen
        </a>
        {stale && (
          <p className="text-xs text-[var(--color-mid)] leading-relaxed p-3 rounded-xl bg-white border border-[var(--color-line)]">
            Die Karte wechselt jede Woche. Für das aktuelle Angebot rufen Sie uns gerne an: <a href={TEL_HREF} className="font-bold text-[var(--color-brand-dark)] whitespace-nowrap">{TEL_DISPLAY}</a>
          </p>
        )}
        <p className="text-xs text-[var(--color-muted)] leading-relaxed">
          Informationen zu Allergenen und Zusatzstoffen liegen im Gasthaus aus. Fragen Sie gerne unser Personal.
        </p>
      </div>
    </div>
  );
}
