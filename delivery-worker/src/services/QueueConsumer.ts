import { Worker, Job } from "bullmq";
import type { WebhookPayload } from "@daraja-toolkit/shared";
import { WebhookDeliveryService } from "../worker";
import type { UserRetrySettingsAPI } from "../worker";

// Webhook service API client
class WebhookServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3001") {
    this.baseUrl = baseUrl;
  }

  async getUserWebhookUrl(
    userId: string,
    environment: string = "dev"
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/user/${userId}/webhook-url/${environment}`
      );
      if (!response.ok) {
        console.warn(
          `Failed to get webhook URL for user ${userId}: ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      return data.success ? data.data.webhookUrl : null;
    } catch (error) {
      console.error(`Error fetching webhook URL for user ${userId}:`, error);
      return null;
    }
  }

  async getUserRetrySettings(
    userId: string,
    environment: string = "dev"
  ): Promise<UserRetrySettingsAPI | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/user/${userId}/retry-settings/${environment}`
      );
      if (!response.ok) {
        console.warn(
          `Failed to get retry settings for user ${userId}: ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error(`Error fetching retry settings for user ${userId}:`, error);
      return null;
    }
  }
}

// Queue configuration (should match webhook-service config). If you are curious why I redefined is because BullMq requires that maxRetriesPerRequest for Workers, which is not the default in the shared config.
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  maxRetriesPerRequest: null, // This here
};

const QUEUE_NAMES = {
  WEBHOOK_DELIVERY: "webhook-delivery",
} as const;

// Job data structure
interface WebhookDeliveryJobData {
  webhookPayload: Partial<WebhookPayload>;
  targetUrl: string;
  userId?: string;
  eventType?: string;
}

export class QueueConsumer {
  private worker: Worker;
  private deliveryService: WebhookDeliveryService;
  private webhookServiceClient: WebhookServiceClient;

  constructor() {
    console.log("🔧 Initializing QueueConsumer...");
    console.log("🔧 Redis config:", redisConnection);

    this.deliveryService = new WebhookDeliveryService();
    this.webhookServiceClient = new WebhookServiceClient();
    console.log("🔧 WebhookDeliveryService and API client created");

    // Create BullMQ worker
    this.worker = new Worker(
      QUEUE_NAMES.WEBHOOK_DELIVERY,
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: 5, // Process up to 5 jobs concurrently
      }
    );
    console.log("🔧 BullMQ Worker created");

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Process a job from the queue
   */
  private async processJob(job: Job<WebhookDeliveryJobData>) {
    console.log(`🔄 Processing job ${job.id}:`, job.data.eventType);

    const { webhookPayload, userId } = job.data;
    const userIdToUse = userId || webhookPayload.userId || "";
    const environment = webhookPayload.environment || "dev";

    // Look up user's webhook URL
    const targetUrl = await this.getUserWebhookUrl(userIdToUse, environment);

    if (!targetUrl) {
      throw new Error(`No webhook URL configured for user ${userIdToUse}`);
    }

    // Fetch user-specific retry settings
    const userRetrySettings =
      await this.webhookServiceClient.getUserRetrySettings(
        userIdToUse,
        environment
      );

    if (userRetrySettings) {
      console.log(`⚙️  Using custom retry settings for user ${userIdToUse}:`, {
        maxRetries: userRetrySettings.maxRetries,
        initialDelay: userRetrySettings.initialDelayMs,
        maxDelay: userRetrySettings.maxDelayMs,
        backoffStrategy: userRetrySettings.backoffStrategy,
      });
    } else {
      console.log(`⚙️  Using default retry settings for user ${userIdToUse}`);
    }

    // Create full webhook payload for delivery
    const fullWebhookPayload: WebhookPayload = {
      id: webhookPayload.id || `webhook_${Date.now()}`,
      userId: userIdToUse,
      eventType: webhookPayload.eventType || "stk_push_result",
      payload: webhookPayload.payload as any, // Type assertion for now
      receivedAt:
        webhookPayload.receivedAt instanceof Date
          ? webhookPayload.receivedAt
          : webhookPayload.receivedAt
            ? new Date(webhookPayload.receivedAt as string | number)
            : new Date(),
      environment: environment,
    };

    // Deliver the webhook with retries (using user settings if available)
    const attempts = await this.deliveryService.deliverWithRetries(
      fullWebhookPayload,
      targetUrl,
      userRetrySettings || undefined // Pass user settings or undefined for defaults
    );

    console.log(
      `📊 Job ${job.id} completed. Total attempts: ${attempts.length}`
    );

    return {
      jobId: job.id,
      attempts: attempts.length,
      status: attempts[attempts.length - 1]?.status,
    };
  }

  /**
   * Get user's webhook URL from the webhook service API
   */
  private async getUserWebhookUrl(
    userId: string,
    environment: string
  ): Promise<string | null> {
    // Use the API client to fetch webhook URL from the webhook service
    const webhookUrl = await this.webhookServiceClient.getUserWebhookUrl(
      userId,
      environment
    );

    if (webhookUrl) {
      console.log(
        `📡 Retrieved webhook URL for user ${userId} in ${environment}: ${webhookUrl}`
      );
      return webhookUrl;
    }

    // Fallback to test URLs for specific test patterns (for testing/development)
    if (environment === "dev") {
      // Check if this is a test user that should get different URLs for testing
      if (userId.includes("test_user_dlq") || userId.includes("timeout")) {
        const testUrl = `http://httpstat.us/500?sleep=30000`; // Timeout URL for testing
        console.log(`🧪 Using test timeout URL for ${userId}: ${testUrl}`);
        return testUrl;
      }

      if (userId.includes("client_error")) {
        const testUrl = `http://httpstat.us/400`; // Client error for testing
        console.log(`🧪 Using test client error URL for ${userId}: ${testUrl}`);
        return testUrl;
      }

      if (userId.includes("server_error")) {
        const testUrl = `http://httpstat.us/500`; // Server error for testing
        console.log(`🧪 Using test server error URL for ${userId}: ${testUrl}`);
        return testUrl;
      }

      // Default working URL for dev (fallback)
      const fallbackUrl = `http://localhost:3002/webhooks/mpesa`;
      console.log(
        `🔄 Using fallback webhook URL for ${userId}: ${fallbackUrl}`
      );
      return fallbackUrl;
    }

    console.warn(
      `⚠️  No webhook URL configured for user ${userId} in ${environment}`
    );
    return null;
  }

  /**
   * Set up event listeners for monitoring
   */
  private setupEventListeners() {
    console.log("🔧 Setting up event listeners...");

    this.worker.on("ready", () => {
      console.log("🎯 Queue consumer ready!");
    });

    this.worker.on("completed", (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    this.worker.on("error", (err) => {
      console.error("🚨 Worker error:", err);
    });

    this.worker.on("stalled", (jobId) => {
      console.warn(`⚠️  Job ${jobId} stalled`);
    });

    console.log("🎯 Queue consumer started and listening for jobs...");
  }

  /**
   * Gracefully shutdown the worker
   */
  async shutdown() {
    console.log("🛑 Shutting down queue consumer...");
    await this.worker.close();
  }
}
