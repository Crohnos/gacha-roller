import React, { useState } from 'react';
import { useStore } from '../store';

const ForgotPasswordForm: React.FC<{ onClose: () => void, showLogin: () => void }> = ({ onClose, showLogin }) => {
  const { forgotPassword } = useStore();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="forgot-password-success">
        <h2>Email Sent</h2>
        <p>
          If an account exists for {email}, you will receive a password reset link.
          Please check your email and follow the instructions.
        </p>
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button 
            className="btn-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-form">
      <h2>Forgot Password</h2>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
      
      {error && (
        <div className="error-message" style={{ 
          color: '#b91c1c', 
          backgroundColor: '#fee2e2', 
          padding: '8px 12px', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
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
        
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-text"
            onClick={showLogin}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0' }}
          >
            Back to Login
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
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;