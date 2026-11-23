"use client";

import { useEffect, useState } from "react";
import { loadSiteData, type SiteSpecial } from "@/lib/siteData";
import Icon from "./Icon";

const de = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "long" });

/* Sonderkarten (Weihnachtsmenü, Ostern …) aus der Verwaltung, nur im eingestellten Zeitraum. */
export default function SpecialMenus() {
  const [list, setList] = useState<SiteSpecial[]>([]);
  useEffect(() => { loadSiteData().then((d) => setList(d?.specials ?? [])); }, []);
  if (!list.length) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10 md:mt-12">
      <p className="text-center text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-brand)] mb-4">Sonderkarte</p>
      <div className={`grid gap-5 ${list.length > 1 ? "md:grid-cols-2" : "max-w-2xl mx-auto"}`}>
        {list.map((s) => (
          <a key={s.id} href={s.pdf} target="_blank" rel="noopener"
            className="group grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)] gap-4 items-center bg-white rounded-2xl border border-[var(--color-line)] p-3 shadow-md hover:shadow-xl transition-shadow">
            <span className="aspect-[3/4] rounded-xl overflow-hidden bg-[var(--color-brand-pale)] flex items-center justify-center text-[var(--color-brand-dark)]">
              {s.image
                // eslint-disable-next-line @next/next/no-img-element -- Bild kommt zur Laufzeit vom Server
                ? <img src={s.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                : <Icon name="file" size={34} strokeWidth={1.4} />}
            </span>
            <span className="min-w-0">
              <span className="block text-xl text-[var(--color-dark)] leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>{s.title}</span>
              {s.text && <span className="block text-sm text-[var(--color-mid)] mt-1 leading-relaxed">{s.text}</span>}
              {s.to && <span className="block text-xs text-[var(--color-muted)] mt-1.5">{s.from ? `${de(s.from)} bis ${de(s.to)}` : `bis ${de(s.to)}`}</span>}
              <span className="inline-flex items-center gap-1.5 mt-2.5 text-sm font-bold text-[var(--color-brand-dark)] group-hover:underline">
                <Icon name="file" size={15} strokeWidth={2} /> Karte ansehen (PDF)
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
