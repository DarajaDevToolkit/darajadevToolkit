import type { Context, Next } from 'hono';
import { isValidMpesaIP } from '../../../shared/src/utils/validation';

/**
 * IP validation middleware: only allow requests from configured M-Pesa IP ranges.
 */
export async function ipValidator(c: Context, next: Next) {
  // Skip IP validation for health and status endpoints
  const reqUrl = new URL(c.req.url);
  if (reqUrl.pathname === '/health' || reqUrl.pathname.startsWith('/health/')) {
    return next();
  }
  // Get forwarded IP header using Hono helper
  const xff = c.req.header('x-forwarded-for');
  const clientIp = xff ? xff.split(',')[0].trim() : (c.req.conn?.remoteAddr || '');

  if (!isValidMpesaIP(clientIp)) {
    console.warn(`🚫 IP validation failed for ${clientIp}`);
    return c.json({ error: 'Forbidden: IP not allowed' }, 403);
  }

  return next();
}
