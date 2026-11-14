import Image from "next/image";
import Link from "next/link";
import SiteFooter from "./SiteFooter";

/* Rahmen für Impressum und Datenschutz: schlichte Kopfzeile, lesbare Textspalte. */
export default function LegalPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <header className="bg-white border-b border-[var(--color-line)]">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-icon.svg" alt="" width={32} height={32} />
            <span className="text-[1.6rem] leading-none text-[var(--color-brand)]" style={{ fontFamily: "var(--font-great-vibes)" }}>Mesnerhaus</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-[var(--color-brand-dark)] hover:underline">Zur Startseite</Link>
        </div>
      </header>
      <main className="flex-1 bg-white">
        <article className="legal max-w-3xl mx-auto px-5 py-12 md:py-16">
          <h1 className="text-3xl md:text-5xl text-[var(--color-dark)] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>{title}</h1>
          {updated && <p className="text-sm text-[var(--color-muted)] mb-8">Stand: {updated}</p>}
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
