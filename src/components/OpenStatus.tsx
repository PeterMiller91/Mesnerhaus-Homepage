"use client";

import { useEffect, useState } from "react";
import { openState, type OpenState } from "@/lib/hours";

function useOpenState() {
  const [state, setState] = useState<OpenState | null>(null);
  useEffect(() => {
    const tick = () => setState(openState());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return state;
}

/* Kleines Badge, z. B. im Hero. Rendert erst im Browser (statischer Export). */
export default function OpenStatus({ variant = "light" }: { variant?: "light" | "dark" }) {
  const s = useOpenState();
  const base = variant === "light"
    ? "bg-white/15 border-white/30 text-white backdrop-blur-sm"
    : "bg-white border-[var(--color-line)] text-[var(--color-dark)]";
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs md:text-sm font-bold min-h-[36px] ${base} ${s ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}
      aria-live="polite">
      <span className={`w-2.5 h-2.5 rounded-full ${s?.open ? "bg-[#7CD45A] shadow-[0_0_0_4px_rgba(124,212,90,.25)]" : "bg-[#E58B6E] shadow-[0_0_0_4px_rgba(229,139,110,.25)]"}`} />
      {s?.text ?? " "}
    </span>
  );
}
