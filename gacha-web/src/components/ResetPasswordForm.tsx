import React, { useState, useEffect } from 'react';
import { useStore } from '../store';

const ResetPasswordForm: React.FC<{ token: string, onClose: () => void, onSuccess: () => void }> = ({ token, onClose, onSuccess }) => {
  const { resetPassword, verifyResetToken } = useStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const isValid = await verifyResetToken(token);
        setIsTokenValid(isValid);
      } catch (err) {
        setIsTokenValid(false);
        setError('Invalid or expired token. Please request a new password reset link.');
      } finally {
        setIsTokenChecking(false);
      }
    };

    checkToken();
  }, [token, verifyResetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);

    try {
      await resetPassword(token, newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenChecking) {
    return (
      <div className="reset-password-loading">
        <h2>Verifying Reset Link</h2>
        <p>Please wait while we verify your reset link...</p>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="reset-password-invalid">
        <h2>Invalid Reset Link</h2>
        <p>
          This password reset link is invalid or has expired.
          Please request a new password reset link.
        </p>
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button 
            className="btn-primary"
            onClick={onClose}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-form">
      <h2>Reset Password</h2>
      <p>Enter your new password below.</p>
      
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
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
        
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;