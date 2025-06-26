import { Hono } from 'hono';
import { loginUserController, registerUserController, getUsers, getUserById, updateUser, deleteUser } from '../controllers/auth.controller';

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
authRouter.post('/register',registerUserController);
// Login endpoint with rate limiting
authRouter.post('/login', rateLimit, loginUserController);
// User CRUD endpoints
authRouter.get('/users', getUsers);
authRouter.get('/users/:id', getUserById);
authRouter.put('/users/:id', updateUser);
authRouter.delete('/users/:id', deleteUser);

export default authRouter;
