import type { Metadata, Viewport } from "next";
import { Great_Vibes, Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import { SITE_URL } from "@/data/site";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lato = Lato({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#8DB43A",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "./" },
  manifest: "/manifest.webmanifest",
  title: "Mesnerhaus – Ausflugsgaststätte am Armesberg",
  description:
    "Herzlich willkommen im Mesnerhaus am Armesberg. Bodenständige Küche, frische Zutaten und ein herrlicher Blick auf die Dreifaltigkeitskirche.",
  openGraph: {
    title: "Mesnerhaus – Ausflugsgaststätte am Armesberg",
    description:
      "Bodenständige Küche am Fuße der Dreifaltigkeitskirche. Genuss mit Panorama.",
    locale: "de_DE",
    url: SITE_URL,
    images: ["/images/panorama-1400.webp"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`${greatVibes.variable} ${playfair.variable} ${lato.variable}`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
