import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

export class SiteBuilder {
  constructor(distDir = CONFIG.paths.dist) {
    this.distDir = distDir;
    this.productsDir = path.join(this.distDir, 'products');
    this.categoryDir = path.join(this.distDir, 'category');
    this.guidesDir = path.join(this.distDir, 'guides');
    this.dashboardDir = path.join(this.distDir, 'dashboard');
    this.assetsDir = path.join(this.distDir, 'assets');
    this.assetsProductsDir = path.join(this.assetsDir, 'products');
  }

  ensureDirectories() {
    [this.distDir, this.productsDir, this.categoryDir, this.guidesDir, this.dashboardDir, this.assetsDir, this.assetsProductsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async buildStaticSite(products) {
    console.log('[Site Builder] Compiling CampTech SG static HTML pages for GitHub Pages...');
    this.ensureDirectories();

    // 1. Output .nojekyll for GitHub Pages
    fs.writeFileSync(path.join(this.distDir, '.nojekyll'), '', 'utf-8');
    // 1. Copy product photos from assets/products to dist/assets/products
    const srcAssets = path.join(CONFIG.paths.root, 'assets', 'products');
    if (fs.existsSync(srcAssets)) {
      const files = fs.readdirSync(srcAssets);
      files.forEach(f => {
        fs.copyFileSync(path.join(srcAssets, f), path.join(this.assetsProductsDir, f));
      });
      console.log(`✔ Copied ${files.length} product photos to dist/assets/products`);
    }

    // 2. Output Management Dashboard (/dashboard/)
    const srcDashboard = path.join(CONFIG.paths.root, 'dashboard', 'index.html');
    if (fs.existsSync(srcDashboard)) {
      fs.copyFileSync(srcDashboard, path.join(this.dashboardDir, 'index.html'));
    }

    // 3. Output High-End Modern Stylesheet
    this.writeStylesheet();

    // 4. Generate Individual Product Review Pages (52 pages)
    for (const item of products) {
      const html = this.renderProductPage(item, products);
      fs.writeFileSync(path.join(this.productsDir, `${item.slug}.html`), html, 'utf-8');
    }

    // 5. Generate Category Pages (5 pages)
    const categories = [...new Set(products.map(p => p.categorySlug))];
    for (const catSlug of categories) {
      const catProducts = products.filter(p => p.categorySlug === catSlug);
      const html = this.renderCategoryPage(catSlug, catProducts, products);
      fs.writeFileSync(path.join(this.categoryDir, `${catSlug}.html`), html, 'utf-8');
    }

    // 6. Generate Singapore SEO Buyer Guides (3 guides)
    const guides = this.getSeoGuidesData(products);
    for (const guide of guides) {
      const html = this.renderGuidePage(guide, products);
      fs.writeFileSync(path.join(this.guidesDir, `${guide.slug}.html`), html, 'utf-8');
    }

    // 7. Generate Hub Index Homepage (index.html)
    const indexHtml = this.renderIndexPage(products, guides);
    fs.writeFileSync(path.join(this.distDir, 'index.html'), indexHtml, 'utf-8');

    console.log(`✔ CampTech SG compiled successfully: ${products.length} product reviews + 5 categories + ${guides.length} SEO guides.`);
  }

  writeStylesheet() {
    const css = `:root {
  --camp-primary: #15803d;
  --camp-primary-hover: #166534;
  --camp-accent: #0f766e;
  --camp-bg: #f8fafc;
  --camp-surface: #ffffff;
  --camp-border: #e2e8f0;
  --camp-border-light: #f1f5f9;
  --camp-border-hover: #cbd5e1;
  --camp-text-primary: #0f172a;
  --camp-text-secondary: #475569;
  --camp-text-tertiary: #94a3b8;
  --camp-orange: #ea580c;
  --camp-green: #16a34a;
  --ease-camp: cubic-bezier(0.16, 1, 0.3, 1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

body {
  background-color: var(--camp-bg);
  color: var(--camp-text-primary);
  line-height: 1.5;
  padding-bottom: 60px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

a { color: inherit; text-decoration: none; }

header.camp-header {
  height: 56px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--camp-border);
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
}

.camp-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--camp-text-primary);
  white-space: nowrap;
}

.brand-logo-icon {
  font-size: 1.3rem;
}

.sg-badge {
  font-size: 0.72rem;
  font-weight: 600;
  background: #ecfdf5;
  color: #065f46;
  padding: 3px 10px;
  border-radius: 980px;
  border: 1px solid #a7f3d0;
  white-space: nowrap;
}

.nav-menu {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-link {
  color: var(--camp-text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--camp-primary);
}

.hero-section {
  padding: 55px 0 35px;
  text-align: center;
  background: #ffffff;
  border-bottom: 1px solid var(--camp-border-light);
}

.eyebrow-tag {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--camp-primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.hero-title {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.15;
  margin-bottom: 14px;
  color: var(--camp-text-primary);
}

.hero-subtitle {
  max-width: 760px;
  margin: 0 auto 26px;
  font-size: 1.15rem;
  font-weight: 400;
  color: var(--camp-text-secondary);
  line-height: 1.6;
}

.hero-cta-group {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-camp-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--camp-primary);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 980px;
  transition: all 0.2s var(--ease-camp);
}

.btn-camp-primary:hover {
  background: var(--camp-primary-hover);
  transform: translateY(-1px);
}

.btn-camp-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--camp-surface);
  color: var(--camp-text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 980px;
  border: 1px solid var(--camp-border);
  transition: all 0.2s var(--ease-camp);
}

.btn-camp-secondary:hover {
  background: #f1f5f9;
}

.filter-container {
  display: flex;
  justify-content: center;
  margin: 35px 0 25px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.segmented-dock {
  display: inline-flex;
  background: #f1f5f9;
  padding: 5px;
  border-radius: 980px;
  border: 1px solid var(--camp-border);
  gap: 4px;
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
}

.segment-btn {
  background: transparent;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--camp-text-secondary);
  padding: 8px 16px;
  border-radius: 980px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.segment-btn.active, .segment-btn:hover {
  background: #ffffff;
  color: var(--camp-text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 60px;
}

.camp-card {
  background: #ffffff;
  border: 1px solid var(--camp-border);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s var(--ease-camp);
  position: relative;
}

.camp-card:hover {
  transform: translateY(-4px);
  border-color: var(--camp-border-hover);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.card-media-wrapper {
  position: relative;
  height: 260px;
  background: #ffffff;
  overflow: hidden;
  border-bottom: 1px solid var(--camp-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-media-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 36px 14px 14px 14px;
  box-sizing: border-box;
  text-decoration: none;
}

.card-img {
  max-width: 90% !important;
  max-height: 185px !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  margin: auto !important;
  display: block !important;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.camp-card:hover .card-img {
  transform: scale(1.04);
}

.card-brand-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  background: #ffffff;
  border: 1px solid var(--camp-border);
  color: var(--camp-text-primary);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 980px;
  z-index: 2;
}

.card-tier-pill {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 980px;
  background: #ffffff;
  border: 1px solid var(--camp-border);
  z-index: 2;
}

.tier-anchor { color: #0369a1; border-color: #bae6fd; background: #f0f9ff; }
.tier-trigger { color: #15803d; border-color: #bbf7d0; background: #f0fdf4; }

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-cat {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--camp-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 8px;
  color: var(--camp-text-primary);
}

.card-desc {
  font-size: 0.85rem;
  color: var(--camp-text-secondary);
  line-height: 1.5;
  margin-bottom: 14px;
  flex-grow: 1;
}

.card-features {
  list-style: none;
  margin-bottom: 16px;
}

.card-features li {
  font-size: 0.8rem;
  color: var(--camp-text-secondary);
  margin-bottom: 4px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.card-features li::before {
  content: "✔";
  color: var(--camp-green);
  font-size: 0.8rem;
  font-weight: 700;
}

.card-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--camp-border-light);
  margin-bottom: 14px;
}

.price-box {
  display: flex;
  flex-direction: column;
}

.price-current {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--camp-text-primary);
}

.price-original {
  font-size: 0.8rem;
  color: var(--camp-text-tertiary);
  text-decoration: line-through;
}

.rating-box {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--camp-text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-card-buy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #ea580c;
  color: #ffffff;
  padding: 11px 18px;
  border-radius: 980px;
  font-size: 0.88rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-card-buy:hover {
  background: #c2410c;
}

/* Guides Section */
.guides-section {
  padding: 55px 0;
  border-top: 1px solid var(--camp-border);
  background: #ffffff;
}

.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 26px;
}

.guide-card {
  background: var(--camp-bg);
  border: 1px solid var(--camp-border);
  border-radius: 16px;
  padding: 22px;
  transition: transform 0.2s ease;
}

.guide-card:hover {
  transform: translateY(-3px);
  border-color: var(--camp-border-hover);
}

.guide-tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--camp-primary);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.guide-title {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 8px;
  color: var(--camp-text-primary);
}

.guide-summary {
  font-size: 0.85rem;
  color: var(--camp-text-secondary);
  line-height: 1.5;
  margin-bottom: 14px;
}

/* Footer */
footer.camp-footer {
  background: #ffffff;
  border-top: 1px solid var(--camp-border);
  padding: 35px 0 25px;
  font-size: 0.82rem;
  color: var(--camp-text-secondary);
}

.legal-notice {
  background: #f8fafc;
  border: 1px solid var(--camp-border);
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 0.8rem;
  line-height: 1.5;
}

/* Product Detail Page Layout */
.product-detail-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 35px;
  padding: 35px 0 50px;
}

.detail-gallery {
  background: #ffffff;
  border: 1px solid var(--camp-border);
  border-radius: 20px;
  padding: 25px 20px;
  text-align: center;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 340px;
  box-sizing: border-box;
}

.detail-img {
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
  object-fit: contain;
  margin: 0 auto;
  display: block;
}

.sticky-buy-box {
  background: #ffffff;
  border: 1px solid var(--camp-border);
  border-radius: 18px;
  padding: 22px;
  position: sticky;
  top: 75px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.buy-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--camp-primary);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.buy-price-large {
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--camp-text-primary);
  margin-bottom: 8px;
}

.spec-table {
  width: 100%;
  border-collapse: collapse;
  margin: 18px 0;
  font-size: 0.88rem;
}

.spec-table td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--camp-border-light);
}

.spec-table td:first-child {
  font-weight: 600;
  color: var(--camp-text-primary);
  width: 38%;
}

.spec-table td:last-child {
  color: var(--camp-text-secondary);
}

.mobile-sticky-cta {
  display: none;
}

@media (max-width: 860px) {
  .nav-menu { display: none !important; }
  .sg-badge { display: none !important; }
  .product-detail-layout { grid-template-columns: 1fr; }
  .hero-title { font-size: 2.1rem; }
  .product-grid { grid-template-columns: 1fr; }
  .card-media-wrapper {
    height: 260px !important;
  }
  .card-media-link {
    padding: 34px 12px 12px 12px;
  }
  .card-img {
    max-height: 180px !important;
    max-width: 90% !important;
    object-fit: contain !important;
  }
  .detail-gallery {
    padding: 18px 12px;
    min-height: 250px;
  }
  .detail-img {
    max-height: 260px;
  }
  .mobile-sticky-cta {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(15px);
    border-top: 1px solid var(--camp-border);
    padding: 12px 18px;
    align-items: center;
    justify-content: space-between;
    z-index: 999;
  }
}

@media (max-width: 480px) {
  .card-media-wrapper {
    height: 250px !important;
  }
  .card-media-link {
    padding: 32px 10px 10px 10px;
  }
  .card-img {
    max-height: 175px !important;
    max-width: 88% !important;
    object-fit: contain !important;
  }
}
`;

    fs.writeFileSync(path.join(this.assetsDir, 'styles.css'), css, 'utf-8');
  }

  renderProductCard(p, isCategory = false) {
    const detailLink = isCategory ? `../products/${p.slug}.html` : `./products/${p.slug}.html`;
    const imgSrc = isCategory ? `../assets/products/${p.imageFile}` : `./assets/products/${p.imageFile}`;
    const affUrl = p.affiliateUrl || `https://www.amazon.sg/dp/${p.asin}/?tag=pettechsg-22&linkCode=ogi&th=1&psc=1`;

    return `
    <div class="camp-card" data-category="${p.categorySlug}">
      <div class="card-media-wrapper" style="position: relative; height: 260px; background: #ffffff; overflow: hidden; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
        <span class="card-brand-badge">${p.brand}</span>
        <span class="card-tier-pill ${p.isHighTicket ? 'tier-anchor' : 'tier-trigger'}">
          ${p.isHighTicket ? 'Top Performance' : 'Popular Pick'}
        </span>
        <a href="${detailLink}" class="card-media-link" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 36px 14px 14px 14px; box-sizing: border-box; text-decoration: none;">
          <img src="${imgSrc}" alt="${p.title}" class="card-img" style="max-width: 90%; max-height: 185px; width: auto; height: auto; object-fit: contain; margin: auto; display: block;" loading="lazy" onerror="this.src='${p.imageUrl}'">
        </a>
      </div>
      <div class="card-body">
        <span class="card-cat">${p.category}</span>
        <h3 class="card-title">
          <a href="${detailLink}">${p.title}</a>
        </h3>
        <p class="card-desc">${p.rawDescription || p.singaporeSpecs}</p>
        <ul class="card-features">
          ${(p.features || []).slice(0, 3).map(f => `<li>${f}</li>`).join('')}
        </ul>
        <div class="card-meta-bar">
          <div class="price-box">
            <span class="price-current">S$${p.priceSgd.toFixed(2)}</span>
            ${p.originalPriceSgd ? `<span class="price-original">S$${p.originalPriceSgd.toFixed(2)}</span>` : ''}
          </div>
          <div class="rating-box">
            ⭐ ${p.rating.toFixed(1)} <span style="color: var(--camp-text-tertiary); font-weight: normal;">(${p.reviewsCount.toLocaleString()})</span>
          </div>
        </div>
        <a href="${affUrl}" target="_blank" rel="nofollow noopener" class="btn-card-buy">
          Buy on Amazon.sg &rarr;
        </a>
      </div>
    </div>`;
  }

  renderIndexPage(products, guides) {
    const cardsHtml = products.map(p => this.renderProductCard(p, false)).join('\n');

    return `<!DOCTYPE html>
<html lang="en-SG">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampTech SG - Best Camping Equipment, Tents, Outdoor Electronics & Apparel Singapore (2026)</title>
  <meta name="description" content="Singapore's premier camping & outdoor adventure gear authority. Tested reviews of waterproof pop-up tents, camping stoves, solar power banks, multi-tools, and weatherproof clothing for East Coast Park, Pulau Ubin, and Malaysia trail expeditions.">
  <link rel="stylesheet" href="./assets/styles.css?v=20261104_v1">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CampTech SG",
    "url": "https://rezavirtual.github.io/camptech-sg",
    "description": "Singapore's Premier Tropical Camping & Outdoor Adventure Gear Authority",
    "inLanguage": "en-SG"
  }
  </script>
</head>
<body>
  <header class="camp-header">
    <div class="container camp-nav">
      <a href="./index.html" class="brand-mark">
        <span class="brand-logo-icon">🏕️</span>
        <span>CampTech SG</span>
        <span class="sg-badge">Singapore Outdoor Authority</span>
      </a>
      <nav class="nav-menu">
        <a href="#productGrid" class="nav-link">All Camping Gear</a>
        <a href="#guides" class="nav-link">Singapore Guides</a>
        <a href="./category/tents-shelters-sleeping.html" class="nav-link">Tents & Sleeping</a>
        <a href="./category/camp-kitchen-cooking.html" class="nav-link">Camp Kitchen</a>
        <a href="./category/outdoor-electronics-power.html" class="nav-link">Electronics & Power</a>
        <a href="./category/gear-tools-furniture.html" class="nav-link">Gear & Tools</a>
        <a href="./category/outdoor-weatherproof-clothing.html" class="nav-link">Outdoor Apparel</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero-section">
      <div class="container">
        <span class="eyebrow-tag">Singapore Tropical Camping & Trail Blueprint • 2026 Tested</span>
        <h1 class="hero-title">Equip Your Adventure. Tested for the Tropics.</h1>
        <p class="hero-subtitle">
          52 field-tested camping tents, portable camp stoves, rugged solar power banks, heavy-duty multi-tools, and UPF 50+ weatherproof apparel curated for Singapore coastal parks and Southeast Asian rainforest expeditions.
        </p>
        <div class="hero-cta-group">
          <a href="#productGrid" class="btn-camp-primary">Browse All 52 Camping Items &rarr;</a>
          <a href="#guides" class="btn-camp-secondary">Read Singapore Camp Guides</a>
        </div>
      </div>
    </section>

    <section class="container" id="productGrid">
      <div class="filter-container">
        <div class="segmented-dock">
          <button class="segment-btn active" onclick="filterCategory('all', this)">All Gear (${products.length})</button>
          <button class="segment-btn" onclick="filterCategory('tents-shelters-sleeping', this)">Tents & Sleeping</button>
          <button class="segment-btn" onclick="filterCategory('camp-kitchen-cooking', this)">Camp Kitchen</button>
          <button class="segment-btn" onclick="filterCategory('outdoor-electronics-power', this)">Electronics & Power</button>
          <button class="segment-btn" onclick="filterCategory('gear-tools-furniture', this)">Gear & Furniture</button>
          <button class="segment-btn" onclick="filterCategory('outdoor-weatherproof-clothing', this)">Outdoor Apparel</button>
        </div>
      </div>

      <div class="product-grid">
        ${cardsHtml}
      </div>
    </section>

    <!-- Singapore SEO Buyer Guides -->
    <section class="guides-section" id="guides">
      <div class="container">
        <span class="eyebrow-tag">Editorial Field Guides</span>
        <h2 style="font-size: 2.1rem; font-weight: 800; letter-spacing: -0.03em; color: var(--camp-text-primary);">
          Singapore Camping & Wilderness Survival Blueprints
        </h2>
        <p style="color: var(--camp-text-secondary); font-size: 1.05rem; margin-top: 6px;">
          Expert-tested guides on park camping permits, tropical monsoon waterproofing, and island bushcraft for Singaporeans.
        </p>
        <div class="guides-grid">
          ${guides.map(g => `
            <div class="guide-card">
              <div class="guide-tag">Singapore Field Guide</div>
              <h3 class="guide-title"><a href="./guides/${g.slug}.html">${g.seoTitle}</a></h3>
              <p class="guide-summary">${g.summary}</p>
              <a href="./guides/${g.slug}.html" style="font-weight: 600; font-size: 0.88rem; color: var(--camp-primary);">
                Read Full Blueprint &rarr;
              </a>
            </div>
          `).join('\n')}
        </div>
      </div>
    </section>
  </main>

  <footer class="camp-footer">
    <div class="container">
      <div class="legal-notice">
        <strong>Affiliate & Fulfillment Notice:</strong> CampTech SG is an independent camping, outdoor gear, and wilderness research publication. All products featured are available directly on Amazon Singapore (Amazon.sg) with fast local Prime delivery and return coverage. As an Amazon Associate, CampTech SG earns from qualifying purchases.
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>Copyright &copy; 2026 CampTech SG. All rights reserved.</div>
        <div>Tested for Singapore Tropical Climate & Coastal Parks</div>
      </div>
    </div>
  </footer>

  <script>
    function filterCategory(cat, btn) {
      document.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cards = document.querySelectorAll('.camp-card');
      cards.forEach(c => {
        if (cat === 'all' || c.getAttribute('data-category') === cat) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;
  }

  renderCategoryPage(catSlug, catProducts, allProducts) {
    const catMeta = CONFIG.categories.find(c => c.slug === catSlug) || { name: catSlug, desc: '' };
    const cardsHtml = catProducts.map(p => this.renderProductCard(p, true)).join('\n');

    return `<!DOCTYPE html>
<html lang="en-SG">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${catMeta.name} Singapore - Best Camping Gear & Reviews (2026)</title>
  <meta name="description" content="${catMeta.desc}">
  <link rel="stylesheet" href="../assets/styles.css?v=20261104_v1">
</head>
<body>
  <header class="camp-header">
    <div class="container camp-nav">
      <a href="../index.html" class="brand-mark">
        <span class="brand-logo-icon">🏕️</span>
        <span>CampTech SG</span>
      </a>
      <nav class="nav-menu">
        <a href="../index.html" class="nav-link">All Gear (52)</a>
        <a href="../index.html#guides" class="nav-link">Singapore Guides</a>
      </nav>
    </div>
  </header>

  <main class="container" style="padding-top: 40px;">
    <div style="margin-bottom: 30px;">
      <a href="../index.html" style="font-size: 0.85rem; color: var(--camp-primary); font-weight: 600;">&larr; Return to All Camping Gear</a>
      <h1 style="font-size: 2.2rem; font-weight: 800; margin-top: 10px;">${catMeta.name}</h1>
      <p style="color: var(--camp-text-secondary); margin-top: 6px; font-size: 1.05rem;">${catMeta.desc}</p>
    </div>

    <div class="product-grid">
      ${cardsHtml}
    </div>
  </main>
</body>
</html>`;
  }

  renderProductPage(product, allProducts) {
    return `<!DOCTYPE html>
<html lang="en-SG">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.title} - Singapore Price & Camping Review (2026)</title>
  <meta name="description" content="${product.rawDescription}">
  <link rel="stylesheet" href="../assets/styles.css?v=20261104_v1">
</head>
<body>
  <header class="camp-header">
    <div class="container camp-nav">
      <a href="../index.html" class="brand-mark">
        <span class="brand-logo-icon">🏕️</span>
        <span>CampTech SG</span>
      </a>
      <nav class="nav-menu">
        <a href="../index.html" class="nav-link">All Gear (52)</a>
        <a href="../category/${product.categorySlug}.html" class="nav-link">${product.category}</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="product-detail-layout">
      <div>
        <div style="margin-bottom: 20px;">
          <a href="../category/${product.categorySlug}.html" style="font-size: 0.85rem; color: var(--camp-primary); font-weight: 600;">&larr; ${product.category}</a>
          <h1 style="font-size: 2rem; font-weight: 800; margin-top: 8px; line-height: 1.25;">${product.title}</h1>
          <div style="display: flex; gap: 12px; align-items: center; margin-top: 8px;">
            <span style="font-weight: 700; color: var(--camp-primary);">Brand: ${product.brand}</span>
            <span style="color: var(--camp-text-tertiary);">•</span>
            <span>⭐ ${product.rating.toFixed(1)} (${product.reviewsCount.toLocaleString()} reviews)</span>
          </div>
        </div>

        <div class="detail-gallery">
          <img src="../assets/products/${product.imageFile}" alt="${product.title}" class="detail-img" onerror="this.src='${product.officialImageUrl}'">
        </div>

        <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 12px;">Singapore Environmental & Field Specifications</h2>
        <p style="font-size: 1rem; color: var(--camp-text-secondary); line-height: 1.6; margin-bottom: 25px;">
          ${product.singaporeSpecs}
        </p>

        <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 12px;">Field Test Evaluation</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px;">
            <h3 style="color: #166534; font-size: 0.95rem; font-weight: 700; margin-bottom: 10px;">Why Campers Love It</h3>
            <ul style="list-style: none; font-size: 0.85rem; color: #14532d; display: flex; flex-direction: column; gap: 6px;">
              ${product.pros.map(pro => `<li>✔ ${pro}</li>`).join('')}
            </ul>
          </div>
          <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 14px; padding: 18px;">
            <h3 style="color: #9f1239; font-size: 0.95rem; font-weight: 700; margin-bottom: 10px;">Things to Consider</h3>
            <ul style="list-style: none; font-size: 0.85rem; color: #881337; display: flex; flex-direction: column; gap: 6px;">
              ${product.cons.map(con => `<li>✖ ${con}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div class="sticky-buy-box">
          <span class="buy-eyebrow">Verified Amazon.sg Listing</span>
          <div class="buy-price-large">S$${product.priceSgd.toFixed(2)}</div>
          <p style="font-size: 0.85rem; color: var(--camp-text-secondary); margin-bottom: 14px;">
            Local fulfillment with Singapore Prime fast shipping and easy Amazon 30-day returns.
          </p>
          <a href="${product.affiliateUrl}" target="_blank" rel="nofollow noopener" class="btn-card-buy" style="width: 100%; box-sizing: border-box; text-align: center; justify-content: center; padding: 14px;">
            Check Price on Amazon.sg &rarr;
          </a>

          <table class="spec-table">
            <tr><td>ASIN</td><td>${product.asin}</td></tr>
            <tr><td>Brand</td><td>${product.brand}</td></tr>
            <tr><td>Category</td><td>${product.category}</td></tr>
            <tr><td>Fulfillment</td><td>Amazon.sg Prime</td></tr>
            <tr><td>Tracking ID</td><td>pettechsg-22</td></tr>
          </table>
        </div>
      </div>
    </div>
  </main>

  <div class="mobile-sticky-cta">
    <div>
      <div style="font-size: 1.25rem; font-weight: 800; color: var(--camp-text-primary);">S$${product.priceSgd.toFixed(2)}</div>
      <div style="font-size: 0.72rem; color: var(--camp-text-secondary);">Prime Delivery Available</div>
    </div>
    <a href="${product.affiliateUrl}" target="_blank" rel="nofollow noopener" class="btn-card-buy" style="padding: 10px 22px;">
      Buy on Amazon.sg &rarr;
    </a>
  </div>
</body>
</html>`;
  }

  renderGuidePage(guide, products) {
    return `<!DOCTYPE html>
<html lang="en-SG">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${guide.seoTitle} - CampTech SG</title>
  <meta name="description" content="${guide.summary}">
  <link rel="stylesheet" href="../assets/styles.css?v=20261104_v1">
</head>
<body>
  <header class="camp-header">
    <div class="container camp-nav">
      <a href="../index.html" class="brand-mark">
        <span class="brand-logo-icon">🏕️</span>
        <span>CampTech SG</span>
      </a>
      <nav class="nav-menu">
        <a href="../index.html" class="nav-link">All Gear (52)</a>
        <a href="../index.html#guides" class="nav-link">All Guides</a>
      </nav>
    </div>
  </header>

  <main class="container" style="max-width: 820px; padding: 45px 20px 80px;">
    <a href="../index.html#guides" style="font-size: 0.85rem; color: var(--camp-primary); font-weight: 600;">&larr; Back to Singapore Guides</a>
    <h1 style="font-size: 2.3rem; font-weight: 800; margin: 14px 0 16px; line-height: 1.25;">${guide.title}</h1>
    <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 1rem; color: var(--camp-text-secondary); line-height: 1.6; margin-bottom: 30px;">
      <strong>Executive Field Summary:</strong> ${guide.summary}
    </div>

    <div style="font-size: 1.05rem; line-height: 1.7; color: var(--camp-text-primary);">
      ${guide.content}
    </div>
  </main>
</body>
</html>`;
  }

  getSeoGuidesData(products) {
    return [
      {
        slug: "singapore-coastal-camping-east-coast-park-permits-gear-guide",
        seoTitle: "Singapore Coastal Camping: East Coast Park & Pasir Ris Permits & Gear Guide (2026)",
        title: "Singapore Coastal Camping Blueprint: East Coast Park & Pasir Ris Camping Permits, Setup & Gear",
        summary: "Step-by-step guide on obtaining free NParks camping permits for East Coast Park (Areas D & G), Pasir Ris Park, and West Coast Park. Essential sand pegs, ground tarps, and coastal wind defense tips.",
        content: `
        <h2>1. Applying for Free NParks Camping Permits in Singapore</h2>
        <p>Camping in Singapore is strictly legal in designated park zones operated by the National Parks Board (NParks). Approved coastal camping sites include <strong>East Coast Park (Area D and Area G)</strong>, <strong>Pasir Ris Park (Area 1 and Area 3)</strong>, and <strong>West Coast Park (Designated Area 2)</strong>. Permits are free and can be applied through the AXS mobile app or AXS station up to 2 weeks in advance with your Singpass.</p>
        
        <h2>2. Defeating Sandy Soil & Coastal Sea Breezes</h2>
        <p>Standard wire tent stakes will pull out of loose beach sand in the first 20-knot sea breeze. Bring specialized spiral sand pegs or use the "deadman anchor" method: tie guylines to sandbags or heavy driftwood buried 20cm into the sand. Set up your tent with the narrowest profile facing the prevailing wind direction to minimize flap noise and prevent pole bending.</p>

        <h2>3. Nighttime Temperature & Humidity Management</h2>
        <p>Even on cool coastal evenings, humidity inside an enclosed tent can reach 95%, causing condensation to drip onto sleeping bags. Choose a double-layer tent with expansive B3 micromesh inner walls (such as Naturehike Cloud-Up or Coleman Instant) and set up a rechargeable 10,000mAh tent fan (AMACOOL) to circulate air throughout the night.</p>
        `
      },
      {
        slug: "tropical-monsoon-rain-camping-malaysia-singapore-waterproofing-blueprint",
        seoTitle: "Tropical Monsoon Camping: 3000mm+ Waterproofing Blueprint for Singapore & Malaysia",
        title: "Tropical Rain & Monsoon Camping Blueprint: Surviving 100mm/hr Equatorial Downpours",
        summary: "How to stay bone-dry during heavy tropical monsoon thunderstorms. Why hydrostatic head ratings matter, how to rig elevated rain flies, and trenching techniques.",
        content: `
        <h2>1. Understanding Hydrostatic Head (PU Ratings) in the Tropics</h2>
        <p>Standard European or North American summer tents rated at 1500mm PU will leak when hammered by intense Southeast Asian monsoon thunderstorms where rain falls at over 80mm to 100mm per hour. For Singapore, coastal islands, and Malaysian trekking, prioritize gear with at least <strong>3000mm to 4000mm PU waterproof ratings</strong> on the rainfly and welded bathtub floor seams.</p>

        <h2>2. The Tarp Overhead Defense Strategy</h2>
        <p>Never rely solely on your tent's rainfly during monsoon season. Rig an expansive 3x3m or 4x4m ripstop nylon tarp (such as Unigear Ripstop Tarp) directly above your tent in a high A-frame or wedge pitch. This deflects the initial kinetic velocity of large tropical raindrops, prevents mud splashing onto mesh walls, and creates a dry front porch for cooking and removing muddy boots.</p>

        <h2>3. Trenching & Ground Slope Drainage</h2>
        <p>Always pitch your tent on high ground. Using a folding entrenching tool (like the SOG folding shovel), dig a shallow 5cm runoff gully around the uphill side of your tent to channel torrential ground water safely around your sleeping footprint.</p>
        `
      },
      {
        slug: "pulau-ubin-overnight-bushcraft-camping-survival-gear-guide",
        seoTitle: "Pulau Ubin Overnight Bushcraft Guide: Gear Checklist & Leave-No-Trace Rules (2026)",
        title: "Pulau Ubin Overnight Bushcraft & Campsite Survival: Gear, Monkeys & Water Strategy",
        summary: "Everything you need to know for camping at Jelutong, Mamam, or Noordin Beach on Pulau Ubin. Wildlife protection from wild boars and long-tailed macaques, water filtration, and off-grid power.",
        content: `
        <h2>1. Choosing Your Ubin Campsite: Jelutong vs Mamam vs Noordin</h2>
        <p>Pulau Ubin offers three official campsites: <strong>Jelutong Beach</strong> (most spacious, close to Ubin town with campfire pit rings), <strong>Mamam Beach</strong> (shaded by coastal sea almond trees with clean toilet amenities), and <strong>Noordin Beach</strong> (remote northern coast facing the Johor Straits). No NParks camping permit is required for Pulau Ubin, but campers must register upon arrival at the Pulau Ubin Police Post.</p>

        <h2>2. Wildlife Defense: Long-Tailed Macaques & Wild Boars</h2>
        <p>Pulau Ubin has active wildlife populations. Never store food inside your sleeping tent. Store all snacks, instant noodles, and trash in airtight dry bags (Earth Pak 20L) and suspend them using 550 military paracord at least 3 meters off the ground from sturdy tree branches. Keep your camp kitchen clean and clear before dusk.</p>

        <h2>3. Water Filtration & Emergency Communication</h2>
        <p>Campsite tap water on Pulau Ubin is non-potable and must be boiled or filtered through a 0.1-micron hollow fiber membrane (Sawyer Mini) before drinking. Cellular data signals can drop along forested valleys; keep a high-output waterproof headlamp and long-range two-way radios (Motorola T260) in your pack for safety.</p>
        `
      }
    ];
  }
}
