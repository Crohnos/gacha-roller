// server.ts
import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { setupRoutes } from './routes';
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

// Global CORS middleware for all requests
app.use((req, res, next) => {
  // Determine appropriate origin
  const allowedOrigins = ['https://gacha-web.onrender.com', 'http://localhost:5173'];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // For requests without Origin header
    res.header('Access-Control-Allow-Origin', process.env.RENDER ? 'https://gacha-web.onrender.com' : 'http://localhost:5173');
  }
  
  // Set other CORS headers
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    console.log('Global OPTIONS handler', { path: req.path, origin: req.headers.origin });
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

// We're using a custom CORS implementation above, so we don't need the cors middleware
// This comment is kept for reference in case we need to revert

// Static routes for cards with caching disabled to prevent stale images
app.use('/images', express.static(cardsDir, {
  maxAge: 0,
  etag: false,
  lastModified: false
}));
app.use('/cards', express.static(cardsDir, {
  maxAge: 0,
  etag: false,
  lastModified: false
}));

// Add a fallback for image paths with old deployments
app.get('*/cards/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(cardsDir, filename);
  
  if (fs.existsSync(filePath)) {
    logger.info('Serving image from fallback path', { filename, path: filePath });
    res.sendFile(filePath);
  } else {
    logger.warn('Image not found in fallback handler', { filename });
    res.status(404).send('Image not found');
  }
});

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
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
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
        timestamp: new Date().toISOString(),
        cors: 'enabled'
      });
    });
    
    // Add a CORS test endpoint
    app.get('/cors-test', (req, res) => {
      res.status(200).json({
        message: 'CORS is working!',
        origin: req.headers.origin || 'unknown'
      });
    });
    
    // Setup routes - no auth required
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