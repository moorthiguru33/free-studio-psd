# Fileopia Global Languages & Assets Backup

This folder contains complete backups of all 20 international language translations and configurations for Fileopia.

## Contents
- `i18n/`: Full translations, UI strings, runtime files, and tool descriptions for all 20 world languages:
  - English (`en`), Spanish (`es`), Portuguese (`pt`), French (`fr`), German (`de`)
  - Simplified Chinese (`zh-cn`), Traditional Chinese (`zh-tw`), Japanese (`ja`), Korean (`ko`)
  - Arabic (`ar`), Hindi (`hi`), Indonesian (`id`), Turkish (`tr`), Vietnamese (`vi`)
  - Russian (`ru`), Polish (`pl`), Dutch (`nl`), Thai (`th`), Ukrainian (`uk`), Tamil (`ta`)
- `languages-full-20.json`: Complete 20-language configuration for unconstrained platforms (Netlify, VPS, Dedicated Nginx) with 56,000+ pages.

## Cloudflare Pages Compliance
Cloudflare Pages imposes a hard platform limit of **20,000 files per deployment**.
For Cloudflare Pages deployment, the 6 largest global languages are active in production:
1. English (`en`)
2. Spanish (`es`)
3. Portuguese (`pt`)
4. French (`fr`)
5. German (`de`)
6. Simplified Chinese (`zh-cn`)

Total deployment footprint: **~16,880 files** (fully compliant with Cloudflare's 20,000 limit).
All remaining languages automatically redirect via HTTP 301 to preserve SEO equity.
