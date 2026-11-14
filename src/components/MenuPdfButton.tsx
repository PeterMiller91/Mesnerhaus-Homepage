"use client";

import { useEffect, useState } from "react";
import { MENU_PDF_URL } from "@/data/site";
import Icon from "./Icon";

/* Zeigt den Button nur, wenn auf dem Server eine Speisekarte liegt
   (hochgeladen über den Telegram-Bot). */
export default function MenuPdfButton() {
  const [info, setInfo] = useState<{ updated: string | null } | null>(null);

  useEffect(() => {
    fetch(MENU_PDF_URL, { method: "HEAD", cache: "no-store" })
      .then((r) => {
        if (!r.ok || !(r.headers.get("content-type") ?? "").includes("pdf")) return;
        const lm = r.headers.get("last-modified");
        setInfo({ updated: lm ? new Date(lm).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }) : null });
      })
      .catch(() => {});
  }, []);

  if (!info) return null;
  return (
    <div className="flex flex-col items-center gap-2 mt-8">
      <a href={MENU_PDF_URL} target="_blank" rel="noopener"
        className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[var(--color-brand)] text-white font-bold text-sm hover:bg-[var(--color-brand-dark)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <Icon name="file" size={18} /> Aktuelle Speisekarte (PDF)
        <Icon name="download" size={16} />
      </a>
      {info.updated && <span className="text-xs text-[var(--color-muted)]">Stand: {info.updated}</span>}
    </div>
  );
}
