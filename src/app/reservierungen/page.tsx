import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import OnlineBooking from "@/components/OnlineBooking";
import TeamLogin from "@/components/TeamLogin";
import SiteFooter from "@/components/SiteFooter";
import Icon from "@/components/Icon";
import { ADDRESS_LINE, OPENING_HOURS, TEL_DISPLAY, TEL_HREF, WHATSAPP } from "@/data/site";
import { fmtSlot } from "@/lib/hours";

export const metadata: Metadata = {
  title: "Tisch reservieren – Mesnerhaus am Armesberg",
  description: "Online einen Tisch im Mesnerhaus am Armesberg reservieren. Jeden Sonntag 11–17 Uhr, sofortige Bestätigung per E-Mail.",
};

const DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export default function Reservieren() {
  const openDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => OPENING_HOURS[d]);
  return (
    <>
      <header className="bg-white border-b border-[var(--color-line)]">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-icon.svg" alt="" width={32} height={32} />
            <span className="text-[1.6rem] leading-none text-[var(--color-brand)]" style={{ fontFamily: "var(--font-great-vibes)" }}>Mesnerhaus</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-[var(--color-brand-dark)] hover:underline">Zur Startseite</Link>
        </div>
      </header>

      <main className="flex-1 bg-[var(--color-brand-pale)]">
        <div className="max-w-5xl mx-auto px-5 py-10 md:py-14">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[var(--color-brand)] mb-3">Reservierung</p>
          <h1 className="text-3xl md:text-5xl text-[var(--color-dark)] mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
            Tisch reservieren
          </h1>
          <p className="text-[var(--color-mid)] max-w-2xl mb-8 md:mb-10 leading-relaxed">
            Ihr Sonntag auf dem Armesberg in drei Schritten: Personen, Tag und Uhrzeit wählen. Ist Platz frei, ist Ihr Tisch sofort reserviert, die Bestätigung kommt per E-Mail.
          </p>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 md:gap-8 items-start">
            <section aria-label="Online-Reservierung" className="p-5 md:p-7 rounded-2xl bg-white border border-[var(--color-brand-light)] shadow-sm">
              <OnlineBooking />
            </section>

            <aside className="grid gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[var(--color-line)]">
                <h2 className="font-bold text-[var(--color-dark)] mb-2 flex items-center gap-2"><Icon name="clock" size={18} className="text-[var(--color-brand-dark)]" />Öffnungszeiten</h2>
                <ul className="text-sm text-[var(--color-mid)] space-y-1 tabular-nums">
                  {openDays.map((d) => <li key={d} className="flex justify-between gap-3"><span>{DAYS[d]}</span><span className="font-bold text-[var(--color-dark)]">{fmtSlot(OPENING_HOURS[d])}</span></li>)}
                </ul>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-[var(--color-line)]">
                <h2 className="font-bold text-[var(--color-dark)] mb-2 flex items-center gap-2"><Icon name="family" size={18} className="text-[var(--color-brand-dark)]" />Ab 9 Personen</h2>
                <p className="text-sm text-[var(--color-mid)] mb-3 leading-relaxed">Für Gruppen und Feiern bis 60 Gäste stimmen wir gerne alles persönlich mit Ihnen ab, auch an anderen Tagen.</p>
                <div className="flex flex-wrap gap-2">
                  <a href={TEL_HREF} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-brand-dark)] text-white text-sm font-bold"><Icon name="phone" size={15} strokeWidth={2} />{TEL_DISPLAY}</a>
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-[var(--color-brand)] text-[var(--color-brand-dark)] text-sm font-bold"><Icon name="message" size={15} strokeWidth={2} />WhatsApp</a>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-[var(--color-line)] text-sm text-[var(--color-mid)]">
                <h2 className="font-bold text-[var(--color-dark)] mb-2 flex items-center gap-2"><Icon name="pin" size={18} className="text-[var(--color-brand-dark)]" />Anfahrt</h2>
                <p>{ADDRESS_LINE}<br />Kostenloser Parkplatz direkt am Haus.</p>
                <Link href="/#location" className="inline-block mt-2 font-bold text-[var(--color-brand-dark)] underline">Route planen</Link>
              </div>
            </aside>
          </div>

          <div className="mt-14">
            <TeamLogin />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
