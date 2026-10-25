# Fileopia launch plan

The examples below use `https://www.example.com`. Replace it with the real domain.

## 0. Switch to the custom domain (owner + 5 minutes)
1. In the Cloudflare dashboard, go to Workers & Pages → **freepdf-tools** → Custom domains → *Set up a domain*. Add both `example.com` and `www.example.com`. Pick one as canonical; I recommend `www`. Wait until the status shows **Active** (SSL issued).
2. Locally, run `npm run domain -- https://www.example.com`. This:
   - sets `src/site.json` baseUrl
   - moves the pages.dev host into `legacyHosts`
   - rebuilds and runs the SEO audit
3. Deploy: `npm run build:cf && CLOUDFLARE_ACCOUNT_ID=… npx wrangler@3 pages deploy dist --project-name freepdf-tools --branch main`
4. Verify:
   - `curl -I https://freepdf-tools-9u1.pages.dev/merge-pdf/` should return **301** to the new domain. This comes from the generated `functions/_middleware.js`.
   - If you chose `www`, set the apex to redirect to www with a Cloudflare Redirect Rule (or the reverse).

## 1. Google Search Console
1. Go to https://search.google.com/search-console and choose *Add property* → **Domain** → `example.com`.
2. Copy the TXT record and add it in Cloudflare DNS. You can also use the one-click "Verify with Cloudflare".
3. In Sitemaps, submit `https://www.example.com/sitemap.xml`. It is an index of the en, hi and ta sitemaps.
4. Use URL inspection → *Request indexing* on:
   - the homepage
   - /merge-pdf/, /compress-pdf/, /pdf-to-word/, /edit-pdf/, /jpg-to-pdf/
   - /tools/convert/
5. Optional: add the pages.dev URL as a URL-prefix property. Change of Address cannot be used from a pages.dev subdomain, so the 301s do this job.
6. Check **Pages** and **Core Web Vitals** reports weekly.

## 2. Bing Webmaster Tools (also feeds DuckDuckGo, Yahoo, ChatGPT search)
1. Go to https://www.bing.com/webmasters and choose *Import from Google Search Console*. This is fastest. Otherwise add the site and verify with DNS.
2. Submit the sitemap, then enable **IndexNow** under Settings. Our key file is already live.

## 3. IndexNow (implemented)
- The key is in `src/site.json` → `indexNowKey`. The build writes `/<key>.txt`.
- Run `npm run indexnow` after every deploy. It checks that the key file is live, then POSTs all sitemap URLs to api.indexnow.org, which notifies Bing, Yandex, Seznam and Naver.
- To ping only some pages: `node scripts/indexnow.js https://www.example.com/merge-pdf/`.

## 4. Directories and launch sites (all free)
Space these out over 2–3 weeks. Do not paste the same text everywhere; rotate the versions below.

**Short description (≤ 60 characters):** Free PDF tools that run in your browser – no uploads.

**Medium description (≈ 160 characters):** Fileopia: 100+ free PDF, image and document tools, including merge, compress, edit, sign, OCR and convert. Everything runs in your browser, so files never leave your device.

**Long description:**
> Fileopia is a free, privacy-first alternative to iLovePDF and Smallpdf. It has more than 100 tools: merge, split, compress, edit (including real text removal), sign, OCR, PDF to Word/Excel/PowerPoint/JPG, watermark, page numbers, PDF/A, plus image tools such as compress, resize and background removal. Every tool runs locally in your browser with WebAssembly and JavaScript. Files are never uploaded, there is no account, no daily limit and no watermark. It is available in English, Hindi and Tamil.

**Tags:** pdf, pdf editor, merge pdf, compress pdf, privacy, productivity, open web, ilovepdf alternative, smallpdf alternative

| # | Site | Notes |
|---|---|---|
| 1 | Product Hunt – producthunt.com | Launch Tuesday–Thursday at 12:01 PT (12:31 IST). Prepare 5 screenshots and a maker comment |
| 2 | AlternativeTo – alternativeto.net | List as an alternative to iLovePDF, Smallpdf, Sejda, Adobe Acrobat online |
| 3 | SaaSHub – saashub.com | Add as an alternative to iLovePDF |
| 4 | Hacker News "Show HN" | Title: "Show HN: 100+ PDF tools that never upload your files". Explain the tech |
| 5 | Reddit r/SideProject | Story post |
| 6 | Reddit r/InternetIsBeautiful | Follow the rules: no "I made", plain link |
| 7 | Reddit r/privacy, r/privacytoolsIO | Focus on the "no upload" angle; be transparent |
| 8 | Reddit r/software, r/productivity, r/webdev | Only where self-promotion is allowed |
| 9 | Reddit r/IndiaTech, r/india (Hindi/Tamil support) | |
| 10 | Indie Hackers – indiehackers.com | Product page + milestone post |
| 11 | BetaList – betalist.com | Free queue |
| 12 | Uneed – uneed.best | Free launch queue |
| 13 | Peerlist – peerlist.io/launchpad | |
| 14 | DevHunt – devhunt.org | |
| 15 | Fazier – fazier.com | |
| 16 | Microlaunch – microlaunch.net | |
| 17 | TinyLaunch – tinylaunch.com | |
| 18 | Launching Next – launchingnext.com | |
| 19 | StartupBase – startupbase.io | |
| 20 | Startup Stash – startupstash.com | |
| 21 | SideProjectors – sideprojectors.com | |
| 22 | Toolify / There's An AI For That | Only for the AI tools (background removal, chat-with-pdf) |
| 23 | Futurepedia | Same as above |
| 24 | Capterra / GetApp / Software Advice (free vendor listing) | |
| 25 | G2 – g2.com (free profile) | |
| 26 | Slant – slant.co | Answer "best online PDF editor" |
| 27 | Softpedia (web apps section) | |
| 28 | Free-For.dev / free-for-life lists on GitHub | Open a PR |
| 29 | GitHub "awesome-privacy" / "awesome-selfhosted"-style lists | PR to the relevant "online tools" section |
| 30 | PrivacyTools.io / PrivacyGuides forum | Suggestion thread |
| 31 | Dev.to | Write-up: "How I built in-browser PDF text removal" |
| 32 | Hashnode / Medium | Cross-post the technical article (canonical to your blog) |
| 33 | Twitter/X #buildinpublic | Short demo videos (GIF of edit-pdf) |
| 34 | LinkedIn | Personal post + company page |
| 35 | Quora | Answer "best free iLovePDF alternative" questions honestly |
| 36 | Stack Exchange (SuperUser) | Only where it truly answers the question |
| 37 | Hacker Noon | Technical story |
| 38 | WebToolsList / allthingsai-style tool directories | |
| 39 | Crunchbase (free company profile) | |
| 40 | Google Business Profile | Only if you have a business address |
| 41 | Bing Places | Same as above |
| 42 | Wikidata item (once notable) | |
| 43 | YourStory / Inc42 tips (India) | Pitch the "made in India, privacy-first" story |
| 44 | Tamil/Hindi tech YouTubers and Telegram channels | Free demo outreach |

## 5. Outreach ideas
- **"Best free PDF tools / iLovePDF alternatives" listicles**
  - Find them by searching for those phrases and email each author.
  - Offer a one-line differentiator: no upload, no limits, works offline after load.
- **Universities and schools**
  - IT help pages often link to "safe PDF tools". Pitch privacy for student documents.
- **Journalists and NGOs** (privacy angle): redact PDF and remove metadata run locally.
- **Comparison page:** write an honest feature table on our own site, e.g. /vs/ilovepdf/, after launch.
- **Linkable assets:**
  - "How to remove text from a PDF properly (not just cover it)" guide
  - a PDF compression benchmark post
- **Embeds:** offer a free "Compress PDF" widget or link button for bloggers.
- **Localised outreach:** Hindi and Tamil education blogs and government-form help sites (form filling, compress to 100 KB for exam portals).
- **Seasonal hooks:** exam and admission season ("compress photo to 20 KB", "PDF under 200 KB").
- **Monitoring:**
  - Track keyword positions in Search Console every week.
  - Refresh titles that sit at positions 5–15 with a better CTR hook.

## 6. Owner checklist
- [ ] Buy and provide the domain
- [ ] Add the custom domain in Cloudflare Pages (step 0)
- [ ] Run `npm run domain -- https://www.<domain>`, deploy, then `npm run indexnow`
- [ ] Verify Search Console and Bing, then submit the sitemap
- [ ] Create the accounts for the directories above (the agent did not sign up anywhere)
- [ ] Product Hunt launch date
