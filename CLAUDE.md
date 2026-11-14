# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # local dev server (Turbopack)
npm run build    # static export → out/
npm run lint     # ESLint
node scripts/convert-images.mjs  # convert new source images to WebP
```

**After every content or code change:** run `npm run build` to regenerate `out/`, then `git add . && git commit && git push`. Plesk on netcup pulls `master` and serves the `out/` directory directly — there is no CI/CD pipeline.

## Architecture

**Static export.** `next.config.ts` sets `output: "export"` and `images: { unoptimized: true }`. The build produces plain HTML/CSS/JS in `out/`. No Node.js runtime on the server.

**Content data.** Contact, address, opening hours, special days, notice bar, Google rating and reviews live in `src/data/site.ts` — edit there, not in `page.tsx`. Reviews must be real Google reviews copied verbatim (emojis stripped, names shortened to first name + initial). Icons come from `src/components/Icon.tsx` (inline SVG line icons) — never use emojis as icons.

**PHP on the server.** There is no fixed menu, only a weekly Tageskarte. `public/api/telegram-tageskarte.php` is a Telegram webhook: a photo (converted server-side to an A4 PDF, no extra libs) or PDF sent to the bot is stored in `<repo>/storage/` (gitignored, outside `out/`). `public/tageskarte.php` serves it (`?bild` preview JPEG, `?info` JSON). Setup: `server/README.md`. Secrets go in `<repo>/mesnerhaus-config.php` on the server only.

**Single page.** The entire site is `src/app/page.tsx` (server component). All interactive pieces are imported as client components from `src/components/`.

**Client components** (`"use client"`):
- `NavScrolled` — transparent nav that turns solid/blurred after 80 px of scroll; owns `MobileMenu`
- `MobileMenu` — slide-in drawer, accepts `scrolled` prop to tint the hamburger lines
- `ParallaxBg` — scroll-driven `translateY` via `requestAnimationFrame`; disabled on `prefers-reduced-motion` and viewports < 768 px
- `ScrollReveal` — `IntersectionObserver` wrapper; supports `direction` (`up`/`left`/`right`/`none`) and `delay` (ms)
- `FloatingCTA` — phone + route buttons that appear on mobile after scrolling past the hero
- `OpenStatus` / `HoursTable` — live open/closed state computed in Europe/Berlin time from `src/lib/hours.ts`
- `WeatherWidget` — 4-day forecast from Open-Meteo (no key)
- `ReservationForm` — builds a WhatsApp / mailto table request; no data stored
- `ReviewCarousel` — horizontally scrolling review cards
- `Tageskarte` — preview image + PDF download from `/tageskarte.php?info`; friendly fallback when none is uploaded

**Styling.** Tailwind v4 — no `tailwind.config.ts`. All design tokens (colors, fonts) are declared in `src/app/globals.css` under `@theme inline`. CSS animation keyframes (`fadeUp`, `scaleIn`, `float`, etc.) and utility classes (`card-hover`, `img-zoom-wrap`, `link-underline`) also live there.

**Fonts.** Loaded via `next/font/google` in `src/app/layout.tsx`: Great Vibes (script wordmark), Playfair Display (headings), Lato (body). Exposed as CSS variables `--font-great-vibes`, `--font-playfair`, `--font-lato`.

**Images.** Source photos live in `../Bilder/` (outside the Next.js project root). `scripts/convert-images.mjs` uses `sharp` to produce responsive WebP files at multiple widths into `public/images/`. These WebP files are committed to git and included in `out/`. Always use `<picture>` with `srcSet` per breakpoint — do not use `next/image` optimization (it is disabled).

**Deployment path.** Document root on the server must point to the `out/` subdirectory of wherever Plesk clones the repo.
