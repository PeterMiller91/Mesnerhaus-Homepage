/* ─────────────────────────────────────────────────────────────
   Zentrale Inhalte der Seite. Hier pflegen, nicht in page.tsx.
   ───────────────────────────────────────────────────────────── */

export const TEL_E164    = "+4915111056281";
export const TEL_HREF    = `tel:${TEL_E164}`;
export const TEL_DISPLAY = "0151 110 56 281";
export const WHATSAPP    = "4915111056281"; // wa.me-Format, ohne +
export const EMAIL       = "kontakt@mesnerhausarmesberg.de";

export const ADDRESS = {
  street: "Armesberg 2",
  zip: "95508",
  city: "Kulmain",
  region: "Bayern",
  lat: 49.9147,
  lon: 11.9133,
};
export const ADDRESS_LINE = `${ADDRESS.street}, ${ADDRESS.zip} ${ADDRESS.city}`;

const Q = encodeURIComponent(`Gaststätte Mesnerhaus, ${ADDRESS_LINE}`);
export const MAPS_EMBED  = `https://maps.google.com/maps?q=${Q}&output=embed&hl=de&z=15`;
export const MAPS_LINK   = `https://www.google.com/maps/search/?api=1&query=${Q}`;
export const MAPS_ROUTE  = `https://www.google.com/maps/dir/?api=1&destination=${Q}`;
export const APPLE_ROUTE = `https://maps.apple.com/?daddr=${encodeURIComponent(ADDRESS_LINE)}`;
export const BAHN_LINK   = "https://www.bahn.de/";

/* ── Öffnungszeiten ────────────────────────────────────────────
   Index = Wochentag wie in JavaScript: 0 = Sonntag … 6 = Samstag.
   null = Ruhetag. Zeiten als "HH:MM".
   Stand: Google-Unternehmensprofil, November 2026.               */
export type Slot = { open: string; close: string } | null;
export const OPENING_HOURS: Slot[] = [
  { open: "11:00", close: "17:00" }, // Sonntag
  null,                              // Montag
  null,                              // Dienstag
  null,                              // Mittwoch
  null,                              // Donnerstag
  null,                              // Freitag
  null,                              // Samstag
];

/* Abweichende Tage (Urlaub, Feiertage). Datum "YYYY-MM-DD".
   slot: null = geschlossen, sonst Sonderzeiten.                  */
export const SPECIAL_DAYS: { date: string; slot: Slot; note?: string }[] = [
  // { date: "2026-12-24", slot: null, note: "Heiligabend" },
];

/* Hinweisleiste ganz oben. null = ausgeblendet.                 */
export const NOTICE: string | null = null;

/* ── Google-Bewertungen ────────────────────────────────────────
   Nur echte Rezensionen aus dem Google-Unternehmensprofil eintragen,
   wörtlich übernommen. Solange `rating` null ist, wird kein Sterne-
   Schnitt angezeigt.                                               */
export const GOOGLE_RATING: { rating: number; count: number } | null = null;

/* Link „Bewertung schreiben“ aus dem Google-Profil
   (Profil → „Bewertungen erhalten“, beginnt mit https://g.page/r/…). */
export const GOOGLE_WRITE_REVIEW: string | null = null;
export const GOOGLE_READ_REVIEWS = MAPS_LINK;

export type Review = {
  author: string;   // z. B. "Maria S."
  stars: 1 | 2 | 3 | 4 | 5;
  date: string;     // z. B. "Oktober 2026"
  text: string;     // wörtlich
  reply?: string;   // Antwort des Inhabers, optional
  photo?: { base: string; alt: string }; // /images/<base>-400.webp und -768.webp
};

/* Wörtlich aus Google übernommen (Stand: November 2026). Emojis entfernt,
   Namen auf Vorname + Initial gekürzt.                                   */
export const REVIEWS: Review[] = [
  {
    author: "Michaela N.",
    stars: 4,
    date: "November 2026",
    text: "Wir waren gestern zu einer Geburtstagsfeier dort eingeladen. Ein schnuckeliges kleines Gasthaus. Das Essen war sehr gut und reichlich. Die Bedienung freundlich und flott. Alles in allem ein sehr gelungener schlemmer Abend.",
  },
  {
    author: "Klaus P.",
    stars: 5,
    date: "Oktober 2026",
    text: "Diese Gaststätte kann man nur empfehlen. Hausgemachte Gerichte die man schmeckt. Die hausgemachten Kuchen sind auch sehr zu empfehlen. Das Personal ist sehr freundlich und wir freuen uns schon aufs nächste Mal.",
    photo: { base: "rezension-backfisch", alt: "Gebackenes Fischfilet mit Kartoffelsalat, Remoulade und Salat" },
  },
  {
    author: "H. W.",
    stars: 5,
    date: "Juli 2026",
    text: "Schönes Lokal mit sehr weiter Aussicht. Gutes Essen. Preislich in Ordnung. Im Lokal Bedienung, im Biergarten Selbstbedienung. Pager meldet dann, wenn das Essen abgeholt werden kann.",
  },
  {
    author: "Kerstin S.",
    stars: 5,
    date: "Juni 2026",
    text: "Unbeschreiblich schön, super leckeres Essen ( alles mit viel liebe gekocht , mit heimischen Produkten) , egal was man isst, es ist einfach alles lecker. Zum Abschluss gibt's super leckere Kuchen, Torten, Küchle, Eis...... !!! Super liebe Wirtsleute, die Chefin ist super lieb, die Perle der Küche. Ein super nettes Personal\nDer Biergarten mit dem tollen Ausblick ist einmalig schön , wie Urlaub und auch innen ist es supergemütlich alles mit viel liebe zum Detail eingerichtet.\nEinfach SPITZE\nDANKE DASS ES EUCH GIBT!!!!!",
  },
  {
    author: "Martin A.",
    stars: 5,
    date: "April 2026",
    text: "Wir waren heute zum Kaffee und mega leckeren Kuchen zu Besuch sehr freundlich Personal und Chef und Chefin da fühlt man sich gut aufgehoben und die Aussicht mega sehr zu empfehlen",
  },
  {
    author: "Matthias G.",
    stars: 5,
    date: "Februar 2026",
    text: "Wir waren gestern beim Mittagessen vor Ort. Sehr schön gelegen. Sehr sympathische Wirtsleute. Das Essen war einfach der Hammer. Sehr, sehe lecker, wie bei Oma. Portionen sind ausreichend und die Preise sind sehr fair.\nReservierung ist zu empfehlen.\nDanke für Eure Gastfreundschaft.\nWIR KOMMEN WIEDER!",
  },
];

/* Speisekarte als PDF — wird über den Telegram-Bot hochgeladen
   (siehe server/README.md) und von speisekarte.php ausgeliefert.  */
export const MENU_PDF_URL = "/speisekarte.php";
