"use client";

import { useRef, useEffect } from "react";

interface Props {
  children: React.ReactNode;
  factor?: number;
  className?: string;
}

export default function ParallaxBg({ children, factor = 0.3, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    // also disable on small screens (iOS parallax is janky)
    if (window.innerWidth < 768) return;

    let ticking = false;
    const container = el.parentElement;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!container) return;
          const rect = container.getBoundingClientRect();
          const offset = -rect.top * factor;
          el.style.transform = `translateY(${offset}px)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [factor]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ willChange: "transform", transform: "translateY(0)" }}
    >
      {children}
    </div>
  );
}
