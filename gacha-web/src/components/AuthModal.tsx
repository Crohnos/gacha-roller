import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';

type AuthView = 'login' | 'register' | 'forgotPassword' | 'resetPassword';

interface AuthModalProps {
  isOpen: boolean;
  initialView?: AuthView;
  onClose: () => void;
  resetToken?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  initialView = 'login', 
  onClose,
  resetToken
}) => {
  const [currentView, setCurrentView] = useState<AuthView>(resetToken ? 'resetPassword' : initialView);
  
  const handleSuccess = () => {
    // After successful password reset, go to login
    setCurrentView('login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '450px',
              padding: '32px',
              boxShadow: '0 0 30px rgba(192, 132, 252, 0.2)', // Epic-like glow
              color: 'var(--gray-100)',
              border: '1px solid var(--purple-700)'
            }}
          >
            {currentView === 'login' && (
              <LoginForm 
                onClose={onClose} 
                showForgotPassword={() => setCurrentView('forgotPassword')} 
              />
            )}
            
            {currentView === 'register' && (
              <RegisterForm 
                onClose={onClose} 
                showLogin={() => setCurrentView('login')} 
              />
            )}
            
            {currentView === 'forgotPassword' && (
              <ForgotPasswordForm 
                onClose={onClose} 
                showLogin={() => setCurrentView('login')} 
              />
            )}
            
            {currentView === 'resetPassword' && resetToken && (
              <ResetPasswordForm 
                token={resetToken} 
                onClose={onClose} 
                onSuccess={handleSuccess} 
              />
            )}
            
            {currentView === 'login' && (
              <div style={{ 
                marginTop: '28px', 
                textAlign: 'center', 
                padding: '16px',
                borderTop: '1px solid var(--purple-800)',
                color: 'var(--gray-300)'
              }}>
                <p style={{ fontSize: '15px' }}>
                  Don't have an account?{' '}
                  <button
                    className="btn-text"
                    onClick={() => setCurrentView('register')}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--purple-400)', 
                      cursor: 'pointer', 
                      padding: '0',
                      fontWeight: 'bold',
                      textDecoration: 'underline'
                    }}
                  >
                    Sign up
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;