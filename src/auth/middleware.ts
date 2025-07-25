import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromCookie, extractTokenFromAuth, JWTPayload } from './jwt';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Try to extract token from Authorization header first, then from cookies
  const authHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie;
  
  let token = extractTokenFromAuth(authHeader || '') || extractTokenFromCookie(cookieHeader || '');
  
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.user = decoded;
  next();
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Try to extract token from Authorization header first, then from cookies
  const authHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie;
  
  let token = extractTokenFromAuth(authHeader || '') || extractTokenFromCookie(cookieHeader || '');
  
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};
