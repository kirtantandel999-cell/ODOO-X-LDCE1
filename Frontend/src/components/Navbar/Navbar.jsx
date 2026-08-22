import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onNavigate, currentScreen = 'calendar' }) {
  const { user, logout } = useAuth();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    setAvatarOpen(false);
    if (logout) await logout();
    if (onNavigate) onNavigate('login');
  };

  const getInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'A';
  };

  return (
    <nav className="topbar">
      <div className="wrap">
        <a
          href="/"
          className="logo"
          onClick={(e) => {
            e.preventDefault();
            onNavigate && onNavigate('home');
          }}
        >
          <span className="mark">GT</span> GlobalTrotter
        </a>

        <div className="topbar-right" ref={menuRef}>
          <span className="crumb">
            <a
              href="/trips"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('home');
              }}
            >
              My Trips
            </a>{' '}
            / <span>Trip Calendar</span>
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
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                getInitial()
              )}
            </button>

            <div className={`avatar-menu${avatarOpen ? ' open' : ''}`}>
              <a
                href="/profile"
                onClick={(e) => {
                  e.preventDefault();
                  setAvatarOpen(false);
                  onNavigate && onNavigate('profile');
                }}
              >
                My Profile
              </a>
              <a
                href="/calendar"
                onClick={(e) => {
                  e.preventDefault();
                  setAvatarOpen(false);
                  onNavigate && onNavigate('calendar');
                }}
              >
                Trip Calendar
              </a>
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  setAvatarOpen(false);
                  onNavigate && onNavigate('admin');
                }}
              >
                Admin Panel
              </a>
              <a
                href="/create-trip"
                onClick={(e) => {
                  e.preventDefault();
                  setAvatarOpen(false);
                  onNavigate && onNavigate('createTrip');
                }}
              >
                Plan Trip
              </a>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setAvatarOpen(false);
                  onNavigate && onNavigate('home');
                }}
              >
                Home Page
              </a>
              <a
                href="/logout"
                onClick={handleLogout}
              >
                Log Out
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
