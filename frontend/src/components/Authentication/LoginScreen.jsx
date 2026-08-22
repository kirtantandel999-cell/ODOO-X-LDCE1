import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { AuthService } from '../../services/AuthService';

export default function LoginScreen({ onNavigate }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setNotification(null);
    
    try {
      const response = await AuthService.login(formData.username, formData.password);
      setNotification({ type: 'success', message: response.message });
      // In a real app, you would save the token/session and redirect to the dashboard.
      setTimeout(() => alert('Redirecting to Dashboard...'), 1000);
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
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

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className={errors.username ? 'input-error' : ''}
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={errors.password ? 'input-error' : ''}
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
