"use client";

import { useState } from "react";

export default function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--color-line)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="font-bold text-[var(--color-dark)] text-sm md:text-base group-hover:text-[var(--color-brand)] transition-colors">
          {q}
        </span>
        <span
          className={`shrink-0 w-7 h-7 rounded-full border-2 border-[var(--color-line)] flex items-center justify-center transition-all duration-300 group-hover:border-[var(--color-brand)] ${
            open ? "rotate-45 bg-[var(--color-brand)] border-[var(--color-brand)]" : ""
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 2v8M2 6h8"
              stroke={open ? "white" : "currentColor"}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-400 ease-out ${
          open ? "max-h-48 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm md:text-base text-[var(--color-mid)] leading-relaxed">{a}</p>
      </div>
    </div>
  );
}
