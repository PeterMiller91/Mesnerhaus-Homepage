import Image from "next/image";
import NavScrolled from "@/components/NavScrolled";
import ParallaxBg from "@/components/ParallaxBg";
import ScrollReveal from "@/components/ScrollReveal";
import FloatingCTA from "@/components/FloatingCTA";
import FaqItem from "@/components/FaqItem";
import Icon, { Stars, type IconName } from "@/components/Icon";
import OpenStatus from "@/components/OpenStatus";
import HoursTable from "@/components/HoursTable";
import WeatherWidget from "@/components/WeatherWidget";
import ReviewCarousel from "@/components/ReviewCarousel";
import Tageskarte from "@/components/Tageskarte";
import ConsentMap from "@/components/ConsentMap";
import SiteFooter from "@/components/SiteFooter";
import {
  TEL_HREF, TEL_DISPLAY, TEL_E164, WHATSAPP, EMAIL, ADDRESS, ADDRESS_LINE,
  MAPS_EMBED, MAPS_LINK, MAPS_ROUTE, APPLE_ROUTE, BAHN_LINK,
  OPENING_HOURS, GOOGLE_RATING, GOOGLE_WRITE_REVIEW, GOOGLE_READ_REVIEWS, REVIEWS,
} from "@/data/site";

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
    <div className="flex items-center gap-4 my-5">
      <span className="flex-1 h-px bg-[var(--color-line)]" />
      <Image src="/logo-icon.svg" alt="" width={24} height={24} />
      <span className="flex-1 h-px bg-[var(--color-line)]" />
    </div>
  );
}
/* smooth S-curve wave — only this one, no mountains */
function Wave({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative -mt-px leading-none overflow-hidden" style={{ background: to }}>
      <svg viewBox="0 0 1440 54" xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none" className="w-full block h-10 md:h-14"
        style={{ fill: from }}>
        <path d="M0,0 C480,54 960,54 1440,0 L1440,0 L0,0 Z" />
      </svg>
    </div>
  );
}

/* ─── data ───────────────────────────────────────────── */
const stats = [
  { value: "731 m",          label: "Weitblick über die Oberpfalz" },
  { value: "Über\n20 Jahre", label: "Familienbetrieb" },
  { value: "Haus\u00ADgemacht", label: "Küche & Kuchen" },
];

const benefits: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "mountain",
    title: "Weitblick über die Oberpfalz",
    body: "Von der Terrasse und aus dem Biergarten schauen Sie auf 731 Metern weit über das Land. Ein Teil der Terrasse ist überdacht.",
  },
  {
    icon: "plate",
    title: "Aus der eigenen Küche",
    body: "Gekocht wird bei uns im Haus, bodenständig und mit Liebe. Die Tageskarte wechselt jede Woche.",
  },
  {
    icon: "cake",
    title: "Selbstgebackene Kuchen",
    body: "Torten, Küchle und Hefebuchteln aus der eigenen Küche. In unseren Google-Bewertungen werden sie besonders oft gelobt.",
  },
  {
    icon: "parking",
    title: "Einfach ankommen",
    body: "Kostenloser Parkplatz direkt am Haus, Fahrradständer und Wanderwege ab der Tür. Hunde sind drinnen und draußen willkommen.",
  },
];

type GalleryItem = { base: string; src: { small: number; large?: number }; alt: string; caption: string; wide?: boolean; pos?: string };
const gallery: GalleryItem[] = [
  { base: "panorama",        src: { small: 480, large: 900 }, wide: true, alt: "Landschaft rund um den Armesberg", caption: "Die Landschaft rund um den Armesberg" },
  { base: "gaststube-ecke",  src: { small: 360, large: 387 }, alt: "Gemütliche Ecke in der Gaststube mit Kerze und Blumen", caption: "Gemütlich in der Gaststube" },
  { base: "krustenbraten",   src: { small: 360, large: 800 },  alt: "Schweinebraten mit knuspriger Kruste", caption: "Schweinebraten mit Kruste" },
  { base: "braten-knoedel",  src: { small: 360, large: 800 },  alt: "Braten mit Soße, Kartoffelknödeln und Blaukraut", caption: "Braten mit Knödeln und Blaukraut" },
  { base: "terrasse",        src: { small: 360, large: 800 },  alt: "Terrasse des Mesnerhaus mit Blick ins Land", caption: "Die Terrasse, zum Teil überdacht" },
  { base: "salat",           src: { small: 360, large: 800 },  alt: "Bunter Salatteller mit Ei, Karotten und Radieschen", caption: "Frischer Salatteller" },
  { base: "kuechle",         src: { small: 360, large: 800 },  alt: "Selbstgebackene Küchle", caption: "Selbstgebackene Küchle" },
  { base: "eisbecher",       src: { small: 360, large: 800 },  alt: "Eisbecher mit Karamell und Waffel", caption: "Eisbecher mit Karamell", pos: "center 35%" },
  { base: "abend",           src: { small: 360, large: 800 },  alt: "Abendstimmung am Armesberg", caption: "Abendstimmung am Armesberg", pos: "center 40%" },
  { base: "essen1",          src: { small: 360, large: 800 },  alt: "Gericht mit Bratkartoffeln und Salat", caption: "Aus unserer Küche" },
  { base: "essen2",          src: { small: 360, large: 800 },  alt: "Braten mit Bratkartoffeln", caption: "Braten mit Bratkartoffeln" },
];

const faqs = [
  {
    q: "Haben Sie nur sonntags geöffnet?",
    a: "Ja, für Gäste sind wir jeden Sonntag von 11 bis 17 Uhr da. Feiern und Gruppen ab 10 Personen sind nach Absprache auch an anderen Tagen möglich. Rufen Sie uns einfach an.",
  },
  {
    q: "Brauche ich eine Reservierung?",
    a: "Wir empfehlen es, denn sonntags ist es oft voll. Spontane Gäste sind willkommen, einen Platz können wir dann aber nicht garantieren. Am einfachsten kurz anrufen oder per WhatsApp schreiben.",
  },
  {
    q: "Gibt es Kaffee und Kuchen?",
    a: "Ja. Am Nachmittag gibt es selbstgebackene Kuchen, Torten und Küchle aus unserer Küche, dazu Kaffee und Eis.",
  },
  {
    q: "Gibt es vegetarische Gerichte?",
    a: "Ja, auf der Tageskarte steht in der Regel mindestens ein vegetarisches Gericht. Bei besonderen Wünschen oder Unverträglichkeiten sprechen Sie uns bitte vorher an.",
  },
  {
    q: "Wie funktioniert der Biergarten?",
    a: "Im Biergarten bedienen Sie sich selbst: Sie bestellen an der Ausgabe und bekommen einen Pager, der sich meldet, sobald Ihr Essen fertig ist. In der Gaststube werden Sie am Tisch bedient.",
  },
  {
    q: "Ist die Terrasse überdacht?",
    a: "Teilweise. Ein Teil der Terrasse ist überdacht und auch bei leichtem Regen nutzbar. Bei schlechtem Wetter sitzen Sie in unserer gemütlichen Gaststube.",
  },
  {
    q: "Dürfen Hunde mit?",
    a: "Ja, Hunde sind bei uns drinnen und draußen willkommen.",
  },
  {
    q: "Wie komme ich am besten hin?",
    a: "Navi: Armesberg 2, 95508 Kulmain. Kostenloser Parkplatz direkt am Haus. Fahrzeit ab Kemnath ca. 10 Minuten, ab Weiden ca. 30 Minuten.",
  },
  {
    q: "Kann ich das Mesnerhaus für eine Feier mieten?",
    a: "Ja. Für Geburtstage, Taufen, Betriebsfeiern und Gruppen bis 60 Gäste reservieren wir die Gasträume exklusiv für Sie, auch an anderen Tagen als sonntags. Wir stellen das Menü mit Ihnen zusammen und machen Ihnen gerne ein Angebot.",
  },
];


/* ─── strukturierte Daten für Google ─────────────────── */
const DAY_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Gaststätte Mesnerhaus",
  servesCuisine: "Bayerisch",
  telephone: TEL_E164,
  email: EMAIL,
  priceRange: "€€",
  image: "/images/panorama-1400.webp",
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.street, postalCode: ADDRESS.zip,
    addressLocality: ADDRESS.city, addressRegion: ADDRESS.region, addressCountry: "DE",
  },
  geo: { "@type": "GeoCoordinates", latitude: ADDRESS.lat, longitude: ADDRESS.lon },
  hasMap: MAPS_LINK,
  openingHoursSpecification: OPENING_HOURS.flatMap((slot, d) =>
    slot ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_SCHEMA[d], opens: slot.open, closes: slot.close }] : []),
  acceptsReservations: true,
};

/* ─── page ───────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <NavScrolled />
      <FloatingCTA />

      <main>
        {/* ════════════ HERO ════════════════════════════ */}
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <ParallaxBg factor={0.25} className="absolute -inset-y-24 inset-x-0">
              <picture>
                <source media="(min-width:1400px)" srcSet="/images/panorama-1920.webp" />
                <source media="(min-width:900px)"  srcSet="/images/panorama-1400.webp" />
                <source media="(min-width:480px)"  srcSet="/images/panorama-900.webp"  />
                <img src="/images/panorama-480.webp" alt="" className="w-full h-full object-cover object-center" fetchPriority="high" width={480} height={183} />
              </picture>
            </ParallaxBg>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
          <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,.35) 100%)" }} />

          <div className="hero-logo mb-5 md:mb-7">
            <Image src="/logo-icon.svg" alt="Mesnerhaus" width={88} height={88}
              className="mx-auto md:w-[108px] md:h-[108px]"
              style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,.5))" }} priority />
          </div>
          <h1 className="hero-title text-[4.2rem] md:text-[7rem] lg:text-[9rem] leading-none text-white drop-shadow-xl mb-3"
            style={{ fontFamily: "var(--font-great-vibes)", textShadow: "0 4px 24px rgba(0,0,0,.4)" }}>
            Mesnerhaus
          </h1>
          <div className="hero-line flex items-center gap-3 mb-7 md:mb-9">
            <span className="w-10 md:w-14 h-px bg-white/55" />
            <p className="text-[0.6rem] md:text-xs font-bold tracking-[0.3em] md:tracking-[0.4em] uppercase text-white/85">
              Ausflugsgaststätte am Armesberg · Kulmain
            </p>
            <span className="w-10 md:w-14 h-px bg-white/55" />
          </div>
          <p className="hero-claim text-base md:text-xl text-white/80 italic max-w-[22rem] md:max-w-xl text-balance mb-9 md:mb-11"
            style={{ fontFamily: "var(--font-playfair)" }}>
            Bodenständige Küche, selbstgebackene Kuchen und Weitblick.<br />Jeden Sonntag von 11 bis 17 Uhr.
          </p>
          <div className="hero-claim flex flex-wrap justify-center gap-2.5 -mt-4 mb-8 md:mb-10">
            <OpenStatus />
            {GOOGLE_RATING && (
              <a href="#bewertungen" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white/15 border-white/30 text-white backdrop-blur-sm text-xs md:text-sm font-bold">
                <Stars value={GOOGLE_RATING.rating} size={14} />
                {GOOGLE_RATING.rating.toLocaleString("de-DE", { minimumFractionDigits: 1 })} · {GOOGLE_RATING.count} Google-Bewertungen
              </a>
            )}
          </div>
          <div className="hero-ctas flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
            <a href="#menu" className="px-9 py-4 rounded-full bg-white text-[var(--color-brand-dark)] font-bold text-sm tracking-wide hover:bg-[var(--color-brand-pale)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-center">
              Zur Tageskarte
            </a>
            <a href="/reservierungen/" className="px-9 py-4 rounded-full border-2 border-white/55 text-white font-bold text-sm tracking-wide hover:bg-white/15 hover:border-white/80 transition-all duration-300 text-center">
              Tisch reservieren
            </a>
          </div>
          <div className="hero-scroll hidden sm:flex absolute bottom-9 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-white/50">
            <span className="text-[0.55rem] tracking-[0.3em] uppercase">Entdecken</span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="animate-bounce">
              <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </section>

        {/* ════════════ STATS ═══════════════════════════ */}
        <section className="py-14 md:py-16 px-5" style={{ background: "linear-gradient(135deg, #2d4a0e 0%, #3d6318 50%, #527a1f 100%)" }}>
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 items-stretch">
            {stats.map(({ value, label }, i) => (
              <ScrollReveal key={label} delay={i * 120} className="text-center min-w-0 h-full">
                {/* Wert unten ausgerichtet, damit alle Beschriftungen auf einer Linie stehen */}
                <div className="h-full flex flex-col justify-end items-center gap-1.5">
                  <p className="text-[1.3rem] leading-[1.15] sm:text-3xl md:text-4xl font-bold text-white whitespace-pre-line hyphens-manual break-words max-w-full"
                    style={{ fontFamily: "var(--font-playfair)" }}>{value}</p>
                  <p className="text-[0.55rem] sm:text-[0.65rem] md:text-xs font-bold tracking-[0.12em] sm:tracking-[0.2em] uppercase text-white/60 leading-snug">{label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <Wave from="#3d6318" to="white" />

        {/* ════════════ ABOUT ═══════════════════════════ */}
        <section id="about" className="py-16 md:py-24 px-5 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <ScrollReveal direction="left" className="order-first md:order-last relative">
              <div className="img-zoom-wrap rounded-2xl shadow-xl overflow-hidden aspect-[4/3]">
                <picture>
                  <source media="(min-width:800px)" srcSet="/images/terrasse-800.webp" />
                  <img src="/images/terrasse-480.webp" alt="Die Terrasse des Mesnerhaus am Armesberg"
                    className="w-full h-full object-cover" loading="lazy" width={800} height={600} />
                </picture>
              </div>
              <div className="float-badge absolute -bottom-5 -right-3 md:-bottom-7 md:-right-7 w-24 h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white"
                style={{ background: "var(--color-brand)", boxShadow: "0 12px 32px rgba(141,180,58,.4)" }}>
                <span className="text-white text-[0.55rem] md:text-[0.6rem] font-bold tracking-widest uppercase text-center leading-tight px-2">
                  Direkt am<br />Armesberg
                </span>
              </div>
            </ScrollReveal>

            <div className="order-last md:order-first">
              <ScrollReveal delay={80}><SectionLabel>Herzlich Willkommen</SectionLabel></ScrollReveal>
              <ScrollReveal delay={160}>
                <h2 className="text-3xl md:text-5xl text-[var(--color-dark)] mb-4 leading-tight"
                  style={{ fontFamily: "var(--font-playfair)" }}>
                  Sonntags auf<br />den Armesberg
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={220}><Divider /></ScrollReveal>
              <ScrollReveal delay={300} className="mt-5 space-y-4 text-[var(--color-mid)] leading-relaxed text-sm md:text-base">
                <p>Das Mesnerhaus liegt direkt unterhalb der Wallfahrtskirche zur Heiligen Dreifaltigkeit, auf 731 Metern, mit weitem Blick über die Oberpfalz. Seit über 20 Jahren führen wir es als Familienbetrieb.</p>
                <p>Gekocht wird bei uns im Haus. Zum Kaffee gibt es selbstgebackene Kuchen und Torten.</p>
                <blockquote className="border-l-2 border-[var(--color-brand)] pl-4 italic">
                  „Das Essen war einfach der Hammer. Sehr lecker, wie bei Oma. Portionen sind ausreichend und die Preise sind sehr fair.“
                  <footer className="not-italic text-xs text-[var(--color-muted)] mt-1.5">Matthias G., Google-Bewertung</footer>
                </blockquote>
              </ScrollReveal>
              <ScrollReveal delay={400}>
                <a href="#menu" className="inline-block mt-7 px-7 py-3.5 bg-[var(--color-brand)] text-white rounded-full text-sm font-bold tracking-wide hover:bg-[var(--color-brand-dark)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  Tageskarte ansehen
                </a>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ════════════ BENEFITS ════════════════════════ */}
        <section className="py-14 md:py-20 px-5 bg-white border-t border-[var(--color-line)]">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal className="text-center mb-10 md:mb-14">
              <SectionLabel>Warum Mesnerhaus</SectionLabel>
              <h2 className="text-3xl md:text-4xl text-[var(--color-dark)]" style={{ fontFamily: "var(--font-playfair)" }}>
                Darum kommen unsere Gäste wieder
              </h2>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
              {benefits.map(({ icon, title, body }, i) => (
                <ScrollReveal key={title} delay={i * 90}>
                  <div className="card-hover group bg-[var(--color-brand-pale)] rounded-2xl p-6 h-full border border-transparent hover:border-[var(--color-brand-light)]">
                    <span className="w-12 h-12 mb-4 rounded-xl bg-white text-[var(--color-brand-dark)] flex items-center justify-center shadow-sm group-hover:bg-[var(--color-brand)] group-hover:text-white transition-colors duration-300">
                      <Icon name={icon} size={24} />
                    </span>
                    <h3 className="font-bold text-[var(--color-dark)] mb-2 text-base">{title}</h3>
                    <p className="text-sm text-[var(--color-mid)] leading-relaxed">{body}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <Wave from="white" to="#F2F7E8" />

        {/* ════════════ GALERIE ═════════════════════════ */}
        <section id="galerie" className="py-16 md:py-24 px-5 bg-[var(--color-brand-pale)]">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal className="text-center mb-10 md:mb-14">
              <SectionLabel>Einblicke</SectionLabel>
              <h2 className="text-3xl md:text-4xl text-[var(--color-dark)]" style={{ fontFamily: "var(--font-playfair)" }}>
                So sieht ein Sonntag am Armesberg aus
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {gallery.map(({ base, wide, src, alt, caption, pos }, i) => (
                <ScrollReveal key={base} delay={(i % 4) * 70} className={wide ? "col-span-2" : ""}>
                  <figure>
                    <div className={`img-zoom-wrap rounded-2xl overflow-hidden shadow-md ${wide ? "aspect-[16/9]" : "aspect-square"}`}>
                      <picture>
                        {src.large && <source media="(min-width:600px)" srcSet={`/images/${base}-${src.large}.webp`} />}
                        <img src={`/images/${base}-${src.small}.webp`} alt={alt}
                          className="w-full h-full object-cover" style={pos ? { objectPosition: pos } : undefined}
                          loading="lazy" width={wide ? 480 : 360} height={wide ? 270 : 360} />
                      </picture>
                    </div>
                    <figcaption className="mt-2 text-xs md:text-sm text-[var(--color-mid)] text-center">{caption}</figcaption>
                  </figure>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════ MENU ════════════════════════════ */}
        <section id="menu" className="py-16 md:py-24 px-5 bg-[var(--color-brand-pale)] border-t border-[var(--color-line)]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 md:mb-14">
              <ScrollReveal><SectionLabel>Unsere Küche</SectionLabel></ScrollReveal>
              <ScrollReveal delay={100}>
                <h2 className="text-3xl md:text-5xl text-[var(--color-dark)]" style={{ fontFamily: "var(--font-playfair)" }}>
                  Unsere Tageskarte
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={180}>
                <p className="text-[var(--color-mid)] max-w-lg mx-auto mt-3 text-sm md:text-base">
                  Bodenständige bayerische Küche aus unserer eigenen Küche. Typisch bei uns: Braten, Wild, Fisch und selbstgebackene Kuchen. Die Karte wechselt jede Woche.
                </p>
              </ScrollReveal>
            </div>
            <ScrollReveal delay={120}>
              <Tageskarte />
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════ ATMOSPHERE / PARALLAX ══════════ */}
        <section className="relative py-28 md:py-44 px-5 text-center overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <ParallaxBg factor={0.2} className="absolute -inset-y-20 inset-x-0">
              <picture>
                <source media="(min-width:800px)" srcSet="/images/abend-1200.webp" />
                <source media="(min-width:480px)" srcSet="/images/abend-800.webp" />
                <img src="/images/abend-480.webp" alt="" className="w-full h-full object-cover object-[center_40%]" loading="lazy" width={480} height={360} />
              </picture>
            </ParallaxBg>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/42 to-black/62" />
          <ScrollReveal direction="none">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-white/60 mb-5">Der Armesberg</p>
            <h2 className="text-5xl md:text-7xl lg:text-8xl text-white mb-5 drop-shadow-xl"
              style={{ fontFamily: "var(--font-great-vibes)", textShadow: "0 4px 24px rgba(0,0,0,.4)" }}>
              Bodenständig gut.
            </h2>
            <figure className="max-w-md mx-auto mb-8">
              <blockquote className="text-base md:text-lg text-white/85 italic" style={{ fontFamily: "var(--font-playfair)" }}>
                „Der Biergarten mit dem tollen Ausblick ist einmalig schön, wie Urlaub.&ldquo;
              </blockquote>
              <figcaption className="text-xs text-white/60 mt-2 tracking-wide">Kerstin S., Google-Bewertung</figcaption>
            </figure>
            <a href="/reservierungen/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--color-brand)] text-white font-bold text-sm hover:bg-[var(--color-brand-dark)] transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              style={{ boxShadow: "0 8px 32px rgba(141,180,58,.4)" }}>
              Jetzt Tisch reservieren
            </a>
          </ScrollReveal>
        </section>

        <Wave from="#1a1a1a" to="white" />

        {/* ════════════ BEWERTUNGEN ═════════════════════ */}
        <section id="bewertungen" className="py-16 md:py-24 px-5 bg-white">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal className="text-center mb-10 md:mb-14">
              <SectionLabel>Gästestimmen</SectionLabel>
              <h2 className="text-3xl md:text-4xl text-[var(--color-dark)]" style={{ fontFamily: "var(--font-playfair)" }}>
                Was unsere Gäste auf Google sagen
              </h2>
            </ScrollReveal>
            <div className={`grid gap-7 items-start ${REVIEWS.length ? "lg:grid-cols-[280px_1fr]" : "max-w-md mx-auto"}`}>
              <ScrollReveal direction={REVIEWS.length ? "left" : "up"}>
                <aside className="bg-white rounded-2xl border border-[var(--color-line)] p-6 flex flex-col gap-4 shadow-sm">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-mid)]">
                    <Icon name="pin" size={15} /> Google-Unternehmensprofil
                  </span>
                  {GOOGLE_RATING && (
                    <div className="flex items-end gap-3">
                      <span className="text-6xl leading-none text-[var(--color-dark)] tabular-nums" style={{ fontFamily: "var(--font-playfair)" }}>
                        {GOOGLE_RATING.rating.toLocaleString("de-DE", { minimumFractionDigits: 1 })}
                      </span>
                      <span className="grid gap-1 pb-1">
                        <Stars value={GOOGLE_RATING.rating} size={20} />
                        <span className="text-xs text-[var(--color-muted)]">{GOOGLE_RATING.count} Bewertungen</span>
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {["weite Aussicht", "gute Küche", "Kuchen & Torten", "freundliches Personal", "faire Preise"].map((t) => (
                      <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-brand-pale)] text-[var(--color-brand-dark)] border border-[var(--color-brand-light)]">{t}</span>
                    ))}
                  </div>
                  {GOOGLE_WRITE_REVIEW && (
                    <a href={GOOGLE_WRITE_REVIEW} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[var(--color-brand)] text-white font-bold text-sm hover:bg-[var(--color-brand-dark)] transition-colors">
                      <Icon name="pen" size={16} /> Bewertung schreiben
                    </a>
                  )}
                  <a href={GOOGLE_READ_REVIEWS} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border-2 border-[var(--color-brand)] text-[var(--color-brand-dark)] font-bold text-sm hover:bg-[var(--color-brand-pale)] transition-colors">
                    Alle Bewertungen auf Google <Icon name="external" size={15} />
                  </a>
                  <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                    Hinweis zu den Bewertungen: Wir zeigen eine Auswahl öffentlicher Google-Bewertungen in wörtlicher Wiedergabe (Namen gekürzt).
                    Wir prüfen nicht, ob die Verfasser tatsächlich bei uns zu Gast waren. Google veröffentlicht Bewertungen nach eigenen Richtlinien.
                    Alle Bewertungen, auch kritische, finden Sie auf Google.
                  </p>
                </aside>
              </ScrollReveal>
              {REVIEWS.length > 0 && (
                <ScrollReveal direction="right" delay={120} className="min-w-0">
                  <ReviewCarousel reviews={REVIEWS} />
                </ScrollReveal>
              )}
            </div>
          </div>
        </section>

        <Wave from="white" to="#F2F7E8" />

        {/* ════════════ FEIERN & GRUPPEN ════════════════ */}
        <section id="feiern" className="py-16 md:py-24 px-5 bg-[var(--color-brand-pale)]">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <ScrollReveal direction="right" className="order-first md:order-last relative">
              <div className="img-zoom-wrap rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                <picture>
                  <img src="/images/gaststube-tische-515.webp" alt="Festlich gedeckte Tische in der Gaststube des Mesnerhaus"
                    className="w-full h-full object-cover" loading="lazy" width={515} height={388} />
                </picture>
              </div>
            </ScrollReveal>

            <div className="order-last md:order-first">
              <ScrollReveal delay={80}><SectionLabel>Feiern & Gruppen</SectionLabel></ScrollReveal>
              <ScrollReveal delay={160}>
                <h2 className="text-3xl md:text-5xl text-[var(--color-dark)] mb-4 leading-tight"
                  style={{ fontFamily: "var(--font-playfair)" }}>
                  Feiern mit Weitblick<br />für bis zu 60 Gäste
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={240}><Divider /></ScrollReveal>
              <ScrollReveal delay={300} className="mt-5 text-[var(--color-mid)] leading-relaxed text-sm md:text-base space-y-4">
                <p>Geburtstag, Taufe, Betriebsfeier oder Wandergruppe: Im Mesnerhaus feiern Sie mit Blick über die Oberpfalz.</p>
                <p>Wir reservieren die Gasträume exklusiv für Sie, auch an anderen Tagen als sonntags, und stellen das Menü gemeinsam mit Ihnen zusammen.</p>
              </ScrollReveal>
              <ScrollReveal delay={360}>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Bis zu 60 Gäste, Gasträume exklusiv",
                    "Auch außerhalb der Öffnungszeiten nach Absprache",
                    "Menü nach Ihren Wünschen",
                    "Kaffee und hausgemachte Kuchen für den Nachmittag",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm md:text-base text-[var(--color-mid)]">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0 text-[var(--color-brand)]">
                        <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
              <ScrollReveal delay={450}>
                <a href={TEL_HREF}
                  className="inline-flex items-center gap-2 mt-7 px-7 py-3.5 bg-[var(--color-brand)] text-white rounded-full text-sm font-bold hover:bg-[var(--color-brand-dark)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.5 1.21 2 2 0 012.49-.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                  </svg>
                  Anfrage stellen
                </a>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ════════════ WANDERN ═════════════════════════ */}
        <section id="wandern" className="py-16 md:py-24 px-5 bg-[var(--color-brand-pale)] border-t border-[var(--color-line)]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 md:mb-14">
              <ScrollReveal><SectionLabel>Ausflug & Wandern</SectionLabel></ScrollReveal>
              <ScrollReveal delay={100}>
                <h2 className="text-3xl md:text-4xl text-[var(--color-dark)]" style={{ fontFamily: "var(--font-playfair)" }}>
                  Der perfekte Ausflugstag
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={180}>
                <p className="text-[var(--color-mid)] max-w-xl mx-auto mt-3 text-sm md:text-base">
                  Wandern Sie auf den Armesberg und kehren Sie danach bei uns ein. Diese Dinge erwarten Sie vor Ort.
                </p>
              </ScrollReveal>
            </div>
            <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-5 md:gap-7 items-stretch">
              <ScrollReveal direction="left" className="h-full">
                <figure className="h-full flex flex-col">
                  <div className="img-zoom-wrap rounded-2xl overflow-hidden shadow-md aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:flex-1 lg:min-h-[420px]">
                    <picture>
                      <source media="(min-width:600px)" srcSet="/images/kirche-800.webp" />
                      <img src="/images/kirche-480.webp" alt="Wallfahrtskirche zur Heiligen Dreifaltigkeit auf dem Armesberg"
                        className="w-full h-full object-cover object-[center_30%]" loading="lazy" width={800} height={1422} />
                    </picture>
                  </div>
                  <figcaption className="mt-2 text-xs md:text-sm text-[var(--color-mid)] text-center">
                    Die Wallfahrtskirche zur Heiligen Dreifaltigkeit, direkt neben dem Mesnerhaus
                  </figcaption>
                </figure>
              </ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-5 md:gap-7 min-w-0">
              {([
                {
                  icon: "church",
                  title: "Dreifaltigkeitskirche",
                  body: "Die Wallfahrtskirche zur Heiligen Dreifaltigkeit steht direkt neben dem Mesnerhaus, auf dem Gipfel des Armesbergs.",
                },
                {
                  icon: "boot",
                  title: "Wanderwege ab Haus",
                  body: "Markierte Wanderwege starten direkt am Parkplatz, für Einsteiger wie für geübte Wanderer.",
                },
                {
                  icon: "bike",
                  title: "Radfahrer willkommen",
                  body: "Fahrradständer direkt am Haus. Nach dem Anstieg auf den Armesberg gibt es bei uns eine Stärkung.",
                },
                {
                  icon: "sunrise",
                  title: "Aussichtspunkt",
                  body: "Vom Armesberg auf 731 Metern reicht der Blick bei klarem Wetter weit über die Oberpfalz.",
                },
                {
                  icon: "child",
                  title: "Mit Kindern",
                  body: "Genug Platz zum Toben, während die Großen noch beim Kaffee sitzen. Wanderwege starten direkt am Haus.",
                },
                {
                  icon: "beer",
                  title: "Biergarten mit Pager",
                  body: "Im Biergarten bestellen Sie selbst an der Ausgabe. Ein Pager meldet sich, sobald Ihr Essen fertig ist.",
                },
              ] as { icon: IconName; title: string; body: string }[]).map(({ icon, title, body }, i) => (
                <ScrollReveal key={title} delay={i * 70}>
                  <div className="card-hover bg-white rounded-2xl p-5 h-full border border-[var(--color-line)]">
                    <span className="w-11 h-11 mb-3 rounded-xl bg-[var(--color-brand-pale)] text-[var(--color-brand-dark)] flex items-center justify-center">
                      <Icon name={icon} size={22} />
                    </span>
                    <h3 className="font-bold text-[var(--color-dark)] mb-1.5 text-sm md:text-base">{title}</h3>
                    <p className="text-xs md:text-sm text-[var(--color-mid)] leading-relaxed">{body}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5 md:gap-7 mt-5 md:mt-7">
              <ScrollReveal delay={80}><WeatherWidget /></ScrollReveal>
              <ScrollReveal delay={160}>
                <div className="bg-white rounded-2xl border border-[var(--color-line)] p-5 md:p-6 h-full flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[var(--color-brand-pale)] text-[var(--color-brand-dark)] flex items-center justify-center">
                      <Icon name="route" />
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--color-dark)]">Route planen</h3>
                      <p className="text-xs text-[var(--color-muted)]">{ADDRESS_LINE}</p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {[
                      { href: MAPS_ROUTE,  icon: "car" as const,        title: "Google Maps",  sub: "Navigation mit Auto, Rad oder zu Fuß" },
                      { href: APPLE_ROUTE, icon: "navigation" as const, title: "Apple Karten", sub: "für iPhone und iPad" },
                      { href: BAHN_LINK,   icon: "bus" as const,        title: "Bus & Bahn",   sub: `Ziel: ${ADDRESS.city}, ${ADDRESS.street}` },
                    ].map(({ href, icon, title, sub }) => (
                      <a key={title} href={href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-pale)] transition-colors group">
                        <Icon name={icon} size={20} className="text-[var(--color-brand-dark)] shrink-0" />
                        <span className="leading-tight">
                          <span className="block font-bold text-sm text-[var(--color-dark)]">{title}</span>
                          <span className="block text-xs text-[var(--color-muted)]">{sub}</span>
                        </span>
                        <Icon name="external" size={15} className="ml-auto text-[var(--color-muted)] group-hover:text-[var(--color-brand-dark)]" />
                      </a>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <Wave from="#F2F7E8" to="white" />

        {/* ════════════ HOURS + CONTACT ═════════════════ */}
        <section id="hours" className="py-16 md:py-24 px-5 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16">
            <ScrollReveal direction="left">
              <SectionLabel>Öffnungszeiten</SectionLabel>
              <h2 className="text-2xl md:text-4xl text-[var(--color-dark)] mb-7"
                style={{ fontFamily: "var(--font-playfair)" }}>
                Jeden Sonntag von 11 bis 17 Uhr
              </h2>
              <HoursTable />
              <p className="mt-5 text-xs text-[var(--color-muted)] leading-relaxed">
                Feiertage können abweichen. Für Gruppen ab 10 Personen bitten wir um Voranmeldung.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-8">
                {[
                  { href: TEL_HREF, label: "Telefon", value: TEL_DISPLAY, icon: "phone" as const, ext: false },
                  { href: `https://wa.me/${WHATSAPP}`, label: "WhatsApp", value: TEL_DISPLAY, icon: "message" as const, ext: true },
                ].map(({ href, label, value, icon, ext }) => (
                  <a key={label} href={href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-3.5 p-4 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-pale)] transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-md">
                    <span className="w-10 h-10 shrink-0 rounded-full bg-[var(--color-brand-pale)] text-[var(--color-brand)] flex items-center justify-center group-hover:bg-[var(--color-brand)] group-hover:text-white transition-colors duration-300">
                      <Icon name={icon} size={17} strokeWidth={2} />
                    </span>
                    <span>
                      <span className="block text-xs text-[var(--color-muted)] uppercase tracking-wide font-bold">{label}</span>
                      <span className="block font-bold text-[var(--color-dark)] text-sm tabular-nums">{value}</span>
                    </span>
                  </a>
                ))}
                <a href={`mailto:${EMAIL}`}
                  className="sm:col-span-2 flex items-center gap-3.5 p-4 rounded-xl border border-[var(--color-line)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-pale)] transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-md">
                  <span className="w-10 h-10 shrink-0 rounded-full bg-[var(--color-brand-pale)] text-[var(--color-brand)] flex items-center justify-center group-hover:bg-[var(--color-brand)] group-hover:text-white transition-colors duration-300">
                    <Icon name="mail" size={17} strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-[var(--color-muted)] uppercase tracking-wide font-bold">E-Mail</span>
                    <span className="block font-bold text-[var(--color-dark)] text-sm break-all">{EMAIL}</span>
                  </span>
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={150}>
              <SectionLabel>Reservierung</SectionLabel>
              <h2 className="text-2xl md:text-4xl text-[var(--color-dark)] mb-3"
                style={{ fontFamily: "var(--font-playfair)" }}>
                Tisch reservieren
              </h2>
              <p className="text-sm text-[var(--color-mid)] mb-6 leading-relaxed">
                Online in einer Minute: Tag und Uhrzeit wählen, und ist Platz frei, ist Ihr Tisch sofort reserviert. Bis 8 Personen online, größere Gruppen bitte per Telefon oder WhatsApp.
              </p>
              <div className="p-5 md:p-6 rounded-2xl bg-[var(--color-brand-pale)] border border-[var(--color-brand-light)] grid gap-4">
                <ul className="grid gap-2 text-sm text-[var(--color-mid)]">
                  {["Freie Zeiten auf einen Blick", "Sofortige Bestätigung per E-Mail", "Kostenlos, Storno jederzeit per Link"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5"><Icon name="check" size={16} strokeWidth={2.4} className="text-[var(--color-brand-dark)] shrink-0" />{t}</li>
                  ))}
                </ul>
                <a href="/reservierungen/"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[var(--color-brand-dark)] text-white font-bold text-sm hover:bg-[var(--color-brand-deeper)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <Icon name="calendar" size={17} strokeWidth={2} /> Jetzt online reservieren
                </a>
              </div>
              <p className="mt-5 text-sm text-[var(--color-mid)] leading-relaxed">
                <strong className="text-[var(--color-brand-dark)]">Gruppen & Feiern:</strong>{" "}
                Für Betriebsfeiern, Familienfeste oder Wandergruppen stehen Ihnen unsere Gasträume auch exklusiv zur Verfügung.{" "}
                <a href="#feiern" className="text-[var(--color-brand)] font-bold hover:underline">Mehr erfahren</a>
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════ FAQ ═════════════════════════════ */}
        <section id="faq" className="py-16 md:py-24 px-5 bg-[var(--color-brand-pale)] border-t border-[var(--color-line)]">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal className="text-center mb-10 md:mb-14">
              <SectionLabel>Häufige Fragen</SectionLabel>
              <h2 className="text-3xl md:text-4xl text-[var(--color-dark)]" style={{ fontFamily: "var(--font-playfair)" }}>
                Alles Wichtige auf einen Blick
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="bg-white rounded-2xl px-6 shadow-sm border border-[var(--color-line)]">
                {faqs.map(({ q, a }) => (
                  <FaqItem key={q} q={q} a={a} />
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        <Wave from="#F2F7E8" to="white" />

        {/* ════════════ LOCATION + MAP ══════════════════ */}
        <section id="location" className="py-16 md:py-24 px-5 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <ScrollReveal direction="left">
              <SectionLabel>Anfahrt</SectionLabel>
              <h2 className="text-2xl md:text-4xl text-[var(--color-dark)] mb-6"
                style={{ fontFamily: "var(--font-playfair)" }}>
                So finden Sie uns
              </h2>
              <div className="space-y-5 text-[var(--color-mid)] mb-8">
                {[
                  {
                    icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
                    title: "Adresse",
                    lines: [ADDRESS_LINE, "Unterhalb der Dreifaltigkeitskirche"],
                  },
                  {
                    icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
                    title: "Fahrzeit",
                    lines: ["ca. 10 Min. ab Kemnath", "ca. 30 Min. ab Weiden i.d. OPf."],
                  },
                  {
                    icon: <><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
                    title: "Parken",
                    lines: ["Kostenfreier Parkplatz direkt am Haus"],
                  },
                ].map(({ icon, title, lines }) => (
                  <div key={title} className="flex gap-3.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      className="mt-0.5 shrink-0 text-[var(--color-brand)]" stroke="currentColor" strokeWidth="2">{icon}
                    </svg>
                    <div className="text-sm md:text-base">
                      <p className="font-bold text-[var(--color-dark)]">{title}</p>
                      {lines.map((l) => <p key={l} className="text-xs md:text-sm mt-0.5">{l}</p>)}
                    </div>
                  </div>
                ))}
              </div>
              <a href={MAPS_ROUTE} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--color-brand)] text-white rounded-full text-sm font-bold hover:bg-[var(--color-brand-dark)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                Route mit Google Maps
              </a>
              <a href={APPLE_ROUTE} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 ml-0 sm:ml-3 mt-3 sm:mt-0 border-2 border-[var(--color-brand)] text-[var(--color-brand-dark)] rounded-full text-sm font-bold hover:bg-[var(--color-brand-pale)] transition-all duration-300">
                <Icon name="navigation" size={15} strokeWidth={2} />
                Apple Karten
              </a>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={150}>
              <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3] border border-[var(--color-line)]">
                <ConsentMap src={MAPS_EMBED} title="Mesnerhaus am Armesberg auf Google Maps" link={MAPS_LINK} />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ════════════ GROSSER CTA BANNER ══════════════ */}
        <section className="py-20 md:py-28 px-5 text-center"
          style={{ background: "linear-gradient(135deg, #2d4a0e 0%, #3d6318 50%, #527a1f 100%)" }}>
          <ScrollReveal direction="none">
            <Image src="/logo-icon.svg" alt="" width={56} height={56} className="mx-auto mb-5 opacity-80" />
            <h2 className="text-3xl md:text-5xl text-white mb-3"
              style={{ fontFamily: "var(--font-playfair)" }}>
              Diesen Sonntag auf den Armesberg?
            </h2>
            <p className="text-white/70 max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
              Sonntags ist es oft voll. Reservieren Sie Ihren Tisch kostenlos online, per Anruf oder per WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
              <a href="/reservierungen/"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-[var(--color-brand)] text-white font-bold text-sm tracking-wide hover:bg-[var(--color-brand-dark)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                <Icon name="calendar" size={16} strokeWidth={2} />
                Online reservieren
              </a>
              <a href={TEL_HREF}
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-white text-[var(--color-brand-dark)] font-bold text-sm tracking-wide hover:bg-[var(--color-brand-pale)] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.5 1.21 2 2 0 012.49-.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                </svg>
                {TEL_DISPLAY}
              </a>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full border-2 border-white/55 text-white font-bold text-sm tracking-wide hover:bg-white/15 hover:border-white/80 transition-all duration-300">
                <Icon name="message" size={16} strokeWidth={2} />
                Per WhatsApp anfragen
              </a>
            </div>
          </ScrollReveal>
        </section>

      </main>

      <SiteFooter />
    </>
  );
}
