import { useState } from 'react'
import LoginScreen from './components/Authentication/LoginScreen'
import RegistrationScreen from './components/Authentication/RegistrationScreen'
import './index.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');

  return (
    <>
      {currentScreen === 'login' ? (
        <LoginScreen onNavigate={setCurrentScreen} />
      ) : (
        <RegistrationScreen onNavigate={setCurrentScreen} />
      )}
    </>
  )
}

export default App
