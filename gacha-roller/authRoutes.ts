// authRoutes.ts
import express from 'express';
import { Database } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger';
import {
  hashPassword,
  comparePassword,
  generateResetToken,
  getResetTokenExpiry,
  sendPasswordResetEmail,
  generateSessionId,
  getSessionExpiry
} from './authUtils';

// Define session augmentation for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId: string;
    username: string;
    isAuthenticated: boolean;
  }
}

export function setupAuthRoutes(app: express.Express, db: Database) {
  console.log('Setting up auth routes');
  // Registration endpoint
  app.post('/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Basic validation
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      // Check if username or email already exists
      const existingUser = await db.get(
        'SELECT * FROM users WHERE username = ? OR email = ?', 
        [username, email]
      );
      
      if (existingUser) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Generate user_id
      const userId = uuidv4();
      
      // Insert new user
      await db.run(
        'INSERT INTO users (user_id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
        [userId, username, email, passwordHash]
      );
      
      // Create session
      req.session.userId = userId;
      req.session.username = username;
      req.session.isAuthenticated = true;
      
      // Store session in database
      const sessionId = generateSessionId();
      const expiresAt = getSessionExpiry();
      
      await db.run(
        'INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)',
        [sessionId, userId, expiresAt.toISOString()]
      );
      
      // Return success response
      res.status(201).json({
        message: 'Registration successful',
        user: {
          userId,
          username,
          email
        }
      });
      
    } catch (error) {
      logger.error('Registration error', { error });
      res.status(500).json({ error: 'Registration failed' });
    }
  });
  
  // Login endpoint
  app.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Find user by email
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last login timestamp
      await db.run(
        'UPDATE users SET last_login = datetime("now") WHERE user_id = ?',
        [user.user_id]
      );
      
      // Create session
      req.session.userId = user.user_id;
      req.session.username = user.username;
      req.session.isAuthenticated = true;
      
      // Store session in database
      const sessionId = generateSessionId();
      const expiresAt = getSessionExpiry();
      
      await db.run(
        'INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)',
        [sessionId, user.user_id, expiresAt.toISOString()]
      );
      
      // Return success response
      res.json({
        message: 'Login successful',
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email
        }
      });
      
    } catch (error) {
      logger.error('Login error', { error });
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  // Logout endpoint
  app.post('/auth/logout', (req, res) => {
    // If we have a logged in user, remove their session from the database
    if (req.session.userId) {
      try {
        // We don't need to await this as it's not critical to complete before responding
        db.run('DELETE FROM sessions WHERE user_id = ?', [req.session.userId]);
      } catch (error) {
        logger.error('Error removing session from database', { error, userId: req.session.userId });
      }
    }
    
    req.session.destroy((err) => {
      if (err) {
        logger.error('Logout error', { error: err });
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  });
  
  // Check session endpoint
  app.get('/auth/check-session', (req, res) => {
    // Log session data for debugging
    console.log('Session check:', { 
      sessionID: req.sessionID,
      session: req.session
    });
    
    if (req.session && req.session.isAuthenticated) {
      return res.json({
        isAuthenticated: true,
        user: {
          userId: req.session.userId,
          username: req.session.username
        }
      });
    }
    
    res.json({ isAuthenticated: false });
  });
  
  // Forgot password endpoint
  app.post('/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Find user by email
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      
      // For security reasons, don't reveal if the email exists or not
      if (!user) {
        return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      }
      
      // Generate reset token
      const resetToken = generateResetToken();
      const expiresAt = getResetTokenExpiry();
      
      // Store token in database
      await db.run(
        'INSERT INTO reset_tokens (token_id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [uuidv4(), user.user_id, resetToken, expiresAt.toISOString()]
      );
      
      // Send reset email
      await sendPasswordResetEmail(email, resetToken, user.username);
      
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      
    } catch (error) {
      logger.error('Forgot password error', { error });
      res.status(500).json({ error: 'Failed to process forgot password request' });
    }
  });
  
  // Verify reset token endpoint
  app.get('/auth/verify-reset-token', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }
      
      // Check if token exists and is not expired
      const tokenRecord = await db.get(
        `SELECT * FROM reset_tokens 
         WHERE token = ? 
         AND used = 0 
         AND datetime(expires_at) > datetime('now')`,
        [token]
      );
      
      if (!tokenRecord) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      
      res.json({ valid: true });
      
    } catch (error) {
      logger.error('Verify reset token error', { error });
      res.status(500).json({ error: 'Failed to verify token' });
    }
  });
  
  // Reset password endpoint
  app.post('/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }
      
      // Check if token exists and is not expired
      const tokenRecord = await db.get(
        `SELECT * FROM reset_tokens 
         WHERE token = ? 
         AND used = 0 
         AND datetime(expires_at) > datetime('now')`,
        [token]
      );
      
      if (!tokenRecord) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      
      // Hash new password
      const passwordHash = await hashPassword(newPassword);
      
      // Update user's password
      await db.run(
        'UPDATE users SET password_hash = ? WHERE user_id = ?',
        [passwordHash, tokenRecord.user_id]
      );
      
      // Mark token as used
      await db.run(
        'UPDATE reset_tokens SET used = 1 WHERE token = ?',
        [token]
      );
      
      res.json({ message: 'Password reset successful' });
      
    } catch (error) {
      logger.error('Reset password error', { error });
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });
  
  return app;
}