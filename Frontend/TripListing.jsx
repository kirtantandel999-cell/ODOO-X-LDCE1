/**
 * GlobalTrotter — User Trip Listing (Screen 6)
 * React version of trip-listing.html.
 *
 * Usage:
 *   import TripListing from './TripListing';
 *   <Route path="/trips" element={<TripListing />} />
 *
 * Requires trip-listing.css in the same folder.
 */

import React, { useState, useMemo } from 'react';
import './trip-listing.css';

const STATUS_LABEL = { ongoing: 'Ongoing', upcoming: 'Up-coming', completed: 'Completed' };
const STATUS_ORDER = ['ongoing', 'upcoming', 'completed'];

const TRIPS = [
  {
    id: 1,
    name: 'Rajasthan Heritage Circuit',
    route: 'Udaipur → Jodhpur → Jaipur',
    status: 'ongoing',
    start: '2026-08-18',
    end: '2026-08-27',
    stops: 3,
    budget: 42000,
    overview: 'Palaces, forts and a backwater‑style lake cruise — day 4 of 9, currently in Jodhpur.',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 2,
    name: 'Kerala Backwaters Escape',
    route: 'Kochi → Alleppey → Kumarakom',
    status: 'upcoming',
    start: '2026-10-05',
    end: '2026-10-11',
    stops: 3,
    budget: 35000,
    overview: 'A slow houseboat trip through palm-lined canals, with two nights on the water.',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 3,
    name: 'Goa Coastal Weekend',
    route: 'Panaji → Palolem',
    status: 'completed',
    start: '2026-02-13',
    end: '2026-02-16',
    stops: 2,
    budget: 18000,
    overview: 'Quiet beaches, a sunset shack dinner, and a lazy morning market walk.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=300&q=70',
  },
  {
    id: 4,
    name: 'Himachal Ridge Trek',
    route: 'Manali → Kasol',
    status: 'completed',
    start: '2025-11-02',
    end: '2025-11-09',
    stops: 2,
    budget: 27000,
    overview: 'A seven-day trek with panoramic valley views and two nights of camping.',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=300&q=70',
  },
];

function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { day: 'numeric', month: 'short' };
  const endOpts = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', endOpts)}`;
}

export default function TripListing({ onOpenTrip, onPlanTrip }) {
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('status');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TRIPS.filter((t) => {
      const matchesSearch = !q || `${t.name} ${t.route} ${t.overview}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || t.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const sortTrips = (list) => {
    const copy = [...list];
    copy.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'budget') return b.budget - a.budget;
      return new Date(a.start) - new Date(b.start);
    });
    return copy;
  };

  const openTrip = (trip) => (onOpenTrip ? onOpenTrip(trip) : console.log('Open itinerary for', trip.name));

  const renderCard = (trip) => (
    <article
      className="trip-card"
      key={trip.id}
      tabIndex={0}
      onClick={() => openTrip(trip)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTrip(trip); } }}
    >
      <div className="trip-thumb"><img src={trip.image} alt={trip.name} /></div>
      <div className="trip-main">
        <div className="trip-top">
          <div>
            <div className="trip-title">{trip.name}</div>
            <div className="trip-route">{trip.route}</div>
          </div>
          <span className={`status-pill ${trip.status}`}>{STATUS_LABEL[trip.status]}</span>
        </div>
        <p className="trip-overview">{trip.overview}</p>
        <div className="trip-foot">
          <span>{formatRange(trip.start, trip.end)}</span>
          <span>{trip.stops} stops</span>
          <span className="budget">₹{trip.budget.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </article>
  );

  return (
    <div onClick={() => menuOpen && setMenuOpen(false)}>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="wrap">
          <a href="/" className="logo">
            <span className="mark">GT</span> GlobalTrotter
          </a>
          <div className="topbar-right">
            <span className="crumb">My Trips</span>
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
          <span className="eyebrow">Screen 6</span>
          <h1>Your trips</h1>
          <p>Everything you're planning, packing for, or looking back on — all in one place.</p>
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
              aria-label="Search your trips"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-selects">
            <select aria-label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="status">Group by: Status</option>
              <option value="none">Group by: None</option>
            </select>
            <select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Filter: All</option>
              <option value="ongoing">Filter: Ongoing</option>
              <option value="upcoming">Filter: Up-coming</option>
              <option value="completed">Filter: Completed</option>
            </select>
            <select aria-label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Sort by: Date</option>
              <option value="name">Sort by: Name</option>
              <option value="budget">Sort by: Budget</option>
            </select>
          </div>
        </div>

        {groupBy === 'none' ? (
          <section className="trip-group">
            <div className="group-head">
              <span className="status-dot" style={{ background: 'var(--indigo)' }} />
              <h2>All trips</h2>
              <span className="group-count">{visibleTrips.length}</span>
            </div>
            <div className="trip-list">{sortTrips(visibleTrips).map(renderCard)}</div>
            {visibleTrips.length === 0 && <p className="group-empty show">No trips match your search.</p>}
          </section>
        ) : (
          STATUS_ORDER.map((status) => {
            const trips = sortTrips(visibleTrips.filter((t) => t.status === status));
            if (filter !== 'all' && filter !== status) return null;
            return (
              <section className="trip-group" key={status}>
                <div className="group-head">
                  <span className={`status-dot ${status}`} />
                  <h2>{STATUS_LABEL[status]}</h2>
                  <span className="group-count">{trips.length}</span>
                </div>
                <div className="trip-list">{trips.map(renderCard)}</div>
                {trips.length === 0 && (
                  <p className="group-empty show">No {STATUS_LABEL[status].toLowerCase()} trips match your search.</p>
                )}
              </section>
            );
          })
        )}
      </main>

      <button
        className="fab"
        onClick={() => (onPlanTrip ? onPlanTrip() : console.log('Plan a trip'))}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="fab-label">Plan a Trip</span>
      </button>
    </div>
  );
}
