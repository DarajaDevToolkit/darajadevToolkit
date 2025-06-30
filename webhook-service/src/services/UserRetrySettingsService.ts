import { eq, and } from "drizzle-orm";
import db from "../drizzle/db";
import {
  userRetrySettings,
  deliveryAttempts,
  retryHistory,
  webhooks,
  type UserRetrySettings,
  type NewUserRetrySettings,
  type NewDeliveryAttempt,
  type NewRetryHistory,
} from "../drizzle/schema";
import type { EnhancedDeliveryAttempt } from "./EnhancedWebhookDeliveryService";

// Default retry settings if user hasn't configured any
const DEFAULT_RETRY_SETTINGS: Omit<
  UserRetrySettings,
  "id" | "userId" | "createdAt" | "updatedAt"
> = {
  environment: "dev",
  maxRetries: 3,
  retryDelayMs: 2000,
  timeoutMs: 25000,
  enableCircuitBreaker: false,
  circuitBreakerThreshold: 5,
  isActive: true,
};

export class UserRetrySettingsService {
  /**
   * Get user retry settings for a specific environment
   */
  async getUserRetrySettings(
    userId: string,
    environment: string = "dev"
  ): Promise<UserRetrySettings> {
    try {
      const settings = await db
        .select()
        .from(userRetrySettings)
        .where(
          and(
            eq(userRetrySettings.userId, userId),
            eq(userRetrySettings.environment, environment),
            eq(userRetrySettings.isActive, true)
          )
        )
        .limit(1);

      if (settings.length > 0 && settings[0]) {
        return settings[0];
      }

      // If no settings exist, create default settings for this user/environment
      console.log(
        `📋 Creating default retry settings for user ${userId} in ${environment}`
      );
      return await this.createDefaultSettings(userId, environment);
    } catch (error) {
      console.error(
        `❌ Failed to get retry settings for user ${userId}:`,
        error
      );
      // Return safe defaults if database fails
      return {
        ...DEFAULT_RETRY_SETTINGS,
        id: `default-${userId}`,
        userId,
        environment,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserRetrySettings;
    }
  }

  /**
   * Create default retry settings for a user
   */
  async createDefaultSettings(
    userId: string,
    environment: string = "dev"
  ): Promise<UserRetrySettings> {
    const newSettings: NewUserRetrySettings = {
      userId,
      ...DEFAULT_RETRY_SETTINGS,
      environment,
    };

    const [created] = await db
      .insert(userRetrySettings)
      .values(newSettings)
      .returning();

    if (!created) {
      throw new Error("Failed to create default retry settings");
    }

    return created;
  }

  /**
   * Update user retry settings
   */
  async updateUserRetrySettings(
    userId: string,
    environment: string,
    updates: Partial<
      Pick<
        UserRetrySettings,
        | "maxRetries"
        | "retryDelayMs"
        | "timeoutMs"
        | "enableCircuitBreaker"
        | "circuitBreakerThreshold"
      >
    >
  ): Promise<UserRetrySettings> {
    const [updated] = await db
      .update(userRetrySettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userRetrySettings.userId, userId),
          eq(userRetrySettings.environment, environment)
        )
      )
      .returning();

    if (!updated) {
      throw new Error(
        `No retry settings found for user ${userId} in ${environment}`
      );
    }

    return updated;
  }

  /**
   * Get user's webhook URL for an environment
   */
  async getUserWebhookUrl(
    userId: string,
    environment: string = "dev",
    eventType: string = "stk_push_result"
  ): Promise<string | null> {
    try {
      const webhook = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.userId, userId),
            eq(webhooks.eventType, eventType),
            eq(webhooks.isActive, true)
          )
        )
        .limit(1);

      if (webhook.length > 0 && webhook[0]) {
        return webhook[0].url;
      }

      // For development, return a test URL if no webhook configured
      if (environment === "dev") {
        console.warn(
          `⚠️  No webhook URL configured for user ${userId}, using test URL`
        );
        return "http://localhost:3002/webhooks/mpesa";
      }

      console.warn(
        `❌ No webhook URL configured for user ${userId} in ${environment}`
      );
      return null;
    } catch (error) {
      console.error(`❌ Failed to get webhook URL for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Save delivery attempt to database
   */
  async saveDeliveryAttempt(
    attempt: EnhancedDeliveryAttempt,
    userId: string,
    queueJobId?: string
  ): Promise<void> {
    try {
      const deliveryAttempt: NewDeliveryAttempt = {
        webhookId: attempt.webhookId,
        userId,
        queueJobId,
        payload: {}, // Will be populated by the webhook payload
        targetUrl: attempt.targetUrl,
        responseStatus: attempt.responseCode,
        responseBody: attempt.responseBody,
        responseHeaders: attempt.responseHeaders,
        success: attempt.status === "delivered",
        attemptNumber: 1, // This should be passed from the calling context
        errorMessage: attempt.errorMessage,
        errorCategory: attempt.errorCategory,
        duration: attempt.duration,
        retryable: attempt.retryable,
      };

      await db.insert(deliveryAttempts).values(deliveryAttempt);
      console.log(`💾 Saved delivery attempt for webhook ${attempt.webhookId}`);
    } catch (error) {
      console.error(`❌ Failed to save delivery attempt:`, error);
      // Don't throw - we don't want delivery failures due to logging issues
    }
  }

  /**
   * Save retry history to database
   */
  async saveRetryHistory(
    webhookId: string,
    userId: string,
    originalJobId: string,
    attempts: EnhancedDeliveryAttempt[],
    finalStatus: "delivered" | "failed" | "moved_to_dlq",
    dlqJobId?: string
  ): Promise<void> {
    try {
      if (attempts.length === 0) return;

      const firstAttempt = attempts[0]!;
      const lastAttempt = attempts[attempts.length - 1]!;
      const totalDuration =
        lastAttempt.attemptedAt.getTime() - firstAttempt.attemptedAt.getTime();

      // Extract failure categories and retry pattern
      const failureCategories = attempts
        .filter((a) => a.errorCategory)
        .map((a) => a.errorCategory!)
        .filter((category, index, self) => self.indexOf(category) === index); // unique

      const retryPattern = attempts.map((attempt, index) => ({
        attemptNumber: index + 1,
        delay:
          index > 0
            ? attempt.attemptedAt.getTime() -
              attempts[index - 1]!.attemptedAt.getTime()
            : 0,
        duration: attempt.duration,
        status: attempt.status,
      }));

      const retryHistoryRecord: NewRetryHistory = {
        webhookId,
        userId,
        originalJobId,
        totalAttempts: attempts.length,
        finalStatus,
        firstAttemptAt: firstAttempt.attemptedAt,
        lastAttemptAt: lastAttempt.attemptedAt,
        totalDuration,
        failureCategories,
        retryPattern,
        dlqJobId,
        metadata: {
          targetUrl: firstAttempt.targetUrl,
          errorSummary: failureCategories,
          deliveryTime: totalDuration,
        },
      };

      await db.insert(retryHistory).values(retryHistoryRecord);
      console.log(
        `📊 Saved retry history for webhook ${webhookId} (${attempts.length} attempts)`
      );
    } catch (error) {
      console.error(`❌ Failed to save retry history:`, error);
      // Don't throw - we don't want delivery failures due to logging issues
    }
  }

  /**
   * Get retry statistics for a user
   */
  async getUserRetryStats(userId: string, days: number = 30) {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const stats = await db
        .select()
        .from(retryHistory)
        .where(
          and(
            eq(retryHistory.userId, userId)
            // Add date filter when we add the proper where clause
          )
        );

      const totalDeliveries = stats.length;
      const successfulDeliveries = stats.filter(
        (s) => s.finalStatus === "delivered"
      ).length;
      const failedDeliveries = stats.filter(
        (s) => s.finalStatus === "failed"
      ).length;
      const dlqDeliveries = stats.filter(
        (s) => s.finalStatus === "moved_to_dlq"
      ).length;

      const successRate =
        totalDeliveries > 0
          ? (successfulDeliveries / totalDeliveries) * 100
          : 0;
      const averageAttempts =
        totalDeliveries > 0
          ? stats.reduce((sum, s) => sum + s.totalAttempts, 0) / totalDeliveries
          : 0;

      return {
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        dlqDeliveries,
        successRate: Math.round(successRate * 100) / 100,
        averageAttempts: Math.round(averageAttempts * 100) / 100,
      };
    } catch (error) {
      console.error(`❌ Failed to get retry stats for user ${userId}:`, error);
      return {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        dlqDeliveries: 0,
        successRate: 0,
        averageAttempts: 0,
      };
    }
  }

  /**
   * Create test user and settings for development
   */
  async createTestUser(): Promise<{
    userId: string;
    settings: UserRetrySettings;
  }> {
    const userId = "test-user-" + Math.random().toString(36).substr(2, 9);

    try {
      // Create test user settings
      const settings = await this.createDefaultSettings(userId, "dev");

      // Create a test webhook entry
      await db.insert(webhooks).values({
        userId,
        url: "http://localhost:3002/webhooks/mpesa",
        eventType: "stk_push_result",
        isActive: true,
        description: "Test webhook for development",
      });

      console.log(`🧪 Created test user ${userId} with default settings`);
      return { userId, settings };
    } catch (error) {
      console.error(`❌ Failed to create test user:`, error);
      throw error;
    }
  }
}
