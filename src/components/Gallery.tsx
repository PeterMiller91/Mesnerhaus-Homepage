"use client";

import { useEffect, useState } from "react";
import { loadSiteData, type SiteGalleryItem } from "@/lib/siteData";
import ScrollReveal from "./ScrollReveal";

/* Galerie „Einblicke“: zuerst die fest eingebauten Bilder (sofort, auch für Google),
   danach – falls in der Verwaltung gepflegt – die dort eingestellte Auswahl und Reihenfolge. */
export default function Gallery({ initial }: { initial: SiteGalleryItem[] }) {
  const [items, setItems] = useState(initial);
  useEffect(() => { loadSiteData().then((d) => { if (d?.gallery) setItems(d.gallery); }); }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {items.map(({ id, wide, small, large, alt, caption, pos }, i) => (
        <ScrollReveal key={id} delay={(i % 4) * 70} className={wide ? "col-span-2" : ""}>
          <figure>
            <div className={`img-zoom-wrap rounded-2xl overflow-hidden shadow-md ${wide ? "aspect-[16/9]" : "aspect-square"}`}>
              <picture>
                {large !== small && <source media="(min-width:600px)" srcSet={large} />}
                <img src={small} alt={alt} className="w-full h-full object-cover" style={pos ? { objectPosition: pos } : undefined}
                  loading="lazy" width={wide ? 480 : 360} height={wide ? 270 : 360} />
              </picture>
            </div>
            {caption && <figcaption className="mt-2 text-xs md:text-sm text-[var(--color-mid)] text-center">{caption}</figcaption>}
          </figure>
        </ScrollReveal>
      ))}
    </div>
  );
}
