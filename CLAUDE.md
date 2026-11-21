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

**PHP on the server.** There is no fixed menu, only a weekly Tageskarte. It is uploaded via a secret link `public/tageskarte-upload.php?k=<upload_key>` (photos are downscaled in the browser, then converted server-side to an A4 PDF with no extra libs). An optional Telegram webhook `public/api/telegram-tageskarte.php` does the same. Both use `public/_tk/tageskarte-lib.php` (kept inside the webroot because the server's `open_basedir` may forbid reading outside `out/`; direct requests get 404). Config is looked up in `<repo>/mesnerhaus-config.php`, then `out/mesnerhaus-config.php`. The same page also edits the header notice banner (`hinweis.json`, served by `public/hinweis.php`, shown by `NoticeBar` inside `NavScrolled`; optional link and expiry date). Files are stored in `<repo>/storage/` if writable, else `out/tageskarte-daten/` (both gitignored). `public/tageskarte.php` serves them (`?bild` preview JPEG, `?info` JSON). Live site: `mesnerhausarmesberg.de` (canonical, `SITE_URL` in `site.ts`); `landing.mesnerhausarmesberg.de` serves the same `out/` folder. Setup: `server/README.md`. Secrets go in `mesnerhaus-config.php` on the server only, never in git.

**Reservations.** Guest booking page `/reservierungen/` (`src/app/reservierungen/page.tsx`: `OnlineBooking` → `public/api/reservierung.php`, auto-confirmed while seats are free, max 8 persons; all „Reservieren“ buttons link here) with a staff login box at the bottom (`TeamLogin`, posts to the admin, same-origin check instead of CSRF token). Admin app at `/reservierungen/verwaltung/` (PHP session, roles admin/team, vanilla JS in `public/reservierungen/verwaltung/app.js`; unauthenticated requests redirect to `/reservierungen/?login=…#team-login`). Shared logic in `public/_tk/resv-lib.php`; data in `resv-*.php` files (JSON behind a PHP exit guard) in the Tageskarte storage dir, purged 60 days after the date. Capacity = seats occupied over the reservation duration, checked in 15-min steps. Guest emails via `mail()`. Docs: `server/RESERVIERUNGEN.md`. `ReservationForm` (WhatsApp/mailto) remains as fallback when the API is unreachable.

**Privacy / consent.** No cookies, no analytics. The only consent-gated service is the Google Maps iframe (`ConsentMap`, two-click). Consent lives in localStorage `mh-consent` via `src/lib/consent.ts` (bump `CONSENT_VERSION` when adding a service, and update `/datenschutz`). `CookieBanner` is mounted in `layout.tsx`; the footer has a „Cookie-Einstellungen“ link. Weather is fetched through `public/wetter.php` (server-side proxy, 30-min cache) so visitor IPs never reach Open-Meteo. Any new third-party request from the browser needs consent gating plus a Datenschutz section.

**Pages.** Home is `src/app/page.tsx` (server component). Legal pages: `src/app/impressum/`, `src/app/datenschutz/` (shared `LegalPage` frame, `SiteFooter`). `trailingSlash: true` so they export as `out/impressum/index.html`.

**Single page.** The home page is `src/app/page.tsx` (server component). All interactive pieces are imported as client components from `src/components/`.

**Client components** (`"use client"`):
- `NavScrolled` — transparent nav that turns solid/blurred after 80 px of scroll; owns `MobileMenu`
- `MobileMenu` — slide-in drawer, accepts `scrolled` prop to tint the hamburger lines
- `ParallaxBg` — scroll-driven `translateY` via `requestAnimationFrame`; disabled on `prefers-reduced-motion` and viewports < 768 px
- `ScrollReveal` — `IntersectionObserver` wrapper; supports `direction` (`up`/`left`/`right`/`none`) and `delay` (ms)
- `FloatingCTA` — phone + route buttons that appear on mobile after scrolling past the hero
- `OpenStatus` / `HoursTable` — live open/closed state computed in Europe/Berlin time from `src/lib/hours.ts`
- `WeatherWidget` — 4-day forecast from Open-Meteo (no key)
- `OnlineBooking` — live availability + booking via the PHP API; falls back to `ReservationForm` (WhatsApp / mailto, no data stored)
- `ReviewCarousel` — horizontally scrolling review cards
- `Tageskarte` — preview image + PDF download from `/tageskarte.php?info`; friendly fallback when none is uploaded

**Styling.** Tailwind v4 — no `tailwind.config.ts`. All design tokens (colors, fonts) are declared in `src/app/globals.css` under `@theme inline`. CSS animation keyframes (`fadeUp`, `scaleIn`, `float`, etc.) and utility classes (`card-hover`, `img-zoom-wrap`, `link-underline`) also live there.

**Fonts.** Loaded via `next/font/google` in `src/app/layout.tsx`: Great Vibes (script wordmark), Playfair Display (headings), Lato (body). Exposed as CSS variables `--font-great-vibes`, `--font-playfair`, `--font-lato`.

**Images.** Source photos live in `../Bilder/` (outside the Next.js project root). `scripts/convert-images.mjs` uses `sharp` to produce responsive WebP files at multiple widths into `public/images/`. These WebP files are committed to git and included in `out/`. Always use `<picture>` with `srcSet` per breakpoint — do not use `next/image` optimization (it is disabled).

**Deployment path.** Document root on the server must point to the `out/` subdirectory of wherever Plesk clones the repo.
