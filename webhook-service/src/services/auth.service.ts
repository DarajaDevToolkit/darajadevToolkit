import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import db from '../drizzle/db';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

// Token expiry durations (in seconds) ,<= later store this in the  .env file
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

// JWT secret keys (should be in env vars in production)
const ACCESS_TOKEN_SECRET = Bun.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = Bun.env.REFRESH_TOKEN_SECRET || 'refresh_secret';

// Allowed roles
const ALLOWED_ROLES = ['user', 'admin', 'super_admin', 'disabled'] as const;
type UserRole = typeof ALLOWED_ROLES[number];

export class AuthService {

// Register a new user with secure password hashing and API key generation
  static async register({ name, email, phoneNumber, password, role }: { name: string; email: string; phoneNumber: string; password: string; role?: UserRole; }) {
    try {
      // Check if user already exists
      let existing;
      try {
        existing = await db.select().from(users).where(eq(users.email, email));
      } catch (dbErr) {
        // console.error('%cDB error during user creation:%c', 'color: red; font-weight: bold;', '', dbErr);
        throw new Error('Database error while checking for existing user.');
      }
      if (existing.length > 0) {
        throw new Error('User already exists');
      }
      // Hash password with Bun's built-in password hashing
      let passwordHash;
      try {
        passwordHash = await Bun.password.hash(password);
      } catch (hashErr) {
        throw new Error('Failed to hash password.');
      }
      // Generate a long, random API key (UUIDv4)
      let apiKey;
      try {
        apiKey = crypto.randomUUID();
      } catch (cryptoErr) {
        throw new Error('Failed to generate API key.');
      }
      // Validate and assign role (default to 'user')
      const userRole: UserRole = role && ALLOWED_ROLES.includes(role) ? role : 'user';
      // Store user in DB
      let user;
      try {
        [user] = await db.insert(users).values({
          name,
          email,
          phoneNumber,
          passwordHash,
          apiKey,
          isActive: true,
          role: userRole,
        }).returning();
      } catch (dbErr: any) {
        // Check for unique constraint violation
        if (dbErr?.code === '23505') {
          if (dbErr?.detail?.includes('email')) {
            throw new Error('A user with this email already exists.');
          }
          if (dbErr?.detail?.includes('phone_number')) {
            throw new Error('A user with this phone number already exists.');
          }
          throw new Error('A user with this information already exists.');
        }
        console.error('DB error during user creation:', dbErr);
        throw new Error('Database error while creating user.');
      }
      if (!user) {
        throw new Error('Failed to create user.');
      }
      return { ...user, apiKey };
    } catch (err) {
      // Catch-all for unexpected errors
      throw new Error(err instanceof Error ? err.message : 'Unknown error during registration.');
    }
  }

  // Login user, validate password, and issue access/refresh tokens
  static async login({ email, password }: { email: string; password: string; }) {
    let user;
    try {
      [user] = await db.select().from(users).where(eq(users.email, email));
    } catch (dbErr) {
      throw new Error('Database error while fetching user.');
    }
    if (!user) throw new Error('Invalid credentials');
    // Compare password securely using Bun
    let valid;
    try {
      valid = await Bun.password.verify(password, user.passwordHash);
    } catch (verifyErr) {
      throw new Error('Failed to verify password.');
    }
    if (!valid) throw new Error('Invalid credentials');
    // Generate access token (short-lived) using jose
    let accessToken;
    try {
      accessToken = await new SignJWT({ userId: user.id, role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(`${ACCESS_TOKEN_EXPIRY}s`)
        .sign(new TextEncoder().encode(ACCESS_TOKEN_SECRET));
    } catch (jwtErr) {
      throw new Error('Failed to generate access token.');
    }
    // Generate refresh token (longer-lived, securely random UUID)
    let refreshToken;
    try {
      refreshToken = crypto.randomUUID();
    } catch (cryptoErr) {
      throw new Error('Failed to generate refresh token.');
    }
    // Store refresh token in DB if you have a table for it (not shown here)
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  }
  // Validate access token (for middleware) =>Handles JWT errors gracefully.
  static async verifyAccessToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(ACCESS_TOKEN_SECRET));
      return payload;
    } catch (err) {
      return null;
    }
  }


  //getUserById
  static async getUserById(userId: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) throw new Error('User not found');
      return user;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error while fetching user.');
    }
  }
  //getAllUsers
  static async getAllUsers() {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error while fetching users.');
    }
  }
  // Update user details
  static async updateUser(userId: string, updates: Partial<{ name: string; email: string; phoneNumber: string; }>) {
    try {
      const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
      if (!updatedUser) throw new Error('User not found or no changes made');
      return updatedUser;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error while updating user.');
    }
  }
  // Delete user by ID
  static async deleteUser(userId: string) {
    try {
      const result = await db.delete(users).where(eq(users.id, userId));
      // Check if any rows were affected. If no rows were affected, it means the user was not found
      if ((result.rowCount ?? 0) === 0) throw new Error('User not found');
      return { message: 'User deleted successfully' };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error while deleting user.');
    }
  }

}
