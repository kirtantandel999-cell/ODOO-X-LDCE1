import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import LoginScreen from './components/Authentication/LoginScreen';
import RegistrationScreen from './components/Authentication/RegistrationScreen';
import HomePage from './components/Home/HomePage';
import CreateTrip from './components/Trips/CreateTrip';
import BuildItinerary from './components/Itinerary/BuildItinerary';
import ProfilePage from './components/Profile/ProfilePage';
import CalendarPage from './components/Calendar/CalendarPage';
import AdminPanel from './components/Admin/AdminPanel';
import Community from './components/Community/Community';
import ActivitySearch from './components/Activities/ActivitySearch';
import './index.css';

function getScreenFromHashOrPath() {
  const hash = window.location.hash.toLowerCase().replace('#', '');
  if (hash === 'calendar') return 'calendar';
  if (hash === 'profile') return 'profile';
  if (hash === 'community' || hash === 'communitytab' || hash === 'feed') return 'community';
  if (hash === 'admin' || hash === 'adminpanel' || hash === 'admin-panel') return 'admin';
  if (hash === 'login') return 'login';
  if (hash === 'register' || hash === 'signup') return 'register';
  if (hash === 'create-trip' || hash === 'createtrip') return 'createTrip';
  if (hash === 'build-itinerary' || hash === 'builditinerary') return 'buildItinerary';
  if (hash === 'activities' || hash === 'activity-search' || hash === 'activitysearch' || hash === 'activity') return 'activitySearch';

  const path = window.location.pathname.toLowerCase();
  if (path === '/calendar') return 'calendar';
  if (path === '/profile') return 'profile';
  if (path === '/community') return 'community';
  if (path === '/admin' || path === '/admin-panel') return 'admin';
  if (path === '/login') return 'login';
  if (path === '/register' || path === '/signup') return 'register';
  if (path === '/create-trip') return 'createTrip';
  if (path === '/build-itinerary') return 'buildItinerary';
  if (path === '/activities' || path === '/activity-search' || path === '/activity') return 'activitySearch';

  return 'home';
}

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState(() => getScreenFromHashOrPath());

  useEffect(() => {
    const handlePopState = () => {
      setCurrentScreen(getScreenFromHashOrPath());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
    const targetHash = `#${screen}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({}, '', targetHash);
    }
  };

  return (
    <>
      {currentScreen === 'home' && <HomePage onNavigate={handleNavigate} />}
      {currentScreen === 'calendar' && (
        <CalendarPage onNavigate={handleNavigate} currentScreen={currentScreen} />
      )}
      {currentScreen === 'login' && <LoginScreen onNavigate={handleNavigate} />}
      {currentScreen === 'register' && <RegistrationScreen onNavigate={handleNavigate} />}
      {currentScreen === 'profile' && <ProfilePage onNavigate={handleNavigate} />}
      {currentScreen === 'community' && <Community onNavigate={handleNavigate} />}
      {currentScreen === 'admin' && <AdminPanel onNavigate={handleNavigate} />}
      {(currentScreen === 'createTrip' || currentScreen === 'create-trip') && (
        <CreateTrip onNavigate={handleNavigate} />
      )}
      {(currentScreen === 'buildItinerary' || currentScreen === 'build-itinerary') && (
        <BuildItinerary onNavigate={handleNavigate} />
      )}
      {(currentScreen === 'activitySearch' || currentScreen === 'activities' || currentScreen === 'activity-search') && (
        <ActivitySearch onNavigate={handleNavigate} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
