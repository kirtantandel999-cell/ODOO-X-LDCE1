/* ==========================================================
   GlobalTrotter — Itinerary View w/ Budget (Screen 9)
   Mirrors activity-search.js (Screen 8):
   - live search across title / location
   - filter by category tag
   - sort each visible day (or category group) by time / price
   - group by Day (default, wireframe layout) or by Category
   - live budget summary (trip total / per-day / average)
   - avatar dropdown menu
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const searchInput   = document.getElementById('itinerarySearch');
  const groupBySelect = document.getElementById('groupBySelect');
  const filterSelect  = document.getElementById('filterSelect');
  const sortBySelect  = document.getElementById('sortBySelect');
  const main          = document.querySelector('main.wrap');

  const CATEGORY_LABEL = { adventure: 'Adventure', nature: 'Nature', heritage: 'Heritage', food: 'Food', water: 'Water' };
  const CATEGORY_ORDER = ['adventure', 'nature', 'heritage', 'food', 'water'];
  const ICON_LETTER    = { adventure: 'A', nature: 'N', heritage: 'H', food: 'F', water: 'W' };

  /* ---------- avatar menu ---------- */
  const avatarBtn  = document.getElementById('avatarBtn');
  const avatarMenu = document.getElementById('avatarMenu');
  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => avatarMenu.classList.remove('open'));

  /* ---------- card click -> pretend to open stop detail ---------- */
  function wireCard(card) {
    const go = () => {
      card.style.outline = '2px solid var(--terracotta)';
      setTimeout(() => { card.style.outline = 'none'; }, 500);
      // No backend wired up yet — this is where a real API call would go.
      console.log(`Opened "${card.querySelector('.step-title').textContent}"`);
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  }
  document.querySelectorAll('.step-card').forEach(wireCard);

  /* ---------- capture original day layout so "Group by: Day" can be restored ---------- */
  const dayBlocks = Array.from(document.querySelectorAll('.day-block'));
  const originalLayout = dayBlocks.map((block) => ({
    block,
    list: block.querySelector('[data-list]'),
    steps: Array.from(block.querySelectorAll('[data-step]')),
  }));

  /* ---------- a fresh container for the "Group by: Category" view ---------- */
  const categoryContainer = document.createElement('div');
  categoryContainer.className = 'category-container';
  categoryContainer.style.display = 'none';
  main.appendChild(categoryContainer);

  const categorySections = {};
  CATEGORY_ORDER.forEach((tag) => {
    const section = document.createElement('section');
    section.className = 'day-block';
    section.dataset.categoryGroup = tag;
    section.innerHTML = `
      <div class="day-header">
        <div class="day-header-left">
          <span class="day-badge">${CATEGORY_LABEL[tag]}</span>
        </div>
        <span class="day-total" data-day-total>₹0</span>
      </div>
      <div class="col-heads"><span>Physical Activity</span><span>Expense</span></div>
      <div class="timeline" data-list></div>
      <p class="group-empty" data-empty style="display:none;border:1.5px dashed var(--line);border-radius:var(--radius);padding:18px;text-align:center;color:#8b9a9e;font-size:13.5px;">No ${CATEGORY_LABEL[tag].toLowerCase()} stops in this trip.</p>
    `;
    categoryContainer.appendChild(section);
    categorySections[tag] = section;
  });

  /* ---------- connector helper ---------- */
  function makeConnector() {
    const div = document.createElement('div');
    div.className = 'connector';
    div.innerHTML = '<svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="0" x2="8" y2="16"/><path d="M2 12l6 8 6-8"/></svg>';
    return div;
  }

  function rebuildConnectors(list) {
    list.querySelectorAll('.connector').forEach((c) => c.remove());
    const visible = Array.from(list.querySelectorAll('[data-step]')).filter((s) => s.style.display !== 'none');
    visible.forEach((step, i) => {
      if (i > 0) list.insertBefore(makeConnector(), step);
    });
  }

  /* ---------- sorting ---------- */
  function sortSteps(list, mode) {
    const steps = Array.from(list.querySelectorAll('[data-step]'));
    steps.sort((a, b) => {
      if (mode === 'price-low') return Number(a.dataset.price) - Number(b.dataset.price);
      if (mode === 'price-high') return Number(b.dataset.price) - Number(a.dataset.price);
      return Number(a.dataset.time) - Number(b.dataset.time); // default: time
    });
    steps.forEach((s) => list.appendChild(s));
  }

  /* ---------- money formatting ---------- */
  function formatINR(n) {
    return n === 0 ? '₹0' : '₹' + n.toLocaleString('en-IN');
  }

  /* ---------- grouping ---------- */
  function applyGrouping(mode) {
    if (mode === 'category') {
      dayBlocks.forEach((b) => { b.style.display = 'none'; });
      categoryContainer.style.display = '';
      // distribute every step out of its day list into its category section
      CATEGORY_ORDER.forEach((tag) => {
        const targetList = categorySections[tag].querySelector('[data-list]');
        document.querySelectorAll(`[data-step][data-tag="${tag}"]`).forEach((step) => targetList.appendChild(step));
      });
    } else {
      categoryContainer.style.display = 'none';
      dayBlocks.forEach((b) => { b.style.display = ''; });
      // restore every step to its original day, in original order
      originalLayout.forEach(({ list, steps }) => {
        steps.forEach((step) => list.appendChild(step));
      });
    }
  }

  /* ---------- filter + search + totals ---------- */
  function refresh() {
    const query = searchInput.value.trim().toLowerCase();
    const tagFilter = filterSelect.value;

    document.querySelectorAll('[data-step]').forEach((step) => {
      const haystack = (
        step.querySelector('.step-title').textContent + ' ' +
        step.querySelector('.step-meta').textContent
      ).toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesFilter = tagFilter === 'all' || step.dataset.tag === tagFilter;
      step.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
    });

    const activeGroups = groupBySelect.value === 'category'
      ? Object.values(categorySections)
      : dayBlocks;

    let tripTotal = 0;
    let dayTotals = [];

    activeGroups.forEach((group) => {
      const list = group.querySelector('[data-list]');
      sortSteps(list, sortBySelect.value);
      rebuildConnectors(list);

      const visibleSteps = Array.from(list.querySelectorAll('[data-step]')).filter((s) => s.style.display !== 'none');
      const groupTotal = visibleSteps.reduce((sum, s) => sum + Number(s.dataset.price), 0);
      tripTotal += groupTotal;
      dayTotals.push(groupTotal);

      const totalEl = group.querySelector('[data-day-total]');
      if (totalEl) totalEl.textContent = formatINR(groupTotal);

      const emptyEl = group.querySelector('[data-empty]');
      if (emptyEl) emptyEl.style.display = visibleSteps.length === 0 ? '' : 'none';
    });

    document.getElementById('tripTotal').textContent = formatINR(tripTotal);
    document.getElementById('day1Total').textContent = formatINR(dayTotals[0] || 0);
    document.getElementById('day2Total').textContent = formatINR(dayTotals[1] || 0);
    const activeDayCount = Math.max(1, dayBlocks.length);
    document.getElementById('avgTotal').textContent = formatINR(Math.round(tripTotal / activeDayCount));
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
