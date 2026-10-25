# FreePDF QA log

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
