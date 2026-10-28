#!/usr/bin/env node
// Automated IndexNow Submission Engine for Fileopia
// Submits all 10,000+ URLs to Bing, Yandex, Naver, and Seznam for instant crawling.

const fs = require('fs');
const path = require('path');
const https = require('https');

const INDEXNOW_KEY = '8b4c9e1205fe4379a78e47c729e81b6d';
const HOST = 'fileopia.com';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

// 1. Ensure verification key file exists in dist and src/assets
const R = p => path.join(__dirname, '..', p);
fs.writeFileSync(R(`dist/${INDEXNOW_KEY}.txt`), INDEXNOW_KEY, 'utf8');
if (fs.existsSync(R('src/assets'))) {
  fs.writeFileSync(R(`src/assets/${INDEXNOW_KEY}.txt`), INDEXNOW_KEY, 'utf8');
}
console.log(`[IndexNow] Verification key file active at /${INDEXNOW_KEY}.txt`);

// 2. Extract URLs from sitemaps
const urls = [];
const sitemapIndex = R('dist/sitemap.xml');
if (fs.existsSync(sitemapIndex)) {
  const content = fs.readFileSync(sitemapIndex, 'utf8');
  const locMatches = [...content.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)];
  
  // If sitemap index links to sub-sitemaps
  if (locMatches.some(m => m[1].includes('sitemap-') || m[1].endsWith('.xml'))) {
    for (const match of locMatches) {
      const subUrl = match[1];
      const filename = path.basename(subUrl);
      const subPath = R(`dist/${filename}`);
      if (fs.existsSync(subPath)) {
        const subContent = fs.readFileSync(subPath, 'utf8');
        for (const sm of subContent.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)) {
          urls.push(sm[1]);
        }
      }
    }
  } else {
    for (const m of locMatches) urls.push(m[1]);
  }
}

// Fallback: If sitemaps were empty or small, read HTML pages in dist
if (urls.length < 100) {
  function scan(dir, prefix = '') {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        scan(p, prefix + f + '/');
      } else if (f === 'index.html') {
        urls.push(`https://${HOST}/${prefix}`);
      }
    }
  }
  scan(R('dist'));
}

const uniqueUrls = Array.from(new Set(urls));
console.log(`[IndexNow] Discovered ${uniqueUrls.length} unique URLs to index.`);

// 3. Submit in batches of 10,000 (IndexNow API limit)
async function submitBatch(batch, batchNum, totalBatches) {
  const payload = JSON.stringify({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: batch
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.indexnow.org',
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      console.log(`[IndexNow] Batch ${batchNum}/${totalBatches} (${batch.length} URLs) -> HTTP ${res.statusCode}: ${res.statusMessage}`);
      resolve(res.statusCode);
    });

    req.on('error', err => {
      console.log(`[IndexNow] Batch ${batchNum}/${totalBatches} network notice: ${err.message}`);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  const BATCH_SIZE = 9500;
  const batches = [];
  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    batches.push(uniqueUrls.slice(i, i + BATCH_SIZE));
  }

  console.log(`[IndexNow] Prepared ${batches.length} batch(es). Submitting to Bing, Yandex, Naver...`);
  for (let i = 0; i < batches.length; i++) {
    await submitBatch(batches[i], i + 1, batches.length);
  }
  console.log('[IndexNow] Submission process completed successfully.');
}

main();
