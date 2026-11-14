"use client";

import { writeConsent } from "@/lib/consent";
import useConsent from "./useConsent";
import Icon from "./Icon";

/* Google-Maps-Karte, die erst nach Einwilligung geladen wird (Zwei-Klick-Lösung). */
export default function ConsentMap({ src, title, link }: { src: string; title: string; link: string }) {
  const consent = useConsent();

  if (consent?.maps) {
    return (
      <iframe src={src} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
        referrerPolicy="no-referrer-when-downgrade" title={title} />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6 bg-[var(--color-brand-pale)]">
      <span className="w-12 h-12 rounded-xl bg-white text-[var(--color-brand-dark)] flex items-center justify-center shadow-sm">
        <Icon name="pin" size={24} />
      </span>
      <p className="text-sm text-[var(--color-mid)] max-w-xs leading-relaxed">
        Mit dem Laden der Karte werden Daten (u. a. Ihre IP-Adresse) an Google übertragen, auch in die USA.{" "}
        <a href="/datenschutz/#google-maps" className="underline text-[var(--color-brand-dark)]">Mehr erfahren</a>
      </p>
      <button type="button" onClick={() => writeConsent({ maps: true })}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-brand-dark)] text-white font-bold text-sm hover:bg-[var(--color-brand-deeper)] transition-colors">
        Karte laden
      </button>
      <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-muted)] underline">
        Oder direkt in Google Maps öffnen
      </a>
    </div>
  );
}
