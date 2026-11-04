/**
 * CampTech SG - Catalog Sorting, Filtering & Pagination Engine
 * Features:
 * - Hidden collapsible filter/search panel (toggled on demand)
 * - 12 items per page pagination with smart page navigation
 * - Multi-criteria instant search & filtering
 * - Cost sorting (Low to High, High to Low) & popularity
 * - URL state synchronization
 */

(function() {
  const ITEMS_PER_PAGE = 12;
  let allCards = [];
  let currentMatchingCards = [];
  let currentPage = 1;
  let isPanelOpen = false;

  function initCatalogFilters() {
    const grid = document.getElementById('mainProductGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    allCards = Array.from(grid.querySelectorAll('.camp-card'));
    if (allCards.length === 0) return;

    // Attach listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', function() {
      currentPage = 1;
      applyFiltersAndSort();
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', function() {
      currentPage = 1;
      applyFiltersAndSort();
    });

    const brandSelect = document.getElementById('brandSelect');
    if (brandSelect) brandSelect.addEventListener('change', function() {
      currentPage = 1;
      applyFiltersAndSort();
    });

    const priceSelect = document.getElementById('priceSelect');
    if (priceSelect) priceSelect.addEventListener('change', function() {
      currentPage = 1;
      applyFiltersAndSort();
    });

    const tierSelect = document.getElementById('tierSelect');
    if (tierSelect) tierSelect.addEventListener('change', function() {
      currentPage = 1;
      applyFiltersAndSort();
    });

    // Read URL query params on load
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('brand') && brandSelect) brandSelect.value = urlParams.get('brand');
    if (urlParams.has('sort') && sortSelect) sortSelect.value = urlParams.get('sort');
    if (urlParams.has('price') && priceSelect) priceSelect.value = urlParams.get('price');
    if (urlParams.has('tier') && tierSelect) tierSelect.value = urlParams.get('tier');
    if (urlParams.has('q') && searchInput) searchInput.value = urlParams.get('q');
    if (urlParams.has('page')) {
      const p = parseInt(urlParams.get('page'), 10);
      if (p > 0) currentPage = p;
    }
    if (urlParams.has('cat')) {
      const catVal = urlParams.get('cat');
      const targetBtn = document.querySelector('.segment-btn[data-cat="' + catVal + '"]');
      if (targetBtn) {
        document.querySelectorAll('.segment-btn').forEach(function(b) { b.classList.remove('active'); });
        targetBtn.classList.add('active');
      }
    }

    // Auto-open filter drawer if user arrived with active filter params
    const hasInitialFilters = urlParams.has('brand') || urlParams.has('price') || urlParams.has('tier') || urlParams.has('q') || (urlParams.has('sort') && urlParams.get('sort') !== 'featured');
    if (hasInitialFilters) {
      openFilterDrawer();
    }

    applyFiltersAndSort();
  }

  // Toggle drawer
  window.toggleFilterDrawer = function() {
    if (isPanelOpen) {
      closeFilterDrawer();
    } else {
      openFilterDrawer();
    }
  };

  window.openFilterDrawer = function() {
    const panel = document.getElementById('catalogControlPanel');
    const toggleBtn = document.getElementById('toggleFilterBtn');
    const chevron = document.getElementById('toggleChevron');
    const btnText = document.getElementById('toggleBtnText');

    if (panel) {
      panel.style.display = 'block';
      panel.classList.add('panel-open');
    }
    if (chevron) chevron.textContent = '▲';
    if (btnText) btnText.textContent = 'Hide Filters & Search';
    if (toggleBtn) toggleBtn.classList.add('btn-active');
    isPanelOpen = true;

    // Focus search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput && window.innerWidth > 768) {
      searchInput.focus();
    }
  };

  window.closeFilterDrawer = function() {
    const panel = document.getElementById('catalogControlPanel');
    const toggleBtn = document.getElementById('toggleFilterBtn');
    const chevron = document.getElementById('toggleChevron');
    const btnText = document.getElementById('toggleBtnText');

    if (panel) {
      panel.style.display = 'none';
      panel.classList.remove('panel-open');
    }
    if (chevron) chevron.textContent = '▼';
    if (btnText) btnText.textContent = 'Filter & Search Options';
    if (toggleBtn) toggleBtn.classList.remove('btn-active');
    isPanelOpen = false;
  };

  window.selectCategory = function(cat, btn) {
    document.querySelectorAll('.segment-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    currentPage = 1;
    applyFiltersAndSort();
  };

  window.clearSearch = function() {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    currentPage = 1;
    applyFiltersAndSort();
  };

  window.resetAllFilters = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'featured';

    const brandSelect = document.getElementById('brandSelect');
    if (brandSelect) brandSelect.value = 'all';

    const priceSelect = document.getElementById('priceSelect');
    if (priceSelect) priceSelect.value = 'all';

    const tierSelect = document.getElementById('tierSelect');
    if (tierSelect) tierSelect.value = 'all';

    const allCatBtn = document.querySelector('.segment-btn[data-cat="all"]');
    if (allCatBtn) {
      document.querySelectorAll('.segment-btn').forEach(function(b) { b.classList.remove('active'); });
      allCatBtn.classList.add('active');
    }

    currentPage = 1;
    applyFiltersAndSort();
  };

  window.removeFilter = function(type) {
    if (type === 'brand') {
      const b = document.getElementById('brandSelect');
      if (b) b.value = 'all';
    }
    if (type === 'price') {
      const p = document.getElementById('priceSelect');
      if (p) p.value = 'all';
    }
    if (type === 'tier') {
      const t = document.getElementById('tierSelect');
      if (t) t.value = 'all';
    }
    if (type === 'search') {
      const s = document.getElementById('searchInput');
      if (s) s.value = '';
    }
    if (type === 'cat') {
      const allCatBtn = document.querySelector('.segment-btn[data-cat="all"]');
      if (allCatBtn) {
        document.querySelectorAll('.segment-btn').forEach(function(b) { b.classList.remove('active'); });
        allCatBtn.classList.add('active');
      }
    }
    currentPage = 1;
    applyFiltersAndSort();
  };

  window.goToPage = function(pageNum) {
    const totalPages = Math.ceil(currentMatchingCards.length / ITEMS_PER_PAGE) || 1;
    if (pageNum < 1) pageNum = 1;
    if (pageNum > totalPages) pageNum = totalPages;
    currentPage = pageNum;
    renderCurrentPage();

    // Smooth scroll to top of product grid
    const target = document.getElementById('productGrid') || document.getElementById('mainProductGrid');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    syncUrlParams();
  };

  function renderPagination(totalPages) {
    const nav = document.getElementById('paginationNav');
    if (!nav) return;

    if (totalPages <= 1) {
      nav.style.display = 'none';
      nav.innerHTML = '';
      return;
    }

    nav.style.display = 'flex';

    let html = '';

    // Previous Button
    const prevDisabled = currentPage === 1 ? ' disabled' : '';
    html += '<button class="page-btn page-arrow' + prevDisabled + '" onclick="goToPage(' + (currentPage - 1) + ')" aria-label="Previous Page">&larr; Prev</button>';

    // Page Numbers with Smart Ellipsis
    const pages = getPageNumbers(currentPage, totalPages);
    pages.forEach(function(p) {
      if (p === '...') {
        html += '<span class="page-dots">…</span>';
      } else {
        const activeClass = p === currentPage ? ' active' : '';
        html += '<button class="page-btn' + activeClass + '" onclick="goToPage(' + p + ')">' + p + '</button>';
      }
    });

    // Next Button
    const nextDisabled = currentPage === totalPages ? ' disabled' : '';
    html += '<button class="page-btn page-arrow' + nextDisabled + '" onclick="goToPage(' + (currentPage + 1) + ')" aria-label="Next Page">Next &rarr;</button>';

    nav.innerHTML = html;
  }

  function getPageNumbers(cur, total) {
    if (total <= 7) {
      const res = [];
      for (let i = 1; i <= total; i++) res.push(i);
      return res;
    }

    const res = [1];
    if (cur > 3) res.push('...');

    const start = Math.max(2, cur - 1);
    const end = Math.min(total - 1, cur + 1);

    for (let i = start; i <= end; i++) {
      res.push(i);
    }

    if (cur < total - 2) res.push('...');
    res.push(total);

    return res;
  }

  function renderCurrentPage() {
    const grid = document.getElementById('mainProductGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    const countEl = document.getElementById('displayedCount');
    const totalPages = Math.ceil(currentMatchingCards.length / ITEMS_PER_PAGE) || 1;

    if (currentPage > totalPages) currentPage = 1;

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, currentMatchingCards.length);
    const pageSlice = currentMatchingCards.slice(startIndex, endIndex);

    // Hide all cards
    allCards.forEach(function(c) { c.style.display = 'none'; });

    // Show and re-order only cards on this page
    pageSlice.forEach(function(c) {
      c.style.display = 'flex';
      grid.appendChild(c);
    });

    // Update count display
    if (countEl) {
      if (currentMatchingCards.length === 0) {
        countEl.textContent = '0';
      } else {
        countEl.textContent = (startIndex + 1) + '–' + endIndex;
      }
    }
    const totalCountEl = document.getElementById('totalCount');
    if (totalCountEl) {
      totalCountEl.textContent = currentMatchingCards.length;
    }

    // Render pagination
    renderPagination(totalPages);
  }

  function syncUrlParams() {
    try {
      const searchInput = document.getElementById('searchInput');
      const sortSelect = document.getElementById('sortSelect');
      const brandSelect = document.getElementById('brandSelect');
      const priceSelect = document.getElementById('priceSelect');
      const tierSelect = document.getElementById('tierSelect');
      const activeCatBtn = document.querySelector('.segment-btn.active');

      const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const sort = sortSelect ? sortSelect.value : 'featured';
      const brand = brandSelect ? brandSelect.value : 'all';
      const price = priceSelect ? priceSelect.value : 'all';
      const tier = tierSelect ? tierSelect.value : 'all';
      const cat = activeCatBtn ? activeCatBtn.getAttribute('data-cat') : 'all';

      const newUrl = new URL(window.location);
      if (brand !== 'all') newUrl.searchParams.set('brand', brand); else newUrl.searchParams.delete('brand');
      if (sort !== 'featured') newUrl.searchParams.set('sort', sort); else newUrl.searchParams.delete('sort');
      if (price !== 'all') newUrl.searchParams.set('price', price); else newUrl.searchParams.delete('price');
      if (tier !== 'all') newUrl.searchParams.set('tier', tier); else newUrl.searchParams.delete('tier');
      if (cat && cat !== 'all') newUrl.searchParams.set('cat', cat); else newUrl.searchParams.delete('cat');
      if (q.length > 0) newUrl.searchParams.set('q', q); else newUrl.searchParams.delete('q');
      if (currentPage > 1) newUrl.searchParams.set('page', currentPage); else newUrl.searchParams.delete('page');

      window.history.replaceState({}, '', newUrl);
    } catch (e) {
      // Ignore URL history errors
    }
  }

  window.applyFiltersAndSort = function() {
    const grid = document.getElementById('mainProductGrid') || document.querySelector('.product-grid');
    if (!grid || allCards.length === 0) return;

    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const sortSelect = document.getElementById('sortSelect');
    const brandSelect = document.getElementById('brandSelect');
    const priceSelect = document.getElementById('priceSelect');
    const tierSelect = document.getElementById('tierSelect');
    const resetBtn = document.getElementById('resetFiltersBtn');
    const tagsContainer = document.getElementById('activeBadgeTags');
    const toolbarTags = document.getElementById('toolbarActiveTags');
    const activeBadge = document.getElementById('activeFilterBadge');
    const noResults = document.getElementById('noResultsState');

    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const sort = sortSelect ? sortSelect.value : 'featured';
    const brand = brandSelect ? brandSelect.value : 'all';
    const price = priceSelect ? priceSelect.value : 'all';
    const tier = tierSelect ? tierSelect.value : 'all';

    const activeCatBtn = document.querySelector('.segment-btn.active');
    const cat = activeCatBtn ? activeCatBtn.getAttribute('data-cat') : 'all';

    if (clearBtn) clearBtn.style.display = q.length > 0 ? 'flex' : 'none';

    // Count active filters
    let activeFilterCount = 0;
    if (brand !== 'all') activeFilterCount++;
    if (price !== 'all') activeFilterCount++;
    if (tier !== 'all') activeFilterCount++;
    if (cat && cat !== 'all') activeFilterCount++;
    if (q.length > 0) activeFilterCount++;
    if (sort !== 'featured') activeFilterCount++;

    if (activeBadge) {
      if (activeFilterCount > 0) {
        activeBadge.textContent = activeFilterCount;
        activeBadge.style.display = 'inline-flex';
      } else {
        activeBadge.style.display = 'none';
      }
    }

    if (resetBtn) resetBtn.style.display = activeFilterCount > 0 ? 'inline-block' : 'none';

    // Render active filter badges
    const tags = [];
    if (cat && cat !== 'all' && activeCatBtn) {
      tags.push('<span class="filter-pill-tag" onclick="removeFilter(\'cat\')">' + activeCatBtn.textContent.trim() + ' ✕</span>');
    }
    if (brand !== 'all') {
      tags.push('<span class="filter-pill-tag" onclick="removeFilter(\'brand\')">Brand: ' + brand + ' ✕</span>');
    }
    if (price !== 'all' && priceSelect) {
      const pLabel = priceSelect.options[priceSelect.selectedIndex].text;
      tags.push('<span class="filter-pill-tag" onclick="removeFilter(\'price\')">' + pLabel + ' ✕</span>');
    }
    if (tier !== 'all' && tierSelect) {
      const tLabel = tierSelect.options[tierSelect.selectedIndex].text;
      tags.push('<span class="filter-pill-tag" onclick="removeFilter(\'tier\')">' + tLabel + ' ✕</span>');
    }
    if (q.length > 0) {
      tags.push('<span class="filter-pill-tag" onclick="removeFilter(\'search\')">Search: "' + q + '" ✕</span>');
    }

    const tagsHtml = tags.join('');
    if (tagsContainer) tagsContainer.innerHTML = tagsHtml;
    if (toolbarTags) toolbarTags.innerHTML = tagsHtml;

    // Filter
    currentMatchingCards = allCards.filter(function(card) {
      if (cat && cat !== 'all' && card.getAttribute('data-category') !== cat) return false;
      if (brand !== 'all' && card.getAttribute('data-brand') !== brand) return false;

      const p = parseFloat(card.getAttribute('data-price')) || 0;
      if (price === 'under-50' && p >= 50) return false;
      if (price === '50-150' && (p < 50 || p > 150)) return false;
      if (price === '150-300' && (p < 150 || p > 300)) return false;
      if (price === 'over-300' && p <= 300) return false;

      if (tier === 'anchor' && card.getAttribute('data-tier') !== 'anchor') return false;
      if (tier === 'trigger' && card.getAttribute('data-tier') !== 'trigger') return false;
      if (tier === 'rating-48') {
        const r = parseFloat(card.getAttribute('data-rating')) || 0;
        if (r < 4.8) return false;
      }

      if (q.length > 0) {
        const searchTokens = card.getAttribute('data-search') || '';
        if (searchTokens.indexOf(q) === -1) return false;
      }

      return true;
    });

    // Sort
    currentMatchingCards.sort(function(a, b) {
      const priceA = parseFloat(a.getAttribute('data-price')) || 0;
      const priceB = parseFloat(b.getAttribute('data-price')) || 0;
      const ratingA = parseFloat(a.getAttribute('data-rating')) || 0;
      const ratingB = parseFloat(b.getAttribute('data-rating')) || 0;
      const reviewsA = parseInt(a.getAttribute('data-reviews'), 10) || 0;
      const reviewsB = parseInt(b.getAttribute('data-reviews'), 10) || 0;
      const titleA = a.getAttribute('data-title') || '';
      const titleB = b.getAttribute('data-title') || '';
      const origA = parseInt(a.getAttribute('data-original-index'), 10) || 0;
      const origB = parseInt(b.getAttribute('data-original-index'), 10) || 0;

      if (sort === 'price-asc') return priceA - priceB;
      if (sort === 'price-desc') return priceB - priceA;
      if (sort === 'rating-desc') return ratingB - ratingA;
      if (sort === 'reviews-desc') return reviewsB - reviewsA;
      if (sort === 'name-asc') return titleA.localeCompare(titleB);
      return origA - origB;
    });

    if (noResults) {
      noResults.style.display = currentMatchingCards.length === 0 ? 'block' : 'none';
    }

    renderCurrentPage();
    syncUrlParams();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalogFilters);
  } else {
    initCatalogFilters();
  }
})();
