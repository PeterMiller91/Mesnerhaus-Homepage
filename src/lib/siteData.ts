/* Inhalte aus der Verwaltung („Website“): Saison-Effekt, Sonderkarten, Galerie.
   Eine Anfrage pro Seitenaufruf an den eigenen Server (/site.php), von allen Komponenten geteilt. */

export type SiteEffect = { type: "schnee" | "laub" | "blueten"; intensity: "leicht" | "mittel" | "stark" };
export type SiteSpecial = { id: string; title: string; text: string; from: string; to: string; pdf: string; image: string };
export type SiteGalleryItem = { id: string; alt: string; caption: string; wide: boolean; pos: string; small: string; large: string };
export type SiteData = { effect: SiteEffect | null; specials: SiteSpecial[]; gallery: SiteGalleryItem[] | null };

let pending: Promise<SiteData | null> | null = null;

export function loadSiteData(): Promise<SiteData | null> {
  if (!pending) {
    pending = fetch("/site.php", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j && j.ok ? (j as SiteData) : null))
      .catch(() => null);
  }
  return pending;
}
