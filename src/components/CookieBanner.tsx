"use client";

import { useEffect, useRef, useState } from "react";
import { OPEN_EVENT, writeConsent } from "@/lib/consent";
import useConsent from "./useConsent";

const btnBase = "inline-flex items-center justify-center px-5 py-3 rounded-full font-bold text-sm transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-brand-light)]";
/* „Alle akzeptieren“ und „Nur notwendige“ sind bewusst gleich gestaltet (keine Bevorzugung). */
const btnChoice = `${btnBase} bg-[var(--color-brand-dark)] text-white hover:bg-[var(--color-brand-deeper)]`;
const btnLink = `${btnBase} text-[var(--color-brand-dark)] underline underline-offset-4 hover:bg-[var(--color-brand-pale)]`;

export default function CookieBanner() {
  const consent = useConsent();
  const [forced, setForced] = useState(false);       // über „Cookie-Einstellungen“ geöffnet
  const [details, setDetails] = useState(false);
  const [maps, setMaps] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const open = () => { setForced(true); setDetails(true); };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  const visible = consent === null || forced;

  useEffect(() => {
    if (visible) dialog.current?.focus();
  }, [visible]);

  if (consent === undefined || !visible) return null;

  const mapsChecked = forced && !details ? (consent?.maps ?? false) : maps;
  const save = (m: boolean) => { writeConsent({ maps: m }); setForced(false); setDetails(false); };
  const openDetails = () => { setMaps(consent?.maps ?? false); setDetails(true); };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] p-3 sm:p-5 pointer-events-none"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="cb-title" aria-describedby="cb-text"
        className="pointer-events-auto mx-auto max-w-2xl bg-white text-[var(--color-dark)] rounded-2xl border border-[var(--color-line)] shadow-[0_12px_48px_rgba(0,0,0,.22)] p-5 sm:p-6 outline-none max-h-[85vh] overflow-y-auto">
        <h2 id="cb-title" className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          Datenschutz-Einstellungen
        </h2>
        <p id="cb-text" className="text-sm text-[var(--color-mid)] leading-relaxed">
          Wir verwenden keine Werbe- oder Analyse-Cookies. Notwendig ist nur, Ihre Auswahl auf diesem Gerät zu speichern.
          Mit Ihrer Einwilligung zeigen wir zusätzlich eine <b>Karte von Google Maps</b> an. Dabei werden Daten wie Ihre IP-Adresse an Google
          übertragen, auch in die USA. Ihre Einwilligung ist freiwillig und kann jederzeit über „Cookie-Einstellungen“ unten auf der Seite widerrufen werden.
          Mehr in der <a href="/datenschutz/" className="underline font-bold text-[var(--color-brand-dark)]">Datenschutzerklärung</a>{" "}
          und im <a href="/impressum/" className="underline font-bold text-[var(--color-brand-dark)]">Impressum</a>.
        </p>

        {details && (
          <fieldset className="mt-4 grid gap-3">
            <legend className="sr-only">Kategorien</legend>
            <label className="flex gap-3 items-start p-3 rounded-xl bg-[var(--color-brand-pale)]">
              <input type="checkbox" checked disabled className="mt-1 w-5 h-5 accent-[var(--color-brand-dark)]" />
              <span className="text-sm">
                <b>Notwendig</b> <span className="text-[var(--color-muted)]">(immer aktiv)</span><br />
                <span className="text-[var(--color-mid)]">Speichert Ihre Datenschutz-Auswahl im Browser (localStorage „mh-consent“). Keine Weitergabe an Dritte.</span>
              </span>
            </label>
            <label className="flex gap-3 items-start p-3 rounded-xl border border-[var(--color-line)] cursor-pointer">
              <input id="cb-maps" type="checkbox" checked={mapsChecked} onChange={(e) => setMaps(e.target.checked)}
                className="mt-1 w-5 h-5 accent-[var(--color-brand-dark)]" />
              <span className="text-sm">
                <b>Externe Medien: Google Maps</b><br />
                <span className="text-[var(--color-mid)]">
                  Interaktive Karte im Bereich „Anfahrt“. Anbieter: Google Ireland Limited, Irland. Übertragung u. a. der IP-Adresse an Google, auch in die USA.
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG.
                </span>
              </span>
            </label>
          </fieldset>
        )}

        <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-2.5">
          {details ? (
            <>
              <button type="button" className={btnChoice} onClick={() => save(maps)}>Auswahl speichern</button>
              <button type="button" className={btnChoice} onClick={() => save(true)}>Alle akzeptieren</button>
              <button type="button" className={btnChoice} onClick={() => save(false)}>Nur notwendige</button>
            </>
          ) : (
            <>
              <button type="button" className={btnChoice} onClick={() => save(true)}>Alle akzeptieren</button>
              <button type="button" className={btnChoice} onClick={() => save(false)}>Nur notwendige</button>
              <button type="button" className={btnLink} onClick={openDetails}>Einstellungen</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
