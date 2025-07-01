import type { Context, Next } from 'hono';
import CIDR from 'ip-cidr';

// Load allowed M-Pesa IP ranges from environment variable (comma-separated CIDRs)
const MPESA_IP_RANGES = (process.env.MPESA_IP_RANGES || '')
  .split(',')
  .map(r => r.trim())
  .filter(Boolean);

// Validate configuration at startup
if (MPESA_IP_RANGES.length === 0) {
  console.warn(
    '⚠️ MPESA_IP_RANGES is empty - IP validation will block all non-health requests'
  );
}

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

  let allowed = false;
  for (const range of MPESA_IP_RANGES) {
    try {
      const cidr = new CIDR(range);
      if (cidr.contains(clientIp)) {
        allowed = true;
        break;
      }
    } catch (error) {
      console.error(`Invalid CIDR range: ${range}`, error);
      continue;
    }
  }

  if (!allowed) {
    console.warn(`🚫 IP validation failed for ${clientIp} - request blocked`);
    return c.json({ error: 'Forbidden: IP not allowed' }, 403);
  }

  if (!allowed) {
    return c.json({ error: 'Forbidden: IP not allowed' }, 403);
  }

  return next();
}
