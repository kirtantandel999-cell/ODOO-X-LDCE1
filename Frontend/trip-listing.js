/* ==========================================================
   GlobalTrotter — User Trip Listing (Screen 6)
   - live search across trip name / route / overview
   - filter by status
   - sort each visible group by date / name / budget
   - group by status (default) or flatten into one list
   - avatar dropdown menu
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const searchInput = document.getElementById('tripSearch');
  const groupBySelect = document.getElementById('groupBySelect');
  const filterSelect = document.getElementById('filterSelect');
  const sortBySelect = document.getElementById('sortBySelect');
  const groups = Array.from(document.querySelectorAll('[data-group]'));
  const STATUS_LABEL = { ongoing: 'Ongoing', upcoming: 'Up-coming', completed: 'Completed' };

  /* ---------- avatar menu ---------- */
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarMenu = document.getElementById('avatarMenu');
  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => avatarMenu.classList.remove('open'));

  /* ---------- card click -> go to itinerary ---------- */
  document.querySelectorAll('[data-trip]').forEach((card) => {
    const go = () => { window.location.href = 'build-itinerary.html'; };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  /* ---------- sorting ---------- */
  function sortCards(list, mode) {
    const cards = Array.from(list.querySelectorAll('[data-trip]'));
    cards.sort((a, b) => {
      if (mode === 'name') return a.dataset.name.localeCompare(b.dataset.name);
      if (mode === 'budget') return Number(b.dataset.budget) - Number(a.dataset.budget);
      // default: date (soonest start first)
      return new Date(a.dataset.start) - new Date(b.dataset.start);
    });
    cards.forEach((c) => list.appendChild(c));
  }

  /* ---------- grouping ---------- */
  function applyGrouping(mode) {
    if (mode === 'none') {
      // Move every card into the first group's list, relabel it, hide the rest.
      const main = groups[0];
      const mainList = main.querySelector('[data-list]');
      groups.forEach((g) => {
        if (g === main) return;
        g.querySelectorAll('[data-trip]').forEach((c) => mainList.appendChild(c));
      });
      main.querySelector('h2').textContent = 'All trips';
      main.querySelector('.status-dot').style.background = 'var(--indigo)';
      groups.slice(1).forEach((g) => { g.style.display = 'none'; });
    } else {
      // Restore each card to the group matching its data-status.
      const lists = {};
      groups.forEach((g) => {
        g.style.display = '';
        g.querySelector('h2').textContent = STATUS_LABEL[g.dataset.group];
        g.querySelector('.status-dot').className = `status-dot ${g.dataset.group}`;
        lists[g.dataset.group] = g.querySelector('[data-list]');
      });
      document.querySelectorAll('[data-trip]').forEach((c) => {
        const target = lists[c.dataset.status];
        if (target) target.appendChild(c);
      });
    }
  }

  /* ---------- filter + search + counts ---------- */
  function refresh() {
    const query = searchInput.value.trim().toLowerCase();
    const statusFilter = filterSelect.value;

    document.querySelectorAll('[data-trip]').forEach((card) => {
      const haystack = (
        card.dataset.name + ' ' +
        card.querySelector('.trip-route').textContent + ' ' +
        card.querySelector('.trip-overview').textContent
      ).toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesFilter = statusFilter === 'all' || card.dataset.status === statusFilter;
      card.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
    });

    groups.forEach((g) => {
      if (g.style.display === 'none') return;
      const list = g.querySelector('[data-list]');
      sortCards(list, sortBySelect.value);
      const visible = list.querySelectorAll('[data-trip]:not([style*="display: none"])').length;
      g.querySelector('[data-count]').textContent = visible;
      g.querySelector('[data-empty]').classList.toggle('show', visible === 0);
      // hide whole group when a specific status filter excludes it entirely
      const groupExcluded = statusFilter !== 'all' && groupBySelect.value !== 'none' && statusFilter !== g.dataset.group;
      g.style.display = groupExcluded ? 'none' : g.style.display === 'none' && groupBySelect.value === 'none' ? 'none' : '';
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
