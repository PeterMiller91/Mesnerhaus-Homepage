import Image from "next/image";
import MobileMenu from "@/components/MobileMenu";

/* ─── helpers ───────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-[0.3em] uppercase text-[var(--color-brand)] mb-3">
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 my-4">
      <span className="flex-1 h-px bg-[var(--color-line)]" />
      <Image src="/logo-icon.svg" alt="" width={26} height={26} />
      <span className="flex-1 h-px bg-[var(--color-line)]" />
    </div>
  );
}

/* ─── data ───────────────────────────────────────────── */

const menuItems = [
  {
    category: "Vorspeisen",
    items: [
      { name: "Obatzda mit Breze", desc: "Hausgemachter Obatzda, frische Breze, Radieschen", highlight: false },
      { name: "Bauernbrot & Schmalz", desc: "Knuspriges Landbrot, selbst gemachter Griebenschmalz", highlight: false },
    ],
  },
  {
    category: "Hauptgerichte",
    items: [
      { name: "Schweinshaxe", desc: "Knusprig gebraten, mit Sauerkraut und Semmelknödel", highlight: false },
      { name: "Bauernente", desc: "Aus dem Ofen, mit Rotkraut und Kartoffelknödel", highlight: true },
      { name: "Schnitzel Wiener Art", desc: "Mit Kartoffelsalat oder Pommes, Preiselbeeren", highlight: false },
      { name: "Forellenfilet", desc: "Aus heimischen Gewässern, Buttergemüse und Salzkartoffeln", highlight: false },
    ],
  },
  {
    category: "Süßes",
    items: [
      { name: "Kaiserschmarrn", desc: "Fluffig und goldgelb, mit Zwetschgenkompott", highlight: false },
      { name: "Apfelstrudel", desc: "Warm, mit Vanillesoße oder Sahne", highlight: false },
    ],
  },
];

const hours = [
  { day: "Montag", time: "Ruhetag" },
  { day: "Dienstag", time: "Ruhetag" },
  { day: "Mittwoch – Freitag", time: "11:00 – 20:00 Uhr" },
  { day: "Samstag", time: "10:00 – 21:00 Uhr" },
  { day: "Sonntag & Feiertag", time: "10:00 – 20:00 Uhr" },
];

/* ─── page ───────────────────────────────────────────── */

export default function Home() {
  return (
    <>
      {/* ── NAV ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/92 backdrop-blur-md border-b border-[var(--color-line)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2.5">
            <Image src="/logo-icon.svg" alt="Mesnerhaus" width={34} height={34} />
            <span
              className="text-[1.6rem] leading-none"
              style={{ fontFamily: "var(--font-great-vibes)", color: "var(--color-brand)" }}
            >
              Mesnerhaus
            </span>
          </a>

          {/* desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-bold text-[var(--color-mid)] tracking-wide">
            <a href="#about"    className="hover:text-[var(--color-brand)] transition-colors">Über uns</a>
            <a href="#menu"     className="hover:text-[var(--color-brand)] transition-colors">Speisekarte</a>
            <a href="#hours"    className="hover:text-[var(--color-brand)] transition-colors">Öffnungszeiten</a>
            <a href="#location" className="hover:text-[var(--color-brand)] transition-colors">Anfahrt</a>
            <a
              href="tel:+4900000000"
              className="px-4 py-2 rounded-full bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] transition-colors"
            >
              Reservieren
            </a>
          </nav>

          {/* mobile hamburger */}
          <MobileMenu />
        </div>
      </header>

      <main>
        {/* ── HERO ────────────────────────────────────── */}
        <section
          id="hero"
          className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 overflow-hidden"
        >
          {/* responsive hero background */}
          <picture className="absolute inset-0 -z-10">
            <source media="(min-width: 1400px)" srcSet="/images/panorama-1920.webp" />
            <source media="(min-width: 900px)"  srcSet="/images/panorama-1400.webp" />
            <source media="(min-width: 480px)"  srcSet="/images/panorama-900.webp" />
            <img
              src="/images/panorama-480.webp"
              alt=""
              className="w-full h-full object-cover object-center"
              fetchPriority="high"
            />
          </picture>
          {/* dark gradient overlay for text readability */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />

          {/* logo mark */}
          <div className="mb-5 md:mb-6">
            <Image
              src="/logo-icon.svg"
              alt="Mesnerhaus Bildmarke"
              width={80}
              height={80}
              className="mx-auto md:w-[100px] md:h-[100px]"
              style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,.45))" }}
              priority
            />
          </div>

          {/* wordmark */}
          <h1
            className="text-[4.5rem] md:text-8xl lg:text-9xl leading-none text-white drop-shadow-lg mb-2"
            style={{ fontFamily: "var(--font-great-vibes)" }}
          >
            Mesnerhaus
          </h1>

          {/* subtitle */}
          <div className="flex items-center gap-3 mb-7 md:mb-8">
            <span className="w-8 md:w-12 h-px bg-white/50" />
            <p className="text-[0.65rem] md:text-sm font-bold tracking-[0.3em] md:tracking-[0.35em] uppercase text-white/85">
              Ausflugsgaststätte am Armesberg
            </p>
            <span className="w-8 md:w-12 h-px bg-white/50" />
          </div>

          {/* claim */}
          <p
            className="text-base md:text-xl text-white/75 italic max-w-sm md:max-w-md mb-9 md:mb-10"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Bodenständig gut. Hoch oben am Berg.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
            <a
              href="#menu"
              className="px-8 py-3.5 rounded-full bg-white text-[var(--color-brand-dark)] font-bold text-sm tracking-wide hover:bg-[var(--color-brand-pale)] transition-colors shadow-lg text-center"
            >
              Zur Speisekarte
            </a>
            <a
              href="#location"
              className="px-8 py-3.5 rounded-full border-2 border-white/60 text-white font-bold text-sm tracking-wide hover:bg-white/15 transition-colors text-center"
            >
              So finden Sie uns
            </a>
          </div>

          {/* scroll hint — hidden on very small screens */}
          <div className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 text-white/50">
            <span className="text-[0.6rem] tracking-widest uppercase">Entdecken</span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="animate-bounce">
              <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </section>

        {/* ── ABOUT ───────────────────────────────────── */}
        <section id="about" className="py-16 md:py-24 px-5 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* image first on mobile */}
            <div className="relative order-first md:order-last">
              <picture>
                <source media="(min-width: 800px)" srcSet="/images/terrasse-800.webp" />
                <img
                  src="/images/terrasse-480.webp"
                  alt="Die Terrasse des Mesnerhaus am Armesberg"
                  className="w-full rounded-2xl shadow-lg object-cover aspect-[4/3]"
                  loading="lazy"
                  width={800}
                  height={600}
                />
              </picture>
              {/* decorative badge */}
              <div
                className="absolute -bottom-5 -right-3 md:-bottom-6 md:-left-6 md:right-auto w-24 h-24 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-white"
                style={{ background: "var(--color-brand)" }}
              >
                <span className="text-white text-[0.6rem] font-bold tracking-widest uppercase text-center leading-tight">
                  Am<br />Armesberg
                </span>
              </div>
            </div>

            <div className="order-last md:order-first">
              <SectionLabel>Herzlich Willkommen</SectionLabel>
              <h2
                className="text-3xl md:text-5xl text-[var(--color-dark)] mb-4 md:mb-6 leading-tight"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Rast mit Aussicht
              </h2>
              <Divider />
              <div className="mt-5 space-y-4 text-[var(--color-mid)] leading-relaxed text-sm md:text-base">
                <p>
                  Das Mesnerhaus liegt idyllisch unterhalb der Dreifaltigkeitskirche am Armesberg —
                  ein Ziel für Wanderer, Ausflügler und alle, die echte Hausmannskost schätzen.
                </p>
                <p>
                  Seit Generationen kochen wir mit dem, was die Region hergibt: frische Zutaten,
                  bewährte Rezepte und die Ruhe eines Ortes, der noch weiß, was wirklich zählt.
                </p>
                <p>
                  Ob nach einer Wanderung über den Armesberg oder als Ausflug am Wochenende —
                  bei uns finden Sie Kraft, Wärme und ehrliches Essen.
                </p>
              </div>
              <a
                href="#menu"
                className="inline-block mt-7 md:mt-8 px-6 py-3.5 bg-[var(--color-brand)] text-white rounded-full text-sm font-bold tracking-wide hover:bg-[var(--color-brand-dark)] transition-colors"
              >
                Unsere Küche entdecken
              </a>
            </div>
          </div>
        </section>

        {/* ── MENU ────────────────────────────────────── */}
        <section id="menu" className="py-16 md:py-24 px-5 bg-[var(--color-brand-pale)]">
          <div className="max-w-6xl mx-auto">
            {/* header + food photos side by side on desktop */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
              <div>
                <SectionLabel>Unsere Küche</SectionLabel>
                <h2
                  className="text-3xl md:text-5xl text-[var(--color-dark)]"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Hausgemacht & regional
                </h2>
              </div>
              {/* food preview photos */}
              <div className="flex gap-3 shrink-0">
                <picture>
                  <source srcSet="/images/essen1-800.webp" media="(min-width:600px)" />
                  <img
                    src="/images/essen1-480.webp"
                    alt="Hausgemachte Küche"
                    className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl shadow-md"
                    loading="lazy"
                    width={128}
                    height={128}
                  />
                </picture>
                <picture>
                  <source srcSet="/images/essen2-800.webp" media="(min-width:600px)" />
                  <img
                    src="/images/essen2-480.webp"
                    alt="Bratkartoffeln und Braten"
                    className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl shadow-md"
                    loading="lazy"
                    width={128}
                    height={128}
                  />
                </picture>
              </div>
            </div>

            <p className="text-[var(--color-mid)] max-w-xl mb-8 md:mb-10 text-sm md:text-base">
              Bodenständige bayerische Küche — täglich frisch, mit regionalen Zutaten.
              Die Speisekarte wechselt saisonal.
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
              {menuItems.map((cat) => (
                <div
                  key={cat.category}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--color-line)]"
                >
                  <div className="px-5 py-3.5" style={{ background: "var(--color-brand)" }}>
                    <h3 className="text-white font-bold tracking-wide text-sm uppercase">
                      {cat.category}
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    {cat.items.map((item) => (
                      <div
                        key={item.name}
                        className={`pb-4 border-b border-[var(--color-line)] last:border-0 last:pb-0 ${
                          item.highlight ? "pl-3 border-l-2 border-[var(--color-brand)]" : ""
                        }`}
                      >
                        <p className="font-bold text-[var(--color-dark)] mb-0.5 text-sm md:text-base">{item.name}</p>
                        <p className="text-xs md:text-sm text-[var(--color-muted)] leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs md:text-sm text-[var(--color-muted)] mt-8">
              Tageskarte und saisonale Angebote direkt im Haus oder auf Anfrage.
            </p>
          </div>
        </section>

        {/* ── ATMOSPHERE STRIP ────────────────────────── */}
        <section className="relative py-20 md:py-28 px-5 text-center overflow-hidden">
          {/* abend photo as background */}
          <picture className="absolute inset-0 -z-10">
            <source media="(min-width: 800px)" srcSet="/images/abend-1200.webp" />
            <source media="(min-width: 480px)" srcSet="/images/abend-800.webp" />
            <img
              src="/images/abend-480.webp"
              alt=""
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          </picture>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

          <h2
            className="text-5xl md:text-7xl text-white mb-3 drop-shadow-lg"
            style={{ fontFamily: "var(--font-great-vibes)" }}
          >
            Bodenständig gut.
          </h2>
          <p className="text-white/75 tracking-[0.25em] md:tracking-[0.3em] uppercase text-[0.65rem] md:text-xs font-bold">
            Hoch oben am Berg — Armesberg, Bayern
          </p>
        </section>

        {/* ── HOURS + CONTACT ─────────────────────────── */}
        <section id="hours" className="py-16 md:py-24 px-5 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16">
            {/* hours */}
            <div>
              <SectionLabel>Öffnungszeiten</SectionLabel>
              <h2
                className="text-2xl md:text-4xl text-[var(--color-dark)] mb-7 md:mb-8"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Wann wir für Sie da sind
              </h2>
              <div className="space-y-0">
                {hours.map(({ day, time }) => (
                  <div
                    key={day}
                    className="flex justify-between items-center py-3.5 border-b border-[var(--color-line)]"
                  >
                    <span className="font-bold text-[var(--color-dark)] text-sm">{day}</span>
                    <span
                      className={`text-sm ${
                        time === "Ruhetag"
                          ? "text-[var(--color-muted)] italic"
                          : "text-[var(--color-brand-dark)] font-bold"
                      }`}
                    >
                      {time}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-[var(--color-muted)] leading-relaxed">
                Feiertage können abweichen. Für Gruppen ab 10 Personen bitten wir um Voranmeldung.
              </p>
            </div>

            {/* contact */}
            <div>
              <SectionLabel>Reservierung & Kontakt</SectionLabel>
              <h2
                className="text-2xl md:text-4xl text-[var(--color-dark)] mb-7 md:mb-8"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Tisch reservieren
              </h2>
              <div className="space-y-3 mb-7">
                <a
                  href="tel:+4900000000"
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-pale)] transition-colors group"
                >
                  <span className="w-10 h-10 shrink-0 rounded-full bg-[var(--color-brand-pale)] flex items-center justify-center group-hover:bg-[var(--color-brand)] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--color-brand)] group-hover:text-white transition-colors" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.5 1.21 2 2 0 012.49-.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide font-bold">Telefon</p>
                    <p className="font-bold text-[var(--color-dark)] text-sm md:text-base">+49 (0) 00 00 / 00 00</p>
                  </div>
                </a>
                <a
                  href="mailto:info@mesnerhaus.de"
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-pale)] transition-colors group"
                >
                  <span className="w-10 h-10 shrink-0 rounded-full bg-[var(--color-brand-pale)] flex items-center justify-center group-hover:bg-[var(--color-brand)] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--color-brand)] group-hover:text-white transition-colors" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide font-bold">E-Mail</p>
                    <p className="font-bold text-[var(--color-dark)] text-sm md:text-base">info@mesnerhaus.de</p>
                  </div>
                </a>
              </div>
              <div className="p-4 md:p-5 rounded-xl bg-[var(--color-brand-pale)] border border-[var(--color-brand-light)]">
                <p className="text-sm text-[var(--color-mid)] leading-relaxed">
                  <strong className="text-[var(--color-brand-dark)]">Gruppen & Feiern:</strong><br />
                  Für Betriebsfeiern, Familienfeste oder Wandergruppen stehen Ihnen unsere Gasträume
                  auch exklusiv zur Verfügung. Sprechen Sie uns gerne an.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOCATION ────────────────────────────────── */}
        <section id="location" className="py-16 md:py-24 px-5 bg-[var(--color-brand-pale)]">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <div>
              <SectionLabel>Anfahrt</SectionLabel>
              <h2
                className="text-2xl md:text-4xl text-[var(--color-dark)] mb-6"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                So finden Sie uns
              </h2>
              <div className="space-y-5 text-[var(--color-mid)] leading-relaxed mb-8">
                <div className="flex gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-[var(--color-brand)]" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="text-sm md:text-base">
                    <p className="font-bold text-[var(--color-dark)]">Mesnerhaus</p>
                    <p>Armesberg [Nr.], 93xxx Ort</p>
                    <p className="text-xs md:text-sm mt-0.5">Unterhalb der Dreifaltigkeitskirche</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-[var(--color-brand)]" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div className="text-sm md:text-base">
                    <p className="font-bold text-[var(--color-dark)]">Fahrzeit ab Schwandorf</p>
                    <p>ca. 20 Minuten</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-[var(--color-brand)]" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <div className="text-sm md:text-base">
                    <p className="font-bold text-[var(--color-dark)]">Parken</p>
                    <p>Kostenfreier Parkplatz direkt am Haus</p>
                  </div>
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Armesberg+Bayern"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--color-brand)] text-white rounded-full text-sm font-bold hover:bg-[var(--color-brand-dark)] transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                In Google Maps öffnen
              </a>
            </div>

            {/* panorama thumb as map placeholder */}
            <div className="rounded-2xl overflow-hidden shadow-lg aspect-[4/3]">
              <picture>
                <source media="(min-width: 800px)" srcSet="/images/panorama-1400.webp" />
                <source media="(min-width: 480px)" srcSet="/images/panorama-900.webp" />
                <img
                  src="/images/panorama-480.webp"
                  alt="Blick vom Armesberg"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={800}
                  height={600}
                />
              </picture>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer
        className="py-14 md:py-16 px-5 text-white/80"
        style={{ background: "linear-gradient(135deg, #2d4a0e 0%, #3d6318 60%, #527a1f 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 pb-10 border-b border-white/20">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo-icon.svg" alt="" width={38} height={38} />
                <span
                  className="text-3xl text-white"
                  style={{ fontFamily: "var(--font-great-vibes)" }}
                >
                  Mesnerhaus
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Ausflugsgaststätte am Armesberg.<br />
                Bodenständig gut. Hoch oben am Berg.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4">Navigation</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "Über uns",       href: "#about" },
                  { label: "Speisekarte",    href: "#menu" },
                  { label: "Öffnungszeiten", href: "#hours" },
                  { label: "Anfahrt",        href: "#location" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-white transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4">Kontakt</h4>
              <address className="not-italic text-sm space-y-1 text-white/70">
                <p>Armesberg [Nr.]</p>
                <p>93xxx Ort</p>
                <p className="mt-3">
                  <a href="tel:+4900000000" className="hover:text-white transition-colors">
                    +49 (0) 00 00 / 00 00
                  </a>
                </p>
                <p>
                  <a href="mailto:info@mesnerhaus.de" className="hover:text-white transition-colors">
                    info@mesnerhaus.de
                  </a>
                </p>
              </address>
            </div>
          </div>

          <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© 2025 Mesnerhaus am Armesberg</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white/70 transition-colors">Impressum</a>
              <a href="#" className="hover:text-white/70 transition-colors">Datenschutz</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
