import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/AuthService';
import './activity-search.css';

const CATEGORY_LABEL = {
  adventure: 'Adventure',
  nature: 'Nature',
  heritage: 'Heritage',
  food: 'Food',
  water: 'Water',
};

const CATEGORY_ORDER = ['adventure', 'nature', 'heritage', 'food', 'water'];

const ACTIVITIES = [
  {
    id: 1,
    name: 'Tandem Paragliding — Bir Billing',
    route: 'Himachal Pradesh · 20–30 min flight',
    tag: 'adventure',
    rating: 4.8,
    price: 3200,
    duration: 1,
    durationLabel: '20–30 min',
    overview: 'A guided tandem flight over the valley with a certified pilot, launch and landing assistance included.',
    image: 'https://images.unsplash.com/photo-1521673461164-de300ebcfb17?auto=format&fit=crop&w=600&q=70',
  },
  {
    id: 2,
    name: 'Sunset Paragliding — Kamshet',
    route: 'Maharashtra · 15–20 min flight',
    tag: 'adventure',
    rating: 4.6,
    price: 2500,
    duration: 1,
    durationLabel: '15–20 min',
    overview: 'A shorter evening flight timed for golden-hour views over the Sahyadri ranges.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=70',
  },
  {
    id: 3,
    name: 'Billing Viewpoint Walk',
    route: 'Himachal Pradesh · Free entry',
    tag: 'nature',
    rating: 4.5,
    price: 0,
    duration: 2,
    durationLabel: '~2 hrs',
    overview: 'A short walk up to the take-off point — the best spot to watch paragliders launch.',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=70',
  },
  {
    id: 4,
    name: 'Bir Monastery & Tibetan Colony',
    route: 'Himachal Pradesh · Entry ₹150',
    tag: 'heritage',
    rating: 4.4,
    price: 150,
    duration: 2,
    durationLabel: '~2 hrs',
    overview: 'A quiet Tibetan settlement with a colourful monastery, prayer wheels and craft shops.',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=70',
  },
  {
    id: 5,
    name: 'Kangra Valley Food Trail',
    route: 'Himachal Pradesh · Group walk',
    tag: 'food',
    rating: 4.7,
    price: 600,
    duration: 2,
    durationLabel: '~2 hrs',
    overview: 'A guided evening walk sampling local Himachali dishes across three family-run kitchens.',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=70',
  },
  {
    id: 6,
    name: 'Beas River Rafting',
    route: 'Kullu, Himachal Pradesh · 14 km stretch',
    tag: 'water',
    rating: 4.3,
    price: 1200,
    duration: 3,
    durationLabel: '~3 hrs',
    overview: 'Grade II–III rapids with safety gear and an instructor included, best paired with a Bir stopover.',
    image: 'https://images.unsplash.com/photo-1530866495561-507c9faab73b?auto=format&fit=crop&w=600&q=70',
  },
  {
    id: 7,
    name: 'Billing Ridge Day Trek',
    route: 'Himachal Pradesh · 8 km trail',
    tag: 'adventure',
    rating: 4.2,
    price: 1800,
    duration: 6,
    durationLabel: '~6 hrs',
    overview: 'A moderate day hike along the ridge with panoramic views of the launch site below.',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=70',
  },
];

export default function ActivitySearch({ onNavigate, onAddActivity }) {
  let auth = null;
  try {
    auth = useAuth();
  } catch (err) {
    // ignore
  }

  const currentUser = auth?.user || AuthService.getCurrentUser();

  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [menuOpen, setMenuOpen] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const [addedNotice, setAddedNotice] = useState(null);

  const visibleActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ACTIVITIES.filter((a) => {
      const matchesSearch = !q || `${a.name} ${a.route} ${a.overview}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || a.tag === filter;
      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const sortActivities = (list) => {
    const copy = [...list];
    copy.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'duration') return a.duration - b.duration;
      return b.rating - a.rating; // default: rating
    });
    return copy;
  };

  const addActivity = (activity) => {
    setFlashId(activity.id);
    setAddedNotice(`Selected "${activity.name}"`);
    setTimeout(() => {
      setFlashId(null);
      setAddedNotice(null);
    }, 2500);

    if (onAddActivity) {
      onAddActivity(activity);
    }
  };

  const handleNav = (screen) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(screen);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    if (auth?.logout) {
      await auth.logout();
    } else {
      await AuthService.logout();
    }
    if (onNavigate) onNavigate('login');
  };

  const userInitial = currentUser?.firstName
    ? currentUser.firstName.charAt(0).toUpperCase()
    : currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : 'A';

  const renderCard = (activity) => (
    <article
      className="trip-card"
      key={activity.id}
      tabIndex={0}
      style={flashId === activity.id ? { outline: '2px solid var(--terracotta)' } : undefined}
      onClick={() => addActivity(activity)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          addActivity(activity);
        }
      }}
    >
      <div className="trip-thumb">
        <img src={activity.image} alt={activity.name} />
      </div>
      <div className="trip-main">
        <div className="trip-top">
          <div>
            <div className="trip-title">{activity.name}</div>
            <div className="trip-route">{activity.route}</div>
          </div>
          <span className={`status-pill ${activity.tag}`}>{CATEGORY_LABEL[activity.tag]}</span>
        </div>
        <p className="trip-overview">{activity.overview}</p>
        <div className="trip-foot">
          <span className="rating">★ {activity.rating}</span>
          <span>{activity.durationLabel}</span>
          <span className="budget">{activity.price === 0 ? 'Free' : `₹${activity.price.toLocaleString('en-IN')}`}</span>
        </div>
      </div>
    </article>
  );

  return (
    <div onClick={() => menuOpen && setMenuOpen(false)}>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="wrap">
          <a
            href="#home"
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              handleNav('home');
            }}
          >
            <span className="mark">GT</span> GlobalTrotter
          </a>

          <div className="topbar-right">
            <span className="crumb">
              <a
                href="#create-trip"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('createTrip');
                }}
              >
                New Trip
              </a>{' '}
              / <span>Activity Search</span>
            </span>

            <div className="avatar-wrap">
              <button
                type="button"
                className="avatar-btn"
                aria-label="Account menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
              >
                {currentUser?.photo || currentUser?.avatar ? (
                  <img
                    src={currentUser.photo || currentUser.avatar}
                    alt={currentUser.name || 'User'}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  userInitial
                )}
              </button>

              <div className={`avatar-menu${menuOpen ? ' open' : ''}`}>
                <button type="button" onClick={() => handleNav('profile')}>My Profile</button>
                <button type="button" onClick={() => handleNav('calendar')}>Trip Calendar</button>
                <button type="button" onClick={() => handleNav('createTrip')}>Plan Trip</button>
                <button type="button" onClick={() => handleNav('community')}>Community</button>
                <button type="button" onClick={() => handleNav('admin')}>Admin Panel</button>
                <button type="button" onClick={() => handleNav('home')}>Home Page</button>
                <button type="button" onClick={handleLogout}>Log Out</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE HEAD */}
      <div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Discovery</span>
          <h1>Activity &amp; city search</h1>
          <p>Search any activity or city and add what fits straight into your itinerary.</p>
        </div>
      </div>

      {addedNotice && (
        <div className="wrap" style={{ marginBottom: '16px' }}>
          <div style={{
            background: 'var(--indigo-deep)',
            color: 'var(--white)',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✓</span> {addedNotice}
          </div>
        </div>
      )}

      <main className="wrap">
        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="search-field">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search activities or cities..."
              aria-label="Search activities or cities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-selects">
            <select aria-label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="none">Group by: None</option>
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
              <option value="rating">Sort by: Rating</option>
              <option value="price-low">Sort by: Price (low)</option>
              <option value="price-high">Sort by: Price (high)</option>
              <option value="duration">Sort by: Duration</option>
            </select>
          </div>
        </div>

        {groupBy === 'none' ? (
          <section className="trip-group">
            <div className="group-head">
              <h2>Results</h2>
              <span className="group-count">{visibleActivities.length}</span>
            </div>
            <div className="trip-list">{sortActivities(visibleActivities).map(renderCard)}</div>
            {visibleActivities.length === 0 && <p className="group-empty show">No activities match your search.</p>}
          </section>
        ) : (
          CATEGORY_ORDER.map((tag) => {
            const activities = sortActivities(visibleActivities.filter((a) => a.tag === tag));
            if (filter !== 'all' && filter !== tag) return null;
            return (
              <section className="trip-group" key={tag}>
                <div className="group-head">
                  <span className={`status-dot ${tag}`} />
                  <h2>{CATEGORY_LABEL[tag]}</h2>
                  <span className="group-count">{activities.length}</span>
                </div>
                <div className="trip-list">{activities.map(renderCard)}</div>
                {activities.length === 0 && (
                  <p className="group-empty show">No {CATEGORY_LABEL[tag].toLowerCase()} activities match your search.</p>
                )}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
