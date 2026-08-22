/* ==========================================================
   GlobalTrotter — Community Tab (Screen 10)
   Mirrors activity-search.js (Screen 8) / itinerary-view.js
   (Screen 9):
   - live search across name / trip / post text
   - filter by category tag
   - sort each visible group by recent / most liked / most commented
   - group by category, or flatten into one "Community tab" feed (default)
   - avatar dropdown menu
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const searchInput   = document.getElementById('communitySearch');
  const groupBySelect = document.getElementById('groupBySelect');
  const filterSelect  = document.getElementById('filterSelect');
  const sortBySelect  = document.getElementById('sortBySelect');
  const groups        = Array.from(document.querySelectorAll('[data-group]'));

  /* ---------- avatar menu ---------- */
  const avatarBtn  = document.getElementById('avatarBtn');
  const avatarMenu = document.getElementById('avatarMenu');
  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => avatarMenu.classList.remove('open'));

  /* ---------- post click -> pretend to open the full thread ---------- */
  function wireCard(card) {
    const go = () => {
      card.style.outline = '2px solid var(--terracotta)';
      setTimeout(() => { card.style.outline = 'none'; }, 500);
      // No backend wired up yet — this is where a real API call would go.
      console.log(`Opened post by "${card.dataset.name}"`);
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  }
  document.querySelectorAll('.post-card').forEach(wireCard);

  /* ---------- sorting ---------- */
  function sortPosts(list, mode) {
    const rows = Array.from(list.querySelectorAll('[data-post]'));
    rows.sort((a, b) => {
      if (mode === 'liked') return Number(b.dataset.likes) - Number(a.dataset.likes);
      if (mode === 'commented') return Number(b.dataset.comments) - Number(a.dataset.comments);
      return Number(a.dataset.time) - Number(b.dataset.time); // default: most recent (lowest "hours ago" first)
    });
    rows.forEach((r) => list.appendChild(r));
  }

  /* ---------- grouping ---------- */
  function applyGrouping(mode) {
    if (mode === 'category') {
      const lists = {};
      groups.forEach((g) => {
        if (g.dataset.group === 'all') { g.style.display = 'none'; return; }
        g.style.display = '';
        lists[g.dataset.group] = g.querySelector('[data-list]');
      });
      document.querySelectorAll('[data-post]').forEach((row) => {
        const target = lists[row.dataset.tag];
        if (target) target.appendChild(row);
      });
    } else {
      const main = groups.find((g) => g.dataset.group === 'all');
      const mainList = main.querySelector('[data-list]');
      groups.forEach((g) => {
        if (g === main) { g.style.display = ''; return; }
        g.style.display = 'none';
      });
      document.querySelectorAll('[data-post]').forEach((row) => mainList.appendChild(row));
    }
  }

  /* ---------- filter + search + counts ---------- */
  function refresh() {
    const query = searchInput.value.trim().toLowerCase();
    const tagFilter = filterSelect.value;

    document.querySelectorAll('[data-post]').forEach((row) => {
      const card = row.querySelector('.post-card');
      const haystack = (
        card.dataset.name + ' ' +
        card.querySelector('.post-trip').textContent + ' ' +
        card.querySelector('.post-text').textContent
      ).toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesFilter = tagFilter === 'all' || row.dataset.tag === tagFilter;
      row.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
    });

    groups.forEach((g) => {
      if (g.style.display === 'none') return;
      const list = g.querySelector('[data-list]');
      sortPosts(list, sortBySelect.value);
      const visible = list.querySelectorAll('[data-post]:not([style*="display: none"])').length;
      g.querySelector('[data-count]').textContent = visible;
      g.querySelector('[data-empty]').classList.toggle('show', visible === 0);
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
