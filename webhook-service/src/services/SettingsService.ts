import { userSettings } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import DB from '../drizzle/db';
import type { UserSetting, NewUserSetting } from '../drizzle/schema';

export class SettingsService {
  constructor(private db: typeof DB) {}

  /**
   * Create or update a webhook URL for a user/environment
   */
  async upsert(userId: string, env: UserSetting['environment'], url: string): Promise<UserSetting>{
    // Check if exists
    const existing = await this.db
      .select()
      .from(userSettings)
      .where(
        and(
          eq(userSettings.userId, userId),
          eq(userSettings.environment, env)
        )
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
    await this.db
      .delete(userSettings)
      .where(eq(userSettings.id, id))
      .execute();
  }
}
