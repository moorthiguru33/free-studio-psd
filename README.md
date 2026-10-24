# FreePDF – 100% free, private, in-browser PDF tools

All processing runs client-side (pdf-lib fork @cantoo/pdf-lib, PDF.js, JSZip, mammoth). No uploads, no limits, no watermarks.

## Commands
- `npm install` – deps (vendored into dist/vendor at build)
- `npm run build` – generate static site into `dist/`
- `npm run preview` – build + serve at http://localhost:8788
- `npm run samples && npm test` – end-to-end tests in headless Chrome (server must be running; set CHROME=/path/to/chrome if needed)

## Layout
- `src/site.json` – brand, baseUrl (canonical/hreflang/sitemap), adsEnabled
- `src/tools.json` – tool registry (slug, accepted types)
- `src/languages.json` – 34 languages; set `enabled:true` + add `src/i18n/<code>.json` (missing keys fall back to English)
- `src/i18n/{en,ta,hi}.json` – UI, home, per-tool SEO copy, steps, FAQ
- `src/assets/app.js` – tool UI + all tool implementations (vendor libs lazy-loaded per tool)
- `src/assets/style.css`, `src/public/*` (favicon, manifest, _headers, 404)
- `scripts/build.js` – SSG: pages, JSON-LD (SoftwareApplication, HowTo, FAQPage, BreadcrumbList), hreflang, sitemap.xml, robots.txt
- `test/` – sample generator + Playwright e2e

## Deploy (Cloudflare Pages)
Build command `npm run build`, output dir `dist`. Set real domain in `src/site.json` first.
Ads: set `adsEnabled:true` to show reserved `.ad-slot` placeholders (fixed min-height to avoid layout shift); insert ad code there later.

## Phase 2
- 33 tool pages × 3 languages. Phase 2 tool code lives in `src/tools2.js` (inlined into app.js at build).
- Tools sharing code use `impl` + `preset` in `src/tools.json` (e.g. delete/extract pages → organize).
- `src/fonts/`: Noto Sans fonts (SIL OFL 1.1, see OFL.txt) for Latin/Greek/Cyrillic, Arabic, Hebrew, Thai and 9 Indic scripts, loaded lazily for the scripts the text uses. Plus sRGB2014.icc (color.org) for PDF/A.
- CJK fonts not bundled yet (large); CJK text renders as missing glyphs in Edit/Watermark/Word→PDF.
