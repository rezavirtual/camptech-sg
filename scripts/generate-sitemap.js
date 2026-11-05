import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const seedPath = path.join(ROOT, 'data', 'products-seed.json');
const items = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const baseUrl = 'https://camp.auraequip.com';
const today = new Date().toISOString().split('T')[0];

const urls = [
  { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
  { loc: `${baseUrl}/category/tents-shelters-sleeping.html`, priority: '0.9', changefreq: 'weekly' },
  { loc: `${baseUrl}/category/camp-kitchen-cooking.html`, priority: '0.9', changefreq: 'weekly' },
  { loc: `${baseUrl}/category/gear-tools-furniture.html`, priority: '0.9', changefreq: 'weekly' },
  { loc: `${baseUrl}/category/outdoor-electronics-power.html`, priority: '0.9', changefreq: 'weekly' },
  { loc: `${baseUrl}/category/outdoor-weatherproof-clothing.html`, priority: '0.9', changefreq: 'weekly' },
  { loc: `${baseUrl}/guides/singapore-tropical-camping-essential-gear-guide.html`, priority: '0.8', changefreq: 'monthly' },
  { loc: `${baseUrl}/guides/pulau-ubin-east-coast-park-campsite-checklist.html`, priority: '0.8', changefreq: 'monthly' },
  { loc: `${baseUrl}/guides/monsoon-rainproof-camp-setup-singapore.html`, priority: '0.8', changefreq: 'monthly' }
];

items.forEach(p => {
  urls.push({
    loc: `${baseUrl}/products/${p.slug}.html`,
    priority: p.isHighTicket ? '0.8' : '0.7',
    changefreq: 'weekly'
  });
});

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapContent, 'utf8');
fs.writeFileSync(path.join(ROOT, 'dist', 'sitemap.xml'), sitemapContent, 'utf8');

console.log(`✔ Generated sitemap.xml with ${urls.length} URLs in root and dist/`);
