import { Queue } from "bullmq";
import type { WebhookPayload } from "@daraja-toolkit/shared";
import {
  redisConnection,
  QUEUE_NAMES,
  JOB_TYPES,
  DEFAULT_JOB_OPTIONS,
  PRIORITY_LEVELS,
} from "../config/queue";

export class WebhookQueueService {
  private webhookQueue: Queue;

  constructor() {
    // Initialize the webhook delivery queue
    this.webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK_DELIVERY, {
      connection: redisConnection,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }

  /**
   * Queue webhook for delivery
   */
  async queueWebhook(webhookPayload: Partial<WebhookPayload>): Promise<void> {
    console.log(
      "📦 Queuing webhook:",
      webhookPayload.eventType,
      "for user:",
      webhookPayload.userId
    );

    // Add job to the queue
    const job = await this.webhookQueue.add(
      JOB_TYPES.DELIVER_WEBHOOK,
      {
        webhookPayload,
        targetUrl: "", // Will be looked up by the worker
        userId: webhookPayload.userId,
        eventType: webhookPayload.eventType,
      },
      {
        priority: PRIORITY_LEVELS.NORMAL,
        attempts: 3,
      }
    );

    console.log(`✅ Webhook queued with job ID: ${job.id}`);
  }

  /**
   * Get queue status (future enhancement)
   */
  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    failed: number;
  }> {
    // TODO: Implement queue monitoring
    return {
      pending: 0,
      processing: 0,
      failed: 0,
    };
  }

  /**
   * Retry failed webhooks (future enhancement)
   */
  async retryFailedWebhooks(userId?: string): Promise<void> {
    // TODO: Implement retry logic
    console.log(
      `Retrying failed webhooks${userId ? ` for user: ${userId}` : ""}`
    );
  }
}
