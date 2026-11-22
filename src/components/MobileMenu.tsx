"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { TEL_DISPLAY, TEL_HREF } from "@/data/site";
import Image from "next/image";

const links = [
  { label: "Über uns",       href: "#about" },
  { label: "Tageskarte",     href: "#menu" },
  { label: "Bewertungen",    href: "#bewertungen" },
  { label: "Öffnungszeiten", href: "#hours" },
  { label: "Anfahrt",        href: "#location" },
];

export default function MobileMenu({ scrolled = false }: { scrolled?: boolean }) {
  const [open, setOpen] = useState(false);

  // Menü direkt in <body> rendern: Die Kopfleiste hat einen Weichzeichner (backdrop-filter),
  // der sonst „fixed“-Elemente auf ihre eigene Höhe beschränkt (Menü wäre nach dem Scrollen durchsichtig).
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menü öffnen"
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px]"
      >
        <span className={`block w-6 h-0.5 transition-colors duration-300 ${scrolled ? "bg-[var(--color-dark)]" : "bg-white"}`} />
        <span className={`block w-6 h-0.5 transition-colors duration-300 ${scrolled ? "bg-[var(--color-dark)]" : "bg-white"}`} />
        <span className={`block w-4 h-0.5 transition-colors duration-300 ${scrolled ? "bg-[var(--color-dark)]" : "bg-white"}`} />
      </button>

      {mounted && createPortal(<>
      {/* backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[100] w-80 max-w-full bg-white flex flex-col shadow-2xl transition-transform duration-400 ease-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--color-line)]">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-icon.svg" alt="" width={30} height={30} />
            <span
              className="text-xl leading-none text-[var(--color-brand)]"
              style={{ fontFamily: "var(--font-great-vibes)" }}
            >
              Mesnerhaus
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Menü schließen"
            className="w-9 h-9 flex items-center justify-center text-[var(--color-mid)] hover:text-[var(--color-dark)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 flex flex-col px-6 pt-6 gap-1">
          {links.map(({ label, href }, i) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between py-4 border-b border-[var(--color-line)] text-[var(--color-dark)] hover:text-[var(--color-brand)] transition-colors group"
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "1.4rem",
                animationDelay: `${i * 60}ms`,
              }}
            >
              {label}
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-brand)]">
                <path d="M5 10h10M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </nav>

        <div className="px-6 pb-10 pt-4">
          <a
            href="/reservierungen/"
            className="flex items-center justify-center gap-2 w-full py-4 bg-[var(--color-brand)] text-white font-bold rounded-full text-sm tracking-wide hover:bg-[var(--color-brand-dark)] transition-colors"
            onClick={() => setOpen(false)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
            Jetzt reservieren
          </a>
          <a
            href={TEL_HREF}
            className="mt-3 flex items-center justify-center gap-2 w-full py-3.5 border-2 border-[var(--color-brand)] text-[var(--color-brand-dark)] font-bold rounded-full text-sm"
            onClick={() => setOpen(false)}
          >
            Anrufen: {TEL_DISPLAY}
          </a>
        </div>
      </div>
      </>, document.body)}
    </>
  );
}
