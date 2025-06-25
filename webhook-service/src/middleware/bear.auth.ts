import { AuthService } from '../services/auth.service';

// middleware to verify Bearer token (JWT access token)
export function bearerAuth(req: any, res: any, next: any) {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  // Verify token
  const payload = AuthService.verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  // Attach user info to request for downstream handlers
  req.user = payload;
  next();
}
