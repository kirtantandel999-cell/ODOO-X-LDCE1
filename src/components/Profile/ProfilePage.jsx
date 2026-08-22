import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/AuthService';
import './ProfilePage.css';

const INITIAL_PREPLANNED_TRIPS = [
  {
    id: 'trip-pre-1',
    title: 'Royal Rajasthan Expedition',
    destination: 'Udaipur & Jodhpur, India',
    route: 'AMD ✈ UDR ➔ JDH',
    startDate: '2026-10-15',
    endDate: '2026-10-21',
    datesFormatted: '15 Oct – 21 Oct 2026 · 6 nights',
    travelers: 2,
    budget: '₹48,000',
    status: 'Upcoming',
    description: 'A 6-day heritage tour traversing lake palaces, majestic Mehrangarh fort, and evening desert trails.',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=70',
    stops: ['City Palace, Udaipur', 'Lake Pichola Sunset', 'Mehrangarh Fort, Jodhpur', 'Blue City Heritage Walk'],
  },
  {
    id: 'trip-pre-2',
    title: 'Bali Coastal & Temple Retreat',
    destination: 'Ubud & Seminyak, Indonesia',
    route: 'BLR ✈ DPS',
    startDate: '2026-12-05',
    endDate: '2026-12-12',
    datesFormatted: '5 Dec – 12 Dec 2026 · 7 nights',
    travelers: 2,
    budget: '₹95,000',
    status: 'Planning',
    description: 'Relaxing week among Ubud rice terraces, waterfall trekking, and beach sunsets in Seminyak.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=70',
    stops: ['Tegallalang Rice Terrace', 'Ubud Monkey Forest', 'Tanah Lot Sunset', 'Seminyak Beachside'],
  },
  {
    id: 'trip-pre-3',
    title: 'Himachal Snow & Ridge Trek',
    destination: 'Manali & Spiti, India',
    route: 'DEL ✈ KUU',
    startDate: '2027-01-10',
    endDate: '2027-01-16',
    datesFormatted: '10 Jan – 16 Jan 2027 · 6 nights',
    travelers: 4,
    budget: '₹36,000',
    status: 'Draft',
    description: 'High-altitude winter journey with panoramic valley trails, mountain cafes, and star-gazing.',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=70',
    stops: ['Old Manali Cafes', 'Solang Snow Activities', 'Sethan Igloo Village', 'Rohtang Pass Viewpoint'],
  },
];

const INITIAL_PREVIOUS_TRIPS = [
  {
    id: 'trip-prev-1',
    title: 'Kerala Backwaters & Tea Gardens',
    destination: 'Munnar & Alleppey, India',
    fromCode: 'COK',
    toCode: 'ALP',
    datesFormatted: '3 – 7 Nov 2025 · 4 nights',
    tag: 'Kerala · Backwaters',
    status: 'Completed',
    budget: '₹32,500',
    travelers: 2,
    description: 'Slow houseboat cruise through palm-lined canals and crisp walks across Munnar mist-laden hills.',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=500&q=70',
    stops: ['Tea Museum Munnar', 'Mattupetty Dam', 'Alleppey Overnight Houseboat', 'Vembanad Kayaking'],
  },
  {
    id: 'trip-prev-2',
    title: 'Rome & Amalfi Coast',
    destination: 'Rome & Positano, Italy',
    fromCode: 'DEL',
    toCode: 'FCO',
    datesFormatted: '18 – 27 Jun 2025 · 9 nights',
    tag: 'Europe · City & Coast',
    status: 'Completed',
    budget: '₹1,85,000',
    travelers: 2,
    description: 'Ancient Roman ruins, authentic Trastevere trattorias, and scenic cliffside drives in Southern Italy.',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=500&q=70',
    stops: ['Colosseum & Roman Forum', 'Vatican Museums', 'Positano Cliff Walk', 'Capri Day Boat Tour'],
  },
  {
    id: 'trip-prev-3',
    title: 'Goa Coastal Exploration',
    destination: 'North & South Goa, India',
    fromCode: 'AMD',
    toCode: 'GOI',
    datesFormatted: '14 – 18 Feb 2025 · 4 nights',
    tag: 'Goa · Coast & Heritage',
    status: 'Completed',
    budget: '₹28,000',
    travelers: 3,
    description: 'Portuguese quarter walks in Fontainhas, sunset boat cruises, and secluded beaches in Palolem.',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=500&q=70',
    stops: ['Fontainhas Latin Quarter', 'Aguada Fort', 'Palolem Beach Kayaking', 'Old Goa Cathedrals'],
  },
];

export default function ProfilePage({ onNavigate }) {
  const { user, token, logout, updateUser } = useAuth();

  // Profile data from the backend
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [preplannedTrips] = useState(INITIAL_PREPLANNED_TRIPS);
  const [previousTrips] = useState(INITIAL_PREVIOUS_TRIPS);

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [notification, setNotification] = useState(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // ── Fetch profile from backend on mount ──────
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setProfileLoading(false);
        return;
      }
      try {
        const userData = await AuthService.getProfile(token);
        setProfile(userData);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        // Fallback to context user data
        if (user) {
          setProfile(user);
        }
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [token, user]);

  // ── Helpers ──────────────────────────────────
  const getFullName = () => {
    if (profile?.firstName && profile?.lastName) return `${profile.firstName} ${profile.lastName}`;
    if (profile?.firstName) return profile.firstName;
    if (profile?.name) return profile.name;
    return 'User';
  };

  const getInitial = () => {
    const name = getFullName();
    return name.charAt(0).toUpperCase();
  };

  const getMemberSince = () => {
    if (profile?.createdAt) {
      const d = new Date(profile.createdAt);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'Recently joined';
  };

  // ── Edit Profile ─────────────────────────────
  const handleOpenEdit = () => {
    setEditFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phoneNumber: profile?.phoneNumber || '',
      city: profile?.city || '',
      country: profile?.country || '',
      additionalInformation: profile?.additionalInformation || '',
      photo: profile?.photo || '',
    });
    setIsEditing(true);
    setNotification(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editFormData.firstName?.trim() || !editFormData.email?.trim()) {
      alert('First Name and Email are required.');
      return;
    }

    setSaveLoading(true);
    try {
      const result = await AuthService.updateProfile(token, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phoneNumber: editFormData.phoneNumber,
        city: editFormData.city,
        country: editFormData.country,
        additionalInformation: editFormData.additionalInformation,
        photo: editFormData.photo,
      });

      // Update local profile state
      setProfile(result.user);

      // Update global AuthContext so navbar everywhere updates immediately
      updateUser(result.user);

      setIsEditing(false);
      setNotification('Profile details updated successfully!');
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = async () => {
    setAvatarMenuOpen(false);
    await logout();
    onNavigate && onNavigate('home');
  };

  // ── Loading / Not authenticated states ───────
  if (profileLoading) {
    return (
      <div className="profile-page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ fontSize: '18px', color: '#55666c' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile && !user) {
    return (
      <div className="profile-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <p style={{ fontSize: '18px', color: '#55666c' }}>Please log in to view your profile.</p>
        <button
          type="button"
          style={{ padding: '12px 28px', background: '#c1622d', color: '#fff', border: 'none', borderRadius: '999px', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}
          onClick={() => onNavigate && onNavigate('login')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div
      className="profile-page-wrapper"
      onClick={() => avatarMenuOpen && setAvatarMenuOpen(false)}
    >
      {/* ---------- TOPBAR ---------- */}
      <nav className="topbar">
        <div className="wrap">
          <a
            href="#home"
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              onNavigate && onNavigate('home');
            }}
          >
            <span className="mark">GT</span> GlobalTrotter
          </a>

          <div className="topbar-right">
            <span className="crumb">
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate('home');
                }}
              >
                Home
              </a>{' '}
              /{' '}
              <a
                href="#calendar"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate && onNavigate('calendar');
                }}
              >
                Calendar
              </a>{' '}
              / <span>My Profile</span>
            </span>

            <div className="avatar-wrap">
              <button
                type="button"
                className="avatar-btn"
                aria-label="Account menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setAvatarMenuOpen((o) => !o);
                }}
              >
                {profile?.photo ? (
                  <img src={profile.photo} alt={getFullName()} />
                ) : (
                  getInitial()
                )}
              </button>

              <div className={`avatar-menu${avatarMenuOpen ? ' open' : ''}`}>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMenuOpen(false);
                  }}
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    onNavigate && onNavigate('calendar');
                  }}
                >
                  Trip Calendar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    onNavigate && onNavigate('createTrip');
                  }}
                >
                  Plan Trip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    onNavigate && onNavigate('home');
                  }}
                >
                  Home Page
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="wrap">
        {/* ---------- PAGE HEAD / HERO ---------- */}
        <header className="page-head">
          <span className="eyebrow">✈ Personal Traveler Profile</span>
          <h1>My Profile</h1>
          <p>
            Manage your personal travel identity, review your upcoming travel blueprints, and revisit past adventures.
          </p>
        </header>

        {notification && (
          <div className="notification-banner success">
            <span>✓</span> {notification}
          </div>
        )}

        {/* ---------- PROFILE HERO CARD ---------- */}
        <section className="profile-hero-card">
          <div className="profile-main-grid">
            <div className="profile-avatar-container">
              {profile?.photo ? (
                <img
                  src={profile.photo}
                  alt={getFullName()}
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {getInitial()}
                </div>
              )}
              <span className="profile-badge-online" title="Active Traveler"></span>
            </div>

            <div className="profile-details-column">
              <div className="profile-name-row">
                <h2 className="profile-user-name">{getFullName()}</h2>
                {profile?.email && <span className="profile-handle">{profile.email}</span>}
              </div>

              {profile?.additionalInformation && (
                <p className="profile-bio">{profile.additionalInformation}</p>
              )}

              <div className="profile-info-grid">
                {(profile?.city || profile?.country) && (
                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {profile?.email && (
                  <div className="info-item">
                    <span className="info-icon">✉</span>
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile?.phoneNumber && (
                  <div className="info-item">
                    <span className="info-icon">📞</span>
                    <span>{profile.phoneNumber}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-icon">🗓</span>
                  <span>Member since {getMemberSince()}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-edit-profile"
              onClick={handleOpenEdit}
            >
              ✎ Edit Profile
            </button>
          </div>

          <div className="profile-stats-strip">
            <div className="stat-box">
              <span className="stat-number">{preplannedTrips.length}</span>
              <span className="stat-label">Upcoming Itineraries</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{previousTrips.length}</span>
              <span className="stat-label">Completed Journeys</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">12</span>
              <span className="stat-label">Cities Explored</span>
            </div>
          </div>
        </section>

        {/* ---------- PREPLANNED TRIPS SECTION ---------- */}
        <section>
          <div className="section-header-block">
            <div>
              <h2>Preplanned Trips</h2>
              <p className="sub">Upcoming itineraries and destinations scheduled on your calendar.</p>
            </div>
            <span className="section-count-badge">
              {preplannedTrips.length} Planned
            </span>
          </div>

          {preplannedTrips.length === 0 ? (
            <div className="empty-trips-card">
              <span className="empty-icon">🗺</span>
              <div className="empty-title">No upcoming trips yet</div>
              <p className="empty-sub">
                Ready to explore somewhere new? Start planning your next dream trip today.
              </p>
              <button
                type="button"
                className="btn-plan-cta"
                onClick={() => onNavigate && onNavigate('createTrip')}
              >
                + Plan a Trip
              </button>
            </div>
          ) : (
            <div className="trips-grid">
              {preplannedTrips.map((trip) => (
                <article className="trip-card" key={trip.id}>
                  <div className="trip-card-thumb">
                    <img src={trip.image} alt={trip.title} />
                    <span className={`trip-status-pill ${trip.status.toLowerCase()}`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="trip-card-body">
                    <h3 className="trip-card-title">{trip.title}</h3>
                    <div className="trip-card-dest">{trip.destination}</div>
                    <p className="trip-card-desc">{trip.description}</p>

                    <div className="trip-meta-row">
                      <div className="trip-meta-item">
                        <span>🗓</span>
                        <span>{trip.datesFormatted}</span>
                      </div>
                      <div className="trip-meta-item">
                        <span>👥</span>
                        <span>{trip.travelers} Guests</span>
                      </div>
                    </div>

                    <div className="trip-card-foot">
                      <span className="trip-budget-tag">Est. {trip.budget}</span>
                      <button
                        type="button"
                        className="btn-view-trip"
                        onClick={() => setSelectedTripDetails(trip)}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ---------- PREVIOUS TRIPS SECTION ---------- */}
        <section>
          <div className="section-header-block">
            <div>
              <h2>Previous Trips</h2>
              <p className="sub">Your passport collection of completed journeys and adventures.</p>
            </div>
            <span className="section-count-badge">
              {previousTrips.length} Completed
            </span>
          </div>

          {previousTrips.length === 0 ? (
            <div className="empty-trips-card">
              <span className="empty-icon">🎒</span>
              <div className="empty-title">You haven't completed any trips yet</div>
              <p className="empty-sub">
                Once you finish an itinerary, your travel stubs and memories will be stored right here.
              </p>
            </div>
          ) : (
            <div className="trips-grid">
              {previousTrips.map((trip) => (
                <article className="ticket-card" key={trip.id}>
                  <div className="ticket-photo">
                    <img src={trip.image} alt={trip.title} />
                    <span className="trip-status-pill completed">Completed</span>
                  </div>

                  <div className="ticket-perforation"></div>

                  <div className="ticket-content">
                    <div className="ticket-route">
                      <span>{trip.fromCode}</span>
                      <span className="ticket-plane">✈</span>
                      <span>{trip.toCode}</span>
                    </div>
                    <div className="ticket-dates">{trip.datesFormatted}</div>
                    <p className="trip-card-desc">{trip.description}</p>

                    <div className="ticket-foot">
                      <span className="ticket-tag">{trip.tag}</span>
                      <button
                        type="button"
                        className="ticket-btn-link"
                        onClick={() => setSelectedTripDetails(trip)}
                      >
                        View Stub →
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ---------- EDIT PROFILE MODAL ---------- */}
      {isEditing && (
        <div
          className="modal-overlay"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>Edit Profile</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditing(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="modal-form">
              <div className="form-row-2">
                <div className="form-field-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.firstName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="form-field-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-field-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    disabled
                    title="Email cannot be changed"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-field-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editFormData.phoneNumber}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phoneNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-field-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, city: e.target.value })
                    }
                  />
                </div>
                <div className="form-field-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={editFormData.country}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, country: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label>Profile Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editFormData.photo}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, photo: e.target.value })
                  }
                />
              </div>

              <div className="form-field-group">
                <label>Bio & Additional Information</label>
                <textarea
                  rows="3"
                  placeholder="Tell other travelers about your passions, favorite destinations, and travel style..."
                  value={editFormData.additionalInformation}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, additionalInformation: e.target.value })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-ghost-modal"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save-modal"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- TRIP DETAILS MODAL ---------- */}
      {selectedTripDetails && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedTripDetails(null)}
        >
          <div
            className="modal-card wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>{selectedTripDetails.title}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedTripDetails(null)}
              >
                ✕
              </button>
            </div>

            <div className="trip-detail-hero">
              <img
                src={selectedTripDetails.image}
                alt={selectedTripDetails.title}
              />
              <div className="trip-detail-hero-overlay">
                <div>
                  <span className={`trip-status-pill ${selectedTripDetails.status.toLowerCase()}`}>
                    {selectedTripDetails.status}
                  </span>
                  <h3 style={{ fontSize: '20px', marginTop: '6px', color: '#ffffff' }}>
                    {selectedTripDetails.destination}
                  </h3>
                </div>
              </div>
            </div>

            <div className="trip-detail-grid">
              <div className="trip-detail-box">
                <div className="lbl">Duration & Dates</div>
                <div className="val">{selectedTripDetails.datesFormatted}</div>
              </div>
              <div className="trip-detail-box">
                <div className="lbl">Travelers</div>
                <div className="val">{selectedTripDetails.travelers || 2} People</div>
              </div>
              <div className="trip-detail-box">
                <div className="lbl">Estimated Budget</div>
                <div className="val">{selectedTripDetails.budget}</div>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#55666c', lineHeight: 1.6, margin: '14px 0' }}>
              {selectedTripDetails.description}
            </p>

            {selectedTripDetails.stops && (
              <div className="trip-itinerary-preview">
                <h4>Itinerary Stops & Highlights</h4>
                {selectedTripDetails.stops.map((stop, idx) => (
                  <div className="itinerary-step" key={idx}>
                    <span className="step-dot"></span>
                    <span>
                      <strong>Stop {idx + 1}:</strong> {stop}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost-modal"
                onClick={() => setSelectedTripDetails(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-save-modal"
                onClick={() => {
                  setSelectedTripDetails(null);
                  onNavigate && onNavigate('buildItinerary');
                }}
              >
                Open Full Itinerary Planner →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
