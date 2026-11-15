import Image from "next/image";
import CookieSettingsLink from "./CookieSettingsLink";
import { ADDRESS, EMAIL, OPENING_HOURS, TEL_DISPLAY, TEL_HREF } from "@/data/site";
import { fmtSlot } from "@/lib/hours";

export default function SiteFooter() {
  return (
      <footer className="pt-14 pb-28 md:py-16 px-5 text-white/80"
        style={{ background: "linear-gradient(135deg, #1e3309 0%, #2d4a0e 60%, #3d6318 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 pb-10 border-b border-white/20">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo-icon.svg" alt="" width={38} height={38} />
                <span className="text-3xl text-white" style={{ fontFamily: "var(--font-great-vibes)" }}>Mesnerhaus</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">Ausflugsgaststätte am Armesberg.<br />Hausgemachte Küche und Kuchen mit Weitblick.</p>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4">Navigation</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "Über uns",       href: "/#about"      },
                  { label: "Tageskarte",     href: "/#menu"       },
                  { label: "Galerie",        href: "/#galerie"    },
                  { label: "Feiern",         href: "/#feiern"     },
                  { label: "Wandern",        href: "/#wandern"    },
                  { label: "Öffnungszeiten", href: "/#hours"      },
                  { label: "FAQ",            href: "/#faq"        },
                  { label: "Anfahrt",        href: "/#location"   },
                ].map(({ label, href }) => (
                  <li key={label}><a href={href} className="link-underline hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4">Kontakt</h4>
              <address className="not-italic text-sm space-y-1.5 text-white/70">
                <p>{ADDRESS.street}<br />{ADDRESS.zip} {ADDRESS.city}</p>
                <p className="mt-3">
                  <a href={TEL_HREF} className="link-underline hover:text-white transition-colors">{TEL_DISPLAY}</a>
                </p>
                <p>
                  <a href={`mailto:${EMAIL}`} className="link-underline hover:text-white transition-colors break-all">{EMAIL}</a>
                </p>
              </address>
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4">Öffnungszeiten</h4>
              <ul className="text-sm space-y-1.5 text-white/70 tabular-nums">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <li key={d}><span className="text-white/40 inline-block w-8">{["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d]}</span> {fmtSlot(OPENING_HOURS[d])}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Mesnerhaus · {ADDRESS.street} · {ADDRESS.zip} {ADDRESS.city}</p>
            <nav aria-label="Rechtliches" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="/impressum/" className="hover:text-white/70 transition-colors">Impressum</a>
              <a href="/datenschutz/" className="hover:text-white/70 transition-colors">Datenschutz</a>
              <CookieSettingsLink className="hover:text-white/70 transition-colors" />
            </nav>
          </div>
        </div>
      </footer>
  );
}
