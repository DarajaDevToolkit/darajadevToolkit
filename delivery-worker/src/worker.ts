import axios from "axios";
import type {
  WebhookPayload,
  DeliveryAttempt,
  DeliveryStatus,
} from "@daraja-toolkit/shared";
import { QueueConsumer } from "./services/QueueConsumer";

console.log("🚀 Worker.ts loaded!");

// User retry settings interface for API compatibility
export interface UserRetrySettingsAPI {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffStrategy: string;
}

export class WebhookDeliveryService {
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1 second

  constructor(maxRetries?: number, baseRetryDelay?: number) {
    this.maxRetries = maxRetries || 3;
    this.baseRetryDelay = baseRetryDelay || 1000;
  }

  async deliverWebhook(
    webhookPayload: WebhookPayload,
    targetUrl: string
  ): Promise<DeliveryAttempt> {
    const deliveryAttempt: DeliveryAttempt = {
      id: this.generateId(),
      webhookId: webhookPayload.id,
      targetUrl,
      status: "pending",
      attemptedAt: new Date(),
    };

    try {
      console.log(`🚀 Delivering webhook ${webhookPayload.id} to ${targetUrl}`);

      const response = await axios.post(targetUrl, webhookPayload.payload, {
        timeout: 25000, // 25 seconds (leave 5 seconds buffer for M-Pesa's 30s limit)
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Daraja-Toolkit/1.0",
          "X-Webhook-Event": webhookPayload.eventType,
          "X-Webhook-ID": webhookPayload.id,
          "X-Webhook-Timestamp": webhookPayload.receivedAt.toISOString(),
        },
      });

      deliveryAttempt.status = "delivered";
      deliveryAttempt.responseCode = response.status;
      deliveryAttempt.responseBody = JSON.stringify(response.data);

      console.log(
        `✅ Webhook ${webhookPayload.id} delivered successfully (${response.status})`
      );
    } catch (error: any) {
      deliveryAttempt.status = "failed";
      deliveryAttempt.errorMessage = error.message;

      if (error.response) {
        deliveryAttempt.responseCode = error.response.status;
        deliveryAttempt.responseBody = JSON.stringify(error.response.data);
      }

      console.error(
        `❌ Webhook ${webhookPayload.id} delivery failed:`,
        error.message
      );
    }

    return deliveryAttempt;
  }

  async deliverWithRetries(
    webhookPayload: WebhookPayload,
    targetUrl: string,
    userRetrySettings?: UserRetrySettingsAPI
  ): Promise<DeliveryAttempt[]> {
    // Use user-specific settings if provided, otherwise use defaults
    const maxRetries = userRetrySettings?.maxRetries ?? this.maxRetries;
    const baseDelay = userRetrySettings?.initialDelayMs ?? this.baseRetryDelay;
    const maxDelay = userRetrySettings?.maxDelayMs ?? 30000; // 30 seconds max
    const backoffStrategy = userRetrySettings?.backoffStrategy ?? "exponential";

    console.log(`🔄 Starting delivery with settings:`, {
      maxRetries,
      baseDelay,
      maxDelay,
      backoffStrategy,
      isUserCustom: !!userRetrySettings,
    });

    const attempts: DeliveryAttempt[] = [];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const deliveryAttempt = await this.deliverWebhook(
        webhookPayload,
        targetUrl
      );
      attempts.push(deliveryAttempt);

      if (deliveryAttempt.status === "delivered") {
        console.log(`✅ Webhook delivered on attempt ${attempt + 1}`);
        break;
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = this.calculateRetryDelay(
          attempt,
          baseDelay,
          maxDelay,
          backoffStrategy
        );
        console.log(
          `⏳ Retrying in ${delay}ms (attempt ${attempt + 2}/${maxRetries})`
        );
        await this.sleep(delay);
      }
    }

    const lastAttempt = attempts[attempts.length - 1];
    if (lastAttempt.status === "failed") {
      console.error(
        `💀 Webhook ${webhookPayload.id} failed after ${maxRetries} attempts`
      );
      lastAttempt.status = "dead_letter";
    }

    return attempts;
  }

  private calculateRetryDelay(
    attemptNumber: number,
    baseDelay: number = this.baseRetryDelay,
    maxDelay: number = 30000,
    strategy: string = "exponential"
  ): number {
    let delay: number;

    switch (strategy) {
      case "linear":
        // Linear backoff: baseDelay * (attempt + 1)
        delay = baseDelay * (attemptNumber + 1);
        break;
      case "fixed":
        // Fixed delay
        delay = baseDelay;
        break;
      case "exponential":
      default:
        // Exponential backoff: baseDelay * 2^attempt
        delay = baseDelay * Math.pow(2, attemptNumber);
        break;
    }

    // Cap at maxDelay
    return Math.min(delay, maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Legacy WebhookProcessor class (replaced by QueueConsumer)
// This class is kept for backward compatibility and manual testing only
export class WebhookProcessor {
  private deliveryService: WebhookDeliveryService;

  constructor() {
    this.deliveryService = new WebhookDeliveryService();
  }

  async processWebhook(webhookPayload: WebhookPayload) {
    console.log(
      `📝 Processing webhook: ${webhookPayload.id} for user: ${webhookPayload.userId}`
    );

    // Get user's webhook URL (fallback to basic lookup for legacy support)
    const userWebhookUrl = await this.getUserWebhookUrl(
      webhookPayload.userId,
      webhookPayload.environment
    );

    if (!userWebhookUrl) {
      console.error(
        `❌ No webhook URL configured for user ${webhookPayload.userId} in ${webhookPayload.environment}`
      );
      return;
    }

    // Deliver the webhook with retries using default settings
    const attempts = await this.deliveryService.deliverWithRetries(
      webhookPayload,
      userWebhookUrl
    );

    console.log(`📊 Delivery complete. Total attempts: ${attempts.length}`);

    return attempts;
  }

  private async getUserWebhookUrl(
    userId: string,
    environment: string
  ): Promise<string | null> {
    // Basic fallback URL logic for legacy compatibility
    if (environment === "dev") {
      return `http://localhost:3000/webhooks/mpesa`;
    }

    console.warn(
      `No webhook URL configured for user ${userId} in ${environment}`
    );
    return null;
  }
}

// Example usage (for testing)
if (import.meta.main) {
  console.log("🚀 Starting Webhook Delivery Worker...");

  try {
    console.log("📡 Creating queue consumer...");
    // Start the queue consumer
    const queueConsumer = new QueueConsumer();
    console.log("✅ Queue consumer created successfully!");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("🛑 Received SIGINT, shutting down gracefully...");
      await queueConsumer.shutdown();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("🛑 Received SIGTERM, shutting down gracefully...");
      await queueConsumer.shutdown();
      process.exit(0);
    });

    console.log("🎯 Worker is running and listening for jobs...");
  } catch (error) {
    console.error("💥 Failed to start worker:", error);
    process.exit(1);
  }

  // Keep the old test code for manual testing (commented out)
  /*
  const processor = new WebhookProcessor();

  // Mock webhook payload for testing
  const mockWebhook: WebhookPayload = {
    id: "test_webhook_123",
    userId: "user_123",
    eventType: "stk_push_result",
    payload: {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant-123",
          CheckoutRequestID: "test-checkout-456",
          ResultCode: 0,
          ResultDesc: "Success",
        },
      },
    },
    receivedAt: new Date(),
    environment: "dev",
  };

  console.log("🧪 Testing webhook delivery...");
  processor.processWebhook(mockWebhook);
  */
}
