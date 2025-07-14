import type { Context } from 'hono';
import {
  registerUserService,
  loginUserService,
  getUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  refreshTokenService,
  getUserByEmailService,
  createResetTokenService,
  verifyResetTokenService,
  updateUserPasswordService
} from 'src/services/auth.service';
import crypto from 'crypto';
import {
  registerUserValidator,
  loginUserValidator,
} from '../validators/user.validators';
import { sendAuthEmail } from 'src/config/mailer';

export const registerUserController = async (c: Context) => {
  try {
    const userData = await c.req.json();

    // Validate input data using Zod schema
    const validationResult = registerUserValidator.safeParse(userData);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        400
      );
    }

    const message = await registerUserService(validationResult.data);
    return c.json({ message }, 201);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 400);
  }
};

export const loginUserController = async (c: Context) => {
  try {
    const body = await c.req.json();
    console.log('Received login request:', body);

    // Validate input data using Zod schema
    const validationResult = loginUserValidator.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return c.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        400
      );
    }

    const { email, password } = validationResult.data;
    const { accessToken, refreshToken, user } = await loginUserService(
      email,
      password
    );

    console.log('Login successful:', user);
    return c.json({ accessToken, refreshToken, user }, 200);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Login error:', errorMessage);

    if (errorMessage === 'User not found.') {
      return c.json({ error: 'User not found. Please register.' }, 404);
    } else if (errorMessage === 'Invalid credentials') {
      return c.json({ error: 'Invalid email or password.' }, 401);
    } else {
      return c.json({ error: 'An error occurred. Please try again.' }, 500);
    }
  }
};

export const getUsers = async (c: Context) => {
  try {
    const page = Number(c.req.query('page')) || 1;
    const limit = Number(c.req.query('limit')) || 10;
    const data = await getUsersService(page, limit);
    return c.json(data, 200);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 400);
  }
};

export const getUserById = async (c: Context) => {
  try {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ error: 'Invalid ID' }, 400);
    }
    const user = await getUserByIdService(id);
    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }
    return c.json(user, 200);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 400);
  }
};

export const updateUser = async (c: Context) => {
  const id = c.req.param('id');
  if (!id) {
    return c.json({ error: 'Invalid ID' }, 400);
  }
  const user = await c.req.json();
  try {
    const existingUser = await getUserByIdService(id);
    if (!existingUser) {
      return c.json({ message: 'User not found' }, 404);
    }
    const updateResult = await updateUserService(id, user);
    if (!updateResult) {
      return c.json({ message: 'User not updated' }, 400);
    }
    return c.json({ message: 'User updated successfully' }, 200);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 400);
  }
};

export const deleteUser = async (c: Context) => {
  const id = c.req.param('id');
  if (!id) {
    return c.json({ error: 'Invalid ID' }, 400);
  }
  try {
    const existingUser = await getUserByIdService(id);
    if (!existingUser) {
      return c.json({ message: 'User not found' }, 404);
    }
    const deleteResult = await deleteUserService(id);
    if (!deleteResult) {
      return c.json({ message: 'User not deleted' }, 400);
    }
    return c.json({ message: 'User deleted successfully' }, 200);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: errorMessage }, 400);
  }
};

export const refreshTokenController = async (c: Context) => {
  try {
    const body = await c.req.json();

    if (!body.refreshToken) {
      return c.json({ error: 'Refresh token is required' }, 400);
    }

    const { accessToken, refreshToken, user } = await refreshTokenService(
      body.refreshToken
    );

    return c.json({ accessToken, refreshToken, user }, 200);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Refresh token error:', errorMessage);

    if (errorMessage.includes('Invalid or expired')) {
      return c.json({ error: 'Invalid or expired refresh token' }, 401);
    } else {
      return c.json({ error: 'An error occurred during token refresh' }, 500);
    }
  }
};

// ########forgotPassword#############################################
export const forgotPassword = async (c: Context) => {
  try {
    const { email } = await c.req.json();
    let user;
    try {
      user = await getUserByEmailService(email);
    } catch (err) {
      // Always return the same message to prevent user enumeration
      return c.json({ message: "If the account exists🤡, a reset link has been sent." }, 200);
    }
    // Generate a secure token
    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Ensure user exists and has an id
    if (!user || !user.id) {
      // Always return the same message to prevent user enumeration (security practise)
      return c.json({ message: "If the account exists😶, a reset link has been sent." }, 200);
    }
    // Save token to DB or Redis
    await createResetTokenService({
      userId: user.id,
      token,
      expiresAt,
    });
    // Compose reset link
    const resetLink = `http://localhost:3000/reset-password?token=${token}`; //replace this with the domain when hosted, initially had it at local host : 3000 (next js)
    // Send email using the new sendAuthEmail signature
    await sendAuthEmail({
      to: user.email,
      name: user.name,
      code: resetLink,
      expiresOn: expiresAt.toISOString(),
      type: "reset",
    });

    return c.json({ message: "If the account exists, a reset link has been sent." }, 200);
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return c.json({ error: "Something went wrong. Please try again later." }, 500);
  }
};

//###################verifyResetToken#######################################
export const verifyResetTokenController = async (c: Context) => {
  try {
    const token = c.req.param('token');
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }
    const message = await verifyResetTokenService(token);
    return c.json({ message });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
}

//#########################reset password###############################################
export const resetPasswordController = async (c: Context) => {
  try {
    const { email, password, token } = await c.req.json();
    const user = await getUserByEmailService(email);
    if (!user) {
      return c.json({ message: "User not found." }, 404);
    }
    // Verify the reset token
    const userId = await verifyResetTokenService(token);
    // Ensure the token belongs to the user
    if (user.id !== userId) {
      return c.json({ message: "Invalid token for this user." }, 400);
    }
    // Here the new password has already been hashed in the updateUserPasswordService so lets Update the user's password and clear the reset token
    await updateUserPasswordService(user.id, password);
    return c.json({ message: 'Password reset successful.' }, 200);
  } catch (error) {
    console.error("Reset Password Error:", error);
    return c.json({ error: "Something went wrong. Please try again later." }, 500);
  }
};