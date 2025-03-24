import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

interface UserMenuProps {
  onShowLogin: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onShowLogin }) => {
  const { user, isAuthenticated, logout } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  if (!isAuthenticated || !user) {
    return (
      <button
        className="btn-primary"
        onClick={onShowLogin}
      >
        Login
      </button>
    );
  }

  return (
    <div className="user-menu" ref={menuRef} style={{ position: 'relative' }}>
      <button
        className="user-menu-button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'var(--primary-light)',
          color: 'var(--primary-dark)',
          padding: '6px 12px',
          borderRadius: '20px',
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        <div className="user-avatar" style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '8px',
          fontSize: '12px'
        }}>
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span>{user?.username || 'User'}</span>
      </button>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="user-menu-dropdown"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            style={{ 
              position: 'absolute', 
              top: '100%', 
              right: 0, 
              marginTop: '8px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              width: '180px',
              zIndex: 100,
              overflow: 'hidden'
            }}
          >
            <div className="menu-items" style={{ padding: '8px 0' }}>
              <style>{`
                .menu-item:hover {
                  background-color: #f5f5f5;
                }
                .logout-item:hover {
                  background-color: #fff0f0;
                }
              `}</style>
              <button 
                className="menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  // Navigate to profile page or show profile modal
                }}
                style={{ 
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#222', // Darker text color
                  fontWeight: 'normal',
                  fontSize: '14px'
                }}
              >
                Profile
              </button>
              
              <button 
                className="menu-item logout-item"
                onClick={handleLogout}
                style={{ 
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#d00', // Red color for logout
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;