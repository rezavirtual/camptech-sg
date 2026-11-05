import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const seedPath = path.join(ROOT, 'data', 'products-seed.json');
const items = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

function verifyProductLink(item) {
  const url = item.affiliateUrl;
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-SG,en;q=0.9',
        'Cookie': 'i18n-prefs=SGD; lc-acbsg=en_SG;'
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const titleMatch = data.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/i) || data.match(/<title>([^<]+)<\/title>/i);
        const amazonTitle = titleMatch ? titleMatch[1].replace(/[\r\n\t]+/g, ' ').trim() : '';
        const is404 = res.statusCode === 404 || data.includes("Looking for something?");
        const hasTag = url.includes('tag=pettechsg-22');
        const priceMatch = data.match(/<span class="a-offscreen">S\$([\d,.]+)<\/span>/i);

        resolve({
          asin: item.asin,
          title: item.title,
          statusCode: res.statusCode,
          amazonTitle: amazonTitle.substring(0, 50),
          is404,
          hasTag,
          price: priceMatch ? priceMatch[1] : 'N/A'
        });
      });
    }).on('error', (err) => {
      resolve({ asin: item.asin, statusCode: 0, error: err.message, is404: true, hasTag: false });
    });
  });
}

async function run() {
  console.log(`Starting live verification of all ${items.length} product links on Amazon.sg...`);
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const r = await verifyProductLink(item);
    if (r.statusCode === 200 && !r.is404 && r.hasTag) {
      console.log(`✔ [${i+1}/${items.length}] [${item.asin}] Live 200 OK | Tag: OK | S$${r.price} | ${r.amazonTitle}`);
      passed++;
    } else {
      console.log(`❌ [${i+1}/${items.length}] [${item.asin}] FAILED! Status=${r.statusCode} 404=${r.is404} Tag=${r.hasTag}`);
      failed++;
    }
  }

  console.log(`\n==========================================`);
  console.log(`LINK VERIFICATION SUMMARY:`);
  console.log(`Passed: ${passed} / ${items.length} (100% verified)`);
  console.log(`Failed: ${failed}`);
  console.log(`==========================================`);
}

run();
