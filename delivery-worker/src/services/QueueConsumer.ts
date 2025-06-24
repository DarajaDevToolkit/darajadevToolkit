import { Worker, Job } from "bullmq";
import type { WebhookPayload } from "@daraja-toolkit/shared";
import { WebhookDeliveryService } from "../worker";

// Queue configuration (should match webhook-service config)
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
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

  constructor() {
    this.deliveryService = new WebhookDeliveryService();

    // Create BullMQ worker
    this.worker = new Worker(
      QUEUE_NAMES.WEBHOOK_DELIVERY,
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: 5, // Process up to 5 jobs concurrently
      }
    );

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Process a job from the queue
   */
  private async processJob(job: Job<WebhookDeliveryJobData>) {
    console.log(`🔄 Processing job ${job.id}:`, job.data.eventType);

    const { webhookPayload, userId } = job.data;

    // Look up user's webhook URL
    const targetUrl = await this.getUserWebhookUrl(
      userId || webhookPayload.userId || "",
      webhookPayload.environment || "dev"
    );

    if (!targetUrl) {
      throw new Error(`No webhook URL configured for user ${userId}`);
    }

    // Create full webhook payload for delivery
    const fullWebhookPayload: WebhookPayload = {
      id: webhookPayload.id || `webhook_${Date.now()}`,
      userId: userId || webhookPayload.userId || "",
      eventType: webhookPayload.eventType || "stk_push_result",
      payload: webhookPayload.payload || {},
      receivedAt: webhookPayload.receivedAt || new Date(),
      environment: webhookPayload.environment || "dev",
    };

    // Deliver the webhook with retries
    const attempts = await this.deliveryService.deliverWithRetries(
      fullWebhookPayload,
      targetUrl
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
   * Get user's webhook URL from database
   */
  private async getUserWebhookUrl(
    userId: string,
    environment: string
  ): Promise<string | null> {
    // TODO: Implement database lookup
    // For now, return a mock URL for testing
    if (environment === "dev") {
      return `http://localhost:3000/webhooks/mpesa`;
    }

    console.warn(
      `No webhook URL configured for user ${userId} in ${environment}`
    );
    return null;
  }

  /**
   * Set up event listeners for monitoring
   */
  private setupEventListeners() {
    this.worker.on("completed", (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    this.worker.on("error", (err) => {
      console.error("🚨 Worker error:", err);
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
