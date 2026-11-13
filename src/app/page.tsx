import Image from "next/image";

function Divider() {
  return (
    <div className="flex items-center gap-4 my-2">
      <span className="flex-1 h-px bg-[var(--color-line)]" />
      <Image src="/logo-icon.svg" alt="" width={28} height={28} />
      <span className="flex-1 h-px bg-[var(--color-line)]" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-[0.3em] uppercase text-[var(--color-brand)] mb-3">
      {children}
    </p>
  );
}

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

export default function Home() {
  return (
    <>
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--color-line)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3">
            <Image src="/logo-icon.svg" alt="Mesnerhaus Logo" width={36} height={36} />
            <span
              className="text-2xl leading-none"
              style={{ fontFamily: "var(--font-great-vibes)", color: "var(--color-brand)" }}
            >
              Mesnerhaus
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-[var(--color-mid)] tracking-wide">
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
        </div>
      </header>

      <main>
        {/* HERO */}
        <section
          id="hero"
          className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        >
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(160deg, #2d4a0e 0%, #3d6318 30%, #527a1f 55%, #6a9428 80%, #8db43a 100%)",
            }}
          />
          <div
            className="absolute inset-0 -z-10 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,.12) 0%, transparent 70%)",
            }}
          />

          <div className="mb-6">
            <Image
              src="/logo-icon.svg"
              alt="Mesnerhaus Bildmarke"
              width={100}
              height={100}
              className="mx-auto"
              style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,.35))" }}
            />
          </div>

          <h1
            className="text-7xl md:text-9xl leading-none text-white drop-shadow-lg mb-2"
            style={{ fontFamily: "var(--font-great-vibes)" }}
          >
            Mesnerhaus
          </h1>

          <div className="flex items-center gap-4 mb-8">
            <span className="w-12 h-px bg-white/50" />
            <p className="text-xs md:text-sm font-bold tracking-[0.35em] uppercase text-white/80">
              Ausflugsgaststätte am Armesberg
            </p>
            <span className="w-12 h-px bg-white/50" />
          </div>

          <p
            className="text-lg md:text-xl text-white/70 italic max-w-md mb-10"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Bodenständig gut. Hoch oben am Berg.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#menu"
              className="px-8 py-3 rounded-full bg-white text-[var(--color-brand-dark)] font-bold text-sm tracking-wide hover:bg-[var(--color-brand-pale)] transition-colors shadow-lg"
            >
              Zur Speisekarte
            </a>
            <a
              href="#location"
              className="px-8 py-3 rounded-full border-2 border-white/60 text-white font-bold text-sm tracking-wide hover:bg-white/10 transition-colors"
            >
              So finden Sie uns
            </a>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
            <span className="text-xs tracking-widest uppercase">Entdecken</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="animate-bounce">
              <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <SectionLabel>Herzlich Willkommen</SectionLabel>
              <h2
                className="text-4xl md:text-5xl text-[var(--color-dark)] mb-6 leading-tight"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Rast mit Aussicht
              </h2>
              <Divider />
              <div className="mt-6 space-y-4 text-[var(--color-mid)] leading-relaxed">
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
                className="inline-block mt-8 px-6 py-3 bg-[var(--color-brand)] text-white rounded-full text-sm font-bold tracking-wide hover:bg-[var(--color-brand-dark)] transition-colors"
              >
                Unsere Küche entdecken
              </a>
            </div>

            <div className="relative">
              <div
                className="aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #C6DC80 0%, #8DB43A 50%, #527A1F 100%)",
                }}
              >
                <div className="text-center text-white/70 p-8">
                  <Image src="/logo-icon.svg" alt="" width={64} height={64} className="mx-auto mb-4 opacity-60" />
                  <p className="text-sm tracking-widest uppercase opacity-70">Foto folgt</p>
                </div>
              </div>
              <div
                className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-white"
                style={{ background: "var(--color-brand)" }}
              >
                <span className="text-white text-xs font-bold tracking-widest uppercase text-center leading-tight">
                  Seit<br />Jahren
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MENU */}
        <section id="menu" className="py-24 px-6 bg-[var(--color-brand-pale)]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <SectionLabel>Unsere Küche</SectionLabel>
              <h2
                className="text-4xl md:text-5xl text-[var(--color-dark)] mb-4"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Hausgemacht & regional
              </h2>
              <p className="text-[var(--color-mid)] max-w-xl mx-auto">
                Bodenständige bayerische Küche — täglich frisch, mit regionalen Zutaten.
                Die Speisekarte wechselt saisonal.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {menuItems.map((cat) => (
                <div
                  key={cat.category}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--color-line)]"
                >
                  <div
                    className="px-6 py-4 border-b border-[var(--color-line)]"
                    style={{ background: "var(--color-brand)" }}
                  >
                    <h3 className="text-white font-bold tracking-wide text-sm uppercase">
                      {cat.category}
                    </h3>
                  </div>
                  <div className="p-6 space-y-5">
                    {cat.items.map((item) => (
                      <div
                        key={item.name}
                        className={`pb-5 border-b border-[var(--color-line)] last:border-0 last:pb-0 ${
                          item.highlight ? "pl-3 border-l-2 border-[var(--color-brand)]" : ""
                        }`}
                      >
                        <p className="font-bold text-[var(--color-dark)] mb-1">{item.name}</p>
                        <p className="text-sm text-[var(--color-muted)] leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-[var(--color-muted)] mt-10">
              Tageskarte und saisonale Angebote direkt im Haus oder auf Anfrage.
            </p>
          </div>
        </section>

        {/* ATMOSPHERE STRIP */}
        <section
          className="py-20 px-6 text-center"
          style={{
            background:
              "linear-gradient(135deg, #2d4a0e 0%, #3d6318 40%, #527a1f 70%, #8db43a 100%)",
          }}
        >
          <h2
            className="text-5xl md:text-7xl text-white mb-4 drop-shadow"
            style={{ fontFamily: "var(--font-great-vibes)" }}
          >
            Bodenständig gut.
          </h2>
          <p className="text-white/70 tracking-[0.3em] uppercase text-xs font-bold">
            Hoch oben am Berg — Armesberg, Bayern
          </p>
        </section>

        {/* HOURS + CONTACT */}
        <section id="hours" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
            <div>
              <SectionLabel>Öffnungszeiten</SectionLabel>
              <h2
                className="text-3xl md:text-4xl text-[var(--color-dark)] mb-8"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Wann wir für Sie da sind
              </h2>
              <div className="space-y-3">
                {hours.map(({ day, time }) => (
                  <div
                    key={day}
                    className="flex justify-between items-center py-3 border-b border-[var(--color-line)]"
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
              <p className="mt-6 text-xs text-[var(--color-muted)]">
                Feiertage können abweichen. Für Gruppen ab 10 Personen bitten wir um Voranmeldung.
              </p>
            </div>

            <div>
              <SectionLabel>Reservierung & Kontakt</SectionLabel>
              <h2
                className="text-3xl md:text-4xl text-[var(--color-dark)] mb-8"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Tisch reservieren
              </h2>
              <div className="space-y-4 mb-8">
                <a
                  href="tel:+4900000000"
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-pale)] transition-colors group"
                >
                  <span className="w-10 h-10 rounded-full bg-[var(--color-brand-pale)] flex items-center justify-center group-hover:bg-[var(--color-brand)] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[var(--color-brand)] group-hover:text-white transition-colors" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.5 1.21 2 2 0 012.49-.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide font-bold">Telefon</p>
                    <p className="font-bold text-[var(--color-dark)]">+49 (0) 00 00 / 00 00</p>
                  </div>
                </a>
                <a
                  href="mailto:info@mesnerhaus.de"
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-pale)] transition-colors group"
                >
                  <span className="w-10 h-10 rounded-full bg-[var(--color-brand-pale)] flex items-center justify-center group-hover:bg-[var(--color-brand)] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[var(--color-brand)] group-hover:text-white transition-colors" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide font-bold">E-Mail</p>
                    <p className="font-bold text-[var(--color-dark)]">info@mesnerhaus.de</p>
                  </div>
                </a>
              </div>
              <div className="p-5 rounded-xl bg-[var(--color-brand-pale)] border border-[var(--color-brand-light)]">
                <p className="text-sm text-[var(--color-mid)] leading-relaxed">
                  <strong className="text-[var(--color-brand-dark)]">Gruppen & Feiern:</strong><br />
                  Für Betriebsfeiern, Familienfeste oder Wandergruppen stehen Ihnen unsere Gasträume
                  auch exklusiv zur Verfügung. Sprechen Sie uns gerne an.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* LOCATION */}
        <section id="location" className="py-24 px-6 bg-[var(--color-brand-pale)]">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div>
              <SectionLabel>Anfahrt</SectionLabel>
              <h2
                className="text-3xl md:text-4xl text-[var(--color-dark)] mb-6"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                So finden Sie uns
              </h2>
              <div className="space-y-4 text-[var(--color-mid)] leading-relaxed mb-8">
                <div className="flex gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-[var(--color-brand)]" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>
                    <p className="font-bold text-[var(--color-dark)]">Mesnerhaus</p>
                    <p>Armesberg [Nr.], 93xxx Ort</p>
                    <p className="text-sm">Unterhalb der Dreifaltigkeitskirche</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-[var(--color-brand)]" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div>
                    <p className="font-bold text-[var(--color-dark)]">Fahrzeit ab Schwandorf</p>
                    <p>ca. 20 Minuten</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-[var(--color-brand)]" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <div>
                    <p className="font-bold text-[var(--color-dark)]">Parken</p>
                    <p>Kostenfreier Parkplatz direkt am Haus</p>
                  </div>
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Armesberg+Bayern"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand)] text-white rounded-full text-sm font-bold hover:bg-[var(--color-brand-dark)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                In Google Maps öffnen
              </a>
            </div>

            <div
              className="aspect-square rounded-2xl overflow-hidden flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #C6DC80, #8DB43A)" }}
            >
              <div className="text-center text-white/80 p-8">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-sm tracking-widest uppercase opacity-80">Kartenansicht</p>
                <p className="text-xs opacity-60 mt-1">Armesberg, Bayern</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer
        className="py-16 px-6 text-white/80"
        style={{ background: "linear-gradient(135deg, #2d4a0e 0%, #3d6318 60%, #527a1f 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-white/20">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo-icon.svg" alt="" width={40} height={40} />
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
              <ul className="space-y-2 text-sm">
                {[
                  { label: "Über uns", href: "#about" },
                  { label: "Speisekarte", href: "#menu" },
                  { label: "Öffnungszeiten", href: "#hours" },
                  { label: "Anfahrt", href: "#location" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-white transition-colors">
                      {label}
                    </a>
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

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
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
