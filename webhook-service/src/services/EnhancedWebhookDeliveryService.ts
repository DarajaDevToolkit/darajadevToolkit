import axios, { AxiosError } from "axios";
import type { WebhookPayload, DeliveryAttempt } from "@daraja-toolkit/shared";
import { DeadLetterQueueService } from "./DeadLetterQueueService";
import { UserRetrySettingsService } from "./UserRetrySettingsService";
import { ERROR_CATEGORIES, RETRY_STRATEGIES } from "../config/queue";
import type { DLQJobData } from "./DeadLetterQueueService";
import type { UserRetrySettings as DBUserRetrySettings } from "../drizzle/schema";

// Enhanced delivery attempt with error categorization
export interface EnhancedDeliveryAttempt extends DeliveryAttempt {
  errorCategory?: string;
  retryable?: boolean;
  duration: number;
  responseHeaders?: Record<string, string>;
}

// User retry settings interface (legacy compatibility)
export interface UserRetrySettings {
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

export class EnhancedWebhookDeliveryService {
  private dlqService: DeadLetterQueueService;
  private userSettingsService: UserRetrySettingsService;
  private defaultRetrySettings: UserRetrySettings = {
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 25000,
  };

  constructor(
    dlqService?: DeadLetterQueueService,
    userSettingsService?: UserRetrySettingsService
  ) {
    this.dlqService = dlqService || new DeadLetterQueueService();
    this.userSettingsService =
      userSettingsService || new UserRetrySettingsService();
  }

  /**
   * Deliver webhook with enhanced retry logic and DLQ integration
   */
  async deliverWebhookWithRetries(
    webhookPayload: WebhookPayload,
    targetUrl: string,
    userRetrySettings?: UserRetrySettings
  ): Promise<{
    attempts: EnhancedDeliveryAttempt[];
    finalStatus: "delivered" | "failed" | "moved_to_dlq";
    dlqJobId?: string;
  }> {
    const retrySettings = {
      ...this.defaultRetrySettings,
      ...userRetrySettings,
    };
    const attempts: EnhancedDeliveryAttempt[] = [];
    let lastErrorCategory: string = ERROR_CATEGORIES.UNKNOWN;

    console.log(
      `🚀 Starting enhanced delivery for webhook ${webhookPayload.id} to ${targetUrl}`
    );
    console.log(`📋 Using retry settings:`, retrySettings);

    for (
      let attemptNumber = 1;
      attemptNumber <= retrySettings.maxRetries;
      attemptNumber++
    ) {
      const startTime = Date.now();

      try {
        const attempt = await this.performSingleDelivery(
          webhookPayload,
          targetUrl,
          attemptNumber,
          retrySettings.timeoutMs
        );

        attempts.push(attempt);

        if (attempt.status === "delivered") {
          console.log(
            `✅ Webhook ${webhookPayload.id} delivered successfully on attempt ${attemptNumber}`
          );
          return {
            attempts,
            finalStatus: "delivered",
          };
        }

        // Categorize the error for intelligent retry logic
        lastErrorCategory = this.categorizeError(attempt);
        const retryStrategy =
          DeadLetterQueueService.getRetryStrategy(lastErrorCategory);

        console.log(
          `❌ Attempt ${attemptNumber} failed (${lastErrorCategory}):`,
          attempt.errorMessage
        );

        // Check if this error type should be retried
        if (!retryStrategy.shouldRetry) {
          console.log(
            `🚫 Error category ${lastErrorCategory} is not retryable. Moving to DLQ.`
          );
          break;
        }

        // Check if we've exceeded retry attempts for this error category
        if (attemptNumber >= retryStrategy.maxRetries) {
          console.log(
            `🔚 Max retries (${retryStrategy.maxRetries}) reached for ${lastErrorCategory}. Moving to DLQ.`
          );
          break;
        }

        // Calculate intelligent delay based on error category
        if (attemptNumber < retrySettings.maxRetries) {
          const delay = this.calculateIntelligentDelay(
            attemptNumber,
            lastErrorCategory,
            retrySettings.retryDelayMs
          );

          console.log(
            `⏳ Retrying in ${delay}ms (attempt ${attemptNumber + 1}/${retrySettings.maxRetries})`
          );
          await this.sleep(delay);
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const attempt: EnhancedDeliveryAttempt = {
          id: this.generateId(),
          webhookId: webhookPayload.id,
          targetUrl,
          status: "failed",
          attemptedAt: new Date(startTime),
          errorMessage: error.message,
          duration,
          errorCategory: this.categorizeErrorFromException(error),
          retryable: false,
        };

        attempts.push(attempt);
        lastErrorCategory = attempt.errorCategory!;
      }
    }

    // All retries exhausted or non-retryable error - move to DLQ
    console.log(`💀 Moving webhook ${webhookPayload.id} to Dead Letter Queue`);

    const failureHistory: DLQJobData["failureHistory"] = attempts.map(
      (attempt, index) => ({
        attemptNumber: index + 1,
        failedAt: attempt.attemptedAt,
        error: attempt.errorMessage || "Unknown error",
        errorCategory: attempt.errorCategory || ERROR_CATEGORIES.UNKNOWN,
        duration: attempt.duration,
      })
    );

    // Create a mock job object for DLQ (in real implementation, this would come from the actual job)
    const mockJob = {
      id: `webhook_${webhookPayload.id}_${Date.now()}`,
      data: {
        webhookPayload,
        targetUrl,
        userId: webhookPayload.userId,
        eventType: webhookPayload.eventType,
      },
      attemptsMade: attempts.length,
      failedReason:
        attempts[attempts.length - 1]?.errorMessage || "Unknown failure",
      timestamp: Date.now(),
      processedOn: undefined,
      finishedOn: undefined,
    } as any;

    await this.dlqService.moveToDLQ(mockJob, failureHistory, lastErrorCategory);

    return {
      attempts,
      finalStatus: "moved_to_dlq",
      dlqJobId: `dlq_${mockJob.id}_${Date.now()}`,
    };
  }

  /**
   * Perform a single delivery attempt
   */
  private async performSingleDelivery(
    webhookPayload: WebhookPayload,
    targetUrl: string,
    attemptNumber: number,
    timeoutMs: number
  ): Promise<EnhancedDeliveryAttempt> {
    const startTime = Date.now();
    const attemptId = this.generateId();

    const deliveryAttempt: EnhancedDeliveryAttempt = {
      id: attemptId,
      webhookId: webhookPayload.id,
      targetUrl,
      status: "pending",
      attemptedAt: new Date(startTime),
      duration: 0,
    };

    try {
      console.log(
        `🔄 Attempt ${attemptNumber}: Delivering webhook ${webhookPayload.id} to ${targetUrl}`
      );

      const response = await axios.post(targetUrl, webhookPayload.payload, {
        timeout: timeoutMs,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Daraja-Toolkit/1.0",
          "X-Webhook-Event": webhookPayload.eventType,
          "X-Webhook-ID": webhookPayload.id,
          "X-Webhook-Timestamp": this.formatTimestamp(
            webhookPayload.receivedAt
          ),
          "X-Webhook-Attempt": attemptNumber.toString(),
        },
        // Add response validation
        validateStatus: (status) => status >= 200 && status < 300,
      });

      const duration = Date.now() - startTime;

      deliveryAttempt.status = "delivered";
      deliveryAttempt.responseCode = response.status;
      deliveryAttempt.responseBody = JSON.stringify(response.data);
      deliveryAttempt.responseHeaders = response.headers as Record<
        string,
        string
      >;
      deliveryAttempt.duration = duration;
      deliveryAttempt.errorCategory = undefined;
      deliveryAttempt.retryable = false;

      console.log(
        `✅ Webhook ${webhookPayload.id} delivered successfully (${response.status}) in ${duration}ms`
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorCategory = this.categorizeErrorFromException(error);
      const retryStrategy =
        DeadLetterQueueService.getRetryStrategy(errorCategory);

      deliveryAttempt.status = "failed";
      deliveryAttempt.errorMessage = this.extractErrorMessage(error);
      deliveryAttempt.duration = duration;
      deliveryAttempt.errorCategory = errorCategory;
      deliveryAttempt.retryable = retryStrategy.shouldRetry;

      if (error.response) {
        deliveryAttempt.responseCode = error.response.status;
        deliveryAttempt.responseBody = JSON.stringify(error.response.data);
        deliveryAttempt.responseHeaders = error.response.headers;
      }

      console.error(
        `❌ Webhook ${webhookPayload.id} delivery failed (${errorCategory}):`,
        deliveryAttempt.errorMessage
      );
    }

    return deliveryAttempt;
  }

  /**
   * Categorize error from delivery attempt
   */
  private categorizeError(attempt: EnhancedDeliveryAttempt): string {
    if (attempt.responseCode) {
      return DeadLetterQueueService.categorizeError(
        { message: attempt.errorMessage },
        attempt.responseCode
      );
    }
    return DeadLetterQueueService.categorizeError({
      message: attempt.errorMessage,
    });
  }

  /**
   * Categorize error from exception
   */
  private categorizeErrorFromException(error: any): string {
    let responseCode: number | undefined;

    if (error.response?.status) {
      responseCode = error.response.status;
    }

    return DeadLetterQueueService.categorizeError(error, responseCode);
  }

  /**
   * Calculate intelligent delay based on error category and attempt number
   */
  private calculateIntelligentDelay(
    attemptNumber: number,
    errorCategory: string,
    baseDelayMs: number
  ): number {
    const retryStrategy =
      DeadLetterQueueService.getRetryStrategy(errorCategory);

    // Use strategy-specific settings if available, otherwise fall back to base delay
    const initialDelay = retryStrategy.initialDelay || baseDelayMs;
    const multiplier = retryStrategy.backoffMultiplier || 2;

    // Calculate exponential backoff with jitter
    const exponentialDelay =
      initialDelay * Math.pow(multiplier, attemptNumber - 1);

    // Add jitter (±20%) to prevent thundering herd
    const jitterRange = exponentialDelay * 0.2;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;

    const finalDelay = Math.max(100, exponentialDelay + jitter); // Minimum 100ms

    return Math.round(finalDelay);
  }

  /**
   * Extract meaningful error message
   */
  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.response?.statusText) {
      return `${error.response.status} ${error.response.statusText}`;
    }

    if (error.code) {
      return `${error.code}: ${error.message}`;
    }

    return error.message || "Unknown error";
  }

  /**
   * Get delivery analytics for user
   */
  async getDeliveryAnalytics(
    userId: string,
    timeRangeMs: number = 24 * 60 * 60 * 1000
  ): Promise<{
    totalAttempts: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageDeliveryTime: number;
    errorsByCategory: Record<string, number>;
    successRate: number;
  }> {
    // This would typically query a database of delivery attempts
    // For now, return mock data
    return {
      totalAttempts: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      errorsByCategory: {},
      successRate: 0,
    };
  }

  /**
   * Validate webhook URL before delivery
   */
  async validateWebhookUrl(
    url: string,
    timeoutMs: number = 5000
  ): Promise<{
    valid: boolean;
    responseTime?: number;
    error?: string;
    statusCode?: number;
  }> {
    const startTime = Date.now();

    try {
      const response = await axios.head(url, {
        timeout: timeoutMs,
        validateStatus: () => true, // Accept any status for validation
      });

      const responseTime = Date.now() - startTime;

      return {
        valid: response.status >= 200 && response.status < 500, // 2xx, 3xx, 4xx are considered "valid" endpoints
        responseTime,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Deliver webhook with user-specific database settings
   */
  async deliverWebhookWithUserSettings(
    webhookPayload: WebhookPayload,
    userId: string,
    environment: string = "dev",
    queueJobId?: string
  ): Promise<{
    attempts: EnhancedDeliveryAttempt[];
    finalStatus: "delivered" | "failed" | "moved_to_dlq";
    dlqJobId?: string;
  }> {
    console.log(
      `🚀 Starting webhook delivery with user settings for ${userId} in ${environment}`
    );

    try {
      // Get user-specific retry settings from database
      const dbUserSettings =
        await this.userSettingsService.getUserRetrySettings(
          userId,
          environment
        );

      // Get user's webhook URL from database
      const targetUrl = await this.userSettingsService.getUserWebhookUrl(
        userId,
        environment,
        webhookPayload.eventType
      );

      if (!targetUrl) {
        throw new Error(
          `No webhook URL configured for user ${userId} in ${environment}`
        );
      }

      console.log(
        `📋 Using user settings: maxRetries=${dbUserSettings.maxRetries}, timeout=${dbUserSettings.timeoutMs}ms`
      );
      console.log(`🎯 Target URL: ${targetUrl}`);

      // Convert database settings to legacy format
      const userRetrySettings: UserRetrySettings = {
        maxRetries: dbUserSettings.maxRetries,
        retryDelayMs: dbUserSettings.retryDelayMs,
        timeoutMs: dbUserSettings.timeoutMs,
      };

      // Use existing delivery logic with database-backed settings
      const result = await this.deliverWebhookWithRetries(
        webhookPayload,
        targetUrl,
        userRetrySettings
      );

      // Save all delivery attempts to database
      for (let i = 0; i < result.attempts.length; i++) {
        const attempt = result.attempts[i];
        await this.userSettingsService.saveDeliveryAttempt(
          { ...attempt, attemptNumber: i + 1 } as any,
          userId,
          queueJobId
        );
      }

      // Save retry history to database
      await this.userSettingsService.saveRetryHistory(
        webhookPayload.id,
        userId,
        queueJobId || `job_${Date.now()}`,
        result.attempts,
        result.finalStatus,
        result.dlqJobId
      );

      console.log(
        `📊 Delivery complete: ${result.finalStatus} after ${result.attempts.length} attempts`
      );

      return result;
    } catch (error: any) {
      console.error(`❌ Failed to deliver webhook for user ${userId}:`, error);

      // Create a failed attempt record for database tracking
      const failedAttempt: EnhancedDeliveryAttempt = {
        id: this.generateId(),
        webhookId: webhookPayload.id,
        targetUrl: "unknown",
        status: "failed",
        attemptedAt: new Date(),
        errorMessage: error.message,
        duration: 0,
        errorCategory: ERROR_CATEGORIES.UNKNOWN,
        retryable: false,
      };

      // Save failed attempt to database
      await this.userSettingsService.saveDeliveryAttempt(
        failedAttempt,
        userId,
        queueJobId
      );

      return {
        attempts: [failedAttempt],
        finalStatus: "failed",
      };
    }
  }

  /**
   * Utility methods
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatTimestamp(timestamp: Date | string | undefined): string {
    if (!timestamp) {
      return new Date().toISOString();
    }

    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }

    if (typeof timestamp === "string") {
      try {
        return new Date(timestamp).toISOString();
      } catch (error) {
        console.warn("Invalid timestamp format:", timestamp);
        return new Date().toISOString();
      }
    }

    return new Date().toISOString();
  }
}
