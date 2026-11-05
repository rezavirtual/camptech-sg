import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const seedPath = path.join(ROOT, 'data', 'products-seed.json');
const items = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const assetsDir = path.join(ROOT, 'assets', 'products');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) return resolve(false);
    const file = fs.createWriteStream(dest);
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return resolve(false);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    });
    req.on('error', () => {
      file.close();
      fs.unlink(dest, () => {});
      resolve(false);
    });
    req.on('timeout', () => {
      req.destroy();
      file.close();
      fs.unlink(dest, () => {});
      resolve(false);
    });
  });
}

function fetchAmazonImageAndUrl(asin) {
  const url = `https://www.amazon.sg/dp/${asin}/?tag=pettechsg-22&linkCode=ogi&th=1&psc=1`;
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
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const imgMatch = data.match(/"landingImageUrl":"([^"]+)"/) || data.match(/data-old-hires="([^"]+)"/) || data.match(/id="landingImage"[^>]+src="([^"]+)"/);
        const img = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : null;
        resolve({
          statusCode: res.statusCode,
          img
        });
      });
    }).on('error', () => resolve({ statusCode: 0, img: null }));
  });
}

async function run() {
  console.log(`Checking images and affiliate links for ${items.length} items...`);
  let fixedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const dest = path.join(assetsDir, item.imageFile);
    let hasLocalImage = fs.existsSync(dest) && fs.statSync(dest).size > 3000;

    if (!hasLocalImage || !item.imageUrl || item.imageUrl.includes('example.jpg')) {
      console.log(`[${i+1}/${items.length}] Fetching live Amazon image for ${item.asin} (${item.title.substring(0, 40)})...`);
      const live = await fetchAmazonImageAndUrl(item.asin);
      if (live.img) {
        item.imageUrl = live.img;
        await downloadImage(live.img, dest);
        hasLocalImage = fs.existsSync(dest) && fs.statSync(dest).size > 3000;
        fixedCount++;
        console.log(`   ✔ Updated image URL & downloaded: ${dest} (${fs.statSync(dest).size} bytes)`);
      } else {
        console.log(`   ⚠️ Could not extract image from Amazon page for ${item.asin}`);
      }
    } else {
      console.log(`[${i+1}/${items.length}] ✔ Image already exists locally for ${item.asin} (${fs.statSync(dest).size} bytes)`);
    }

    // Double check affiliate URL format
    item.affiliateUrl = `https://www.amazon.sg/dp/${item.asin}/?tag=pettechsg-22&linkCode=ogi&th=1&psc=1`;
  }

  fs.writeFileSync(seedPath, JSON.stringify(items, null, 2));
  console.log(`\n✔ Completed! Verified all ${items.length} items. Updated ${fixedCount} images.`);
}

run();
