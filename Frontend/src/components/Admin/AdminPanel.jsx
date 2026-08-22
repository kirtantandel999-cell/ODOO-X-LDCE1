import React, { useState, useMemo } from 'react';
import './admin-panel.css';

const USERS = [
  { id: 1, name: 'Priya Nair', email: 'priya.nair@mail.com', status: 'active', trips: 12, joined: '2024-01-14', joinedLabel: '14 Jan 2024', color: 'var(--ocean)', letter: 'P' },
  { id: 2, name: 'Rohan Mehta', email: 'rohan.mehta@mail.com', status: 'active', trips: 7, joined: '2024-03-02', joinedLabel: '02 Mar 2024', color: 'var(--rust)', letter: 'R' },
  { id: 3, name: 'Sana Iqbal', email: 'sana.iqbal@mail.com', status: 'invited', trips: 0, joined: '2024-07-19', joinedLabel: '19 Jul 2024', color: 'var(--terracotta)', letter: 'S' },
  { id: 4, name: 'Vikram Rao', email: 'vikram.rao@mail.com', status: 'suspended', trips: 3, joined: '2023-11-08', joinedLabel: '08 Nov 2023', color: 'var(--gold)', letter: 'V' },
  { id: 5, name: 'Meera Das', email: 'meera.das@mail.com', status: 'active', trips: 21, joined: '2023-06-27', joinedLabel: '27 Jun 2023', color: 'var(--leaf)', letter: 'M' },
];

const CITIES = [
  { id: 1, name: 'Bir Billing', sub: 'Himachal Pradesh', value: 1840 },
  { id: 2, name: 'Manali', sub: 'Himachal Pradesh', value: 1420 },
  { id: 3, name: 'Rishikesh', sub: 'Uttarakhand', value: 1105 },
  { id: 4, name: 'Goa', sub: 'Goa', value: 960 },
  { id: 5, name: 'Udaipur', sub: 'Rajasthan', value: 710 },
];

const ACTIVITIES = [
  { id: 1, name: 'Tandem Paragliding', sub: 'Adventure', value: 640, color: 'var(--gold)' },
  { id: 2, name: 'River Rafting', sub: 'Water', value: 510, color: 'var(--ocean)' },
  { id: 3, name: 'Food Trails', sub: 'Food', value: 455, color: 'var(--rust)' },
  { id: 4, name: 'Heritage Walks', sub: 'Heritage', value: 330, color: 'var(--terracotta)' },
  { id: 5, name: 'Nature Treks', sub: 'Nature', value: 290, color: 'var(--leaf)' },
];

const TABS = [
  { id: 'trends', label: 'User Trends and Analytics' },
  { id: 'users', label: 'Manage Users' },
  { id: 'cities', label: 'Popular cities' },
  { id: 'activities', label: 'Popular Activities' },
];

const RECENT_BOOKINGS = [
  { name: 'Priya Nair', sub: 'Bir Billing · 2 days ago', tag: 'completed', color: 'var(--ocean)', letter: 'P' },
  { name: 'Rohan Mehta', sub: 'Kangra Valley · 3 days ago', tag: 'ongoing', color: 'var(--rust)', letter: 'R' },
  { name: 'Sana Iqbal', sub: 'Bir Monastery · 5 days ago', tag: 'planned', color: 'var(--terracotta)', letter: 'S' },
  { name: 'Vikram Rao', sub: 'Beas River · 1 week ago', tag: 'completed', color: 'var(--gold)', letter: 'V' },
];

export default function AdminPanel({ onNavigate }) {
  const [tab, setTab] = useState('trends');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [menuOpen, setMenuOpen] = useState(false);

  const usesToolbar = tab !== 'trends';

  const sortOptions = tab === 'users'
    ? [['name', 'Sort by: Name'], ['trips', 'Sort by: Trips'], ['joined', 'Sort by: Joined']]
    : [['name', 'Sort by: Name'], ['value', `Sort by: ${tab === 'cities' ? 'Visits' : 'Bookings'}`]];

  const changeTab = (t) => {
    setTab(t);
    setSearch('');
    setSortBy('name');
  };

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = USERS.filter((u) => {
      const matchesSearch = !q || `${u.name} ${u.email}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || u.status === filter;
      return matchesSearch && matchesFilter;
    });
    list = [...list].sort((a, b) => {
      if (groupBy === 'status' && a.status !== b.status) return a.status.localeCompare(b.status);
      if (sortBy === 'trips') return b.trips - a.trips;
      if (sortBy === 'joined') return new Date(b.joined) - new Date(a.joined);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [search, filter, sortBy, groupBy]);

  const filteredSorted = (items) => {
    const q = search.trim().toLowerCase();
    let list = items.filter((i) => !q || i.name.toLowerCase().includes(q));
    list = [...list].sort((a, b) => (sortBy === 'value' ? b.value - a.value : a.name.localeCompare(b.name)));
    return list;
  };

  const visibleCities = useMemo(() => filteredSorted(CITIES), [search, sortBy]);
  const visibleActivities = useMemo(() => filteredSorted(ACTIVITIES), [search, sortBy]);

  const statusLabel = { active: 'Active', invited: 'Invited', suspended: 'Suspended' };

  const handleNav = (screen) => {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(screen);
    }
  };

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
            <span className="crumb">Admin Panel</span>
            <div className="avatar-wrap">
              <button
                className="avatar-btn"
                aria-label="Account menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
              >
                A
              </button>
              <div className={`avatar-menu${menuOpen ? ' open' : ''}`}>
                <button type="button" onClick={() => handleNav('profile')}>My Profile</button>
                <button type="button" onClick={() => handleNav('createTrip')}>Create Trip</button>
                <button type="button" onClick={() => handleNav('calendar')}>Calendar</button>
                <button type="button" onClick={() => handleNav('community')}>Community</button>
                <button type="button" onClick={() => handleNav('home')}>Home</button>
                <button type="button" onClick={() => handleNav('login')}>Log Out</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE HEAD */}
      <div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Administration</span>
          <h1>Admin panel</h1>
          <p>Manage users and their access, and track the cities, activities, and trends that matter most to the community.</p>
        </div>
      </div>

      <main className="wrap">
        {/* SECTION TABS */}
        <div className="tabbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn${tab === t.id ? ' active' : ''}`}
              onClick={() => changeTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TOOLBAR */}
        {usesToolbar && (
          <div className="toolbar">
            <div className="search-field">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder={`Search ${tab}...`}
                aria-label="Search this section"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="toolbar-selects">
              {tab === 'users' && (
                <>
                  <select aria-label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                    <option value="none">Group by: None</option>
                    <option value="status">Group by: Status</option>
                  </select>
                  <select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">Filter: All</option>
                    <option value="active">Filter: Active</option>
                    <option value="invited">Filter: Invited</option>
                    <option value="suspended">Filter: Suspended</option>
                  </select>
                </>
              )}
              <select aria-label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {sortOptions.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ================= USER TRENDS & ANALYTICS ================= */}
        {tab === 'trends' && (
          <section className="dashboard-card">
            <div className="dashboard-grid">

              <div className="chart-panel">
                <h3>Recent trip bookings</h3>
                <div className="mini-list">
                  {RECENT_BOOKINGS.map((r, i) => (
                    <div className="mini-row" key={i}>
                      <div className="mini-avatar" style={{ background: r.color }}>{r.letter}</div>
                      <div className="mini-main"><div className="mini-name">{r.name}</div><div className="mini-sub">{r.sub}</div></div>
                      <span className={`mini-tag ${r.tag}`}>{r.tag[0].toUpperCase() + r.tag.slice(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-panel">
                <h3>Trip status breakdown</h3>
                <div className="pie-wrap">
                  <svg width="120" height="120" viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)', flex: 'none' }}>
                    <circle r="16" cx="16" cy="16" fill="var(--ocean)" />
                    <circle r="16" cx="16" cy="16" fill="transparent" stroke="var(--gold)" strokeWidth="32" strokeDasharray="19.5 80.5" strokeDashoffset="0" />
                    <circle r="16" cx="16" cy="16" fill="transparent" stroke="var(--leaf)" strokeWidth="32" strokeDasharray="9 91" strokeDashoffset="-19.5" />
                  </svg>
                  <div className="pie-legend">
                    <span><span className="dot" style={{ background: 'var(--ocean)' }} />Completed<span className="pct">71.5%</span></span>
                    <span><span className="dot" style={{ background: 'var(--gold)' }} />Planned<span className="pct">19.5%</span></span>
                    <span><span className="dot" style={{ background: 'var(--leaf)' }} />Ongoing<span className="pct">9%</span></span>
                  </div>
                </div>
              </div>

              <div className="chart-panel span-2">
                <h3>Monthly active users</h3>
                <div className="line-meta"><span className="big">8,240</span><span className="delta">+14.2% vs last month</span></div>
                <svg viewBox="0 0 560 140" width="100%" height="140" preserveAspectRatio="none">
                  <polyline points="10,110 105,70 200,95 295,40 390,55 485,45" fill="none" stroke="#6a787c" strokeWidth="2" />
                  {[[10, 110], [105, 70], [200, 95], [295, 40], [390, 55], [485, 45]].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="6" fill="var(--rust)" />
                  ))}
                </svg>
                <div className="line-labels"><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span></div>
              </div>

              <div className="chart-panel">
                <h3>Most booked categories</h3>
                <div className="bar-chart">
                  <div className="bar-col"><span className="bar-value">640</span><div className="bar-fill" style={{ height: '70%' }} /><span className="bar-label">Adventure</span></div>
                  <div className="bar-col"><span className="bar-value">510</span><div className="bar-fill" style={{ height: '56%' }} /><span className="bar-label">Water</span></div>
                  <div className="bar-col"><span className="bar-value">455</span><div className="bar-fill" style={{ height: '50%' }} /><span className="bar-label">Food</span></div>
                </div>
              </div>

              <div className="chart-panel">
                <h3>Top activities this month</h3>
                <div className="rank-list">
                  <div className="rank-row"><span className="rank-num">1</span><span className="rank-name">Tandem Paragliding — Bir Billing</span><span className="rank-count">640</span></div>
                  <div className="rank-row"><span className="rank-num">2</span><span className="rank-name">Beas River Rafting</span><span className="rank-count">510</span></div>
                  <div className="rank-row"><span className="rank-num">3</span><span className="rank-name">Kangra Valley Food Trail</span><span className="rank-count">455</span></div>
                  <div className="rank-row"><span className="rank-num">4</span><span className="rank-name">Bir Monastery &amp; Tibetan Colony</span><span className="rank-count">330</span></div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ================= MANAGE USERS ================= */}
        {tab === 'users' && (
          <section>
            <table className="data-table">
              <thead>
                <tr><th>User</th><th>Status</th><th>Trips</th><th>Joined</th><th></th></tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="mini-avatar" style={{ background: u.color }}>{u.letter}</div>
                        <div className="who"><div className="name">{u.name}</div><div className="email">{u.email}</div></div>
                      </div>
                    </td>
                    <td><span className={`status-pill ${u.status}`}>{statusLabel[u.status]}</span></td>
                    <td>{u.trips}</td>
                    <td>{u.joinedLabel}</td>
                    <td>
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        {u.status === 'invited' ? (
                          <>
                            <button type="button" onClick={() => console.log(`Resend invite to ${u.name}`)}>Resend</button>
                            <button type="button" onClick={() => console.log(`Revoke invite for ${u.name}`)}>Revoke</button>
                          </>
                        ) : u.status === 'suspended' ? (
                          <>
                            <button type="button" onClick={() => console.log(`View ${u.name}`)}>View</button>
                            <button type="button" onClick={() => console.log(`Reinstate ${u.name}`)}>Reinstate</button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => console.log(`View ${u.name}`)}>View</button>
                            <button type="button" onClick={() => console.log(`Suspend ${u.name}`)}>Suspend</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleUsers.length === 0 && <p className="table-empty">No users match your search.</p>}
          </section>
        )}

        {/* ================= POPULAR CITIES ================= */}
        {tab === 'cities' && (
          <section className="rank-board">
            {visibleCities.map((c, i) => (
              <div className="rank-board-row" key={c.id}>
                <div className="rank-board-num">{i + 1}</div>
                <div className="rank-board-main">
                  <div className="rank-board-name">{c.name}</div>
                  <div className="rank-board-sub">{c.sub} · {c.value.toLocaleString('en-IN')} visits this quarter</div>
                  <div className="rank-board-bar-track"><div className="rank-board-bar-fill" style={{ width: `${(c.value / CITIES[0].value) * 100}%` }} /></div>
                </div>
                <div className="rank-board-count">{c.value.toLocaleString('en-IN')}<span>visits</span></div>
              </div>
            ))}
            {visibleCities.length === 0 && <p className="table-empty">No cities match your search.</p>}
          </section>
        )}

        {/* ================= POPULAR ACTIVITIES ================= */}
        {tab === 'activities' && (
          <section className="rank-board">
            {visibleActivities.map((a, i) => (
              <div className="rank-board-row" key={a.id}>
                <div className="rank-board-num">{i + 1}</div>
                <div className="rank-board-main">
                  <div className="rank-board-name">{a.name}</div>
                  <div className="rank-board-sub">{a.sub} · {a.value.toLocaleString('en-IN')} bookings this quarter</div>
                  <div className="rank-board-bar-track"><div className="rank-board-bar-fill" style={{ width: `${(a.value / ACTIVITIES[0].value) * 100}%`, background: a.color }} /></div>
                </div>
                <div className="rank-board-count">{a.value.toLocaleString('en-IN')}<span>bookings</span></div>
              </div>
            ))}
            {visibleActivities.length === 0 && <p className="table-empty">No activities match your search.</p>}
          </section>
        )}
      </main>
    </div>
  );
}
