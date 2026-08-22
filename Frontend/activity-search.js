/* ==========================================================
   GlobalTrotter — Activity Search / City Search (Screen 8)
   Mirrors trip-listing.js (Screen 6):
   - live search across name / location / overview
   - filter by category tag
   - sort each visible group by rating / price / duration
   - group by category, or flatten into one "Results" list (default)
   - avatar dropdown menu
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const searchInput = document.getElementById('activitySearch');
  const groupBySelect = document.getElementById('groupBySelect');
  const filterSelect = document.getElementById('filterSelect');
  const sortBySelect = document.getElementById('sortBySelect');
  const groups = Array.from(document.querySelectorAll('[data-group]'));
  const CATEGORY_LABEL = { adventure: 'Adventure', nature: 'Nature', heritage: 'Heritage', food: 'Food', water: 'Water' };

  /* ---------- avatar menu ---------- */
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarMenu = document.getElementById('avatarMenu');
  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => avatarMenu.classList.remove('open'));

  /* ---------- card click -> pretend to add to itinerary ---------- */
  function wireCard(card) {
    const go = () => {
      card.style.outline = '2px solid var(--terracotta)';
      setTimeout(() => { card.style.outline = 'none'; }, 500);
      // No backend wired up yet — this is where a real API call would go.
      console.log(`Added "${card.dataset.name}" to itinerary`);
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  }
  document.querySelectorAll('[data-trip]').forEach(wireCard);

  /* ---------- sorting ---------- */
  function sortCards(list, mode) {
    const cards = Array.from(list.querySelectorAll('[data-trip]'));
    cards.sort((a, b) => {
      if (mode === 'price-low') return Number(a.dataset.price) - Number(b.dataset.price);
      if (mode === 'price-high') return Number(b.dataset.price) - Number(a.dataset.price);
      if (mode === 'duration') return Number(a.dataset.duration) - Number(b.dataset.duration);
      return Number(b.dataset.rating) - Number(a.dataset.rating); // default: rating
    });
    cards.forEach((c) => list.appendChild(c));
  }

  /* ---------- grouping ---------- */
  function applyGrouping(mode) {
    if (mode === 'category') {
      // Distribute every card out of the flat "all" list into its category group.
      const lists = {};
      groups.forEach((g) => {
        if (g.dataset.group === 'all') { g.style.display = 'none'; return; }
        g.style.display = '';
        lists[g.dataset.group] = g.querySelector('[data-list]');
      });
      document.querySelectorAll('[data-trip]').forEach((c) => {
        const target = lists[c.dataset.tag];
        if (target) target.appendChild(c);
      });
    } else {
      // Gather every card back into the flat "all" list.
      const main = groups.find((g) => g.dataset.group === 'all');
      const mainList = main.querySelector('[data-list]');
      groups.forEach((g) => {
        if (g === main) { g.style.display = ''; return; }
        g.style.display = 'none';
      });
      document.querySelectorAll('[data-trip]').forEach((c) => mainList.appendChild(c));
    }
  }

  /* ---------- filter + search + counts ---------- */
  function refresh() {
    const query = searchInput.value.trim().toLowerCase();
    const tagFilter = filterSelect.value;

    document.querySelectorAll('[data-trip]').forEach((card) => {
      const haystack = (
        card.dataset.name + ' ' +
        card.querySelector('.trip-route').textContent + ' ' +
        card.querySelector('.trip-overview').textContent
      ).toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesFilter = tagFilter === 'all' || card.dataset.tag === tagFilter;
      card.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
    });

    groups.forEach((g) => {
      if (g.style.display === 'none') return;
      const list = g.querySelector('[data-list]');
      sortCards(list, sortBySelect.value);
      const visible = list.querySelectorAll('[data-trip]:not([style*="display: none"])').length;
      g.querySelector('[data-count]').textContent = visible;
      g.querySelector('[data-empty]').classList.toggle('show', visible === 0);
      // hide a category group entirely when a specific filter excludes it
      const groupExcluded = tagFilter !== 'all' && groupBySelect.value === 'category' && tagFilter !== g.dataset.group;
      if (groupExcluded) g.style.display = 'none';
    });
  }

  searchInput.addEventListener('input', refresh);
  filterSelect.addEventListener('change', refresh);
  sortBySelect.addEventListener('change', refresh);
  groupBySelect.addEventListener('change', () => {
    applyGrouping(groupBySelect.value);
    refresh();
  });

  refresh();
});
