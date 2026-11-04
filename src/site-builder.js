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
    // Copy catalog-filters.js to dist/assets/
    const srcFiltersJs = path.join(CONFIG.paths.root, 'assets', 'catalog-filters.js');
    if (fs.existsSync(srcFiltersJs)) {
      fs.copyFileSync(srcFiltersJs, path.join(this.assetsDir, 'catalog-filters.js'));
    }

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



/* ==========================================================================
   INTERACTIVE SORTING & FILTERING CONTROL PANEL (COLLAPSIBLE + PAGINATED)
   ========================================================================== */
.filter-action-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 28px 0 16px;
  gap: 14px;
  flex-wrap: wrap;
}

.btn-toggle-filters {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  color: var(--camp-primary);
  border: 1.5px solid var(--camp-primary);
  padding: 10px 20px;
  border-radius: 980px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(21, 128, 61, 0.08);
}

.btn-toggle-filters:hover, .btn-toggle-filters.btn-active {
  background: #ecfdf5;
  border-color: var(--camp-primary-hover);
  color: var(--camp-primary-hover);
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.15);
}

.filter-count-badge {
  background: var(--camp-primary);
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 980px;
  line-height: 1.2;
}

.toggle-chevron {
  font-size: 0.72rem;
  transition: transform 0.2s ease;
}

.toolbar-status {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--camp-text-secondary);
}

.toolbar-active-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* Control Panel Drawer (Hidden by default, shown on click) */
.catalog-control-panel {
  display: none;
  background: #ffffff;
  border: 1.5px solid #bbf7d0;
  border-radius: 18px;
  padding: 22px 24px;
  margin: 0 0 25px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.07);
  animation: filterSlideDown 0.25s ease-out;
}

@keyframes filterSlideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-close-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--camp-border-light);
}

.btn-done-filters {
  background: var(--camp-primary);
  color: #ffffff;
  border: none;
  padding: 9px 20px;
  border-radius: 980px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-done-filters:hover {
  background: var(--camp-primary-hover);
}

.control-row-primary {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-box-wrapper {
  position: relative;
  flex: 1 1 360px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  font-size: 1rem;
  color: var(--camp-text-tertiary);
  pointer-events: none;
}

#searchInput {
  width: 100%;
  height: 44px;
  padding: 0 40px 0 42px;
  border-radius: 12px;
  border: 1px solid var(--camp-border);
  background: #f8fafc;
  color: var(--camp-text-primary);
  font-size: 0.92rem;
  font-weight: 500;
  transition: all 0.2s ease;
  outline: none;
}

#searchInput:focus {
  background: #ffffff;
  border-color: var(--camp-primary);
  box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: #e2e8f0;
  border: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.72rem;
  color: var(--camp-text-secondary);
  transition: background 0.2s;
}

.clear-search-btn:hover {
  background: #cbd5e1;
}

.sort-box-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.control-label {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--camp-text-secondary);
  white-space: nowrap;
}

.camp-select {
  height: 44px;
  padding: 0 34px 0 14px;
  border-radius: 12px;
  border: 1px solid var(--camp-border);
  background: #f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--camp-text-primary);
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.camp-select:focus, .camp-select:hover {
  border-color: var(--camp-primary);
  background-color: #ffffff;
}

.control-row-secondary {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--camp-border-light);
}

.filter-dropdown-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-reset-filters {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  padding: 9px 16px;
  border-radius: 980px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
}

.btn-reset-filters:hover {
  background: #fecaca;
  color: #991b1b;
}

.segmented-dock-wrapper {
  margin-top: 14px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.active-filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  flex-wrap: wrap;
  gap: 10px;
}

.counter-display {
  font-size: 0.88rem;
  color: var(--camp-text-secondary);
  font-weight: 500;
}

.count-highlight {
  font-weight: 800;
  color: var(--camp-primary);
  font-size: 1rem;
}

.active-badge-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-pill-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 980px;
  cursor: pointer;
}

.filter-pill-tag:hover {
  background: #d1fae5;
}

.no-results-state {
  text-align: center;
  padding: 60px 20px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid var(--camp-border);
  margin-bottom: 50px;
}

.no-results-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.no-results-state h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--camp-text-primary);
  margin-bottom: 8px;
}

.no-results-state p {
  color: var(--camp-text-secondary);
  font-size: 0.95rem;
  margin-bottom: 22px;
}

/* Pagination Navigation (12 items per page) */
.pagination-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 45px 0 60px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 42px;
  height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--camp-border);
  color: var(--camp-text-primary);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  user-select: none;
}

.page-btn:hover {
  border-color: var(--camp-primary);
  color: var(--camp-primary);
  background: #f0fdf4;
}

.page-btn.active {
  background: var(--camp-primary);
  color: #ffffff;
  border-color: var(--camp-primary);
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.25);
}

.page-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
  border-color: var(--camp-border-light);
}

.page-arrow {
  padding: 0 16px;
  font-weight: 700;
}

.page-dots {
  padding: 0 6px;
  color: var(--camp-text-tertiary);
  font-weight: 800;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .catalog-control-panel {
    padding: 16px;
    margin: 0 0 18px;
  }
  .control-row-primary {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .search-box-wrapper {
    flex: 1 1 100%;
  }
  .sort-box-wrapper {
    width: 100%;
    justify-content: space-between;
  }
  .sort-box-wrapper .camp-select {
    flex: 1;
  }
  .control-row-secondary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding-bottom: 14px;
  }
  .filter-dropdown-group {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .filter-dropdown-group .camp-select {
    width: 100%;
  }
  .btn-reset-filters {
    grid-column: span 2;
    text-align: center;
    width: 100%;
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .filter-action-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .btn-toggle-filters {
    justify-content: center;
    width: 100%;
  }
  .toolbar-status {
    text-align: center;
  }
  .page-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 10px;
    font-size: 0.84rem;
    border-radius: 10px;
  }
  .page-arrow {
    padding: 0 12px;
  }
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

  renderProductCard(p, isCategory = false, index = 0) {
    const detailLink = isCategory ? `../products/${p.slug}.html` : `./products/${p.slug}.html`;
    const imgSrc = isCategory ? `../assets/products/${p.imageFile}` : `./assets/products/${p.imageFile}`;
    const affUrl = p.affiliateUrl || `https://www.amazon.sg/dp/${p.asin}/?tag=pettechsg-22&linkCode=ogi&th=1&psc=1`;
    const searchTokens = [p.brand, p.title, p.category, (p.features || []).join(' '), p.rawDescription || ''].join(' ').toLowerCase().replace(/"/g, '&quot;');

    return `
    <div class="camp-card" 
         data-category="${p.categorySlug}" 
         data-brand="${p.brand}" 
         data-price="${p.priceSgd}" 
         data-rating="${p.rating}" 
         data-reviews="${p.reviewsCount}" 
         data-tier="${p.isHighTicket ? 'anchor' : 'trigger'}" 
         data-title="${p.title.toLowerCase().replace(/"/g, '&quot;')}"
         data-search="${searchTokens}"
         data-original-index="${index}">
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
    const cardsHtml = products.map((p, idx) => this.renderProductCard(p, false, idx)).join('\n');

    // Brand counts for dropdown
    const brandCounts = {};
    products.forEach(p => {
      brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    });
    const topBrands = Object.entries(brandCounts).sort((a,b) => b[1] - a[1]);
    const brandOptionsHtml = topBrands.map(([b, count]) => 
      `<option value="${b}">${b} (${count})</option>`
    ).join('\n              ');

    return `<!DOCTYPE html>
<html lang="en-SG">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampTech SG - Best Camping Equipment, Tents, Outdoor Electronics & Apparel Singapore (2026)</title>
  <meta name="description" content="Singapore's premier camping & outdoor adventure gear authority. Tested reviews of waterproof pop-up tents, camping stoves, solar power banks, multi-tools, and weatherproof clothing for East Coast Park, Pulau Ubin, and Malaysia trail expeditions.">
  <link rel="stylesheet" href="./assets/styles.css?v=20261104_v3">
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
          ${products.length} field-tested camping tents, portable camp stoves, rugged solar power banks, heavy-duty multi-tools, and UPF 50+ weatherproof apparel curated for Singapore coastal parks and Southeast Asian rainforest expeditions.
        </p>
        <div class="hero-cta-group">
          <a href="#productGrid" class="btn-camp-primary">Browse All ${products.length} Camping Items &rarr;</a>
          <a href="#guides" class="btn-camp-secondary">Read Singapore Camp Guides</a>
        </div>
      </div>
    </section>

    <section class="container" id="productGrid">
      <!-- Collapsible Filter Action Toolbar (Visible by default) -->
      <div class="filter-action-toolbar">
        <button id="toggleFilterBtn" class="btn-toggle-filters" onclick="toggleFilterDrawer()">
          <span>🔍</span>
          <span id="toggleBtnText">Filter & Search Options</span>
          <span id="activeFilterBadge" class="filter-count-badge" style="display: none;">0</span>
          <span id="toggleChevron" class="toggle-chevron">▼</span>
        </button>

        <div class="toolbar-status">
          Showing <span id="displayedCount" class="count-highlight">1–12</span> of <span id="totalCount" class="count-total">${products.length}</span> items
        </div>

        <div id="toolbarActiveTags" class="toolbar-active-tags"></div>
      </div>

      <!-- Collapsible Filter & Search Drawer (Hidden by default, shown on click) -->
      <div class="catalog-control-panel" id="catalogControlPanel">
        <!-- Search & Sort Row -->
        <div class="control-row-primary">
          <div class="search-box-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="searchInput" placeholder="Search ${products.length} items (e.g. Coleman tent, Camping Moon stove, Columbia, Salomon, Jackery)...">
            <button id="clearSearchBtn" class="clear-search-btn" onclick="clearSearch()" title="Clear Search" style="display: none;">✕</button>
          </div>

          <div class="sort-box-wrapper">
            <label for="sortSelect" class="control-label">Sort by:</label>
            <select id="sortSelect" class="camp-select">
              <option value="featured">Featured / Best Sellers</option>
              <option value="price-asc">Cost: Low to High (S$)</option>
              <option value="price-desc">Cost: High to Low (S$)</option>
              <option value="rating-desc">Highest Customer Rating (⭐ 5.0 → 4.5)</option>
              <option value="reviews-desc">Most Reviewed (Popularity)</option>
              <option value="name-asc">Product Name (A → Z)</option>
            </select>
          </div>
        </div>

        <!-- Filter Dropdowns Row -->
        <div class="control-row-secondary">
          <!-- Brand Filter -->
          <div class="filter-dropdown-group">
            <label for="brandSelect" class="control-label">Brand:</label>
            <select id="brandSelect" class="camp-select">
              <option value="all">All Brands (${products.length})</option>
              ${brandOptionsHtml}
            </select>
          </div>

          <!-- Price Range Filter -->
          <div class="filter-dropdown-group">
            <label for="priceSelect" class="control-label">Cost / Price:</label>
            <select id="priceSelect" class="camp-select">
              <option value="all">Any Price</option>
              <option value="under-50">Under S$50 (Budget Essentials)</option>
              <option value="50-150">S$50 – S$150 (Mid-Range Gear)</option>
              <option value="150-300">S$150 – S$300 (Pro Camping)</option>
              <option value="over-300">S$300+ (Power Stations & Tents)</option>
            </select>
          </div>

          <!-- Tier / Rating Filter -->
          <div class="filter-dropdown-group">
            <label for="tierSelect" class="control-label">Tier / Rating:</label>
            <select id="tierSelect" class="camp-select">
              <option value="all">All Items</option>
              <option value="anchor">Top Performance (Hero Picks)</option>
              <option value="trigger">Popular Picks (High Volume)</option>
              <option value="rating-48">⭐ 4.8 Stars & Above</option>
            </select>
          </div>

          <!-- Reset Button -->
          <button id="resetFiltersBtn" class="btn-reset-filters" onclick="resetAllFilters()" style="display: none;">
            Reset Filters ✕
          </button>
        </div>

        <!-- Category Quick-Pills Row -->
        <div class="segmented-dock-wrapper">
          <div class="segmented-dock" id="categoryDock">
            <button class="segment-btn active" data-cat="all" onclick="selectCategory('all', this)">All Categories (${products.length})</button>
            <button class="segment-btn" data-cat="tents-shelters-sleeping" onclick="selectCategory('tents-shelters-sleeping', this)">🏕️ Tents & Sleeping</button>
            <button class="segment-btn" data-cat="camp-kitchen-cooking" onclick="selectCategory('camp-kitchen-cooking', this)">🍳 Camp Kitchen</button>
            <button class="segment-btn" data-cat="outdoor-electronics-power" onclick="selectCategory('outdoor-electronics-power', this)">⚡ Battery & Power</button>
            <button class="segment-btn" data-cat="gear-tools-furniture" onclick="selectCategory('gear-tools-furniture', this)">🪓 Gear & Furniture</button>
            <button class="segment-btn" data-cat="outdoor-weatherproof-clothing" onclick="selectCategory('outdoor-weatherproof-clothing', this)">🥾 Weatherproof Apparel</button>
          </div>
        </div>

        <!-- Done / Apply Button to close drawer -->
        <div class="panel-close-bar">
          <button class="btn-done-filters" onclick="closeFilterDrawer()">Done / Close Filters &rarr;</button>
        </div>
      </div>

      <!-- No Results State -->
      <div id="noResultsState" class="no-results-state" style="display: none;">
        <div class="no-results-icon">🔍</div>
        <h3>No matching camping gear found</h3>
        <p>Try adjusting your search keyword, price range, or brand filter.</p>
        <button class="btn-camp-primary" onclick="resetAllFilters()">Reset All Filters</button>
      </div>

      <!-- Product Grid (Paginated to 12 items per page) -->
      <div class="product-grid" id="mainProductGrid">
        ${cardsHtml}
      </div>

      <!-- Pagination Navigation -->
      <div id="paginationNav" class="pagination-nav"></div>
    </section>

    <!-- Singapore SEO Buyer Guides -->
    <section class="guides-section" id="guides">
      <div class="container">
        <div class="sec-header">
          <h2 class="sec-title">Singapore Outdoor & Trail Field Guides (2026)</h2>
          <p class="sec-subtitle">Comprehensive editorial blueprints engineered for coastal park camping, Pulau Ubin wilderness stays, and cross-border jungle trails.</p>
        </div>
        <div class="guides-grid">
          ${guides.map(g => `
            <div class="guide-card">
              <span class="guide-badge">${g.readTime}</span>
              <h3 class="guide-title">${g.title}</h3>
              <p class="guide-excerpt">${g.excerpt}</p>
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

  <script src="./assets/catalog-filters.js?v=20261104_v3"></script>
</body>
</html>`;
  }

  renderCategoryPage(catSlug, catProducts, allProducts) {
    const catMeta = CONFIG.categories.find(c => c.slug === catSlug) || { name: catSlug, desc: '' };
    const cardsHtml = catProducts.map((p, idx) => this.renderProductCard(p, true, idx)).join('\n');

    // Brands in this specific category
    const brandCounts = {};
    catProducts.forEach(p => {
      brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    });
    const topBrands = Object.entries(brandCounts).sort((a,b) => b[1] - a[1]);
    const brandOptionsHtml = topBrands.map(([b, count]) => 
      `<option value="${b}">${b} (${count})</option>`
    ).join('\n              ');

    return `<!DOCTYPE html>
<html lang="en-SG">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${catMeta.name} Singapore - Best Camping Gear & Reviews (2026)</title>
  <meta name="description" content="${catMeta.desc}">
  <link rel="stylesheet" href="../assets/styles.css?v=20261104_v3">
</head>
<body>
  <header class="camp-header">
    <div class="container camp-nav">
      <a href="../index.html" class="brand-mark">
        <span class="brand-logo-icon">🏕️</span>
        <span>CampTech SG</span>
        <span class="sg-badge">Singapore Outdoor Authority</span>
      </a>
      <nav class="nav-menu">
        <a href="../index.html" class="nav-link">All Gear (${allProducts.length})</a>
        <a href="../index.html#guides" class="nav-link">Singapore Guides</a>
        <a href="./tents-shelters-sleeping.html" class="nav-link">Tents & Sleeping</a>
        <a href="./camp-kitchen-cooking.html" class="nav-link">Camp Kitchen</a>
        <a href="./outdoor-electronics-power.html" class="nav-link">Electronics & Power</a>
        <a href="./gear-tools-furniture.html" class="nav-link">Gear & Tools</a>
        <a href="./outdoor-weatherproof-clothing.html" class="nav-link">Outdoor Apparel</a>
      </nav>
    </div>
  </header>

  <main class="container" style="padding-top: 40px;">
    <div style="margin-bottom: 25px;">
      <a href="../index.html" style="font-size: 0.88rem; color: var(--camp-primary); font-weight: 600;">&larr; Return to All ${allProducts.length} Camping Items</a>
      <h1 style="font-size: 2.3rem; font-weight: 800; margin-top: 10px; color: var(--camp-text-primary);">${catMeta.name}</h1>
      <p style="color: var(--camp-text-secondary); margin-top: 6px; font-size: 1.05rem;">${catMeta.desc}</p>
    </div>

    <!-- Collapsible Filter Action Toolbar -->
    <div class="filter-action-toolbar">
      <button id="toggleFilterBtn" class="btn-toggle-filters" onclick="toggleFilterDrawer()">
        <span>🔍</span>
        <span id="toggleBtnText">Filter & Search Options</span>
        <span id="activeFilterBadge" class="filter-count-badge" style="display: none;">0</span>
        <span id="toggleChevron" class="toggle-chevron">▼</span>
      </button>

      <div class="toolbar-status">
        Showing <span id="displayedCount" class="count-highlight">1–12</span> of <span id="totalCount" class="count-total">${catProducts.length}</span> items in ${catMeta.name}
      </div>

      <div id="toolbarActiveTags" class="toolbar-active-tags"></div>
    </div>

    <!-- Collapsible Filter & Search Drawer (Hidden by default, shown on click) -->
    <div class="catalog-control-panel" id="catalogControlPanel">
      <!-- Search & Sort Row -->
      <div class="control-row-primary">
        <div class="search-box-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" placeholder="Search ${catProducts.length} items in ${catMeta.name}...">
          <button id="clearSearchBtn" class="clear-search-btn" onclick="clearSearch()" title="Clear Search" style="display: none;">✕</button>
        </div>

        <div class="sort-box-wrapper">
          <label for="sortSelect" class="control-label">Sort by:</label>
          <select id="sortSelect" class="camp-select">
            <option value="featured">Featured / Best Sellers</option>
            <option value="price-asc">Cost: Low to High (S$)</option>
            <option value="price-desc">Cost: High to Low (S$)</option>
            <option value="rating-desc">Highest Customer Rating (⭐ 5.0 → 4.5)</option>
            <option value="reviews-desc">Most Reviewed (Popularity)</option>
            <option value="name-asc">Product Name (A → Z)</option>
          </select>
        </div>
      </div>

      <!-- Filter Dropdowns Row -->
      <div class="control-row-secondary">
        <!-- Brand Filter -->
        <div class="filter-dropdown-group">
          <label for="brandSelect" class="control-label">Brand:</label>
          <select id="brandSelect" class="camp-select">
            <option value="all">All Brands (${catProducts.length})</option>
            ${brandOptionsHtml}
          </select>
        </div>

        <!-- Price Range Filter -->
        <div class="filter-dropdown-group">
          <label for="priceSelect" class="control-label">Cost / Price:</label>
          <select id="priceSelect" class="camp-select">
            <option value="all">Any Price</option>
            <option value="under-50">Under S$50 (Budget)</option>
            <option value="50-150">S$50 – S$150 (Mid-Range)</option>
            <option value="150-300">S$150 – S$300 (Pro Gear)</option>
            <option value="over-300">S$300+ (High-Ticket)</option>
          </select>
        </div>

        <!-- Tier / Rating Filter -->
        <div class="filter-dropdown-group">
          <label for="tierSelect" class="control-label">Tier / Rating:</label>
          <select id="tierSelect" class="camp-select">
            <option value="all">All Items</option>
            <option value="anchor">Top Performance</option>
            <option value="trigger">Popular Picks</option>
            <option value="rating-48">⭐ 4.8 Stars & Above</option>
          </select>
        </div>

        <!-- Reset Button -->
        <button id="resetFiltersBtn" class="btn-reset-filters" onclick="resetAllFilters()" style="display: none;">
          Reset Filters ✕
        </button>
      </div>

      <!-- Done / Apply Button to close drawer -->
      <div class="panel-close-bar">
        <button class="btn-done-filters" onclick="closeFilterDrawer()">Done / Close Filters &rarr;</button>
      </div>
    </div>

    <!-- No Results State -->
    <div id="noResultsState" class="no-results-state" style="display: none;">
      <div class="no-results-icon">🔍</div>
      <h3>No matching items found in this category</h3>
      <p>Try clearing your keyword, adjusting your price range, or clearing the brand filter.</p>
      <button class="btn-camp-primary" onclick="resetAllFilters()">Reset Filters</button>
    </div>

    <!-- Product Grid (12 items per page) -->
    <div class="product-grid" id="mainProductGrid">
      ${cardsHtml}
    </div>

    <!-- Pagination Navigation -->
    <div id="paginationNav" class="pagination-nav"></div>
  </main>

  <script src="../assets/catalog-filters.js?v=20261104_v3"></script>
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
