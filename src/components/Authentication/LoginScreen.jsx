import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ onNavigate }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
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
      const response = await login(formData.email, formData.password);
      setNotification({ type: 'success', message: response.message || 'Login successful!' });
      // Redirect to home after a brief success message
      setTimeout(() => {
        onNavigate && onNavigate('home');
      }, 600);
    } catch (error) {
      setNotification({ type: 'error', message: error.message || 'Login failed' });
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
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? 'input-error' : ''}
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
      </form>
    </div>
  );
}
