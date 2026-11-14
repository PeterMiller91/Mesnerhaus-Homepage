"use client";

import { useEffect, useState } from "react";
import { slotFor } from "@/lib/hours";
import Icon, { type IconName } from "./Icon";

type Day = { date: string; code: number; max: number; min: number; rain: number };

/* WMO-Wettercodes → Icon + Text */
function describe(code: number): { icon: IconName; label: string } {
  if (code === 0) return { icon: "sun", label: "sonnig" };
  if (code <= 2) return { icon: "cloudSun", label: "heiter" };
  if (code === 3) return { icon: "cloud", label: "bewölkt" };
  if (code <= 48) return { icon: "fog", label: "neblig" };
  if (code <= 67 || (code >= 80 && code <= 82)) return { icon: "rain", label: "Regen" };
  if (code <= 77 || code === 85 || code === 86) return { icon: "snow", label: "Schnee" };
  return { icon: "storm", label: "Gewitter" };
}

function verdict(d: Day): string {
  const { label } = describe(d.code);
  if (d.max >= 15 && d.rain <= 20 && d.code <= 2) return `ideales Terrassenwetter, ${Math.round(d.max)} °C und ${label}.`;
  if (d.max >= 10 && d.rain <= 40) return `gutes Ausflugswetter, ${Math.round(d.max)} °C, ${label}.`;
  return `eher ein Tag für die gemütliche Gaststube, ${Math.round(d.max)} °C, ${label}.`;
}

export default function WeatherWidget() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Abruf über den eigenen Server (public/wetter.php), damit keine Besucher-IP an Dritte geht
    const url = "/wetter.php";
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        const d = j.daily;
        setDays(d.time.map((t: string, i: number) => ({
          date: t, code: d.weather_code[i], max: d.temperature_2m_max[i],
          min: d.temperature_2m_min[i], rain: d.precipitation_probability_max[i] ?? 0,
        })));
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  const shown = days?.slice(0, 4);
  const nextOpen = days?.find((d) => slotFor(new Date(d.date + "T12:00")).slot);

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-line)] p-5 md:p-6 h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-[var(--color-brand-pale)] text-[var(--color-brand-dark)] flex items-center justify-center">
          <Icon name="beer" />
        </span>
        <div>
          <h3 className="font-bold text-[var(--color-dark)]">Biergarten-Wetter</h3>
          <p className="text-xs text-[var(--color-muted)]">Vorhersage für den Armesberg, 731 m</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(shown ?? Array.from({ length: 4 }, () => null)).map((d, i) => {
          if (!d) return <div key={i} className="h-[104px] rounded-xl bg-[var(--color-brand-pale)] animate-pulse" />;
          const { icon, label } = describe(d.code);
          const dt = new Date(d.date + "T12:00");
          const name = i === 0 ? "Heute" : dt.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
          return (
            <div key={d.date} className="rounded-xl bg-[var(--color-brand-pale)] py-3 px-1 flex flex-col items-center gap-1 text-center tabular-nums">
              <span className="text-xs font-bold text-[var(--color-mid)]">{name}</span>
              <Icon name={icon} size={26} className="text-[var(--color-brand-dark)]" aria-label={label} />
              <span className="font-bold text-[var(--color-dark)]">{Math.round(d.max)}°</span>
              <span className="text-[0.65rem] text-[var(--color-muted)]">{Math.round(d.min)}° · {d.rain} %</span>
            </div>
          );
        })}
      </div>
      {nextOpen && (
        <p className="flex gap-2.5 items-start text-sm text-[var(--color-mid)] p-3 rounded-xl border border-[var(--color-brand-light)]">
          <Icon name={describe(nextOpen.code).icon} size={18} className="text-[var(--color-brand-dark)] mt-0.5 shrink-0" />
          <span>
            <b className="text-[var(--color-dark)]">
              {nextOpen.date === days![0].date ? "Heute" : new Date(nextOpen.date + "T12:00").toLocaleDateString("de-DE", { weekday: "long" })}:
            </b>{" "}{verdict(nextOpen)}
          </span>
        </p>
      )}
      <p className="text-[0.65rem] text-[var(--color-muted)] mt-auto">
        Wetterdaten: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">Open-Meteo.com</a> (CC BY 4.0)
      </p>
    </div>
  );
}
