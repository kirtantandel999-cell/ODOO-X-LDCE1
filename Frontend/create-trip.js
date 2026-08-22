

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Avatar menu ---------- */
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarMenu = document.getElementById('avatarMenu');
  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    avatarMenu.classList.toggle('open');
  });
  document.addEventListener('click', () => avatarMenu.classList.remove('open'));

  /* ---------- Stops: add / remove ---------- */
  const stopsContainer = document.getElementById('stopsContainer');
  const addStopBtn = document.getElementById('addStopBtn');
  const placeListId = 'placeList';

  function renumberStops() {
    const rows = stopsContainer.querySelectorAll('[data-stop]');
    rows.forEach((row, i) => {
      row.querySelector('.stop-index').textContent = `Place ${i + 1}`;
      const removeBtn = row.querySelector('.remove-stop');
      removeBtn.disabled = rows.length === 1;
    });
  }

  function buildStopRow() {
    const row = document.createElement('div');
    row.className = 'stop-row';
    row.setAttribute('data-stop', '');
    row.innerHTML = `
      <span class="stop-index">Place</span>
      <div class="field">
        <label>Select a place</label>
        <input type="text" placeholder="e.g. Kerala, India" list="${placeListId}" data-role="place">
      </div>
      <div class="field">
        <label>Start date</label>
        <input type="date" data-role="start">
      </div>
      <div class="field">
        <label>End date</label>
        <input type="date" data-role="end">
        <span class="field-error">End date must be after start date.</span>
      </div>
      <button type="button" class="remove-stop" aria-label="Remove this place">✕</button>
    `;
    row.querySelector('.remove-stop').addEventListener('click', () => {
      row.remove();
      renumberStops();
    });
    row.querySelector('[data-role="end"]').addEventListener('change', () => validateStopDates(row));
    row.querySelector('[data-role="start"]').addEventListener('change', () => validateStopDates(row));
    return row;
  }

  addStopBtn.addEventListener('click', () => {
    stopsContainer.appendChild(buildStopRow());
    renumberStops();
  });

  // wire up the first (default) row's remove + validation too
  stopsContainer.querySelectorAll('[data-stop]').forEach((row) => {
    const removeBtn = row.querySelector('.remove-stop');
    removeBtn.addEventListener('click', () => {
      row.remove();
      renumberStops();
    });
    row.querySelector('[data-role="end"]').addEventListener('change', () => validateStopDates(row));
    row.querySelector('[data-role="start"]').addEventListener('change', () => validateStopDates(row));
  });

  function validateStopDates(row) {
    const start = row.querySelector('[data-role="start"]').value;
    const end = row.querySelector('[data-role="end"]').value;
    const endField = row.querySelector('[data-role="end"]').closest('.field');
    const invalid = start && end && new Date(end) < new Date(start);
    endField.classList.toggle('has-error', invalid);
    endField.querySelector('.field-error').classList.toggle('show', invalid);
    return !invalid;
  }

  /* ---------- Suggestions: select + counter ---------- */
  const suggestGrid = document.getElementById('suggestGrid');
  const selectedPill = document.getElementById('selectedPill');

  function updateSelectedCount() {
    const count = suggestGrid.querySelectorAll('.suggest-card.selected').length;
    selectedPill.textContent = `${count} selected`;
  }

  suggestGrid.querySelectorAll('[data-suggest]').forEach((card) => {
    const toggleBtn = card.querySelector('.add-toggle');
    toggleBtn.addEventListener('click', () => {
      const nowSelected = card.classList.toggle('selected');
      toggleBtn.textContent = nowSelected ? '✓ Added' : '+ Add to itinerary';
      updateSelectedCount();
    });
  });

  /* ---------- Submit / Save draft ---------- */
  const form = document.getElementById('tripForm');
  const confirmMsg = document.getElementById('confirmMsg');
  const saveDraftBtn = document.getElementById('saveDraftBtn');

  function showConfirm(text) {
    confirmMsg.textContent = text;
    confirmMsg.classList.add('show');
    setTimeout(() => confirmMsg.classList.remove('show'), 3200);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const tripStart = document.getElementById('tripStart');
    const tripStartField = document.getElementById('tripStartField');
    let valid = true;

    if (!tripStart.value) {
      tripStartField.classList.add('has-error');
      tripStartField.querySelector('.field-error').classList.add('show');
      valid = false;
    } else {
      tripStartField.classList.remove('has-error');
      tripStartField.querySelector('.field-error').classList.remove('show');
    }

    stopsContainer.querySelectorAll('[data-stop]').forEach((row) => {
      if (!validateStopDates(row)) valid = false;
    });

    if (!valid) return;

    showConfirm('Trip created! Redirecting to your itinerary…');
    setTimeout(() => {
      window.location.href = 'build-itinerary.html';
    }, 600);
  });

  saveDraftBtn.addEventListener('click', () => {
    showConfirm('Draft saved — pick up where you left off anytime.');
  });

});
