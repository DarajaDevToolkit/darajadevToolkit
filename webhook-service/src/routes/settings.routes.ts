import { Hono } from 'hono';
import { z } from 'zod';
import { SettingsController } from '../controllers/SettingsController';
import { validateParams, validateBody } from '../middleware/validation';
import { settingInputSchema } from '../validators/settings.validators';

const settingsRoutes = new Hono();
const settingsController = new SettingsController();

// Get all settings for a user
settingsRoutes.get(
  '/settings/:userId',
  validateParams(z.object({ userId: z.string().uuid() })),
  (c) => settingsController.getAll(c)
);

// Create or upsert a setting
settingsRoutes.post(
  '/settings/:userId',
  validateParams(z.object({ userId: z.string().uuid() })),
  validateBody(settingInputSchema),
  (c) => settingsController.create(c)
);

// Update an existing setting by ID
settingsRoutes.put(
  '/settings/:userId/:id',
  validateParams(z.object({ userId: z.string().uuid(), id: z.string().uuid() })),
  validateBody(settingInputSchema),
  (c) => settingsController.update(c)
);

// Delete a setting by ID
settingsRoutes.delete(
  '/settings/:userId/:id',
  validateParams(z.object({ userId: z.string().uuid(), id: z.string().uuid() })),
  (c) => settingsController.remove(c)
);

export default settingsRoutes;
