// TODO: Replace 'any' with proper express types when @types/express is installed
// import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  /**
   * User registration endpoint
   * - Hashes password
   * - Generates secure API key
   * - Returns user info (never password)
   * - Handles all errors robustly
   */
  static async register(req: any, res: any) {
    try {
      const { name, email, phoneNumber, password } = req.body;
      // Input validation should be added here (omitted for brevity)
      try {
        const user = await AuthService.register({ name, email, phoneNumber, password });
        // Never return password hash
        res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            apiKey: user.apiKey,
            role: user.role,
          },
        });
      } catch (err: any) {
        // Known error from AuthService
        res.status(400).json({ error: err.message || 'Registration failed.' });
      }
    } catch (err: any) {
      // Unexpected error
      console.error('Unexpected error in register:', err);
      res.status(500).json({ error: 'Internal server error during registration.' });
    }
  }

  // User login endpoint, - Validates credentials, Issues access and refresh tokens, Returns tokens and user info, Handles all errors robustly
  static async login(req: any, res: any) {
    try {
      const { email, password } = req.body;
      // Input validation should be added here (omitted for brevity)
      try {
        const { accessToken, refreshToken, user } = await AuthService.login({ email, password });
        // Set refresh token as httpOnly cookie (recommended for web clients)
        // res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.status(200).json({
          message: 'Login successful',
          accessToken,
          refreshToken, // For mobile/CLI, return in body; for web, use httpOnly cookie
          user,
        });
      } catch (err: any) {
        // Known error from AuthService
        res.status(401).json({ error: err.message || 'Login failed.' });
      }
    } catch (err: any) {
      // Unexpected error
      console.error('Unexpected error in login:', err);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  }

  // get all users endpoint
  //get user by id endpoint
  // update user endpoint
  // delete user endpoint
}
