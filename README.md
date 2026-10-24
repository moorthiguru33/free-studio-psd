# FreePDF – free, private, in-browser file tools

141 tools (PDF, image, OCR, AI, audio/video, data, converters) × 3 languages (en default, ta, hi) = static pages with hreflang.
**All processing is client-side.** No uploads, no accounts, no watermarks. Nothing is deployed from this repo automatically.

## Commands
- `npm install` – dependencies (vendored into `dist/vendor` at build)
- `sh scripts/fetch-models.sh` – **required before building for deploy**: downloads self-hosted model files into `models/` (git-ignored): Tesseract `tessdata_fast` (OCR) and U²-Net-p (background remover, 4.6 MB)
- `npm run build` – generate the static site into `dist/` (427 HTML pages)
- `npm run preview` – build + serve at http://localhost:8788 (`scripts/serve.js`, serves `.mjs`/`.wasm` with correct MIME)
- `npm run samples && npm test` – end-to-end tests in headless Chrome (phone 390×844 by default; `DESKTOP=1` for 1366×900; `ONLY=<regex>` to filter)

## Layout
- `src/site.json` brand, baseUrl (canonical/hreflang/sitemap), adsEnabled
- `src/tools.json` tool registry: `id, slug, cat, accept, multiple, maxmb, nofile, impl, vars, preset`. Landing pages (e.g. `cm-to-inches`, `mp4-to-mp3`) reuse an `impl` with preset `vars`.
- `src/core.js` shared UI runtime (upload → options → download stepper, file cards, progress, result screen, live mode)
- `src/tools/<impl>.js` one bundle per tool; `// @needs img|pdfx|htmlpdf|media` pulls helpers from `src/lib/`
- `src/i18n/{en,ta,hi}.json` + `src/i18n/<lang>/*.json` UI strings and per-tool SEO copy (title, description, H1, steps, FAQ). Missing keys fall back to English.
- `scripts/build.js` SSG: pages, JSON-LD (SoftwareApplication, HowTo, FAQPage, BreadcrumbList), hreflang, sitemap.xml, robots.txt
- `scripts/vendor/*.js` small ESM→IIFE shims bundled with esbuild (mediabunny, gifuct, gifenc, avif)
- `test/` sample generator + Playwright e2e (`test/e2e.js`)

## Deploy (when you choose to – not done)
Any static host (e.g. Cloudflare Pages): build command `sh scripts/fetch-models.sh && npm run build`, output dir `dist`. Set the real domain in `src/site.json` first. Make sure the host serves `.mjs` as `text/javascript` and `.wasm` as `application/wasm` (Cloudflare Pages does).
Ads: `adsEnabled:true` shows labelled `.ad-slot` placeholders placed **outside** the upload/options/result zones (before "related tools"). Insert ad code there later.

## Third-party licences (all permit commercial use)
| Library | Version | Licence | Used for |
|---|---|---|---|
| @cantoo/pdf-lib | 2.11 | MIT | create/edit PDFs |
| @cantoo/fontkit | 2.0 | MIT | font embedding |
| pdf-lib | 1.17 | MIT | test sample generation |
| pdfjs-dist (PDF.js) | 3.11 | Apache-2.0 | render/read PDFs |
| tesseract.js / tesseract.js-core | 7.0 | Apache-2.0 | OCR |
| tessdata_fast models | – | Apache-2.0 | OCR language data (fetched) |
| onnxruntime-web | 1.30 | MIT | AI inference (wasm) |
| U²-Net-p model (via rembg releases) | – | Apache-2.0 | background removal (fetched) |
| @vladmandic/face-api (+ tiny face detector weights) | 1.7 | MIT | blur faces |
| mediabunny | 1.62 | **MPL-2.0** | video demux/mux/transcode (WebCodecs) |
| lamejs | 1.2.1 | **LGPL-3.0** | MP3 encoding |
| heic2any (bundles libheif) | 0.0.4 | MIT wrapper, **libheif LGPL-3.0** | HEIC decoding |
| JSZip | 3.10 | MIT (dual MIT/GPL-3.0 – used under MIT) | ZIP create/extract |
| SheetJS CE (xlsx) | 0.20.3 | Apache-2.0 | Excel/ODS |
| PapaParse | 5.7 | MIT | CSV |
| mammoth | 1.13 | BSD-2-Clause | Word → HTML |
| marked | 18 | MIT | Markdown |
| gifenc / gifuct-js | 1.0 / 2.1 | MIT | GIF encode / decode |
| @jsquash/avif | 2.1 | Apache-2.0 | AVIF encode |
| UPNG.js, UTIF.js, pako | – | MIT | PNG/TIFF |
| imagetracerjs | 1.2 | Unlicense | image → SVG |
| qrcode-generator | 2.0 | MIT | QR codes |
| jsQR | 1.4 | Apache-2.0 | QR scanning |
| JsBarcode | 3.12 | MIT | barcodes |
| Noto Sans fonts | – | SIL OFL 1.1 | PDF text in many scripts |
| esbuild, playwright-core (dev) | – | MIT / Apache-2.0 | build / tests |

No GPL or AGPL code is shipped. Compliance notes for the weak-copyleft items:
- **LGPL (lamejs, libheif inside heic2any)**: shipped unmodified as separate, lazily loaded files (`/vendor/lame.min.js`, `/vendor/heic2any.min.js`) so users can replace them; keep this licence notice and link the source (npm packages). If you modify them, publish the modified source.
- **MPL-2.0 (mediabunny)**: file-level copyleft – unmodified; if you modify mediabunny's files, publish those files' source.

## Known limits
- Image enlarger/upscaler is classical (Lanczos-3 + sharpening), not an AI super-resolution model (those are 20–60 MB+ and too slow on phones).
- Background remover uses the small U²-Net-p model: good on people/products; fine hair is softened.
- Video tools need WebCodecs (Chrome/Edge 94+, Safari 17+, Firefox 130+). Very long or 4K videos are slow on phones.
- MP3 encoding is done on the main thread (lamejs); long files take a while.
- jsQR cannot read some QR codes with large logos; no PDF linearization; CJK fonts not bundled (missing glyphs in PDF text tools).
- Encrypted ZIPs are not supported.
- The brand "FreePDF" now covers more than PDF – consider a broader name/domain before launch.
