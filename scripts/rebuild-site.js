import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SiteBuilder } from '../src/site-builder.js';
import { CONFIG } from '../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const seedPath = path.join(ROOT, 'data', 'products-seed.json');
const products = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const builder = new SiteBuilder(CONFIG.paths.dist);
await builder.buildStaticSite(products);

console.log('✔ CampTech SG rebuild complete.');
