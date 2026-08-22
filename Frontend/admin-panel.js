/* ==========================================================
   GlobalTrotter — Admin Panel (Screen 12)
   - tab switching between Manage Users / Popular Cities /
     Popular Activities / User Trends and Analytics
   - live search, filter, sort, group for whichever tab is
     currently active (mirrors the toolbar pattern used across
     Screens 8–10)
   - avatar dropdown menu
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const searchInput   = document.getElementById('adminSearch');
  const groupBySelect = document.getElementById('groupBySelect');
  const filterSelect  = document.getElementById('filterSelect');
  const sortBySelect  = document.getElementById('sortBySelect');
  const tabButtons    = Array.from(document.querySelectorAll('.tab-btn'));
  const panels        = Array.from(document.querySelectorAll('.tab-panel'));

  /* ---------- avatar menu ---------- */
  const avatarBtn  = document.getElementById('avatarBtn');
  const avatarMenu = document.getElementById('avatarMenu');
  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => avatarMenu.classList.remove('open'));

  /* ---------- row / card click -> pretend to open detail ---------- */
  document.querySelectorAll('[data-user]').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // let action buttons behave independently
      console.log(`Opened user "${row.dataset.name}"`);
    });
  });
  document.querySelectorAll('.row-actions button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = btn.closest('[data-user]');
      console.log(`"${btn.textContent}" clicked for "${row.dataset.name}"`);
    });
  });
  document.querySelectorAll('.rank-board-row').forEach((row) => {
    row.addEventListener('click', () => console.log(`Opened "${row.dataset.name}"`));
  });

  /* ---------- tab switching ---------- */
  function setActiveTab(tab) {
    tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === tab));

    // toolbar controls make sense only on the tabular / ranked tabs
    const usesToolbar = tab !== 'trends';
    searchInput.disabled = !usesToolbar;
    filterSelect.disabled = tab !== 'users';
    groupBySelect.disabled = tab !== 'users';
    sortBySelect.disabled = !usesToolbar;

    // relabel sort options per tab
    sortBySelect.innerHTML = tab === 'users'
      ? `<option value="name">Sort by: Name</option><option value="trips">Sort by: Trips</option><option value="joined">Sort by: Joined</option>`
      : `<option value="name">Sort by: Name</option><option value="value">Sort by: ${tab === 'cities' ? 'Visits' : 'Bookings'}</option>`;

    refresh();
  }
  tabButtons.forEach((btn) => btn.addEventListener('click', () => setActiveTab(btn.dataset.tab)));

  /* ---------- Manage Users: search / filter / sort / group ---------- */
  function refreshUsers() {
    const query = searchInput.value.trim().toLowerCase();
    const statusFilter = filterSelect.value;
    const rows = Array.from(document.querySelectorAll('#usersTableBody [data-user]'));

    rows.forEach((row) => {
      const haystack = (row.dataset.name + ' ' + row.querySelector('.email').textContent).toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesFilter = statusFilter === 'all' || row.dataset.status === statusFilter;
      row.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
    });

    const mode = sortBySelect.value;
    const groupByStatus = groupBySelect.value === 'status';
    rows.sort((a, b) => {
      if (groupByStatus && a.dataset.status !== b.dataset.status) {
        return a.dataset.status.localeCompare(b.dataset.status);
      }
      if (mode === 'trips') return Number(b.dataset.trips) - Number(a.dataset.trips);
      if (mode === 'joined') return new Date(b.dataset.joined) - new Date(a.dataset.joined);
      return a.dataset.name.localeCompare(b.dataset.name);
    });
    const tbody = document.getElementById('usersTableBody');
    rows.forEach((r) => tbody.appendChild(r));

    const visible = rows.filter((r) => r.style.display !== 'none').length;
    document.getElementById('usersEmpty').style.display = visible === 0 ? '' : 'none';
  }

  /* ---------- Popular Cities / Popular Activities: search / sort ---------- */
  function refreshBoard(boardId, emptyId) {
    const query = searchInput.value.trim().toLowerCase();
    const board = document.getElementById(boardId);
    const items = Array.from(board.querySelectorAll('[data-item]'));

    items.forEach((item) => {
      const matches = !query || item.dataset.name.toLowerCase().includes(query);
      item.style.display = matches ? '' : 'none';
    });

    const mode = sortBySelect.value;
    items.sort((a, b) => {
      if (mode === 'value') return Number(b.dataset.value) - Number(a.dataset.value);
      return a.dataset.name.localeCompare(b.dataset.name);
    });
    items.forEach((item, i) => {
      board.appendChild(item);
      const numEl = item.querySelector('.rank-board-num');
      if (numEl) numEl.textContent = i + 1;
    });

    const visible = items.filter((i) => i.style.display !== 'none').length;
    document.getElementById(emptyId).style.display = visible === 0 ? '' : 'none';
  }

  function refresh() {
    const activeTab = tabButtons.find((b) => b.classList.contains('active')).dataset.tab;
    if (activeTab === 'users') refreshUsers();
    else if (activeTab === 'cities') refreshBoard('citiesBoard', 'citiesEmpty');
    else if (activeTab === 'activities') refreshBoard('activitiesBoard', 'activitiesEmpty');
    // "trends" tab is a static analytics dashboard — nothing to filter
  }

  searchInput.addEventListener('input', refresh);
  filterSelect.addEventListener('change', refresh);
  sortBySelect.addEventListener('change', refresh);
  groupBySelect.addEventListener('change', refresh);

  setActiveTab('trends');
});
