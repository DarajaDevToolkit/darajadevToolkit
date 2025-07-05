import Redis from 'ioredis';
import type { Context, Next } from 'hono';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const RATE_LIMIT_WINDOW_SEC = parseInt(process.env.RATE_LIMIT_WINDOW_SEC || '60', 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10);

/*
 * Applies rate limiting per user using Redis.
 * Increments a counter for the given userId and sets an expiration window.
 * If the request count exceeds the configured maximum within the time window,
 * responds with HTTP 429 (Too Many Requests).
 * @returns A Promise that resolves to the next middleware result or a 429 response.
 */
export const rateLimit = async (c: Context, next: Next) => {
  const userId = c.req.param('userId')
  const key = `ratelimit: ${userId}`
  const execResult = await redis.multi()
    .incr(key)
    .expire(key, RATE_LIMIT_WINDOW_SEC)
    .exec();
  if (!execResult) {
    throw new Error('Redis exec returned null');
  }
  // Check if the execResult is an array and has at least one element
  const firstResult = execResult[0];
  if (!firstResult) {
    throw new Error('Redis exec returned no results');
  }

  const count = Number(firstResult[1]);

  if (count > RATE_LIMIT_MAX) {
    return c.text('Too Many Requests', 429);
  }
  return next()
}
