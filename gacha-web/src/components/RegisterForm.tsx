import React, { useState } from 'react';
import { useStore } from '../store';

const RegisterForm: React.FC<{ onClose: () => void, showLogin: () => void }> = ({ onClose, showLogin }) => {
  const { register } = useStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);

    try {
      await register(username, email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-form">
      <h2 style={{ 
        color: 'var(--gray-100)', 
        fontSize: '24px', 
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center'
      }}>Create Account</h2>
      
      {error && (
        <div className="error-message" style={{ 
          color: '#fecaca', 
          backgroundColor: 'rgba(185, 28, 28, 0.3)', 
          padding: '12px 16px', 
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid rgba(248, 113, 113, 0.4)',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <small>Must be at least 8 characters</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-text"
            onClick={showLogin}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0' }}
          >
            Already have an account? Login
          </button>
          
          <div>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ marginRight: '8px' }}
              disabled={isLoading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Register'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;