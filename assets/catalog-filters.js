/**
 * CampTech SG - High-Performance Client-Side Catalog Sorting & Filtering Engine
 * Handles instant search, multi-criteria filtering, price sorting, and URL sync.
 */

(function() {
  let allCards = [];

  function initCatalogFilters() {
    const grid = document.getElementById('mainProductGrid') || document.querySelector('.product-grid');
    if (!grid) return;

    allCards = Array.from(grid.querySelectorAll('.camp-card'));
    if (allCards.length === 0) return;

    // Attach search input listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', applyFiltersAndSort);
    }

    // Attach dropdown listeners
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSort);

    const brandSelect = document.getElementById('brandSelect');
    if (brandSelect) brandSelect.addEventListener('change', applyFiltersAndSort);

    const priceSelect = document.getElementById('priceSelect');
    if (priceSelect) priceSelect.addEventListener('change', applyFiltersAndSort);

    const tierSelect = document.getElementById('tierSelect');
    if (tierSelect) tierSelect.addEventListener('change', applyFiltersAndSort);

    // Read URL query params on load
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('brand') && brandSelect) {
      brandSelect.value = urlParams.get('brand');
    }
    if (urlParams.has('sort') && sortSelect) {
      sortSelect.value = urlParams.get('sort');
    }
    if (urlParams.has('price') && priceSelect) {
      priceSelect.value = urlParams.get('price');
    }
    if (urlParams.has('tier') && tierSelect) {
      tierSelect.value = urlParams.get('tier');
    }
    if (urlParams.has('q') && searchInput) {
      searchInput.value = urlParams.get('q');
    }
    if (urlParams.has('cat')) {
      const catVal = urlParams.get('cat');
      const targetBtn = document.querySelector('.segment-btn[data-cat="' + catVal + '"]');
      if (targetBtn) {
        document.querySelectorAll('.segment-btn').forEach(function(b) { b.classList.remove('active'); });
        targetBtn.classList.add('active');
      }
    }

    applyFiltersAndSort();
  }

  window.selectCategory = function(cat, btn) {
    document.querySelectorAll('.segment-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    applyFiltersAndSort();
  };

  window.clearSearch = function() {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = '';
      input.focus();
    }
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
    applyFiltersAndSort();
  };

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
    const countEl = document.getElementById('displayedCount');
    const tagsContainer = document.getElementById('activeBadgeTags');
    const noResults = document.getElementById('noResultsState');

    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const sort = sortSelect ? sortSelect.value : 'featured';
    const brand = brandSelect ? brandSelect.value : 'all';
    const price = priceSelect ? priceSelect.value : 'all';
    const tier = tierSelect ? tierSelect.value : 'all';

    const activeCatBtn = document.querySelector('.segment-btn.active');
    const cat = activeCatBtn ? activeCatBtn.getAttribute('data-cat') : 'all';

    // Clear search button visibility
    if (clearBtn) {
      clearBtn.style.display = q.length > 0 ? 'flex' : 'none';
    }

    // Is any filter active?
    const isFiltered = (q.length > 0) || (brand !== 'all') || (price !== 'all') || (tier !== 'all') || (cat !== 'all') || (sort !== 'featured');
    if (resetBtn) {
      resetBtn.style.display = isFiltered ? 'inline-block' : 'none';
    }

    // Active badge pills
    if (tagsContainer) {
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
      tagsContainer.innerHTML = tags.join('');
    }

    // Filter cards
    const matching = allCards.filter(function(card) {
      // Category filter
      if (cat && cat !== 'all' && card.getAttribute('data-category') !== cat) {
        return false;
      }

      // Brand filter
      if (brand !== 'all' && card.getAttribute('data-brand') !== brand) {
        return false;
      }

      // Price filter
      const p = parseFloat(card.getAttribute('data-price')) || 0;
      if (price === 'under-50' && p >= 50) return false;
      if (price === '50-150' && (p < 50 || p > 150)) return false;
      if (price === '150-300' && (p < 150 || p > 300)) return false;
      if (price === 'over-300' && p <= 300) return false;

      // Tier / Rating filter
      if (tier === 'anchor' && card.getAttribute('data-tier') !== 'anchor') return false;
      if (tier === 'trigger' && card.getAttribute('data-tier') !== 'trigger') return false;
      if (tier === 'rating-48') {
        const r = parseFloat(card.getAttribute('data-rating')) || 0;
        if (r < 4.8) return false;
      }

      // Search query
      if (q.length > 0) {
        const searchTokens = card.getAttribute('data-search') || '';
        if (searchTokens.indexOf(q) === -1) return false;
      }

      return true;
    });

    // Sort matching cards
    matching.sort(function(a, b) {
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
      return origA - origB; // 'featured'
    });

    // Reorder DOM
    allCards.forEach(function(c) { c.style.display = 'none'; });
    matching.forEach(function(c) {
      c.style.display = 'flex';
      grid.appendChild(c);
    });

    if (countEl) {
      countEl.textContent = matching.length;
    }

    if (noResults) {
      noResults.style.display = matching.length === 0 ? 'block' : 'none';
    }

    // Sync URL without refreshing
    try {
      const newUrl = new URL(window.location);
      if (brand !== 'all') newUrl.searchParams.set('brand', brand); else newUrl.searchParams.delete('brand');
      if (sort !== 'featured') newUrl.searchParams.set('sort', sort); else newUrl.searchParams.delete('sort');
      if (price !== 'all') newUrl.searchParams.set('price', price); else newUrl.searchParams.delete('price');
      if (tier !== 'all') newUrl.searchParams.set('tier', tier); else newUrl.searchParams.delete('tier');
      if (cat && cat !== 'all') newUrl.searchParams.set('cat', cat); else newUrl.searchParams.delete('cat');
      if (q.length > 0) newUrl.searchParams.set('q', q); else newUrl.searchParams.delete('q');
      window.history.replaceState({}, '', newUrl);
    } catch (e) {
      // Ignore URL history errors in embedded contexts
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalogFilters);
  } else {
    initCatalogFilters();
  }
})();
