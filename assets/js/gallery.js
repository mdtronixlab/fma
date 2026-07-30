'use strict';

(function () {

  // --- Render gallery from data ---

  const grid = document.getElementById('gallery-grid');

  function renderGallery(items) {
    if (!grid) return;
    grid.innerHTML = items.map(item => {
      const categoryLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
      return `
        <div
          class="gallery-item${item.portrait ? ' portrait' : ''}"
          data-category="${item.category}"
          data-title="${item.title}"
          tabindex="0"
          role="button"
          aria-label="View ${item.title}"
        >
          <figure class="gallery-img-holder">
            <img src="${item.image}" alt="${item.alt}" loading="lazy" class="gallery-img" />
          </figure>
          <div class="gallery-overlay" aria-hidden="true">
            <span class="gallery-category">${categoryLabel}</span>
            <p class="gallery-title">${item.title}</p>
            <span class="gallery-zoom-icon">
              <ion-icon name="expand-outline"></ion-icon>
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Photos are discovered automatically from assets/images/gallery/ (drop a
  // photo in there, e.g. via cPanel File Manager - no code changes needed).
  async function loadItems() {
    try {
      const res = await fetch('./assets/gallery-list.php', { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async function init() {
    renderGallery(await loadItems());
    initInteractions();
  }

  init();

  // --- Everything below depends on the rendered .gallery-item elements ---
  function initInteractions() {

  // --- Elements ---
  const filterBtns   = document.querySelectorAll('[data-filter]');
  const galleryItems = [...document.querySelectorAll('.gallery-item')];
  const lightbox     = document.getElementById('lightbox');
  const lightboxImg  = document.getElementById('lightbox-img');
  const lightboxTitle    = document.getElementById('lightbox-title');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxCounter  = document.getElementById('lightbox-counter');
  const lightboxClose    = document.querySelector('.lightbox-close');
  const lightboxPrev     = document.querySelector('.lightbox-prev');
  const lightboxNext     = document.querySelector('.lightbox-next');
  const lightboxOverlay  = document.querySelector('.lightbox-overlay');

  let currentIndex  = 0;
  let currentFilter = 'all';
  let isBusy        = false;
  let touchStartX   = 0;
  let touchStartY   = 0;

  // --- Helpers ---

  function getVisibleItems() {
    return galleryItems.filter(item => !item.classList.contains('is-hidden'));
  }

  function waitForAll(items, eventName) {
    if (!items.length) return Promise.resolve();
    return new Promise(resolve => {
      let remaining = items.length;
      items.forEach(item => {
        item.addEventListener(eventName, function handler() {
          item.removeEventListener(eventName, handler);
          if (--remaining === 0) resolve();
        });
      });
    });
  }


  // --- ENTRANCE ANIMATION on page load ---

  galleryItems.forEach((item, i) => {
    item.style.animationDelay = `${(i % 3) * 80 + Math.floor(i / 3) * 60}ms`;
    item.classList.add('entrance');
    item.addEventListener('animationend', function handler() {
      item.removeEventListener('animationend', handler);
      item.classList.remove('entrance');
      item.style.animationDelay = '';
    });
  });


  // --- FILTER ---

  async function applyFilter(filter) {
    if (isBusy || filter === currentFilter) return;
    isBusy = true;
    currentFilter = filter;

    const toHide = galleryItems.filter(
      item => filter !== 'all' &&
               item.dataset.category !== filter &&
              !item.classList.contains('is-hidden')
    );

    const toShow = galleryItems.filter(
      item => filter === 'all' || item.dataset.category === filter
    );

    // Phase 1: hide non-matching
    if (toHide.length) {
      toHide.forEach(item => item.classList.add('is-hiding'));
      await waitForAll(toHide, 'animationend');
      toHide.forEach(item => {
        item.classList.remove('is-hiding');
        item.classList.add('is-hidden');
      });
    }

    // Phase 2: reveal matching
    toShow.forEach((item, i) => {
      item.classList.remove('is-hidden');
      item.style.animationDelay = `${i * 55}ms`;
      item.classList.add('is-showing');
      item.addEventListener('animationend', function handler() {
        item.removeEventListener('animationend', handler);
        item.classList.remove('is-showing');
        item.style.animationDelay = '';
      });
    });

    isBusy = false;
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });


  // --- LIGHTBOX ---

  function openLightbox(index) {
    const visible = getVisibleItems();
    if (!visible.length || index < 0 || index >= visible.length) return;
    currentIndex = index;

    const item = visible[index];
    const img  = item.querySelector('.gallery-img');

    lightboxImg.classList.remove('is-loaded');
    lightboxImg.src = '';
    lightboxImg.alt = img.alt;
    lightboxTitle.textContent    = item.dataset.title;
    lightboxCategory.textContent = item.dataset.category;
    lightboxCounter.textContent  = `${index + 1} / ${visible.length}`;

    lightboxImg.onload = () => lightboxImg.classList.add('is-loaded');
    lightboxImg.src = img.src;

    lightbox.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.setAttribute('hidden', '');
    document.body.style.overflow = '';
    lightboxImg.classList.remove('is-loaded');
    lightboxImg.src = '';
  }

  function navigateLightbox(dir) {
    const visible = getVisibleItems();
    let next = currentIndex + dir;
    if (next < 0) next = visible.length - 1;
    if (next >= visible.length) next = 0;
    openLightbox(next);
  }

  // Attach open handlers to each item
  galleryItems.forEach(item => {
    function handleOpen() {
      const idx = getVisibleItems().indexOf(item);
      if (idx !== -1) openLightbox(idx);
    }
    item.addEventListener('click', handleOpen);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); }
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxOverlay.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
  lightboxNext.addEventListener('click', () => navigateLightbox(1));

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (lightbox.hasAttribute('hidden')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   navigateLightbox(-1);
    if (e.key === 'ArrowRight')  navigateLightbox(1);
  });

  // Touch / swipe
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].screenY - touchStartY);
    if (Math.abs(dx) > 50 && dy < 100) navigateLightbox(dx > 0 ? -1 : 1);
  }, { passive: true });

  } // end initInteractions


  // --- STATS COUNTER (independent of gallery items) ---

  const statsNumbers = document.querySelectorAll('.stats-number[data-count]');

  if ('IntersectionObserver' in window && statsNumbers.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el     = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.textContent.replace(/[\d,]/g, '');
        let current  = 0;
        const step   = target / (1400 / 16);

        const tick = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current).toLocaleString() + suffix;
          if (current >= target) clearInterval(tick);
        }, 16);

        observer.unobserve(el);
      });
    }, { threshold: 0.6 });

    statsNumbers.forEach(el => observer.observe(el));
  }

})();
