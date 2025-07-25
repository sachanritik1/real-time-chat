import { request as WebSocketRequest } from 'websocket';
import { verifyToken, extractTokenFromCookie, extractTokenFromAuth, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends WebSocketRequest {
  user?: JWTPayload;
}

export const authenticateWebSocket = (request: WebSocketRequest): JWTPayload | null => {
  // Try to extract token from query parameters first
  const url = new URL(request.httpRequest.url || '', 'http://localhost');
  const tokenFromQuery = url.searchParams.get('token');
  
  // Try to extract from Authorization header
  const authHeader = request.httpRequest.headers.authorization;
  const tokenFromAuth = extractTokenFromAuth(authHeader || '');
  
  // Try to extract from cookies
  const cookieHeader = request.httpRequest.headers.cookie;
  const tokenFromCookie = extractTokenFromCookie(cookieHeader || '');
  
  // Priority: query > auth header > cookie
  const token = tokenFromQuery || tokenFromAuth || tokenFromCookie;
  
  if (!token) {
    return null;
  }

  return verifyToken(token);
};

export const requireWebSocketAuth = (request: WebSocketRequest): { success: boolean; user?: JWTPayload; error?: string } => {
  const user = authenticateWebSocket(request);
  
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }
  
  return { success: true, user };
};
