/* Einwilligungen (TDDDG § 25, DSGVO Art. 6 Abs. 1 lit. a / Art. 7).
   Gespeichert wird nur im Browser des Besuchers (localStorage). Das ist
   zur Speicherung der Entscheidung unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).
   Bei neuen Diensten CONSENT_VERSION erhöhen, dann wird erneut gefragt. */

export const CONSENT_VERSION = 1;
const KEY = "mh-consent";
const EVENT = "mh:consent-change";
export const OPEN_EVENT = "mh:open-consent";

export type Consent = {
  v: number;
  ts: string;          // Zeitpunkt der Entscheidung (ISO)
  maps: boolean;       // Google Maps (Karte)
};

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    return c && c.v === CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: Omit<Consent, "v" | "ts">): void {
  const c: Consent = { v: CONSENT_VERSION, ts: new Date().toISOString(), ...choice };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* privat-Modus: gilt nur für diese Sitzung */ }
  memory = c;
  window.dispatchEvent(new CustomEvent(EVENT));
}

let memory: Consent | null = null;
export function currentConsent(): Consent | null {
  return readConsent() ?? memory;
}

export function subscribeConsent(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", onStorage); };
}

export function openConsentSettings(): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}
