# Fileopia QA log

Method: every tool tested on the LIVE site (https://freepdf-tools-9u1.pages.dev) in headless Chrome at phone (390×844) and desktop (1366×900).
- Functional suites: `test/e2e*.js` (~270 cases with output assertions, incl. no-upload check).
- Real-world stress: `test/stress.js` with heavy files: `big.pdf` (19 MB, 17 pages, photo/design pages + article, invoice, scan), `scan10.pdf` (10-page 200-dpi grey scan, skewed), `photo.jpg` (4032×3024, 15 MB), `photo.png` (3000×2000, 10 MB), `report.docx` (8 sections, images, tables, Tamil/Hindi), `video.mp4` (1080p 20 s), `audio.mp3` (3 min), `data.csv` (20k rows).
- PASS = valid non-empty output, no page errors. INPUT = tool correctly asks the user for something (not a bug).

Baseline (before this QA round, live): e2e mobile 271/271, desktop 268/271 (edit, edit-multiscript, redact-box).

## Batch 1 (tools 1–25: PDF organize/edit)
| Tool | Phone | Desktop | Notes |
|---|---|---|---|
| merge | PASS | PASS | 19 MB + 2.8 MB → 21.7 MB in 4 s |
| split | PASS | PASS | |
| rotate | PASS | PASS | 2 files → zip |
| pagenumbers | PASS | PASS | |
| jpg2pdf | PASS | PASS | 10 MB PNG |
| pdf2jpg | PASS | PASS | 17 pages in 8 s |
| compress | PASS | PASS | 19 MB → 3.5 MB |
| protect | PASS | PASS | **Fixed**: empty password showed "Something went wrong: Password?"; now a friendly hint "Please fill in “Password”." |
| unlock | PASS | PASS | |
| sign | PASS | PASS | **Fixed**: desktop preview taller than screen (couldn't see whole page while placing); preview now capped to 80% viewport height. Missing-signature message now a hint, not an error |
| edit | PASS | PASS | **Fixed**: phone sticky toolbar took ~25% of screen and covered the page; now a single scrollable row. Desktop test now passes |
| pdf2word | PASS | PASS | 17 pages → 5.7 MB docx in 13 s |
| word2pdf | PASS | PASS | images/tables/Tamil |
| organize | PASS | PASS | |
| deletepages | PASS | PASS | |
| extractpages | PASS | PASS | "Tap the pages…" now a hint |
| splitbm | INPUT | INPUT | no bookmarks → hint (was shown as an error) |
| splitsize | PASS | PASS | |
| splittext | PASS | PASS | |
| nup | PASS | PASS | |
| watermark | PASS | PASS | |
| headerfooter | PASS | PASS | |
| bates | PASS | PASS | |
| crop | PASS | PASS | |
| findreplace | PASS | PASS | |

Site-wide fix: all validation messages (o_* strings) are now shown as a yellow ℹ hint without "Sorry, that didn't work / Try again".

## Batch 2 (tools 26–50: PDF security/convert + image converters)
All tested with big.pdf / scan10.pdf / 15 MB JPG + 10 MB PNG (batch of 2), phone + desktop.
| Tool | Phone | Desktop | Notes |
|---|---|---|---|
| metadata, flatten, redact, compare, grayscale (19→3.4 MB), deskew, pdfa | PASS | PASS | |
| extractimages | PASS | PASS | **Improved**: new default "Original" format writes embedded JPEGs byte-for-byte (lossless). The 17-page file gave 18.8 MB instead of 108 MB of re-encoded PNGs. Other images still decoded to PNG |
| imgcompress (25 MB → 6.2 MB), imgresize, imgcrop, imgrotate, imgconvert | PASS | PASS | |
| png2jpg, jpg2png, webp2jpg, webp2png, jpg2webp, png2webp, avif2jpg, tiff2jpg, jpg2tiff, bmp2jpg, png2ico | PASS | PASS | |
| jpg2avif | PASS | PASS | slow on 12 MP + 6 MP photos (37 s) but works |

## Batch 3 (tools 51–75: image/graphic tools, PDF page tools, text→PDF)
| Tool | Phone | Desktop | Notes |
|---|---|---|---|
| svg2png, gif2png, heic2jpg, imgwatermark, gifmaker, img2gif, favicon, colorpicker, collage | PASS | PASS | |
| png2svg | PASS | PASS | **Fixed**: tracing a 12 MP photo took 152 s and gave a 29 MB SVG. Images are now traced at ≤1000 px with the original width/height kept: 5 s, 2.9 MB |
| meme, blurface | INPUT | INPUT | ask for text / face boxes (correct) |
| booklet, halve, overlay, pagesize, resizepdf, rasterize, webopt, removemeta, viewerprefs | PASS | PASS | halve doubles file size (each half keeps the full page image), as expected |
| searchpdf | INPUT | INPUT | asks for search term |
| txt2pdf, md2pdf, rtf2pdf | PASS | PASS | |

**Site-wide bug fixed (found here):** when several input files shared a base name (e.g. `photo.jpg` + `photo.png`), the ZIP silently kept only one output. This affected every multi-file converter in batch 2. ZIP entries are now de-duplicated (`photo.jpg`, `photo (2).jpg`).

## Batch 4 (tools 76–104: PDF→text/SVG/TIFF, OCR, AI image, audio/video, data)
| Tool | Phone | Desktop | Notes |
|---|---|---|---|
| pdf2txt, pdf2html, pdf2md, pdf2tiff | PASS | PASS | image-only pages give no text (OCR is a separate tool) |
| pdf2svg | PASS | PASS | **Fixed 3 bugs**: (1) crashed on any page with JPEG images ("reading 'subarray'"). (2) Images were `blob:` URLs that broke outside the browser; they are now embedded JPEG/PNG data, and output dropped from 338 MB to 24 MB. (3) Embedded or Type3 fonts came out as tofu boxes; those pages are now a 2× raster with an invisible, selectable text layer, and pages with plain fonts stay vector |
| ocrpdf (10-page scan, 21 s), ocr, bgremove | PASS | PASS | |
| enlarge, upscale | PASS | PASS | **Fixed**: 12 MP photo ×2 failed with "Result too large"; factor now auto-capped to the 40 MP limit |
| video2mp3, audioconv, wav2mp3, mp32wav, audiocompress, audiocut | PASS | PASS | 3-min MP3 |
| videotrim, videocrop, videocompress (15.5→3.9 MB), videomute, video2gif, gif2mp4 | PASS | PASS | 1080p 20 s |
| dataconv, csv2json, json2csv, csv2excel, excel2csv, excel2json, json2excel | PASS | PASS | 20k-row CSV |

## Batch 5 (tools 105–132: archive, AI/PDF utilities, office→PDF, remaining converters)
| Tool | Phone | Desktop | Notes |
|---|---|---|---|
| zipcreate, unzip, summarize, quizgen, extractfacts, poster, cleanpdf, repair, pdfacheck | PASS | PASS | |
| chatpdf | INPUT | INPUT | **Fixed**: "Ask a question first." was shown as an error. Messages thrown by tool code are now shown as ℹ hints |
| pdf2epub, epub2pdf, pdfspeech, formfill, formcreate, anypdf, zip2pdf | PASS | PASS | |
| viewer | PASS | PASS | **Fixed**: the phone layout scrolled sideways because the page area was 524 px on a 390 px screen. The container now shrinks to fit and pages scroll inside it |
| excel2pdf, csv2pdf (20k rows → 10.6 MB PDF), odt2pdf, pdf2excel, pdf2csv, docscan, printready, pdf2png, compresspng (10→3.7 MB), compressjpg (15→2.5 MB) | PASS | PASS | |

## No-upload tools (35: generators, calculators, text utilities, recorders)
Covered by the functional suites (QR, barcode, password, units, timers, voice/screen/webcam recorders with fake devices, etc.). All pass on phone and desktop.

## Final regression
Local e2e after all fixes: 271/271 pass. Live stress: all 132 file tools give PASS or a correct INPUT hint on phone and desktop.

## Remaining gaps
- Edit PDF still covers original text rather than deleting its content-stream operators (not attempted this round; see report).
- pdf2svg: pages with embedded/Type3 fonts are a raster image plus an invisible text layer, not pure vectors.
- jpg2avif is slow on large photos (~37 s for 18 MP total).
- pdf2txt/html/md give no text for image-only pages (use OCR PDF first).
- halve-pages doubles file size for image pages.

## Edit PDF – true content-stream editing (Oct 2026)

### Milestone 1 – remove original text (commit 8eed16e)
- Editing an existing text line removes its glyphs from the page content stream (Tj/TJ/'/", Form XObjects, Flate streams, Type0/CID Identity-H/V, simple TrueType/Type1, Type3). Neighbouring glyphs in the same TJ are kept via kerning numbers.
- New text reuses the original embedded font when every glyph is available (non-Type3, unchanged font/style); otherwise standard/Noto font.
- Verified (`test/edit-remove.js`, samples in `test/samples/real/`): invoice, type0, article, word, flyer – old line absent from `pdftotext`, new text present, render diff confined to the line. Live verified.
- Fallback to sampled cover patch: OCR lines, invisible text (Tr 3/7), non-Identity CID encodings, low glyph-match ratio.

### Milestone 2 – existing images & shapes
- New mode "◧ Images & shapes": overlays for Image XObjects, inline images (BI/ID/EI) and filled/stroked vector paths (clip paths and full-page backgrounds >97% skipped).
- Move/resize: span wrapped in `q (C·U·C⁻¹) cm … Q`; delete: operators removed; replace image: new XObject added to the stream's Resources and the Do/inline image rewritten to `/EdImN Do`; shape fill/stroke: `rg`/`RG` set before the path. No cover patches.
- Live preview re-renders the page from an edited single-page copy (debounced 250 ms).
- Verified with `test/edit-objects.js` on flyer (raster banner + circle + bars), design.pdf (inline image, line, rect, Form XObject rects), word.pdf (Image XObject + table rules), invoice.pdf: text identical before/after, renders checked.
- Overflow helper: when edited existing text grows past its original box, a warning appears; it samples the page where the text spills and flags low contrast, with "Shrink to fit" and "Use dark/light text" + colour picker (`test/edit-overflow.js`).

### Known limits
- Objects inside a Form XObject shared by several pages are changed on all those pages; same for text removal inside shared forms.
- Shading (`sh`) fills, patterns and annotations are not listed as objects; images with soft masks keep the original mask only when not replaced.

### Gap fixes (Oct 2026)
- Clip that belongs only to an image (`q [marked/gs] clip W n [q cm] IMG [Q] … Q`, the Word/LibreOffice figure pattern) is moved/scaled with the image (`Mc cm clip Mc⁻¹ cm`). Shared clips are left alone. Verified: word.pdf figure moved right/down renders fully (pixel in moved-out strip is image colour, was white).
- Deleting a shape checks text lines lying on it against the re-rendered page; if contrast < 2.5 a warning offers "Make that text dark" or a colour picker, which re-colours those lines through the text-removal path (no patches). Verified: flyer footer bar deleted -> footer text redrawn dark and still extractable.
- Form XObject shapes: design.pdf rects inside /Fm1 recoloured, moved and deleted correctly (form stream rewritten in place).
- Test: `test/edit-objects2.js`.
- Remaining: clips shared by several elements are not moved; edits inside a Form XObject reused on several pages affect all of them.

## 2026-10-25 – New tool batches
| Tool | Test | Result |
|---|---|---|
| Compress PDF to KB/MB (+100KB/200KB/300KB/500KB/1MB/2MB presets) | 2.83 MB 3-page scan (test/pdfkb.js), local + live | 100KB→37 KB, 500KB→255 KB, 1MB→682 KB, 200KB no-raster→114 KB; all 3 pages intact |
| FLAC/OGG/M4A/AAC/OPUS → MP3/WAV (10 pages, impl audioconv) | 4 s stereo samples made with ffmpeg (test/aud.js), ffprobe on output | all 10 OK in Chrome |
| WMA → MP3/WAV | – | Skipped: no browser decodes WMA; only ffmpeg.wasm could, and the stock @ffmpeg/core build bundles GPL codecs |
| Extract RAR (v4, v5) / 7Z / TAR / TAR.GZ / TAR.XZ / single .gz (libarchive.js MIT + libarchive BSD-2, 1 MB wasm lazy-loaded on Start) | test/arch.js with libarchive's own RAR test files + tar/xz/7z made locally | all extract OK; encrypted 7z shows a clear "not supported" message (libarchive can't decrypt 7z/RAR) |
| Create TAR.GZ / TAR / TAR.XZ / TAR.BZ2 / 7Z | 2 files → archive.tar.gz, verified with `tar tzf` | OK |
