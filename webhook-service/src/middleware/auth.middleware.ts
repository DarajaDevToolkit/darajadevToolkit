import type { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import { getUserByIdService } from '../services/auth.service';

// JWT secret keys (same as in auth service)
const ACCESS_TOKEN_SECRET = Bun.env.ACCESS_TOKEN_SECRET || 'access_secret';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

// Extend Hono's Context type to include user
declare module 'hono' {
  interface Context {
    user?: AuthenticatedUser;
  }
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user to context
 */
export async function authenticateJWT(c: Context, next: Next) {
  try {
    // Get token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(ACCESS_TOKEN_SECRET)
    );

    if (!payload.userId || typeof payload.userId !== 'string') {
      return c.json({ error: 'Invalid token payload' }, 401);
    }

    // Get user details from database
    const user = await getUserByIdService(payload.userId);
    if (!user || !user.isActive) {
      return c.json({ error: 'User not found or inactive' }, 401);
    }

    // Add user to context
    c.user = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
    };

    await next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('JWT Authentication failed:', errorMessage);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

/**
 * API Key Authentication Middleware
 * For webhook endpoints that use API key instead of JWT
 */
export async function authenticateAPIKey(c: Context, next: Next) {
  try {
    // Get API key from header or query param
    const apiKey = c.req.header('X-API-Key') || c.req.query('api_key');

    if (!apiKey) {
      return c.json({ error: 'API Key required' }, 401);
    }

    // Find user by API key
    const { getUserByApiKeyService } = await import('../services/auth.service');
    const user = await getUserByApiKeyService(apiKey);

    if (!user || !user.isActive) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    // Add user to context
    c.user = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
    };

    await next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('API Key Authentication failed:', errorMessage);
    return c.json({ error: 'Invalid API key' }, 401);
  }
}

/**
 * Role-based Authorization Middleware
 * Requires user to have specific role(s)
 */
export function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    if (!c.user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    if (!allowedRoles.includes(c.user.role)) {
      return c.json(
        {
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: c.user.role,
        },
        403
      );
    }

    await next();
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Self or Admin middleware
 * Users can access their own data, admins can access anyone's
 */
export function requireSelfOrAdmin(userIdParam: string = 'userId') {
  return async (c: Context, next: Next) => {
    if (!c.user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const targetUserId = c.req.param(userIdParam);
    const isAdmin = ['admin', 'super_admin'].includes(c.user.role);
    const isSelf = c.user.userId === targetUserId;

    if (!isAdmin && !isSelf) {
      return c.json(
        {
          error: 'Access denied. You can only access your own data.',
        },
        403
      );
    }

    await next();
  };
}
