// tempAuth.ts - Temporary authentication handler for development
import express from 'express';
import logger from './logger';

// This is a simplified auth route for development, to be replaced with proper auth later
export function setupTempAuthRoutes(app: express.Express) {
  logger.info('Setting up temporary auth routes');
  
  // Add specific CORS handling for auth routes
  const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  };
  
  // Apply CORS to all auth routes
  app.use('/auth', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  app.get('/auth/check-session', (req, res) => {
    // Log session data for debugging
    logger.info('Session check received', {
      sessionID: req.sessionID,
      session: req.session
    });
    
    // Check if we have a session cookie with temp auth
    const hasTempAuth = req.cookies && req.cookies.temp_auth === 'true';
    
    if (hasTempAuth) {
      // Return authenticated for development
      res.json({ 
        isAuthenticated: true,
        user: {
          userId: 'temp_user_1',
          username: 'DevUser'
        }
      });
    } else {
      // Not authenticated
      res.json({ 
        isAuthenticated: false,
        message: 'Not authenticated (dev mode)'
      });
    }
  });
  
  // Temporary login endpoint
  app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    logger.info('Login attempt', { email });
    
    // Simple validation for development mode
    // At least require email to contain "@" and password to be non-empty
    if (!email.includes('@') || !password) {
      logger.warn('Login failed - invalid credentials', { email });
      return res.status(401).json({
        error: 'Invalid email or password. In development mode, email must contain "@" and password must not be empty.'
      });
    }
    
    // Special case for DevUser - must use correct credentials
    if (email === 'dev@example.com' && password === 'password123') {
      // Set session data for authentication
      if (req.session) {
        req.session.isAuthenticated = true;
        req.session.userId = 'temp_user_1';
        req.session.username = 'DevUser';
      }
      
      // Set a cookie for backup auth mechanism
      res.cookie('temp_auth', 'true', {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: false, // Allow JS access for development
        sameSite: 'lax'
      });
      
      // For development, accept correct credentials
      return res.json({
        message: 'Login successful (development mode)',
        user: {
          userId: 'temp_user_1',
          username: 'DevUser',
          email
        }
      });
    } else {
      // Failed login attempt
      logger.warn('Login failed - incorrect credentials', { email });
      return res.status(401).json({
        error: 'Invalid credentials. For development testing, use email: dev@example.com and password: password123'
      });
    }
  });
  
  // Temporary register endpoint
  app.post('/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    
    logger.info('Registration attempt', { username, email });
    
    // Simple validation for development mode
    if (!username || !email || !email.includes('@') || !password) {
      logger.warn('Registration failed - invalid data', { username, email });
      return res.status(400).json({
        error: 'All fields are required. Email must contain "@".'
      });
    }
    
    // Check if trying to register with the reserved DevUser credentials
    if (email === 'dev@example.com') {
      logger.warn('Registration failed - attempting to use reserved email', { username, email });
      return res.status(409).json({
        error: 'This email is already registered. Please use a different email.'
      });
    }
    
    // Set session data for authentication
    if (req.session) {
      req.session.isAuthenticated = true;
      req.session.userId = 'temp_user_1';
      req.session.username = username;
    }
    
    // Set a cookie for backup auth mechanism
    res.cookie('temp_auth', 'true', {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: false, // Allow JS access for development
      sameSite: 'lax'
    });
    
    // Registration successful
    res.status(201).json({
      message: 'Registration successful (development mode)',
      user: {
        userId: 'temp_user_1',
        username: username,
        email
      }
    });
  });
  
  // Temporary logout endpoint
  app.post('/auth/logout', (req, res) => {
    logger.info('Logout request');
    
    // Clear session data if it exists
    if (req.session) {
      req.session.isAuthenticated = false;
      delete req.session.userId;
      delete req.session.username;
    }
    
    // Clear the temp auth cookie
    res.clearCookie('temp_auth');
    res.clearCookie('connect.sid');
    
    res.json({ message: 'Logout successful (development mode)' });
  });
  
  // Temporary forgot password
  app.post('/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    
    logger.info('Forgot password request', { email });
    
    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  });
  
  // Temporary verify token
  app.get('/auth/verify-reset-token', (req, res) => {
    const { token } = req.query;
    
    logger.info('Token verification request', { token });
    
    res.json({ valid: true });
  });
  
  // Temporary reset password
  app.post('/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    
    logger.info('Password reset request', { token });
    
    res.json({ message: 'Password reset successful' });
  });
  
  logger.info('Temporary auth routes set up successfully');
  return app;
}