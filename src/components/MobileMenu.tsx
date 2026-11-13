"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const links = [
  { label: "Über uns",       href: "#about" },
  { label: "Speisekarte",    href: "#menu" },
  { label: "Öffnungszeiten", href: "#hours" },
  { label: "Anfahrt",        href: "#location" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Menü öffnen"
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
      >
        <span className="block w-6 h-0.5 bg-[var(--color-dark)]" />
        <span className="block w-6 h-0.5 bg-[var(--color-dark)]" />
        <span className="block w-4 h-0.5 bg-[var(--color-dark)]" />
      </button>

      {/* overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          {/* header row */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--color-line)]">
            <div className="flex items-center gap-3">
              <Image src="/logo-icon.svg" alt="" width={32} height={32} />
              <span
                className="text-2xl leading-none"
                style={{ fontFamily: "var(--font-great-vibes)", color: "var(--color-brand)" }}
              >
                Mesnerhaus
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Menü schließen"
              className="w-10 h-10 flex items-center justify-center text-[var(--color-mid)]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* links */}
          <nav className="flex-1 flex flex-col justify-center px-8 gap-2">
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="text-3xl py-4 border-b border-[var(--color-line)] text-[var(--color-dark)] hover:text-[var(--color-brand)] transition-colors"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTA bottom */}
          <div className="px-8 pb-10">
            <a
              href="tel:+4900000000"
              className="block w-full py-4 text-center bg-[var(--color-brand)] text-white font-bold rounded-full text-sm tracking-wide hover:bg-[var(--color-brand-dark)] transition-colors"
              onClick={() => setOpen(false)}
            >
              Jetzt reservieren
            </a>
          </div>
        </div>
      )}
    </>
  );
}
