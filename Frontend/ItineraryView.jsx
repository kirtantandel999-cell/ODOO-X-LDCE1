/**
 * GlobalTrotter — Itinerary View w/ Budget (Screen 9)
 * React version of itinerary-view.html, structured to mirror
 * ActivitySearch.jsx (Screen 8) for 1:1 consistency.
 *
 * Usage:
 *   import ItineraryView from './ItineraryView';
 *   <Route path="/itinerary" element={<ItineraryView />} />
 *
 * Requires itinerary-view.css in the same folder.
 */

import React, { useState, useMemo } from 'react';
import './itinerary-view.css';

const CATEGORY_LABEL = { adventure: 'Adventure', nature: 'Nature', heritage: 'Heritage', food: 'Food', water: 'Water' };
const CATEGORY_ORDER = ['adventure', 'nature', 'heritage', 'food', 'water'];
const ICON_LETTER    = { adventure: 'A', nature: 'N', heritage: 'H', food: 'F', water: 'W' };

const DAYS = [
  {
    day: 1,
    date: 'Fri, 12 Sep',
    stops: [
      { id: 1, name: 'Tandem Paragliding — Bir Billing', meta: 'Himachal Pradesh · 20–30 min flight', tag: 'adventure', time: '7:00 AM', timeSort: 700, price: 3200, expenseTag: 'Activity fee' },
      { id: 2, name: 'Billing Viewpoint Walk', meta: 'Himachal Pradesh · Free entry', tag: 'nature', time: '10:00 AM', timeSort: 1000, price: 0, expenseTag: 'No cost' },
      { id: 3, name: 'Bir Monastery & Tibetan Colony', meta: 'Himachal Pradesh · Entry ₹150', tag: 'heritage', time: '2:00 PM', timeSort: 1400, price: 150, expenseTag: 'Entry fee' },
    ],
  },
  {
    day: 2,
    date: 'Sat, 13 Sep',
    stops: [
      { id: 4, name: 'Beas River Rafting', meta: 'Kullu, Himachal Pradesh · 14 km stretch', tag: 'water', time: '9:00 AM', timeSort: 900, price: 1200, expenseTag: 'Rafting fee' },
      { id: 5, name: 'Billing Ridge Day Trek', meta: 'Himachal Pradesh · 8 km trail', tag: 'adventure', time: '1:00 PM', timeSort: 1300, price: 1800, expenseTag: 'Guide fee' },
      { id: 6, name: 'Kangra Valley Food Trail', meta: 'Himachal Pradesh · Group walk', tag: 'food', time: '7:00 PM', timeSort: 1900, price: 600, expenseTag: 'Food trail' },
    ],
  },
];

function formatINR(n) {
  return n === 0 ? 'Free' : `₹${n.toLocaleString('en-IN')}`;
}

export default function ItineraryView() {
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  const [menuOpen, setMenuOpen] = useState(false);
  const [flashId, setFlashId] = useState(null);

  const allStops = useMemo(
    () => DAYS.flatMap((d) => d.stops.map((s) => ({ ...s, day: d.day }))),
    []
  );

  const visibleStops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allStops.filter((s) => {
      const matchesSearch = !q || `${s.name} ${s.meta}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || s.tag === filter;
      return matchesSearch && matchesFilter;
    });
  }, [allStops, search, filter]);

  const sortStops = (list) => {
    const copy = [...list];
    copy.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return a.timeSort - b.timeSort; // default: time
    });
    return copy;
  };

  const dayTotals = DAYS.map((d) =>
    visibleStops.filter((s) => s.day === d.day).reduce((sum, s) => sum + s.price, 0)
  );
  const tripTotal = dayTotals.reduce((a, b) => a + b, 0);
  const avgPerDay = Math.round(tripTotal / DAYS.length);

  const openStop = (stop) => {
    setFlashId(stop.id);
    setTimeout(() => setFlashId(null), 500);
    // No backend wired up yet — this is where a real API call would go.
    console.log(`Opened "${stop.name}"`);
  };

  const renderStep = (stop, isLast) => (
    <React.Fragment key={stop.id}>
      <div className="step">
        <article
          className="step-card"
          tabIndex={0}
          style={flashId === stop.id ? { outline: '2px solid var(--terracotta)' } : undefined}
          onClick={() => openStop(stop)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStop(stop); } }}
        >
          <div className={`step-icon ${stop.tag}`}>{ICON_LETTER[stop.tag]}</div>
          <div className="step-main">
            <div className="step-top">
              <div>
                <div className="step-title">{stop.name}</div>
                <div className="step-meta">{stop.meta}</div>
              </div>
              <span className="step-time">{stop.time}</span>
            </div>
            <span className={`status-pill ${stop.tag}`}>{CATEGORY_LABEL[stop.tag]}</span>
          </div>
        </article>
        <div className="step-expense">
          <span className={`amount${stop.price === 0 ? ' free' : ''}`}>{formatINR(stop.price)}</span>
          <span className="tag">{stop.expenseTag}</span>
        </div>
      </div>
      {!isLast && (
        <div className="connector">
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="0" x2="8" y2="16" /><path d="M2 12l6 8 6-8" />
          </svg>
        </div>
      )}
    </React.Fragment>
  );

  const renderGroup = (title, dateOrDot, stops, total, emptyLabel) => (
    <section className="day-block" key={title}>
      <div className="day-header">
        <div className="day-header-left">
          {dateOrDot.dot ? <span className={`status-dot ${dateOrDot.dot}`} /> : null}
          <span className="day-badge">{title}</span>
          {dateOrDot.date ? <span className="day-date">{dateOrDot.date}</span> : null}
        </div>
        <span className="day-total">{formatINR(total)}</span>
      </div>
      <div className="col-heads"><span>Physical Activity</span><span>Expense</span></div>
      <div className="timeline">
        {stops.length > 0
          ? sortStops(stops).map((s, i) => renderStep(s, i === stops.length - 1))
          : null}
      </div>
      {stops.length === 0 && (
        <p className="group-empty" style={{ display: 'block', border: '1.5px dashed var(--line)', borderRadius: 'var(--radius)', padding: 18, textAlign: 'center', color: '#8b9a9e', fontSize: 13.5 }}>
          {emptyLabel}
        </p>
      )}
    </section>
  );

  return (
    <div onClick={() => menuOpen && setMenuOpen(false)}>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="wrap">
          <a href="/" className="logo"><span className="mark">GT</span> GlobalTrotter</a>
          <div className="topbar-right">
            <span className="crumb"><a href="/trips">My Trips</a> / Itinerary</span>
            <div className="avatar-wrap">
              <button
                className="avatar-btn"
                aria-label="Account menu"
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              >
                A
              </button>
              <div className={`avatar-menu${menuOpen ? ' open' : ''}`}>
                <a href="/profile">My Profile</a>
                <a href="/trips">My Trips</a>
                <a href="/logout">Log Out</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE HEAD */}
      <div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Screen 9</span>
          <h1>Itinerary for a selected place</h1>
          <p>Day-by-day plan for Bir Billing, Himachal Pradesh, with the cost of every stop tracked against your budget.</p>
        </div>
      </div>

      <main className="wrap">
        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="search-field">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search bar ......"
              aria-label="Search itinerary stops"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-selects">
            <select aria-label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="day">Group by: Day</option>
              <option value="category">Group by: Category</option>
            </select>
            <select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Filter: All</option>
              <option value="adventure">Filter: Adventure</option>
              <option value="nature">Filter: Nature</option>
              <option value="heritage">Filter: Heritage</option>
              <option value="food">Filter: Food</option>
              <option value="water">Filter: Water</option>
            </select>
            <select aria-label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="time">Sort by: Time</option>
              <option value="price-low">Sort by: Price (low)</option>
              <option value="price-high">Sort by: Price (high)</option>
            </select>
          </div>
        </div>

        {/* TRIP TITLE */}
        <div className="itin-title-row">
          <div>
            <h2>Bir Billing Getaway</h2>
            <p>2 days · 6 stops · Himachal Pradesh, India</p>
          </div>
        </div>

        {/* BUDGET SUMMARY */}
        <div className="budget-summary">
          <div className="budget-stat">
            <span className="label">Trip total</span>
            <span className="value">{formatINR(tripTotal)}</span>
            <span className="sub">across {DAYS.length} days</span>
          </div>
          {DAYS.map((d, i) => (
            <div className="budget-stat" key={d.day}>
              <span className="label">Day {d.day}</span>
              <span className="value">{formatINR(dayTotals[i])}</span>
              <span className="sub">{d.stops.length} stops</span>
            </div>
          ))}
          <div className="budget-stat">
            <span className="label">Avg. per day</span>
            <span className="value">{formatINR(avgPerDay)}</span>
            <span className="sub">activities only</span>
          </div>
        </div>

        {groupBy === 'day'
          ? DAYS.map((d) =>
              renderGroup(
                `Day ${d.day}`,
                { date: d.date },
                visibleStops.filter((s) => s.day === d.day),
                dayTotals[d.day - 1],
                'No stops match your search for this day.'
              )
            )
          : CATEGORY_ORDER.map((tag) => {
              if (filter !== 'all' && filter !== tag) return null;
              const stops = visibleStops.filter((s) => s.tag === tag);
              const total = stops.reduce((sum, s) => sum + s.price, 0);
              return renderGroup(
                CATEGORY_LABEL[tag],
                { dot: tag },
                stops,
                total,
                `No ${CATEGORY_LABEL[tag].toLowerCase()} stops in this trip.`
              );
            })}
      </main>
    </div>
  );
}
