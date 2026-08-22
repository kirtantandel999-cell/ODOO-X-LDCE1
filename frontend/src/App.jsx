import { useState } from 'react'
import LoginScreen from './components/Authentication/LoginScreen'
import RegistrationScreen from './components/Authentication/RegistrationScreen'
import HomePage from './components/Home/HomePage'
import './index.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  return (
    <>
      {currentScreen === 'home' && <HomePage onNavigate={setCurrentScreen} />}
      {currentScreen === 'login' && <LoginScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'register' && <RegistrationScreen onNavigate={setCurrentScreen} />}
    </>
  )
}

export default App
