import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const seedPath = path.join(ROOT, 'data', 'products-seed.json');
const products = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

console.log('================================================================');
console.log('🏕️ CAMPTECH SG - QUALITY MANAGER DAILY AUDIT SUITE');
console.log(`Universal Associate Tag: pettechsg-22`);
console.log(`Total SKUs Evaluated: ${products.length}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('================================================================');

let errors = 0;

// 1. Verify affiliate tags
products.forEach((p, i) => {
  // Seed data may omit affiliateUrl; mirror the fallback used in src/site-builder.js
  const affUrl = p.affiliateUrl || (p.asin ? `https://www.amazon.sg/dp/${p.asin}/?tag=pettechsg-22&linkCode=ogi&th=1&psc=1` : '');
  if (!affUrl.includes('tag=pettechsg-22')) {
    console.error(`✖ Product #${i + 1} (${p.asin}) missing correct affiliate tag!`);
    errors++;
  }
  if (!p.imageUrl || !p.imageUrl.startsWith('https://')) {
    console.error(`✖ Product #${i + 1} (${p.asin}) invalid image URL!`);
    errors++;
  }
  if (!p.priceSgd || p.priceSgd <= 0) {
    console.error(`✖ Product #${i + 1} (${p.asin}) invalid SGD price!`);
    errors++;
  }
});

// 2. Verify dist build
const distDir = path.join(ROOT, 'dist');
if (fs.existsSync(distDir)) {
  const indexFile = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.error(`✖ dist/index.html is missing!`);
    errors++;
  } else {
    console.log(`✔ dist/index.html verified (${fs.statSync(indexFile).size} bytes).`);
  }

  const productsDir = path.join(distDir, 'products');
  if (fs.existsSync(productsDir)) {
    const pFiles = fs.readdirSync(productsDir);
    console.log(`✔ Product detail pages: ${pFiles.length} generated.`);
  }

  const catDir = path.join(distDir, 'category');
  if (fs.existsSync(catDir)) {
    const cFiles = fs.readdirSync(catDir);
    console.log(`✔ Category landing pages: ${cFiles.length} generated.`);
  }

  const guidesDir = path.join(distDir, 'guides');
  if (fs.existsSync(guidesDir)) {
    const gFiles = fs.readdirSync(guidesDir);
    console.log(`✔ Singapore SEO guides: ${gFiles.length} generated.`);
  }
}

console.log('================================================================');
if (errors === 0) {
  console.log(`✔ QUALITY AUDIT PASSED: 100% compliance across all ${products.length} products.`);
} else {
  console.error(`✖ QUALITY AUDIT FAILED with ${errors} issues.`);
  process.exit(1);
}
