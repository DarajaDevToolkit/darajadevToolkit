import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';
import { registerUserValidator, loginUserValidator } from '../validators/user.validators';

// Simple in-memory rate limiter (per IP, for demo; use Redis for production)
// //use request-ip library for better IP handling later on⬇
const loginAttempts: Record<string, { count: number; last: number }> = {};
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

import type { Context, Next } from 'hono';

function rateLimit(c: Context, next: Next) {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const now = Date.now();
  // Initialize or update login attempts for this IP
  if (!loginAttempts[ip] || now - loginAttempts[ip].last > WINDOW_MS) {
    loginAttempts[ip] = { count: 1, last: now }; // Reset count if outside the time window
  } else {
    loginAttempts[ip].count++; // Increment count if within the time window
    loginAttempts[ip].last = now; // Update last attempt time
  }
  if (loginAttempts[ip].count > MAX_ATTEMPTS) {
    return c.json({ error: 'Too many login attempts, try again later.' }, 429);
  }
  return next();
}

const authRouter = new Hono();

// Registration endpoint
authRouter.post('/register', async (c) => {
  const body = await c.req.json();
  const result = registerUserValidator.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation failed', details: result.error.flatten() }, 422);
  }
  const { name, email, phoneNumber, password } = result.data;
  try {
    const user = await AuthService.register({ name, email, phoneNumber, password });
    return c.json({ message: 'User registered successfully✅', user }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error⚠';
    return c.json({ error: message }, 400);
  }
});

// Login endpoint with rate limiting
authRouter.post('/login', rateLimit, async (c) => {
  const body = await c.req.json();
  const result = loginUserValidator.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation failed', details: result.error.flatten() }, 422);
  }
  const { email, password } = result.data;
  try {
    const { accessToken, refreshToken, user } = await AuthService.login({ email, password });
    return c.json({ message: 'Login successful✅', accessToken, refreshToken, user });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error❗';
    return c.json({ error: message }, 401);
  }
});

export default authRouter;
