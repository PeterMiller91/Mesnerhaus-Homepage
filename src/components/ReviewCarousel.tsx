"use client";

import { useRef, useState } from "react";
import type { Review } from "@/data/site";
import Icon, { Stars } from "./Icon";

function ReviewCard({ r }: { r: Review }) {
  const [expanded, setExpanded] = useState(false);
  const long = r.text.length > 260;
  return (
    <article className="snap-start shrink-0 w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] bg-[var(--color-brand-pale)] border border-[var(--color-brand-light)] rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-[var(--color-brand-dark)] text-white font-bold flex items-center justify-center shrink-0">
          {r.author.trim().charAt(0).toUpperCase()}
        </span>
        <div className="leading-tight">
          <p className="font-bold text-[var(--color-dark)] text-sm">{r.author}</p>
          <p className="text-xs text-[var(--color-muted)]">{r.date} · Google</p>
        </div>
      </div>
      <Stars value={r.stars} />
      {r.photo && (
        <picture className="block rounded-xl overflow-hidden aspect-[4/3]">
          <source media="(min-width:1024px)" srcSet={`/images/${r.photo.base}-768.webp`} />
          <img src={`/images/${r.photo.base}-400.webp`} alt={r.photo.alt} loading="lazy" width={400} height={300}
            className="w-full h-full object-cover" />
        </picture>
      )}
      <p className={`text-sm text-[var(--color-mid)] leading-relaxed whitespace-pre-line ${!expanded && long ? "line-clamp-5" : ""}`}>{r.text}</p>
      {long && (
        <button type="button" onClick={() => setExpanded((e) => !e)}
          className="self-start text-xs font-bold text-[var(--color-brand-dark)] hover:underline">
          {expanded ? "Weniger anzeigen" : "Mehr lesen"}
        </button>
      )}
      {r.reply && (
        <div className="mt-auto border-l-2 border-[var(--color-brand-light)] pl-3 text-xs text-[var(--color-muted)] leading-relaxed">
          <b className="text-[var(--color-mid)]">Antwort vom Mesnerhaus:</b> {r.reply}
        </div>
      )}
    </article>
  );
}

export default function ReviewCarousel({ reviews }: { reviews: Review[] }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const el = track.current; if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 20), behavior: "smooth" });
  };
  return (
    <div className="min-w-0">
      {reviews.length > 1 && (
        <div className="hidden sm:flex justify-end gap-2 mb-3">
          {([[-1, "left", "Vorherige"], [1, "right", "Nächste"]] as const).map(([d, ic, l]) => (
            <button key={ic} type="button" onClick={() => scroll(d)} aria-label={`${l} Bewertung`}
              className="w-10 h-10 rounded-full border border-[var(--color-line)] bg-white flex items-center justify-center text-[var(--color-dark)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand-dark)] transition-colors">
              <Icon name={ic} size={18} />
            </button>
          ))}
        </div>
      )}
      <div ref={track} className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-3 [scrollbar-width:thin]">
        {reviews.map((r, i) => <ReviewCard key={i} r={r} />)}
      </div>
    </div>
  );
}
