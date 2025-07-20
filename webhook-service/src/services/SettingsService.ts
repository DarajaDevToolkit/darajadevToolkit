import { userSettings } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import DB from '../drizzle/db';
import type { UserSetting, NewUserSetting } from '../drizzle/schema';

export class SettingsService {
  constructor(private db: typeof DB) {}

  /**
   * Create or update a webhook URL for a user/environment
   */
  async upsert(
    userId: string,
    env: UserSetting['environment'],
    url: string
  ): Promise<UserSetting> {
    // Check if exists
    const existing = await this.db
      .select()
      .from(userSettings)
      .where(
        and(eq(userSettings.userId, userId), eq(userSettings.environment, env))
      )
      .execute();

    if (existing.length) {
      const record = existing[0]!;
      const [updated] = await this.db
        .update(userSettings)
        .set({ webhookUrl: url, updatedAt: new Date() })
        .where(eq(userSettings.id, record.id))
        .returning()
        .execute();
      return updated!;
    }

    const insertData: NewUserSetting = {
      userId,
      environment: env,
      webhookUrl: url,
    };

    const [newRecord] = await this.db
      .insert(userSettings)
      .values(insertData)
      .returning()
      .execute();
    return newRecord!;
  }

  /** Get all settings for a user */
  async findAll(userId: string): Promise<UserSetting[]> {
    return this.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .execute();
  }

  /** Delete a setting by id */
  async remove(id: string): Promise<void> {
    await this.db.delete(userSettings).where(eq(userSettings.id, id)).execute();
  }

  /**
   * Get user's webhook URL and environment for webhook delivery
   */
  async getUserWebhookConfig(
    userId: string,
    environment?: string
  ): Promise<{ webhookUrl: string; environment: string }> {
    try {
      // Get user settings
      const settings = await this.db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .execute();

      if (!settings.length) {
        throw new Error(`No webhook configuration found for user ${userId}`);
      }

      // If specific environment requested, find it
      if (environment) {
        const envConfig = settings.find(
          (setting: UserSetting) => setting.environment === environment
        );
        if (!envConfig) {
          throw new Error(
            `No webhook URL configured for environment: ${environment}`
          );
        }
        return {
          webhookUrl: envConfig.webhookUrl,
          environment: envConfig.environment,
        };
      }

      // Default to first available environment if none specified
      const defaultConfig = settings[0];
      if (!defaultConfig) {
        throw new Error(`No webhook configuration found for user ${userId}`);
      }
      return {
        webhookUrl: defaultConfig.webhookUrl,
        environment: defaultConfig.environment,
      };
    } catch (error) {
      console.error('Error getting user webhook config:', error);
      throw error;
    }
  }
}
