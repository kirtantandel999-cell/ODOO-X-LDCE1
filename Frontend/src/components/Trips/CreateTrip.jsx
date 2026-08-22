import React, { useState } from 'react';
import './create-trip.css';

const PLACE_OPTIONS = [
  'Rajasthan, India',
  'Kerala, India',
  'Goa, India',
  'Himachal Pradesh, India',
  'North-East India',
  'Bali, Indonesia',
  'Rome, Italy',
  'Paris, France',
];

const SUGGESTIONS = [
  {
    id: 'city-palace',
    tag: 'heritage',
    label: 'Heritage',
    name: 'City Palace',
    desc: 'A lakeside palace complex with courtyards, museums and sweeping views.',
    img: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'backwater-cruise',
    tag: 'nature',
    label: 'Nature',
    name: 'Backwater Cruise',
    desc: 'A slow houseboat ride through palm-lined canals and paddy fields.',
    img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'ridge-trek',
    tag: 'adventure',
    label: 'Adventure',
    name: 'Ridge Trek',
    desc: 'A half-day trail with panoramic views of the valley below.',
    img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'food-walk',
    tag: 'food',
    label: 'Food',
    name: 'Old Town Food Walk',
    desc: 'A guided evening walk through the local street-food market.',
    img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'heritage-museum',
    tag: 'heritage',
    label: 'Heritage',
    name: 'Heritage Museum',
    desc: 'Local art, textiles and history housed in a restored haveli.',
    img: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'sunset-beach',
    tag: 'nature',
    label: 'Nature',
    name: 'Sunset Beach',
    desc: 'A quieter stretch of coast, best visited an hour before sunset.',
    img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=500&q=70',
  },
];

let stopUid = 1;
const makeStop = () => ({ id: stopUid++, place: '', start: '', end: '' });

export default function CreateTrip({ onNavigate }) {
  const [tripStart, setTripStart] = useState('');
  const [tripStartError, setTripStartError] = useState(false);
  const [stops, setStops] = useState([makeStop()]);
  const [selected, setSelected] = useState(new Set());
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');

  const updateStop = (id, field, value) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const addStop = () => setStops((prev) => [...prev, makeStop()]);
  const removeStop = (id) => setStops((prev) => (prev.length === 1 ? prev : prev.filter((s) => s.id !== id)));

  const stopHasDateError = (stop) =>
    stop.start && stop.end && new Date(stop.end) < new Date(stop.start);

  const toggleSuggestion = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const flashConfirm = (text) => {
    setConfirmMsg(text);
    setTimeout(() => setConfirmMsg(''), 3200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasTripStartError = !tripStart;
    const hasStopError = stops.some(stopHasDateError);
    setTripStartError(hasTripStartError);
    if (hasTripStartError || hasStopError) return;

    flashConfirm('Trip created! Redirecting to your itinerary…');
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('buildItinerary');
      }
    }, 600);
  };

  return (
    <div onClick={() => avatarOpen && setAvatarOpen(false)}>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="wrap">
          <a
            href="/"
            className="logo"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('home');
              }
            }}
          >
            <span className="mark">GT</span> GlobalTrotter
          </a>
          <div className="topbar-right">
            <span className="crumb">
              <a
                href="/trips"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate('home');
                  }
                }}
              >
                My Trips
              </a>{' '}
              / New Trip
            </span>
            <div className="avatar-wrap">
              <button
                type="button"
                className="avatar-btn"
                aria-label="Account menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setAvatarOpen((o) => !o);
                }}
              >
                A
              </button>
              <div className={`avatar-menu${avatarOpen ? ' open' : ''}`}>
                <a href="/profile">My Profile</a>
                <a
                  href="/trips"
                  onClick={(e) => {
                    if (onNavigate) {
                      e.preventDefault();
                      onNavigate('home');
                    }
                  }}
                >
                  My Trips
                </a>
                <a href="/logout">Log Out</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE HEAD */}
      <div className="page-head">
        <div className="wrap">
          <h1>Plan a new trip</h1>
          <p>Set your dates, add the places you're visiting, and we'll suggest what to do there.</p>
        </div>
      </div>

      <main className="wrap">
        <form onSubmit={handleSubmit}>
          {/* TRIP DETAILS */}
          <section className="card">
            <h2>Trip details</h2>
            <p className="card-sub">Add at least one place. Use "+ Add another place" for multi-city trips.</p>

            <div className="field-row">
              <div className={`field${tripStartError ? ' has-error' : ''}`}>
                <label htmlFor="tripStart">Trip start date</label>
                <input
                  id="tripStart"
                  type="date"
                  value={tripStart}
                  onChange={(e) => {
                    setTripStart(e.target.value);
                    if (e.target.value) setTripStartError(false);
                  }}
                />
                <span className={`field-error${tripStartError ? ' show' : ''}`}>
                  Pick a start date to continue.
                </span>
              </div>
            </div>

            <div className="stops">
              {stops.map((stop, i) => {
                const dateError = stopHasDateError(stop);
                return (
                  <div className="stop-row" key={stop.id}>
                    <span className="stop-index">Place {i + 1}</span>
                    <div className="field">
                      <label>Select a place</label>
                      <input
                        type="text"
                        placeholder="e.g. Udaipur, Rajasthan"
                        list="placeList"
                        value={stop.place}
                        onChange={(e) => updateStop(stop.id, 'place', e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Start date</label>
                      <input
                        type="date"
                        value={stop.start}
                        onChange={(e) => updateStop(stop.id, 'start', e.target.value)}
                      />
                    </div>
                    <div className={`field${dateError ? ' has-error' : ''}`}>
                      <label>End date</label>
                      <input
                        type="date"
                        value={stop.end}
                        onChange={(e) => updateStop(stop.id, 'end', e.target.value)}
                      />
                      <span className={`field-error${dateError ? ' show' : ''}`}>
                        End date must be after start date.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="remove-stop"
                      aria-label="Remove this place"
                      disabled={stops.length === 1}
                      onClick={() => removeStop(stop.id)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <datalist id="placeList">
              {PLACE_OPTIONS.map((p) => (
                <option value={p} key={p} />
              ))}
            </datalist>

            <button type="button" className="add-stop-btn" onClick={addStop}>
              + Add another place
            </button>
          </section>

          {/* SUGGESTIONS */}
          <section>
            <div className="suggest-head">
              <div>
                <h2>Suggestions for places to visit / activities to perform</h2>
                <p className="sub">Tap to add any of these to your itinerary.</p>
              </div>
              <span className="selected-pill">{selected.size} selected</span>
            </div>

            <div className="suggest-grid">
              {SUGGESTIONS.map((s) => {
                const isSelected = selected.has(s.id);
                return (
                  <article className={`suggest-card${isSelected ? ' selected' : ''}`} key={s.id}>
                    <div className="thumb">
                      <span className={`tag ${s.tag}`}>{s.label}</span>
                      <img src={s.img} alt={s.name} />
                    </div>
                    <div className="suggest-body">
                      <h3>{s.name}</h3>
                      <p>{s.desc}</p>
                      <button type="button" className="add-toggle" onClick={() => toggleSuggestion(s.id)}>
                        {isSelected ? '✓ Added' : '+ Add to itinerary'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

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
              Create Trip →
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
