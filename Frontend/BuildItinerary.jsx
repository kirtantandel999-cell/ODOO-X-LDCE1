
import React, { useState, useMemo } from 'react';
import './build-itinerary.css';

const TYPE_OPTIONS = [
  { value: 'travel', label: 'Travel' },
  { value: 'stay', label: 'Stay' },
  { value: 'activity', label: 'Activity' },
  { value: 'food', label: 'Food' },
  { value: 'other', label: 'Other' },
];

let sectionUid = 1;
const makeSection = (type = 'travel') => ({
  id: sectionUid++,
  type,
  desc: '',
  start: '',
  end: '',
  budget: '',
});

export default function BuildItinerary() {
  const [sections, setSections] = useState([
    makeSection('travel'),
    makeSection('stay'),
    makeSection('activity'),
  ]);
  const [confirmMsg, setConfirmMsg] = useState('');

  const updateSection = (id, field, value) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const addSection = () => setSections((prev) => [...prev, makeSection()]);
  const removeSection = (id) =>
    setSections((prev) => (prev.length === 1 ? prev : prev.filter((s) => s.id !== id)));

  const sectionHasDateError = (s) => s.start && s.end && new Date(s.end) < new Date(s.start);

  const totalBudget = useMemo(
    () => sections.reduce((sum, s) => sum + (Number(s.budget) || 0), 0),
    [sections]
  );

  const flashConfirm = (text) => {
    setConfirmMsg(text);
    setTimeout(() => setConfirmMsg(''), 3200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sections.some(sectionHasDateError)) return;

    // No backend wired up yet — this is where a real API call would go.
    flashConfirm('Itinerary finished! Taking you to your trip…');
  };

  return (
    <div>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="wrap">
          <a href="/" className="logo">
            <span className="mark">GT</span> GlobalTrotter
          </a>
          <div className="topbar-right">
            <span className="crumb">
              <a href="/trips">My Trips</a> / <a href="/create-trip">New Trip</a> / Itinerary
            </span>
            <button className="avatar-btn" aria-label="Account menu">A</button>
          </div>
        </div>
      </div>

      {/* PAGE HEAD */}
      <div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Screen 5</span>
          <h1>Build your itinerary</h1>
          <p>Break your trip into sections — travel, stay, or anything else — and set a date range and budget for each.</p>
        </div>
      </div>

      <main className="wrap">
        <form onSubmit={handleSubmit}>
          <div className="sections">
            {sections.map((s, i) => {
              const dateError = sectionHasDateError(s);
              return (
                <div className="section-card" key={s.id}>
                  <div className="section-top">
                    <div className="section-title-group">
                      <span className="section-title">Section {i + 1}</span>
                      <select
                        className={`type-select ${s.type}`}
                        value={s.type}
                        onChange={(e) => updateSection(s.id, 'type', e.target.value)}
                      >
                        {TYPE_OPTIONS.map((t) => (
                          <option value={t.value} key={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="remove-section"
                      aria-label="Remove this section"
                      disabled={sections.length === 1}
                      onClick={() => removeSection(s.id)}
                    >
                      ✕
                    </button>
                  </div>

                  <textarea
                    className="section-desc"
                    placeholder="All the necessary information about this section. This can be anything like travel, hotel, or any other activity."
                    value={s.desc}
                    onChange={(e) => updateSection(s.id, 'desc', e.target.value)}
                  />

                  <div className="section-meta">
                    <div className={`meta-box${dateError ? ' has-error' : ''}`}>
                      <span className="meta-label">Date range</span>
                      <div className="date-range">
                        <input
                          type="date"
                          value={s.start}
                          onChange={(e) => updateSection(s.id, 'start', e.target.value)}
                        />
                        <span>to</span>
                        <input
                          type="date"
                          value={s.end}
                          onChange={(e) => updateSection(s.id, 'end', e.target.value)}
                        />
                      </div>
                      <span className={`meta-error${dateError ? ' show' : ''}`}>
                        End date must be after start date.
                      </span>
                    </div>
                    <div className="meta-box">
                      <span className="meta-label">Budget for this section</span>
                      <div className="budget-input">
                        <span>₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={s.budget}
                          onChange={(e) => updateSection(s.id, 'budget', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" className="add-section-btn" onClick={addSection}>
            + Add another Section
          </button>

          <div className="summary-bar">
            <span className="label">Total planned budget</span>
            <span className="value">₹{totalBudget.toLocaleString('en-IN')}</span>
          </div>

          <div className="action-bar">
            <span className={`confirm-msg${confirmMsg ? ' show' : ''}`}>{confirmMsg}</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => flashConfirm('Draft saved — pick up where you left off anytime.')}
            >
              Save Draft
            </button>
            <button type="submit" className="btn btn-primary">
              Finish Itinerary →
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
