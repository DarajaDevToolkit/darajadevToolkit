import { Queue, QueueEvents } from "bullmq";
import type { WebhookPayload } from "@daraja-toolkit/shared";
import {
  redisConnection,
  QUEUE_NAMES,
  JOB_TYPES,
  DEFAULT_JOB_OPTIONS,
  PRIORITY_LEVELS,
  QUEUE_CONFIG,
} from "../config/queue";

export class WebhookQueueService {
  private webhookQueue: Queue;
  private queueEvents: QueueEvents;

  constructor() {
    // Initialize the webhook delivery queue with advanced configuration
    this.webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK_DELIVERY, {
      connection: redisConnection,
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
      },
    });

    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents(QUEUE_NAMES.WEBHOOK_DELIVERY, {
      connection: redisConnection,
    });

    // Set up queue event listeners for better monitoring
    this.setupQueueEventListeners();
  }

  /**
   * Queue webhook for delivery
   */
  async queueWebhook(webhookPayload: Partial<WebhookPayload>): Promise<void> {
    return this.queueWebhookWithPriority(
      webhookPayload,
      PRIORITY_LEVELS.NORMAL
    );
  }

  /**
   * Queue webhook for delivery with specific priority
   */
  async queueWebhookWithPriority(
    webhookPayload: Partial<WebhookPayload>,
    priority: number = PRIORITY_LEVELS.NORMAL
  ): Promise<void> {
    const priorityName = this.getPriorityName(priority);

    console.log(
      `📦 Queuing webhook (${priorityName}):`,
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
        priority,
        attempts: 3,
      }
    );

    console.log(
      `✅ Webhook queued with job ID: ${job.id} (Priority: ${priorityName})`
    );
  }

  /**
   * Get priority name for logging
   */
  private getPriorityName(priority: number): string {
    switch (priority) {
      case PRIORITY_LEVELS.LOW:
        return "LOW";
      case PRIORITY_LEVELS.NORMAL:
        return "NORMAL";
      case PRIORITY_LEVELS.HIGH:
        return "HIGH";
      case PRIORITY_LEVELS.URGENT:
        return "URGENT";
      default:
        return `CUSTOM(${priority})`;
    }
  }

  /**
   * Get queue status (real implementation)
   */
  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  }> {
    try {
      const waiting = await this.webhookQueue.getWaiting();
      const active = await this.webhookQueue.getActive();
      const failed = await this.webhookQueue.getFailed();
      const completed = await this.webhookQueue.getCompleted();

      return {
        pending: waiting.length,
        processing: active.length,
        failed: failed.length,
        completed: completed.length,
      };
    } catch (error) {
      console.error("❌ Failed to get queue status:", error);
      throw error;
    }
  }

  /**
   * Get queue health information
   */
  async getQueueHealth(): Promise<{
    status: "healthy" | "unhealthy";
    queue: {
      name: string;
      waiting: number;
      active: number;
      failed: number;
      completed: number;
    };
    redis: {
      connected: boolean;
      error?: string;
    };
  }> {
    try {
      // Test Redis connection by getting queue status
      const queueStatus = await this.getQueueStatus();

      return {
        status: "healthy",
        queue: {
          name: "webhook-delivery",
          waiting: queueStatus.pending,
          active: queueStatus.processing,
          failed: queueStatus.failed,
          completed: queueStatus.completed,
        },
        redis: {
          connected: true,
        },
      };
    } catch (error: any) {
      return {
        status: "unhealthy",
        queue: {
          name: "webhook-delivery",
          waiting: 0,
          active: 0,
          failed: 0,
          completed: 0,
        },
        redis: {
          connected: false,
          error: error.message,
        },
      };
    }
  }

  /**
   * Set up queue event listeners for monitoring
   */
  private setupQueueEventListeners(): void {
    console.log("🔧 Setting up queue event listeners...");

    this.queueEvents.on("completed", ({ jobId }) => {
      console.log(`✅ Webhook job ${jobId} completed successfully`);
    });

    this.queueEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(`❌ Webhook job ${jobId} failed:`, failedReason);
    });

    this.queueEvents.on("stalled", ({ jobId }) => {
      console.warn(`⚠️  Webhook job ${jobId} stalled`);
    });

    this.queueEvents.on("progress", ({ jobId, data }) => {
      console.log(`🔄 Webhook job ${jobId} progress: ${data}%`);
    });

    this.queueEvents.on("waiting", ({ jobId }) => {
      console.log(`⏳ Webhook job ${jobId} is waiting`);
    });

    this.queueEvents.on("active", ({ jobId }) => {
      console.log(`🚀 Webhook job ${jobId} is active`);
    });

    this.queueEvents.on("removed", ({ jobId }) => {
      console.log(`🗑️  Webhook job ${jobId} was removed`);
    });

    this.queueEvents.on("error", (err) => {
      console.error("🚨 Queue error:", err);
    });

    console.log("✅ Queue event listeners set up successfully");
  }

  /**
   * Add advanced job options with deduplication
   */
  async queueWebhookWithOptions(
    webhookPayload: Partial<WebhookPayload>,
    options: {
      priority?: number;
      delay?: number;
      attempts?: number;
      deduplicationKey?: string;
      timeout?: number;
    } = {}
  ): Promise<void> {
    const priorityName = this.getPriorityName(
      options.priority || PRIORITY_LEVELS.NORMAL
    );

    console.log(
      `📦 Queuing webhook with advanced options (${priorityName}):`,
      webhookPayload.eventType,
      "for user:",
      webhookPayload.userId
    );

    // Create job options with deduplication
    const jobOptions = {
      priority: options.priority || PRIORITY_LEVELS.NORMAL,
      attempts: options.attempts || 3,
      delay: options.delay || 0,
      timeout: options.timeout || QUEUE_CONFIG.capacity.maxConcurrency * 1000,
      // Add deduplication if key provided
      ...(options.deduplicationKey && {
        jobId: `webhook_${options.deduplicationKey}`,
      }),
    };

    // Add job to the queue
    const job = await this.webhookQueue.add(
      JOB_TYPES.DELIVER_WEBHOOK,
      {
        webhookPayload,
        targetUrl: "", // Will be looked up by the worker
        userId: webhookPayload.userId,
        eventType: webhookPayload.eventType,
      },
      jobOptions
    );

    console.log(
      `✅ Webhook queued with job ID: ${job.id} (Priority: ${priorityName})`
    );
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log("🛑 Cleaning up WebhookQueueService...");
    await this.queueEvents.close();
    await this.webhookQueue.close();
  }

  /**
   * Get the webhook queue instance (for subclasses)
   */
  protected getWebhookQueue(): Queue {
    return this.webhookQueue;
  }
}
