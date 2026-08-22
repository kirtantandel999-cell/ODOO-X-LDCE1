
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Avatar menu ---------- */
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarMenu = document.getElementById('avatarMenu');
  if (avatarBtn && avatarMenu) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      avatarMenu.classList.toggle('open');
    });
    document.addEventListener('click', () => avatarMenu.classList.remove('open'));
  }

  const sectionsContainer = document.getElementById('sectionsContainer');
  const addSectionBtn = document.getElementById('addSectionBtn');
  const totalBudgetEl = document.getElementById('totalBudget');
  const TYPE_CLASSES = ['travel', 'stay', 'activity', 'food', 'other'];

  function renumberSections() {
    const cards = sectionsContainer.querySelectorAll('[data-section]');
    cards.forEach((card, i) => {
      card.querySelector('.section-title').textContent = `Section ${i + 1}`;
      const removeBtn = card.querySelector('.remove-section');
      removeBtn.disabled = cards.length === 1;
    });
  }

  function recolorTypeSelect(select) {
    TYPE_CLASSES.forEach((c) => select.classList.remove(c));
    select.classList.add(select.value);
  }

  function updateTotalBudget() {
    let total = 0;
    sectionsContainer.querySelectorAll('[data-role="budget"]').forEach((input) => {
      total += Number(input.value) || 0;
    });
    totalBudgetEl.textContent = `₹${total.toLocaleString('en-IN')}`;
  }

  function validateSectionDates(card) {
    const start = card.querySelector('[data-role="start"]').value;
    const end = card.querySelector('[data-role="end"]').value;
    const dateBox = card.querySelector('[data-role="dateBox"]');
    const invalid = start && end && new Date(end) < new Date(start);
    dateBox.classList.toggle('has-error', invalid);
    dateBox.querySelector('.meta-error').classList.toggle('show', invalid);
    return !invalid;
  }

  function wireSection(card) {
    card.querySelector('.remove-section').addEventListener('click', () => {
      card.remove();
      renumberSections();
      updateTotalBudget();
    });
    const typeSelect = card.querySelector('[data-role="type"]');
    typeSelect.addEventListener('change', () => recolorTypeSelect(typeSelect));
    card.querySelector('[data-role="start"]').addEventListener('change', () => validateSectionDates(card));
    card.querySelector('[data-role="end"]').addEventListener('change', () => validateSectionDates(card));
    card.querySelector('[data-role="budget"]').addEventListener('input', updateTotalBudget);
  }

  sectionsContainer.querySelectorAll('[data-section]').forEach(wireSection);

  function buildSection() {
    const card = document.createElement('div');
    card.className = 'section-card';
    card.setAttribute('data-section', '');
    card.innerHTML = `
      <div class="section-top">
        <div class="section-title-group">
          <span class="section-title">Section</span>
          <select class="type-select travel" data-role="type">
            <option value="travel">Travel</option>
            <option value="stay">Stay</option>
            <option value="activity">Activity</option>
            <option value="food">Food</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="button" class="remove-section" aria-label="Remove this section">✕</button>
      </div>
      <textarea class="section-desc" placeholder="All the necessary information about this section. This can be anything like travel, hotel, or any other activity."></textarea>
      <div class="section-meta">
        <div class="meta-box" data-role="dateBox">
          <span class="meta-label">Date range</span>
          <div class="date-range">
            <input type="date" data-role="start">
            <span>to</span>
            <input type="date" data-role="end">
          </div>
          <span class="meta-error">End date must be after start date.</span>
        </div>
        <div class="meta-box">
          <span class="meta-label">Budget for this section</span>
          <div class="budget-input">
            <span>₹</span>
            <input type="number" min="0" placeholder="0" data-role="budget">
          </div>
        </div>
      </div>
    `;
    wireSection(card);
    return card;
  }

  addSectionBtn.addEventListener('click', () => {
    sectionsContainer.appendChild(buildSection());
    renumberSections();
  });

  /* ---------- Submit / Save draft ---------- */
  const form = document.getElementById('itineraryForm');
  const confirmMsg = document.getElementById('confirmMsg');
  const saveDraftBtn = document.getElementById('saveDraftBtn');

  function showConfirm(text) {
    confirmMsg.textContent = text;
    confirmMsg.classList.add('show');
    setTimeout(() => confirmMsg.classList.remove('show'), 3200);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    sectionsContainer.querySelectorAll('[data-section]').forEach((card) => {
      if (!validateSectionDates(card)) valid = false;
    });
    if (!valid) return;

    // No backend wired up yet — this is where a real API call would go.
    showConfirm('Itinerary finished! Taking you to your trip…');
  });

  saveDraftBtn.addEventListener('click', () => {
    showConfirm('Draft saved — pick up where you left off anytime.');
  });

  updateTotalBudget();
});
