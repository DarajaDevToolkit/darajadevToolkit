import Redis from 'ioredis';
import type { Context, Next } from 'hono';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const IP_RATE_LIMIT_WINDOW_SEC = (() => {
  const val = parseInt(process.env.IP_RATE_LIMIT_WINDOW_SEC || '', 10);
  return isNaN(val) ? 60 : val;
})();
const IP_RATE_LIMIT_MAX = parseInt(process.env.IP_RATE_LIMIT_MAX ?? '200', 10);

/**
 * IP-based rate limiting middleware.
 * Limits requests per IP within a time window using Redis.
 */
export const ipRateLimit = async (c: Context, next: Next) => {
  // Extract client IP (trusting x-forwarded-for or x-real-ip headers)
  const clientIp =
    (c.req.header('x-forwarded-for') ?? '').split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    '';
  
  const key = `ratelimit:ip:${clientIp}`;
  let count: number;

  // Try to set the key with expiry if it does not exist
  const setResult = await redis.set(key, 1, 'EX', IP_RATE_LIMIT_WINDOW_SEC, 'NX');
  if (setResult === 'OK') {
    count = 1;
  } else {
    // Key exists, increment the count
    count = await redis.incr(key);
  }

  if (count > IP_RATE_LIMIT_MAX) {
    return c.text('Too Many Requests (IP)', 429);
  }

  return next();
};
