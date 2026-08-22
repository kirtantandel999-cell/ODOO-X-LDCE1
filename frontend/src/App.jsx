import { useState } from 'react'
import LoginScreen from './components/Authentication/LoginScreen'
import RegistrationScreen from './components/Authentication/RegistrationScreen'
import HomePage from './components/Home/HomePage'
import CreateTrip from './components/Trips/CreateTrip'
import BuildItinerary from './components/Itinerary/BuildItinerary'
import ProfilePage from './components/Profile/ProfilePage'
import './index.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  return (
    <>
      {currentScreen === 'home' && <HomePage onNavigate={setCurrentScreen} />}
      {currentScreen === 'login' && <LoginScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'register' && <RegistrationScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'profile' && <ProfilePage onNavigate={setCurrentScreen} />}
      {(currentScreen === 'createTrip' || currentScreen === 'create-trip') && (
        <CreateTrip onNavigate={setCurrentScreen} />
      )}
      {(currentScreen === 'buildItinerary' || currentScreen === 'build-itinerary') && (
        <BuildItinerary onNavigate={setCurrentScreen} />
      )}
    </>
  )
}

export default App
