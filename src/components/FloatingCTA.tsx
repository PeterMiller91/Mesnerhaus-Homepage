"use client";

import { useState, useEffect } from "react";
import { MAPS_ROUTE, TEL_HREF } from "@/data/site";
import Icon from "./Icon";

export default function FloatingCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2.5 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <a href={MAPS_ROUTE} target="_blank" rel="noopener noreferrer" aria-label="Route planen"
        className="w-12 h-12 rounded-full bg-[var(--color-brand-deeper)] text-white flex items-center justify-center shadow-xl">
        <Icon name="navigation" size={19} strokeWidth={2} />
      </a>
      <a href={TEL_HREF} aria-label="Anrufen"
        className="w-12 h-12 rounded-full bg-white text-[var(--color-brand-dark)] border border-[var(--color-line)] flex items-center justify-center shadow-xl">
        <Icon name="phone" size={18} strokeWidth={2} />
      </a>
      <a href="/reservierungen/"
        className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-[var(--color-brand)] text-white font-bold text-sm shadow-xl"
        style={{ boxShadow: "0 8px 32px rgba(141,180,58,0.45)" }}>
        <Icon name="calendar" size={16} strokeWidth={2.2} />
        Reservieren
      </a>
    </div>
  );
}
