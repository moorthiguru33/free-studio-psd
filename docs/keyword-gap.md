# Keyword gap: Fileopia vs iLovePDF and Smallpdf (checked 25 Oct 2026, IST)

Method: I fetched live `<title>` and `<h1>` text from ilovepdf.com and smallpdf.com and compared it with our built pages (dist/). The rule was to put the head keyword first, add one natural secondary keyword, and avoid stuffing.

| # | Keyword | iLovePDF title / H1 | Smallpdf title / H1 | Fileopia title / H1 | Status |
|---|---|---|---|---|---|
| 1 | merge pdf | Merge PDF files online… / Merge PDF files | Merge PDF: Combine PDF Files… / Merge PDF | Merge PDF – Combine PDF Files Online Free, No Upload / Merge PDF files | ✅ parity + privacy angle |
| 2 | compress pdf | Compress PDF online… / Compress PDF file | Compress PDF: Reduce PDF File Size… | Compress PDF – Reduce PDF File Size Online Free / Compress PDF | ✅ |
| 3 | pdf to word | PDF to WORD \| Convert PDF to Word… | PDF to Word Converter: Convert PDF to DOCX | PDF to Word Converter – Convert PDF to DOCX Free / Convert PDF to Word | ✅ |
| 4 | word to pdf | Convert WORD to PDF… | Free Word to PDF Converter | Word to PDF Converter Online Free – DOCX to PDF | ✅ |
| 5 | split pdf | Split PDF files online… | Split PDF: Separate PDF Pages | Split PDF – Extract Pages or Split by Range | ✅ |
| 6 | jpg to pdf | Convert JPG to PDF… | JPG to PDF Converter… | JPG to PDF – Convert Images to PDF Online Free | ✅ |
| 7 | pdf to jpg | Convert PDF to JPG… | PDF to JPG Converter… | PDF to JPG Converter Online Free | ✅ |
| 8 | edit pdf / pdf editor | Edit PDF \| Online PDF Editor / H1 PDF Editor | Free PDF Editor / Free Online PDF Editor | Edit PDF Online Free – Add Text to PDF | ✅ ("PDF editor" also used in body copy) |
| 9 | sign pdf | Sign PDF… | Free PDF Signer / eSign PDF | Sign PDF Online Free – Add Signature to PDF | ✅ |
| 10 | unlock pdf | Unlock PDF… | Unlock PDF: Remove PDF Password… | Unlock PDF Online Free – Remove PDF Password | ✅ |
| 11 | protect pdf | Protect PDF… | Password Protect PDF | Protect PDF with Password… – Encrypt PDF | ✅ |
| 12 | rotate pdf | Rotate PDF… | Rotate PDF Pages Online | Rotate PDF Online Free – Turn PDF Pages | ✅ |
| 13 | pdf to excel | PDF to EXCEL… | PDF to Excel Converter… XLSX | PDF to Excel – Convert PDF Tables to XLSX Free | ✅ |
| 14 | excel to pdf | EXCEL to PDF… | Convert Excel to PDF Online | Excel to PDF – Convert XLSX, XLS, ODS to PDF | ✅ |
| 15 | pdf to ppt / pdf to powerpoint | PDF to POWERPOINT… | PDF to PPT Converter… | **New:** PDF to PowerPoint – Convert PDF to PPT Slides Free | ✅ gap closed (new tool) |
| 16 | ppt to pdf | POWERPOINT to PDF… | PPT to PDF Converter | — | ❌ gap (needs a slide renderer) |
| 17 | pdf ocr | Make PDF searchable. Online OCR tool | PDF OCR Converter | OCR PDF Online Free – Make Scanned PDF Searchable | ✅ |
| 18 | add watermark to pdf | (URL 404 at check time) | Not found | Add Watermark to PDF Online Free… | ✅ advantage |
| 19 | add page numbers to pdf | (404) | Not found | Add Page Numbers to PDF Online Free… | ✅ advantage |
| 20 | repair pdf | Repair PDF… | Not found | Repair PDF – Fix Corrupted or Damaged PDF Files | ✅ |
| 21 | pdf to png | — | Free PDF to PNG Converter | PDF to PNG – Convert PDF to PNG Images Free | ✅ |
| 22 | delete pages from pdf | Remove PDF pages | Delete PDF Pages | Delete Pages from PDF Online Free | ✅ |
| 23 | organize pdf | Organize PDF… | — | Organize PDF Pages Online Free… | ✅ |
| 24 | pdf to pdf/a | PDF to PDF/A (404) | — | PDF to PDF/A Converter Online Free | ✅ |
| 25 | pdf reader / pdf viewer | — | PDF Viewer \| Free PDF Reader | PDF Reader Online – Open & View PDF Files Free | ✅ |
| 26 | html to pdf | HTML to PDF… | — | — | ❌ gap |
| 27 | crop pdf | Crop PDF… | Crop PDF | Crop PDF (existing) | ✅ |
| 28 | compare pdf | Compare PDF… | Compare PDF | Compare PDF (existing) | ✅ |
| 29 | redact pdf | Redact PDF… | Redact PDF | Redact PDF (existing) | ✅ |
| 30 | pdf converter | — | PDF Converter: Create & Convert PDF Files | Homepage "Free PDF Tools Online – Merge, Split, Compress, Convert" | ⚠️ no dedicated hub; /tools/convert/ category hub covers it |

## Our edge (use it in copy; it is true)
Everything runs in the browser. Files are never uploaded, there is no sign-up, no daily limit and no watermark. Competitors upload files to their servers and cap free use.

## Remaining gaps
- **PPT to PDF** and **HTML to PDF**: both need a faithful in-browser renderer. They are not built yet because a low-quality converter would hurt rankings and trust.
- 31 titles are over 70 characters and 285 meta descriptions are over 165 characters (`npm run seo` warnings). Google truncates these but does not penalise them. Shorten them over time, starting with the top-traffic pages.
- 26 Hindi and Tamil tool pages are untranslated. They now 301 to English. Translating them would add hi/ta long-tail traffic.
