import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import db from '../drizzle/db';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { error } from 'console';

// Token expiry durations (in seconds) ,<= later store this in the  .env file
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

// JWT secret keys (should be in env vars in production)
const ACCESS_TOKEN_SECRET = Bun.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = Bun.env.REFRESH_TOKEN_SECRET || 'refresh_secret';

// register a new user with secure password hashing and API key generation
export const registerUserService = async (userData: any) => {
  try {
    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email));
    if (existing.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password with Bun's built-in password hashing
    const passwordHash = await Bun.password.hash(userData.password);
    // Generate a long, random API key (UUIDv4)
    const apiKey = crypto.randomUUID();
    // Store user in DB
    const insertResult = await db
      .insert(users)
      .values({
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        passwordHash: passwordHash,
        apiKey: apiKey,
        isActive: true,
        role: userData.role || 'user',
      })
      .returning();

    const user = Array.isArray(insertResult) ? insertResult[0] : undefined; // Ensure we get the first user object from the result
    // Check if user was created successfully
    if (!user) {
      throw new Error('Failed to create user.');
    }

    return { ...user, apiKey };
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Unknown error during registration.'
    );
  }
};

// Login user, validate password, and issue access/refresh tokens
export const loginUserService = async (email: string, password: string) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) throw new Error('Invalid credentials');

    // Compare password securely using Bun
    const valid = await Bun.password.verify(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    // Generate access token (short-lived) using jose
    const accessToken = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(`${ACCESS_TOKEN_EXPIRY}s`)
      .sign(new TextEncoder().encode(ACCESS_TOKEN_SECRET));

    // Generate refresh token (longer-lived, securely random UUID)
    const refreshToken = crypto.randomUUID();
    //verify user with jwtVerify
    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(ACCESS_TOKEN_SECRET)
    );
    if (!payload || !payload.userId) {
      throw new Error('Invalid access token payload');
    }
    // Store refresh token in memory
    storeRefreshToken(refreshToken, user.id);
    // Return tokens and user info
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Unknown error during login.'
    );
  }
};

// Store refresh token when user logs in
export const storeRefreshToken = (refreshToken: string, userId: string) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  refreshTokenStore.set(refreshToken, { userId, expiresAt });
};

// Store refresh tokens in memory (use Redis in production)
const refreshTokenStore = new Map<
  string,
  { userId: string; expiresAt: Date }
>();

// Refresh token endpoint
export const refreshTokenService = async (refreshToken: string) => {
  try {
    // Check if refresh token exists and is valid
    const tokenData = refreshTokenStore.get(refreshToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const user = await getUserByIdService(tokenData.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new access token
    const accessToken = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(`${ACCESS_TOKEN_EXPIRY}s`)
      .sign(new TextEncoder().encode(ACCESS_TOKEN_SECRET));

    // Generate new refresh token
    const newRefreshToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Remove old refresh token and store new one
    refreshTokenStore.delete(refreshToken);
    refreshTokenStore.set(newRefreshToken, { userId: user.id, expiresAt });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Unknown error during token refresh.'
    );
  }
};

// Get all users with pagination
export const getUsersService = async (
  page: number = 1,
  limit: number = 20
): Promise<{
  users: Array<{
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    apiKey: string;
    role: string;
    isActive: boolean;
  }>;
  total: number;
}> => {
  try {
    // Validate pagination parameters
    if (page < 1) throw new Error('Page must be at least 1');
    if (limit < 1 || limit > 100)
      throw new Error('Limit must be between 1 and 100');

    const offset = (page - 1) * limit;

    // Get paginated users
    const userList = await db.select().from(users).limit(limit).offset(offset);
    // Get total count for pagination metadata
    // const totalResult = await db.select({ count: sql<number>`count(*)` })
    const totalResult = await db.select().from(users);
    const total = totalResult.length;

    return {
      users: userList.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        apiKey: user.apiKey ?? '',
        role: user.role ?? 'user',
        isActive: user.isActive ?? false,
      })),
      total,
    };
  } catch (error) {
    throw error;
  }
};

//getUserById
export const getUserByIdService = async (userId: string) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('User not found');
    return user;
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Unknown error while fetching user.'
    );
  }
};

// Update user details
export const updateUserService = async (
  userId: string,
  updates: Partial<{ name: string; email: string; phoneNumber: string }>
) => {
  try {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    if (!updatedUser) throw new Error('User not found or no changes made');
    return updatedUser;
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Unknown error while updating user.'
    );
  }
};

// delete user by ID
export const deleteUserService = async (userId: string) => {
  try {
    const result = await db.delete(users).where(eq(users.id, userId));
    if (result.rowCount === 0) throw new Error('User not found');
    return { message: 'User deleted successfully' };
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Unknown error while deleting user.'
    );
  }
};

// Get user by API key
export const getUserByApiKeyService = async (apiKey: string) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.apiKey, apiKey));
    if (!user) throw new Error('User not found with this API key');
    return user;
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? err.message
        : 'Unknown error while fetching user by API key.'
    );
  }
};
