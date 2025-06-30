import { WebhookQueueService } from "./WebhookQueueService";
import { EnhancedWebhookDeliveryService } from "./EnhancedWebhookDeliveryService";
import { UserRetrySettingsService } from "./UserRetrySettingsService";
import type { WebhookPayload } from "@daraja-toolkit/shared";
import { PRIORITY_LEVELS } from "../config/queue";

/**
 * Enhanced webhook queue service that integrates with database-backed user settings
 */
export class DatabaseWebhookQueueService extends WebhookQueueService {
  private enhancedDeliveryService: EnhancedWebhookDeliveryService;
  private userSettingsService: UserRetrySettingsService;

  constructor() {
    super();
    this.userSettingsService = new UserRetrySettingsService();
    this.enhancedDeliveryService = new EnhancedWebhookDeliveryService(
      undefined, // DLQ service
      this.userSettingsService
    );
  }

  /**
   * Queue webhook with user-specific settings from database
   */
  async queueWebhookWithUserSettings(
    webhookPayload: Partial<WebhookPayload>,
    userId: string,
    environment: string = "dev",
    priority: number = PRIORITY_LEVELS.NORMAL
  ): Promise<{ jobId: string; userSettings: any }> {
    try {
      // Get user retry settings from database
      const userSettings = await this.userSettingsService.getUserRetrySettings(
        userId,
        environment
      );

      // Get user webhook URL
      const webhookUrl = await this.userSettingsService.getUserWebhookUrl(
        userId,
        environment
      );

      if (!webhookUrl) {
        throw new Error(
          `No webhook URL configured for user ${userId} in ${environment}`
        );
      }

      console.log(
        `📦 Queueing webhook for user ${userId} with custom settings:`,
        {
          maxRetries: userSettings.maxRetries,
          retryDelayMs: userSettings.retryDelayMs,
          timeoutMs: userSettings.timeoutMs,
          url: webhookUrl,
        }
      );

      // Create complete webhook payload
      const completePayload: WebhookPayload = {
        id: webhookPayload.id || `webhook_${Date.now()}`,
        userId,
        eventType: webhookPayload.eventType || "stk_push_result",
        payload: webhookPayload.payload as any,
        receivedAt: webhookPayload.receivedAt || new Date(),
        environment: environment as "dev" | "staging" | "production",
      };

      // Queue with user-specific job options
      const job = await this.getWebhookQueue().add(
        "deliver_webhook_enhanced",
        {
          webhookPayload: completePayload,
          targetUrl: webhookUrl,
          userId,
          eventType: completePayload.eventType,
          userSettings: {
            maxRetries: userSettings.maxRetries,
            retryDelayMs: userSettings.retryDelayMs,
            timeoutMs: userSettings.timeoutMs,
          },
        },
        {
          priority,
          attempts: userSettings.maxRetries,
          delay: 0,
          backoff: {
            type: "exponential",
            delay: userSettings.retryDelayMs,
          },
          // Remove timeout as it's not a valid BullMQ job option
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      );

      console.log(
        `✅ Webhook queued with ID: ${job.id} (Priority: ${priority})`
      );

      return {
        jobId: job.id!,
        userSettings: {
          maxRetries: userSettings.maxRetries,
          retryDelayMs: userSettings.retryDelayMs,
          timeoutMs: userSettings.timeoutMs,
          url: webhookUrl,
        },
      };
    } catch (error: any) {
      console.error(`❌ Failed to queue webhook for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process webhook delivery with database integration
   * This method would be called by the worker
   */
  async processWebhookDelivery(
    webhookPayload: WebhookPayload,
    userId: string,
    environment: string,
    queueJobId: string
  ): Promise<{
    attempts: any[];
    finalStatus: string;
    dlqJobId?: string;
  }> {
    console.log(
      `🔄 Processing webhook delivery for user ${userId} with database integration`
    );

    try {
      const result =
        await this.enhancedDeliveryService.deliverWebhookWithUserSettings(
          webhookPayload,
          userId,
          environment,
          queueJobId
        );

      console.log(
        `📊 Delivery result: ${result.finalStatus} (${result.attempts.length} attempts)`
      );

      return {
        attempts: result.attempts,
        finalStatus: result.finalStatus,
        dlqJobId: result.dlqJobId,
      };
    } catch (error: any) {
      console.error(`❌ Failed to process webhook delivery:`, error);
      throw error;
    }
  }

  /**
   * Get user delivery stats from database
   */
  async getUserDeliveryStats(userId: string, days: number = 30) {
    return await this.userSettingsService.getUserRetryStats(userId, days);
  }

  /**
   * Create test user for development
   */
  async createTestUser() {
    return await this.userSettingsService.createTestUser();
  }

  /**
   * Update user retry settings
   */
  async updateUserRetrySettings(
    userId: string,
    environment: string,
    updates: {
      maxRetries?: number;
      retryDelayMs?: number;
      timeoutMs?: number;
      enableCircuitBreaker?: boolean;
    }
  ) {
    return await this.userSettingsService.updateUserRetrySettings(
      userId,
      environment,
      updates
    );
  }
}
