"use client";

import { useEffect, useRef, useState } from "react";
import { loadSiteData, type SiteEffect } from "@/lib/siteData";

/* Leichter Saison-Effekt über der Startseite (Schnee, Herbstlaub, Blüten), eingestellt in der Verwaltung.
   Aus bei „Bewegung reduzieren“, pausiert im Hintergrund-Tab, klickt nichts weg (pointer-events: none).
   Vorschau: /?effekt=schnee&staerke=mittel */
const COUNT = { leicht: 28, mittel: 55, stark: 95 } as const;
const LEAF = ["#C46A1E", "#D98C2B", "#B5502A", "#E0A43A", "#8E5A1E"];
const BLOSSOM = ["#F7C6D3", "#F3B0C3", "#FBE3EA", "#EFA3B8"];

type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; va: number; sway: number; c: string };

export default function SeasonalEffect() {
  const [fx, setFx] = useState<SiteEffect | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const q = new URLSearchParams(location.search);
    const preview = q.get("effekt");
    if (preview === "schnee" || preview === "laub" || preview === "blueten") {
      const st = q.get("staerke");
      setTimeout(() => setFx({ type: preview, intensity: st === "leicht" || st === "stark" ? st : "mittel" }), 0);
      return;
    }
    loadSiteData().then((d) => { if (d?.effect) setFx(d.effect); });
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!fx || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, last = performance.now();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const n = Math.round(COUNT[fx.intensity] * (w < 640 ? 0.55 : 1));
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const make = (top: boolean): P => {
      const snow = fx.type === "schnee";
      return {
        x: rnd(0, w), y: top ? rnd(-h * 0.2, -10) : rnd(0, h),
        r: snow ? rnd(1.2, 3.6) : rnd(5, 9),
        vy: snow ? rnd(18, 45) : rnd(22, 48), vx: rnd(-8, 8),
        a: rnd(0, Math.PI * 2), va: rnd(-1.2, 1.2), sway: rnd(0.6, 1.6),
        c: fx.type === "laub" ? LEAF[Math.floor(Math.random() * LEAF.length)] : fx.type === "blueten" ? BLOSSOM[Math.floor(Math.random() * BLOSSOM.length)] : "#fff",
      };
    };
    const ps: P[] = Array.from({ length: n }, () => make(false));

    const draw = (p: P) => {
      if (fx.type === "schnee") {
        ctx.globalAlpha = 0.85; ctx.fillStyle = "#fff";
        ctx.shadowColor = "rgba(60,80,110,.35)"; ctx.shadowBlur = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        return;
      }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = 0.9; ctx.fillStyle = p.c;
      ctx.beginPath();
      if (fx.type === "laub") {            // Blatt: zwei Bögen + Stiel
        ctx.moveTo(0, -p.r); ctx.quadraticCurveTo(p.r * 0.9, 0, 0, p.r); ctx.quadraticCurveTo(-p.r * 0.9, 0, 0, -p.r); ctx.fill();
        ctx.strokeStyle = "rgba(80,40,10,.45)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(0, p.r * 1.25); ctx.stroke();
      } else {                             // Blütenblatt
        ctx.ellipse(0, 0, p.r * 0.55, p.r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.y += p.vy * dt; p.a += p.va * dt;
        p.x += (p.vx + Math.sin(now / 1000 * p.sway + i) * 14) * dt;
        if (p.y > h + 12 || p.x < -20 || p.x > w + 20) ps[i] = make(true);
        draw(p);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); };
  }, [fx]);

  if (!fx) return null;
  return <canvas ref={canvas} aria-hidden="true" className="fixed inset-0 z-[45] pointer-events-none" />;
}
