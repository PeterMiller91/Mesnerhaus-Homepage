import type { SVGProps } from "react";

/* Einheitliches Linien-Icon-Set (24×24, stroke = currentColor). */
const paths = {
  mountain: <><path d="M3 20l6-10 4 6 2-3 6 7z" /><circle cx="15" cy="6" r="1.5" /></>,
  plate: <><circle cx="12" cy="13" r="7" /><circle cx="12" cy="13" r="3.5" /><path d="M4 3v5M2.5 3v3.5A1.5 1.5 0 0 0 4 8a1.5 1.5 0 0 0 1.5-1.5V3M20 3c-1.5 1-2 3-2 5h2v13" /></>,
  parking: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" /></>,
  family: <><circle cx="8" cy="6" r="2.5" /><circle cx="16" cy="6" r="2.5" /><circle cx="12" cy="12.5" r="1.8" /><path d="M4 21v-6a4 4 0 0 1 8 0M12 21v-6a4 4 0 0 1 8 0M10 21v-3a2 2 0 0 1 4 0v3" /></>,
  church: <><path d="M12 2v4M10 4h4M12 6l-5 5v10h10V11z" /><path d="M3 21h18M7 14H4v7M17 14h3v7M10.5 21v-3a1.5 1.5 0 0 1 3 0v3" /></>,
  boot: <><path d="M6 3h6v7l6 3a3 3 0 0 1 2 3v3H4V3z" /><path d="M4 19v2h16v-2M9 7h3M9 10h3" /></>,
  bike: <><circle cx="5.5" cy="16.5" r="3.5" /><circle cx="18.5" cy="16.5" r="3.5" /><path d="M5.5 16.5L9 9h6l3.5 7.5M9 9l3 7.5L15 9M13 5h2.5l1 4" /></>,
  sunrise: <path d="M2 20h20M5 16a7 7 0 0 1 14 0M12 2v4M4.2 8.2l1.4 1.4M19.8 8.2l-1.4 1.4" />,
  child: <><circle cx="12" cy="5" r="2.5" /><path d="M12 8v7M8 11l4-2 4 2M9.5 21l2.5-6 2.5 6" /></>,
  car: <><path d="M5 17h14M5 17v2M19 17v2M3 13l2-6h14l2 6v4H3z" /><circle cx="7.5" cy="14.5" r=".8" /><circle cx="16.5" cy="14.5" r=".8" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  cloudSun: <><path d="M12 3v1.5M5.6 5.6l1 1M3 12h1.5M17.4 6.6l1-1" /><path d="M8 11a4 4 0 0 1 7.4-2" /><path d="M8 20h9a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.5A2.8 2.8 0 0 0 8 20z" /></>,
  cloud: <path d="M7 19h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 2A3 3 0 0 0 7 19z" />,
  rain: <><path d="M7 15h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 2A3 3 0 0 0 7 15z" /><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" /></>,
  snow: <><path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 2A3 3 0 0 0 7 14z" /><path d="M8 18h.01M12 18h.01M16 18h.01M10 21h.01M14 21h.01" /></>,
  storm: <><path d="M7 15h10a4 4 0 0 0 0-8 6 6 0 0 0-11.6 2A3 3 0 0 0 7 15z" /><path d="M13 15l-2 4h3l-2 4" /></>,
  fog: <path d="M4 10h16M3 14h18M5 18h14M7 6h10" />,
  beer: <><path d="M5 7h10v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" /><path d="M15 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M5 7a3 3 0 0 1 3-3 3 3 0 0 1 5 0 2.5 2.5 0 0 1 2 3M8.5 11v6M11.5 11v6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  message: <path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12z" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  navigation: <path d="M3 11l19-9-9 19-2-8z" />,
  bus: <><rect x="4" y="3" width="16" height="15" rx="2" /><path d="M4 11h16M8 18v3M16 18v3" /><circle cx="8" cy="14.5" r=".8" /><circle cx="16" cy="14.5" r=".8" /></>,
  external: <path d="M7 17L17 7M9 7h8v8" />,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></>,
  download: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  bell: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" />,
  left: <path d="M15 18l-6-6 6-6" />,
  right: <path d="M9 18l6-6-6-6" />,
  pen: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  route: <><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H17a3.5 3.5 0 0 0 0-7H7a3.5 3.5 0 0 1 0-7h8.5" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
} as const;

export type IconName = keyof typeof paths;

export default function Icon({ name, size = 22, strokeWidth = 1.7, ...rest }:
  { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {paths[name]}
    </svg>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value.toLocaleString("de-DE")} von 5 Sternen`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#B8913A" />
                <stop offset={`${fill * 100}%`} stopColor="#E0E0D6" />
              </linearGradient>
            </defs>
            <path fill={`url(#s${i}-${Math.round(fill * 100)})`}
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      })}
    </span>
  );
}
