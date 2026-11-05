import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export const CONFIG = {
  paths: {
    root: ROOT_DIR,
    data: path.join(ROOT_DIR, 'data'),
    dist: path.join(ROOT_DIR, 'dist'),
    dashboard: path.join(ROOT_DIR, 'dashboard'),
    productFeed: path.join(ROOT_DIR, 'data', 'products-seed.json'),
    assets: path.join(ROOT_DIR, 'assets')
  },
  amazon: {
    associateTag: 'pettechsg-22',
    domain: 'amazon.sg',
    currency: 'SGD'
  },
  site: {
    name: 'CampTech SG',
    tagline: 'Singapore Tropical Camping Gear, Tents, Outdoor Electronics & Trail Apparel (2026)',
    url: 'https://camp.auraequip.com',
    locale: 'en-SG',
    contactEmail: 'rezavirtual@gmail.com',
    defaultTag: 'pettechsg-22'
  },
  categories: [
    { slug: 'tents-shelters-sleeping', name: 'Tents, Shelters & Sleeping', icon: '⛺', desc: 'Instant pop-up family tents, ultralight trekking shelters, double hammocks and self-inflating sleeping pads.' },
    { slug: 'camp-kitchen-cooking', name: 'Camp Kitchen & Cooking', icon: '🍳', desc: 'Windproof gas stoves, non-stick mess kits, pure titanium mugs, rotomolded coolers and 0.1-micron water purifiers.' },
    { slug: 'outdoor-electronics-power', name: 'Outdoor Electronics & Power', icon: '⚡', desc: 'Rugged solar power banks, 1000-lumen lanterns, waterproof headlamps, mosquito repellers and campsite fans.' },
    { slug: 'gear-tools-furniture', name: 'Gear, Tools & Furniture', icon: '🎒', desc: 'Multi-tools, ultralight folding chairs, roll-up aluminum tables, all-terrain beach wagons and first aid kits.' },
    { slug: 'outdoor-weatherproof-clothing', name: 'Weatherproof Clothing', icon: '🌧️', desc: 'UPF 50+ sun protection shirts, packable rain jackets, anti-blister Merino wool socks and convertible hiking pants.' }
  ]
};
