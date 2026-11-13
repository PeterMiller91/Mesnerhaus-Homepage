import Image from "next/image";
import NavScrolled from "@/components/NavScrolled";
import ParallaxBg from "@/components/ParallaxBg";
import ScrollReveal from "@/components/ScrollReveal";
import FloatingCTA from "@/components/FloatingCTA";

/* ─── small server-side helpers ─────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-[0.3em] uppercase text-[var(--color-brand)] mb-3">
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 my-5">
      <span className="flex-1 h-px bg-[var(--color-line)]" />
      <Image src="/logo-icon.svg" alt="" width={24} height={24} />
      <span className="flex-1 h-px bg-[var(--color-line)]" />
    </div>
  );
}

/* SVG wave divider pointing downward */
function WaveDown({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative -mt-1 leading-none" style={{ background: to }}>
      <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full block" style={{ fill: from }}>
        <path d="M0,0 C360,56 1080,56 1440,0 L1440,0 L0,0 Z" />
      </svg>
    </div>
  );
}

/* SVG mountain-silhouette divider */
function MountainDivider({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative leading-none" style={{ background: to }}>
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full block" style={{ fill: from }}>
        <path d="M0,80 L0,60 L180,20 L300,50 L420,10 L540,45 L660,0 L780,38 L900,8 L1020,42 L1140,15 L1260,48 L1440,20 L1440,80 Z" />
      </svg>
    </div>
  );
}

/* ─── data ───────────────────────────────────────────── */

const stats = [
  { value: "731 m", label: "Höhe über NN" },
  { value: "Seit\nGenerationen", label: "Familienbetrieb" },
  { value: "Bayerische\nKüche", label: "Täglich frisch" },
];

const menuItems = [
  {
    category: "Vorspeisen",
    items: [
      { name: "Obatzda mit Breze",   desc: "Hausgemachter Obatzda, frische Breze, Radieschen",                    highlight: false },
      { name: "Bauernbrot & Schmalz", desc: "Knuspriges Landbrot, selbst gemachter Griebenschmalz",               highlight: false },
    ],
  },
  {
    category: "Hauptgerichte",
    items: [
      { name: "Schweinshaxe",        desc: "Knusprig gebraten, mit Sauerkraut und Semmelknödel",                   highlight: false },
      { name: "Bauernente",          desc: "Aus dem Ofen, mit Rotkraut und Kartoffelknödel",                       highlight: true  },
      { name: "Schnitzel Wiener Art", desc: "Mit Kartoffelsalat oder Pommes, Preiselbeeren",                       highlight: false },
      { name: "Forellenfilet",       desc: "Aus heimischen Gewässern, Buttergemüse und Salzkartoffeln",            highlight: false },
    ],
  },
  {
    category: "Süßes",
    items: [
      { name: "Kaiserschmarrn",      desc: "Fluffig und goldgelb, mit Zwetschgenkompott",                          highlight: false },
      { name: "Apfelstrudel",        desc: "Warm, mit Vanillesoße oder Sahne",                                     highlight: false },
    ],
  },
];

const hours = [
  { day: "Montag",             time: "Ruhetag" },
  { day: "Dienstag",           time: "Ruhetag" },
  { day: "Mittwoch – Freitag", time: "11:00 – 20:00 Uhr" },
  { day: "Samstag",            time: "10:00 – 21:00 Uhr" },
  { day: "Sonntag & Feiertag", time: "10:00 – 20:00 Uhr" },
];

/* ─── page ───────────────────────────────────────────── */

export default function Home() {
  return (
    <>
      <NavScrolled />
      <FloatingCTA />

      <main>

        {/* ════════════ HERO ════════════════════════════ */}
        <section
          id="hero"
          className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 overflow-hidden"
        >
          {/* parallax background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <ParallaxBg factor={0.25} className="absolute -inset-y-24 inset-x-0">
              <picture>
                <source media="(min-width:1400px)" srcSet="/images/panorama-1920.webp" />
                <source media="(min-width:900px)"  srcSet="/images/panorama-1400.webp" />
                <source media="(min-width:480px)"  srcSet="/images/panorama-900.webp"  />
                <img
                  src="/images/panorama-480.webp"
                  alt=""
                  className="w-full h-full object-cover object-center"
                  fetchPriority="high"
                />
              </picture>
            </ParallaxBg>
          </div>

          {/* layered overlays for depth */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
          {/* subtle vignette */}
          <div className="absolute inset-0 -z-10" style={{
            background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,.35) 100%)"
          }} />

          {/* content */}
          <div className="hero-logo mb-5 md:mb-7">
            <Image
              src="/logo-icon.svg"
              alt="Mesnerhaus Bildmarke"
              width={88}
              height={88}
              className="mx-auto md:w-[108px] md:h-[108px]"
              style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,.5))" }}
              priority
            />
          </div>

          <h1
            className="hero-title text-[4.2rem] md:text-[7rem] lg:text-[9rem] leading-none text-white drop-shadow-xl mb-3"
            style={{ fontFamily: "var(--font-great-vibes)", textShadow: "0 4px 24px rgba(0,0,0,.4)" }}
          >
            Mesnerhaus
          </h1>

          <div className="hero-line flex items-center gap-3 mb-7 md:mb-9">
            <span className="w-10 md:w-14 h-px bg-white/55" />
            <p className="text-[0.6rem] md:text-xs font-bold tracking-[0.3em] md:tracking-[0.4em] uppercase text-white/85">
              Ausflugsgaststätte am Armesberg
            </p>
            <span className="w-10 md:w-14 h-px bg-white/55" />
          </div>

          <p
            className="hero-claim text-base md:text-xl text-white/80 italic max-w-xs md:max-w-md mb-9 md:mb-11"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Bodenständig gut. Hoch oben am Berg.
          </p>

          <div className="hero-ctas flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
            <a
              href="#menu"
              className="px-9 py-4 rounded-full bg-white text-[var(--color-brand-dark)] font-bold text-sm tracking-wide hover:bg-[var(--color-brand-pale)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-center"
            >
              Zur Speisekarte
            </a>
            <a
              href="#location"
              className="px-9 py-4 rounded-full border-2 border-white/55 text-white font-bold text-sm tracking-wide hover:bg-white/15 hover:border-white/80 transition-all duration-300 text-center"
            >
              So finden Sie uns
            </a>
          </div>

          <div className="hero-scroll hidden sm:flex absolute bottom-9 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-white/50">
            <span className="text-[0.55rem] tracking-[0.3em] uppercase">Entdecken</span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="animate-bounce">
              <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </section>

        {/* wave from hero to stats */}
        <WaveDown from="#000000" to="#2d4a0e" />

        {/* ════════════ STATS STRIP ═════════════════════ */}
        <section className="py-14 md:py-16 px-5" style={{ background: "linear-gradient(135deg, #2d4a0e 0%, #3d6318 50%, #527a1f 100%)" }}>
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 md:gap-8">
            {stats.map(({ value, label }, i) => (
              <ScrollReveal key={label} delay={i * 120} className="text-center">
                <p
                  className="text-2xl md:text-4xl font-bold text-white leading-tight mb-1 whitespace-pre-line"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {value}
                </p>
                <p className="text-[0.6rem] md:text-xs font-bold tracking-[0.2em] uppercase text-white/55">
                  {label}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* mountain divider: stats → about */}
        <MountainDivider from="#527a1f" to="white" />

        {/* ════════════ ABOUT ═══════════════════════════ */}
        <section id="about" className="py-16 md:py-24 px-5 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">

            {/* image */}
            <ScrollReveal direction="left" className="order-first md:order-last relative">
              <div className="img-zoom-wrap rounded-2xl shadow-xl overflow-hidden aspect-[4/3]">
                <picture>
                  <source media="(min-width:800px)" srcSet="/images/terrasse-800.webp" />
                  <img
                    src="/images/terrasse-480.webp"
                    alt="Die Terrasse des Mesnerhaus"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={800} height={600}
                  />
                </picture>
              </div>
              {/* floating badge */}
              <div
                className="float-badge absolute -bottom-5 -right-3 md:-bottom-7 md:-right-7 w-24 h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white"
                style={{ background: "var(--color-brand)", boxShadow: "0 12px 32px rgba(141,180,58,.4)" }}
              >
                <span className="text-white text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest uppercase text-center leading-tight px-2">
                  Direkt am<br />Armesberg
                </span>
              </div>
            </ScrollReveal>

            {/* text */}
            <div className="order-last md:order-first">
              <ScrollReveal delay={100}>
                <SectionLabel>Herzlich Willkommen</SectionLabel>
              </ScrollReveal>
              <ScrollReveal delay={180}>
                <h2
                  className="text-3xl md:text-5xl text-[var(--color-dark)] mb-4 leading-tight"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Rast mit Aussicht
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={240}>
                <Divider />
              </ScrollReveal>
              <ScrollReveal delay={300} className="mt-5 space-y-4 text-[var(--color-mid)] leading-relaxed text-sm md:text-base">
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
              </ScrollReveal>
              <ScrollReveal delay={400}>
                <a
                  href="#menu"
                  className="inline-block mt-7 px-7 py-3.5 bg-[var(--color-brand)] text-white rounded-full text-sm font-bold tracking-wide hover:bg-[var(--color-brand-dark)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Unsere Küche entdecken
                </a>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ════════════ MENU ════════════════════════════ */}
        <section id="menu" className="py-16 md:py-24 px-5 bg-[var(--color-brand-pale)]">
          <div className="max-w-6xl mx-auto">

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
              <div>
                <ScrollReveal>
                  <SectionLabel>Unsere Küche</SectionLabel>
                </ScrollReveal>
                <ScrollReveal delay={100}>
                  <h2
                    className="text-3xl md:text-5xl text-[var(--color-dark)]"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    Hausgemacht & regional
                  </h2>
                </ScrollReveal>
                <ScrollReveal delay={180}>
                  <p className="text-[var(--color-mid)] max-w-lg mt-3 text-sm md:text-base">
                    Bodenständige bayerische Küche — täglich frisch, mit regionalen Zutaten.
                  </p>
                </ScrollReveal>
              </div>

              {/* food photos */}
              <ScrollReveal delay={220} direction="right" className="flex gap-3 shrink-0">
                <div className="img-zoom-wrap w-24 h-24 md:w-32 md:h-32 rounded-xl shadow-md overflow-hidden">
                  <picture>
                    <source srcSet="/images/essen1-800.webp" media="(min-width:600px)" />
                    <img src="/images/essen1-480.webp" alt="Hausgemachte Küche"
                      className="w-full h-full object-cover" loading="lazy" width={128} height={128} />
                  </picture>
                </div>
                <div className="img-zoom-wrap w-24 h-24 md:w-32 md:h-32 rounded-xl shadow-md overflow-hidden">
                  <picture>
                    <source srcSet="/images/essen2-800.webp" media="(min-width:600px)" />
                    <img src="/images/essen2-480.webp" alt="Bratkartoffeln und Braten"
                      className="w-full h-full object-cover" loading="lazy" width={128} height={128} />
                  </picture>
                </div>
              </ScrollReveal>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-7">
              {menuItems.map((cat, i) => (
                <ScrollReveal key={cat.category} delay={i * 100}>
                  <div className="card-hover bg-white rounded-2xl overflow-hidden border border-[var(--color-line)] h-full">
                    <div className="px-5 py-3.5" style={{ background: "var(--color-brand)" }}>
                      <h3 className="text-white font-bold tracking-wide text-sm uppercase">{cat.category}</h3>
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
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={200}>
              <p className="text-center text-xs md:text-sm text-[var(--color-muted)] mt-8">
                Tageskarte und saisonale Angebote direkt im Haus oder auf Anfrage.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════ ATMOSPHERE / PARALLAX ══════════ */}
        <section className="relative py-28 md:py-40 px-5 text-center overflow-hidden">
          {/* parallax bench photo */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <ParallaxBg factor={0.2} className="absolute -inset-y-20 inset-x-0">
              <picture>
                <source media="(min-width:800px)" srcSet="/images/abend-1200.webp" />
                <source media="(min-width:480px)" srcSet="/images/abend-800.webp"  />
                <img src="/images/abend-480.webp" alt=""
                  className="w-full h-full object-cover object-[center_40%]" loading="lazy" />
              </picture>
            </ParallaxBg>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/42 to-black/62" />

          <ScrollReveal direction="none">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/60 mb-5">
              Der Armesberg
            </p>
            <h2
              className="text-5xl md:text-7xl lg:text-8xl text-white mb-5 drop-shadow-xl"
              style={{ fontFamily: "var(--font-great-vibes)", textShadow: "0 4px 24px rgba(0,0,0,.4)" }}
            >
              Bodenständig gut.
            </h2>
            <p
              className="text-base md:text-lg text-white/70 italic max-w-sm mx-auto"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              „Ein Platz, den man nicht so schnell vergisst."
            </p>
          </ScrollReveal>
        </section>

        {/* ════════════ HOURS + CONTACT ═════════════════ */}
        <section id="hours" className="py-16 md:py-24 px-5 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16">

            {/* hours */}
            <ScrollReveal direction="left">
              <SectionLabel>Öffnungszeiten</SectionLabel>
              <h2
                className="text-2xl md:text-4xl text-[var(--color-dark)] mb-7"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Wann wir für Sie da sind
              </h2>
              <div>
                {hours.map(({ day, time }, i) => (
                  <ScrollReveal key={day} delay={i * 60}>
                    <div className="flex justify-between items-center py-3.5 border-b border-[var(--color-line)]">
                      <span className="font-bold text-[var(--color-dark)] text-sm">{day}</span>
                      <span className={`text-sm ${
                        time === "Ruhetag"
                          ? "text-[var(--color-muted)] italic"
                          : "text-[var(--color-brand-dark)] font-bold"
                      }`}>
                        {time}
                      </span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
              <p className="mt-5 text-xs text-[var(--color-muted)] leading-relaxed">
                Feiertage können abweichen. Für Gruppen ab 10 Personen bitten wir um Voranmeldung.
              </p>
            </ScrollReveal>

            {/* contact */}
            <ScrollReveal direction="right" delay={150}>
              <SectionLabel>Reservierung & Kontakt</SectionLabel>
              <h2
                className="text-2xl md:text-4xl text-[var(--color-dark)] mb-7"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Tisch reservieren
              </h2>
              <div className="space-y-3 mb-6">
                {[
                  {
                    href: "tel:+4900000000",
                    label: "Telefon",
                    value: "+49 (0) 00 00 / 00 00",
                    icon: (
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.5 1.21 2 2 0 012.49-.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                    ),
                  },
                  {
                    href: "mailto:info@mesnerhaus.de",
                    label: "E-Mail",
                    value: "info@mesnerhaus.de",
                    icon: (
                      <>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </>
                    ),
                  },
                ].map(({ href, label, value, icon }) => (
                  <a
                    key={label}
                    href={href}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-pale)] transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="w-10 h-10 shrink-0 rounded-full bg-[var(--color-brand-pale)] flex items-center justify-center group-hover:bg-[var(--color-brand)] transition-colors duration-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        className="text-[var(--color-brand)] group-hover:text-white transition-colors duration-300"
                        stroke="currentColor" strokeWidth="2">
                        {icon}
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide font-bold">{label}</p>
                      <p className="font-bold text-[var(--color-dark)] text-sm md:text-base">{value}</p>
                    </div>
                  </a>
                ))}
              </div>
              <div className="p-4 md:p-5 rounded-xl bg-[var(--color-brand-pale)] border border-[var(--color-brand-light)]">
                <p className="text-sm text-[var(--color-mid)] leading-relaxed">
                  <strong className="text-[var(--color-brand-dark)]">Gruppen & Feiern:</strong><br />
                  Für Betriebsfeiern, Familienfeste oder Wandergruppen stehen Ihnen unsere Gasträume
                  auch exklusiv zur Verfügung. Sprechen Sie uns gerne an.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════ LOCATION ════════════════════════ */}
        <section id="location" className="py-16 md:py-24 px-5 bg-[var(--color-brand-pale)]">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-start">

            <ScrollReveal direction="left">
              <SectionLabel>Anfahrt</SectionLabel>
              <h2
                className="text-2xl md:text-4xl text-[var(--color-dark)] mb-6"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                So finden Sie uns
              </h2>
              <div className="space-y-5 text-[var(--color-mid)] mb-8">
                {[
                  {
                    icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
                    title: "Mesnerhaus",
                    lines: ["Armesberg [Nr.], 93xxx Ort", "Unterhalb der Dreifaltigkeitskirche"],
                  },
                  {
                    icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
                    title: "Fahrzeit ab Schwandorf",
                    lines: ["ca. 20 Minuten"],
                  },
                  {
                    icon: <><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
                    title: "Parken",
                    lines: ["Kostenfreier Parkplatz direkt am Haus"],
                  },
                ].map(({ icon, title, lines }) => (
                  <div key={title} className="flex gap-3.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      className="mt-0.5 shrink-0 text-[var(--color-brand)]" stroke="currentColor" strokeWidth="2">
                      {icon}
                    </svg>
                    <div className="text-sm md:text-base">
                      <p className="font-bold text-[var(--color-dark)]">{title}</p>
                      {lines.map((l) => <p key={l} className="text-xs md:text-sm mt-0.5">{l}</p>)}
                    </div>
                  </div>
                ))}
              </div>
              <a
                href="https://maps.google.com/?q=Armesberg+Bayern"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--color-brand)] text-white rounded-full text-sm font-bold hover:bg-[var(--color-brand-dark)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                In Google Maps öffnen
              </a>
            </ScrollReveal>

            {/* panorama as location photo */}
            <ScrollReveal direction="right" delay={150}>
              <div className="img-zoom-wrap rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                <picture>
                  <source media="(min-width:800px)" srcSet="/images/panorama-1400.webp" />
                  <source media="(min-width:480px)" srcSet="/images/panorama-900.webp"  />
                  <img src="/images/panorama-480.webp" alt="Blick vom Armesberg"
                    className="w-full h-full object-cover" loading="lazy" width={800} height={600} />
                </picture>
              </div>
              <p className="text-xs text-[var(--color-muted)] text-center mt-3 italic">
                Blick vom Armesberg über das Oberpfälzer Land
              </p>
            </ScrollReveal>
          </div>
        </section>

      </main>

      {/* ════════════ FOOTER ══════════════════════════ */}
      <footer
        className="py-14 md:py-16 px-5 text-white/80"
        style={{ background: "linear-gradient(135deg, #2d4a0e 0%, #3d6318 60%, #527a1f 100%)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 pb-10 border-b border-white/20">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo-icon.svg" alt="" width={38} height={38} />
                <span className="text-3xl text-white" style={{ fontFamily: "var(--font-great-vibes)" }}>
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
                  { label: "Über uns",       href: "#about"    },
                  { label: "Speisekarte",    href: "#menu"     },
                  { label: "Öffnungszeiten", href: "#hours"    },
                  { label: "Anfahrt",        href: "#location" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="link-underline hover:text-white transition-colors">{label}</a>
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
                  <a href="tel:+4900000000" className="link-underline hover:text-white transition-colors">
                    +49 (0) 00 00 / 00 00
                  </a>
                </p>
                <p>
                  <a href="mailto:info@mesnerhaus.de" className="link-underline hover:text-white transition-colors">
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
