"use client";

import { useEffect, useState } from "react";
import { TEL_HREF } from "@/data/site";
import Icon from "./Icon";

type Notice = { active: boolean; text: string; link: string; url?: string; label?: string; until: string; updated: string };

const LINKS: Record<string, { href: string; label: string }> = {
  "#menu": { href: "/#menu", label: "Zur Tageskarte" },
  "#hours": { href: "/#hours", label: "Tisch anfragen" },
  "#location": { href: "/#location", label: "Anfahrt" },
  tel: { href: TEL_HREF, label: "Anrufen" },
};

/* Hinweis-Banner, gepflegt über die Upload-Seite (/hinweis.php).
   Weggeklickt wird nur für diese Browser-Sitzung (sessionStorage). */
export default function NoticeBar() {
  const [n, setN] = useState<Notice | null>(null);

  useEffect(() => {
    fetch("/hinweis.php", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Notice | null) => {
        if (!j?.active) return;
        try { if (sessionStorage.getItem("mh-hinweis-zu") === j.updated) return; } catch { /* egal */ }
        setN(j);
      })
      .catch(() => {});
  }, []);

  if (!n) return null;
  const custom = n.link === "custom" && n.url && /^(https?:\/\/|\/(?!\/))/i.test(n.url)
    ? { href: n.url, label: n.label || "Mehr erfahren", external: /^https?:\/\//i.test(n.url) }
    : null;
  const link = custom ?? (LINKS[n.link] ? { ...LINKS[n.link], external: false } : null);
  const close = () => {
    try { sessionStorage.setItem("mh-hinweis-zu", n.updated); } catch { /* egal */ }
    setN(null);
  };

  return (
    <div role="region" aria-label="Aktueller Hinweis" className="bg-[var(--color-brand-deeper)] text-white">
      <div className="max-w-6xl mx-auto pl-4 pr-2.5 sm:px-5 py-2 flex items-center gap-2.5 text-[0.8rem] md:text-sm">
        <Icon name="bell" size={16} className="shrink-0 opacity-85" />
        <p className="flex-1 min-w-0 leading-snug">
          <span className="font-bold">{n.text}</span>
          {link && (
            <>
              {" "}
              <a href={link.href} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="underline underline-offset-2 whitespace-nowrap hover:text-[var(--color-brand-light)]">
                {link.label}
              </a>
            </>
          )}
        </p>
        <button type="button" onClick={close} aria-label="Hinweis schließen"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
