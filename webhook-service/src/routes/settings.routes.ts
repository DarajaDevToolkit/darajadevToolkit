import { Hono } from 'hono';
import { SettingsController } from '../controllers/SettingsController';

const settingsRoutes = new Hono();
const settingsController = new SettingsController();

// Get all settings for a user
settingsRoutes.get('/settings/:userId', (c) => settingsController.getAll(c));

// Create or update a setting
settingsRoutes.post('/settings/:userId', (c) => settingsController.create(c));

// Update an existing setting by ID
settingsRoutes.put('/settings/:userId/:id', (c) => settingsController.update(c));

// Delete a setting by ID
settingsRoutes.delete('/settings/:userId/:id', (c) => settingsController.remove(c));

export default settingsRoutes;
