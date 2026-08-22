import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService, normalizeUserProfile } from '../../services/AuthService';
import './ProfilePage.css';

const DEFAULT_PROFILE = {
  fullName: 'Aarav Sharma',
  username: 'aarav_travels',
  email: 'aarav.sharma@example.com',
  phone: '+91 98765 43210',
  location: 'Ahmedabad, Gujarat, India',
  bio: 'Passionate globetrotter exploring architectural wonders, Himalayan treks, and coastal culture across India and around the globe.',
  photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  memberSince: 'March 2024',
  preferences: ['Heritage', 'Nature', 'Food', 'Adventure', 'Culture'],
};

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
  let auth = null;
  try {
    auth = useAuth();
  } catch (err) {
    // Fallback if rendered outside AuthProvider
  }

  const currentUser = auth?.user || AuthService.getCurrentUser();

  const [profile, setProfile] = useState(() => {
    if (currentUser) {
      return normalizeUserProfile(currentUser);
    }
    const saved = localStorage.getItem('globetrotter_user_profile') || localStorage.getItem('globetrotter_user');
    return saved ? normalizeUserProfile(JSON.parse(saved)) : DEFAULT_PROFILE;
  });

  const [preplannedTrips, setPreplannedTrips] = useState(INITIAL_PREPLANNED_TRIPS);
  const [previousTrips, setPreviousTrips] = useState(INITIAL_PREVIOUS_TRIPS);

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(profile);
  const [notification, setNotification] = useState(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);

  // Sync profile state when auth user changes
  useEffect(() => {
    if (currentUser) {
      const normalized = normalizeUserProfile(currentUser);
      setProfile(normalized);
      localStorage.setItem('globetrotter_user_profile', JSON.stringify(normalized));
    }
  }, [auth?.user]);

  // Fetch live profile from backend if user is authenticated
  useEffect(() => {
    const fetchLiveProfile = async () => {
      const token = AuthService.getToken();
      if (!token) return;
      try {
        const liveUser = await AuthService.getProfile();
        if (liveUser) {
          const normalized = normalizeUserProfile(liveUser);
          setProfile(normalized);
          localStorage.setItem('globetrotter_user', JSON.stringify(normalized));
          localStorage.setItem('globetrotter_user_profile', JSON.stringify(normalized));
        }
      } catch (e) {
        console.warn('Live profile fetch error:', e.message);
      }
    };
    fetchLiveProfile();
  }, []);

  const handleOpenEdit = () => {
    setEditFormData({ ...profile });
    setIsEditing(true);
    setNotification(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editFormData.fullName?.trim() || !editFormData.email?.trim()) {
      alert('Full Name and Email are required.');
      return;
    }

    const nameParts = editFormData.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    let city = editFormData.city;
    let country = editFormData.country;
    if (!city && editFormData.location) {
      const locParts = editFormData.location.split(',');
      city = locParts[0]?.trim() || '';
      country = locParts[1]?.trim() || '';
    }

    const updatedProfile = {
      ...editFormData,
      firstName: firstName || editFormData.firstName || '',
      lastName: lastName || editFormData.lastName || '',
      city: city || editFormData.city || '',
      country: country || editFormData.country || '',
      phoneNumber: editFormData.phone || editFormData.phoneNumber || '',
      additionalInformation: editFormData.bio || editFormData.additionalInformation || '',
    };

    const normalized = normalizeUserProfile(updatedProfile);
    setProfile(normalized);
    localStorage.setItem('globetrotter_user_profile', JSON.stringify(normalized));
    localStorage.setItem('globetrotter_user', JSON.stringify(normalized));
    setIsEditing(false);
    setNotification('Profile details updated successfully!');

    // Persist changes to backend if token exists
    const token = AuthService.getToken();
    if (token) {
      try {
        await AuthService.updateProfile({
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          phoneNumber: normalized.phoneNumber,
          city: normalized.city,
          country: normalized.country,
          additionalInformation: normalized.additionalInformation,
          photo: normalized.photo,
        });
      } catch (err) {
        console.warn('Backend update failed:', err.message);
      }
    }

    setTimeout(() => setNotification(null), 3500);
  };

  const handlePreferenceToggle = (pref) => {
    setEditFormData((prev) => {
      const current = prev.preferences || [];
      const updated = current.includes(pref)
        ? current.filter((p) => p !== pref)
        : [...current, pref];
      return { ...prev, preferences: updated };
    });
  };

  const handleLogout = async () => {
    setAvatarMenuOpen(false);
    if (auth?.logout) {
      await auth.logout();
    } else {
      await AuthService.logout();
    }
    if (onNavigate) onNavigate('login');
  };

  const ALL_PREFERENCES = ['Heritage', 'Nature', 'Food', 'Adventure', 'Culture', 'Beaches', 'Photography', 'Nightlife'];

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
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.fullName} />
                ) : (
                  profile.fullName.charAt(0)
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
                    onNavigate && onNavigate('community');
                  }}
                >
                  Community
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
        {/* ---------- PAGE HEAD / HERO (Short card structure matching image) ---------- */}
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
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.fullName}
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {profile.fullName.charAt(0)}
                </div>
              )}
              <span className="profile-badge-online" title="Active Traveler"></span>
            </div>

            <div className="profile-details-column">
              <div className="profile-name-row">
                <h2 className="profile-user-name">{profile.fullName}</h2>
                <span className="profile-handle">@{profile.username}</span>
              </div>

              <p className="profile-bio">{profile.bio}</p>

              <div className="profile-info-grid">
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  <span>{profile.location}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">✉</span>
                  <span>{profile.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📞</span>
                  <span>{profile.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🗓</span>
                  <span>Member since {profile.memberSince}</span>
                </div>
              </div>

              {profile.preferences && profile.preferences.length > 0 && (
                <div className="profile-prefs-group">
                  <span className="prefs-label">Travel Style:</span>
                  {profile.preferences.map((pref) => {
                    const tagClass = pref.toLowerCase().replace(/[^a-z]/g, '');
                    return (
                      <span key={pref} className={`pref-tag ${tagClass}`}>
                        {pref}
                      </span>
                    );
                  })}
                </div>
              )}
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
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, fullName: e.target.value })
                    }
                  />
                </div>
                <div className="form-field-group">
                  <label>Username / Handle</label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, username: e.target.value })
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
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-field-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label>Location / City, Country</label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad, Gujarat, India"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, location: e.target.value })
                  }
                />
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
                <label>Bio & Travel Motto</label>
                <textarea
                  rows="3"
                  placeholder="Tell other travelers about your passions, favorite destinations, and travel style..."
                  value={editFormData.bio}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, bio: e.target.value })
                  }
                />
              </div>

              <div className="form-field-group">
                <label>Select Travel Preferences</label>
                <div className="profile-prefs-group" style={{ marginTop: '6px' }}>
                  {ALL_PREFERENCES.map((pref) => {
                    const active = (editFormData.preferences || []).includes(pref);
                    const tagClass = pref.toLowerCase().replace(/[^a-z]/g, '');
                    return (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => handlePreferenceToggle(pref)}
                        className={`pref-tag ${tagClass}`}
                        style={{
                          cursor: 'pointer',
                          opacity: active ? 1 : 0.45,
                          transform: active ? 'scale(1.05)' : 'scale(1)',
                          borderStyle: active ? 'solid' : 'dashed',
                        }}
                      >
                        {active ? `✓ ${pref}` : `+ ${pref}`}
                      </button>
                    );
                  })}
                </div>
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
                >
                  Save Changes
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
