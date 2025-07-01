import type { Context } from 'hono';
import {
  registerUserService,
  loginUserService,
  getUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
  refreshTokenService,
} from 'src/services/auth.service';

export const registerUserController = async (c: Context) => {
  try {
    const user = await c.req.json();
    const message = await registerUserService(user);
    return c.json({ message }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
};

export const loginUserController = async (c: Context) => {
  try {
    const body = await c.req.json();
    console.log('Received login request:', body);

    if (!body.email || !body.password) {
      console.error('Missing email or password');
      return c.json({ message: 'Email and password are required' }, 400);
    }

    const { accessToken, refreshToken, user } = await loginUserService(
      body.email,
      body.password
    );

    console.log('Login successful:', user);
    return c.json({ accessToken, refreshToken, user }, 200);
  } catch (error: any) {
    console.error('Login error:', error.message);

    if (error.message === 'User not found.') {
      return c.json({ error: 'User not found. Please register.' }, 404);
    } else if (error.message === 'Invalid credentials.') {
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
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
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
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
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
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
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
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
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
