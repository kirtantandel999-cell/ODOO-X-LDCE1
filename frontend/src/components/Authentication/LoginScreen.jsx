import React, { useState } from 'react';
import { User, Lock, Mail } from 'lucide-react';
import { AuthService } from '../../services/AuthService';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ onNavigate }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  let authContext = null;
  try {
    authContext = useAuth();
  } catch (err) {
    // Fallback if not inside AuthProvider
  }

  const validate = () => {
    const newErrors = {};
    const emailVal = formData.email?.trim();
    if (!emailVal) {
      newErrors.email = 'Email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setNotification(null);
    
    try {
      const emailOrUsername = formData.email.trim();
      let response;
      if (authContext && authContext.login) {
        response = await authContext.login(emailOrUsername, formData.password);
      } else {
        response = await AuthService.login(emailOrUsername, formData.password);
      }

      setNotification({
        type: 'success',
        message: response.message || 'Logged in successfully! Redirecting...',
      });

      setTimeout(() => {
        if (onNavigate) {
          onNavigate('home');
        }
      }, 1000);
    } catch (error) {
      setNotification({
        type: 'error',
        message: error.message || 'Login failed. Please check your credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-title">Login</h1>
      
      <div className="profile-placeholder">
        <User size={40} />
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? 'input-error' : ''}
            autoComplete="email"
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={errors.password ? 'input-error' : ''}
            autoComplete="current-password"
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? <div className="spinner"></div> : 'Login'}
        </button>
        
        <button type="button" className="btn-secondary" onClick={() => onNavigate('register')}>
          Create Account / Sign Up
        </button>

        <button type="button" className="btn-link" onClick={() => alert('Password reset modal opened.')}>
          Forgot Password?
        </button>
        
        <button type="button" className="btn-link" onClick={() => onNavigate('home')}>
          ← Back to Home
        </button>
      </form>
    </div>
  );
}
