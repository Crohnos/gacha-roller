// authMiddleware.ts
import { Request, Response, NextFunction } from 'express';

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Check session-based authentication
  const hasSessionAuth = req.session && req.session.isAuthenticated;
  
  // Check cookie-based authentication (temporary for development)
  const hasTempAuth = req.cookies && req.cookies.temp_auth === 'true';
  
  if (hasSessionAuth || hasTempAuth) {
    return next();
  }
  
  console.log('Auth check failed:', {
    sessionID: req.sessionID,
    session: req.session,
    cookies: req.cookies
  });
  
  res.status(401).json({ error: 'Authentication required' });
}

// Middleware to attach user to request if they're authenticated
export function attachUser(req: Request, res: Response, next: NextFunction) {
  // Check session-based authentication
  const hasSessionAuth = req.session && req.session.isAuthenticated;
  
  // Check cookie-based authentication (temporary for development)
  const hasTempAuth = req.cookies && req.cookies.temp_auth === 'true';
  
  if (hasSessionAuth) {
    // Add user info from session to the request object
    (req as any).user = {
      userId: req.session.userId,
      username: req.session.username
    };
  } else if (hasTempAuth) {
    // Add a default temp user for development
    (req as any).user = {
      userId: 'temp_user_1',
      username: 'DevUser'
    };
  }
  
  next();
}