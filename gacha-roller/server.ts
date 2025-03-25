// server.ts
import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { setupRoutes } from './routes';
import { setupAuthRoutes } from './authRoutes';
import { setupTempAuthRoutes } from './tempAuth';
import logger from './logger';

// Load environment variables
dotenv.config();

// Ensure cards directory exists
const cardsDir = process.env.RENDER ? '/opt/render/project/src/gacha-roller/cards' : path.join(__dirname, 'cards');
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir, { recursive: true });
  logger.info('Cards directory created', { path: cardsDir });
}

// Create Express app
const app = express();

// CORS headers middleware - applies to all requests
app.use((req, res, next) => {
  // Explicitly set CORS headers for all responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  
  next();
});

// Standard middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure CORS for cross-origin requests
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://gacha-web.onrender.com',
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // Still allow for development purposes
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false
}));

// Add explicit handling for OPTIONS requests
app.options('*', cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://gacha-web.onrender.com',
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin (OPTIONS):', origin);
      // Still allow for development purposes
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400 // 24 hours
}));

// Session handling
app.use(session({
  secret: process.env.SESSION_SECRET || 'gacha-session-secret',
  resave: true, // Changed to true for development to ensure session updates are saved
  saveUninitialized: true, // Changed to true for development to create session for all requests
  cookie: {
    secure: process.env.RENDER ? true : false, // Secure in production (Render uses HTTPS)
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'none' // Required for cross-domain cookie with secure=true
  }
}));

// Debug middleware to log each incoming request body and session
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`REQUEST BODY for ${req.path}:`, req.body);
  }
  
  // Log session data for all auth-related requests
  if (req.path.startsWith('/auth')) {
    console.log(`SESSION DATA for ${req.path}:`, {
      sessionID: req.sessionID,
      session: req.session,
      cookies: req.cookies,
      headers: req.headers
    });
  }
  
  next();
});
app.use('/images', express.static(cardsDir));
app.use('/cards', express.static(cardsDir));

// Initialize database
async function initializeDb() {
  logger.info('Initializing database');
  
  // Use verbose mode in development
  if (process.env.NODE_ENV !== 'production') {
    sqlite3.verbose();
  }
  
  const dbPath = process.env.RENDER ? '/tmp/gacha.db' : 'gacha.db';
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Import and run migrations in development
  if (process.env.NODE_ENV !== 'production') {
    const { createTestUser } = require('./migrations/create-test-user');
    await createTestUser(db);
  }
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    );
    
    CREATE TABLE IF NOT EXISTS cards (
      card_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      image_path TEXT,
      description TEXT,
      css TEXT,
      rarity TEXT,
      character TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS reset_tokens (
      token_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
    
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `);
  
  logger.info('Database initialized successfully');
  return db;
}

// Start server
async function startServer() {
  try {
    const db = await initializeDb();
    
    // Setup health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Setup routes
    setupTempAuthRoutes(app); // Use temporary auth routes for development
    // setupAuthRoutes(app, db); // Commented out until CORS issues are resolved
    setupRoutes(app, db);
    
    // Add 404 handler
    app.use((req, res) => {
      logger.warn('Route not found', { method: req.method, url: req.originalUrl });
      res.status(404).json({ error: 'Route not found' });
    });
    
    // Global error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Check if this is a 503 error (Service Unavailable)
      const is503Error = err.response && err.response.status === 503;
      
      if (is503Error) {
        logger.warn('Unhandled 503 error in server - service overloaded', { 
          url: req.url, 
          method: req.method,
          status: 503
        });
        
        res.status(503).json({ 
          error: 'Image generation servers are currently busy. Please try again in a few minutes.',
          serverOverloaded: true
        });
      } else {
        logger.error('Unhandled server error', { error: err.message || err, url: req.url });
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });
    
    return { app, db };
  } catch (error) {
    logger.error('Server startup error', { error });
    throw error;
  }
}

// Export the promise that resolves to app and db
const serverPromise = startServer();
export default serverPromise;