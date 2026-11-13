"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import MobileMenu from "./MobileMenu";

const links = [
  { label: "Über uns",       href: "#about" },
  { label: "Speisekarte",    href: "#menu" },
  { label: "Öffnungszeiten", href: "#hours" },
  { label: "Anfahrt",        href: "#location" },
];

export default function NavScrolled() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[var(--color-line)] shadow-sm py-0"
          : "bg-transparent border-b border-transparent py-0"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-2.5 group">
          <Image
            src="/logo-icon.svg"
            alt="Mesnerhaus"
            width={34}
            height={34}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <span
            className={`text-[1.6rem] leading-none transition-colors duration-500 ${
              scrolled ? "text-[var(--color-brand)]" : "text-white drop-shadow"
            }`}
            style={{ fontFamily: "var(--font-great-vibes)" }}
          >
            Mesnerhaus
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-bold tracking-wide">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className={`transition-colors duration-300 hover:text-[var(--color-brand)] ${
                scrolled ? "text-[var(--color-mid)]" : "text-white/90 drop-shadow"
              }`}
            >
              {label}
            </a>
          ))}
          <a
            href="tel:+4900000000"
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
              scrolled
                ? "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)]"
                : "bg-white/20 backdrop-blur-sm text-white border border-white/40 hover:bg-white/30"
            }`}
          >
            Reservieren
          </a>
        </nav>

        <MobileMenu scrolled={scrolled} />
      </div>
    </header>
  );
}
