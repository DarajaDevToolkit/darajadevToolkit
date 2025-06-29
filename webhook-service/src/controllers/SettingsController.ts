import type { Context } from 'hono';
import db from '../drizzle/db';
import DB  from '../drizzle/db';
import { SettingsService } from '../services/SettingsService';
import {
  settingInputSchema,
  settingParamSchema,
} from '../validators/settings.validators';

export class SettingsController {
  private service: SettingsService;

  constructor() {
    this.service = new SettingsService(db as typeof DB);
  }

//   List all settings for a user
  async getAll(c: Context) {
    const userId = c.req.param('userId');
    const settings = await this.service.findAll(userId);
    return c.json(settings);
  }

  /** Create or upsert a setting */
  async create(c: Context) {
    const userId = c.req.param('userId');
    const input = settingInputSchema.parse(await c.req.json());
    const result = await this.service.upsert(
      userId,
      input.environment,
      input.webhookUrl
    );
    return c.json(result, 201);
  }

  /** Update an existing setting */
  async update(c: Context) {
    const userId = c.req.param('userId');
    const { id } = settingParamSchema.parse({ id: c.req.param('id') });
    const input = settingInputSchema.parse(await c.req.json());
    // Using upsert by environment; ensure id matches if necessary
    const result = await this.service.upsert(
      userId,
      input.environment,
      input.webhookUrl
    );
    return c.json(result);
  }

  /** Delete a setting */
  async remove(c: Context) {
    const { id } = settingParamSchema.parse({ id: c.req.param('id') });
    await this.service.remove(id);
    return c.json({ success: true });
  }
}
