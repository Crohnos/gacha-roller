import React, { useState } from 'react';
import { useStore } from '../store';

const LoginForm: React.FC<{ onClose: () => void, showForgotPassword: () => void }> = ({ onClose, showForgotPassword }) => {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form">
      <h2 style={{ 
        color: 'var(--gray-100)', 
        fontSize: '24px', 
        fontWeight: 'bold',
        marginBottom: '20px',
        textAlign: 'center'
      }}>Login</h2>
      
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
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="email" style={{ 
            display: 'block', 
            marginBottom: '6px', 
            color: 'var(--gray-300)',
            fontWeight: '500',
            fontSize: '14px'
          }}>Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--purple-700)',
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: 'rgba(31, 16, 50, 0.6)',
              color: 'var(--gray-100)'
            }}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label htmlFor="password" style={{ 
            display: 'block', 
            marginBottom: '6px', 
            color: 'var(--gray-300)',
            fontWeight: '500',
            fontSize: '14px'
          }}>Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--purple-700)',
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: 'rgba(31, 16, 50, 0.6)',
              color: 'var(--gray-100)'
            }}
          />
        </div>
        
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-text"
            onClick={showForgotPassword}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--purple-400)', 
              cursor: 'pointer', 
              padding: '6px 0',
              fontSize: '14px',
              textDecoration: 'underline',
              fontWeight: '500'
            }}
          >
            Forgot password?
          </button>
          
          <div>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ 
                marginRight: '12px',
                padding: '10px 20px',
                border: '1px solid var(--purple-700)',
                borderRadius: '6px',
                backgroundColor: 'rgba(31, 16, 50, 0.6)',
                color: 'var(--gray-300)',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ 
                padding: '10px 24px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(192, 132, 252, 0.4)'
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;