import { Queue, QueueEvents, Worker, Job } from "bullmq";
import type { WebhookPayload } from "@daraja-toolkit/shared";
import {
  redisConnection,
  QUEUE_NAMES,
  JOB_TYPES,
  ERROR_CATEGORIES,
  RETRY_STRATEGIES,
  DLQ_CONFIG,
  PRIORITY_LEVELS,
} from "../config/queue";

// Dead Letter Queue Job Data
export interface DLQJobData {
  originalJob: {
    id: string;
    data: any;
    attempts: number;
    failedReason: string;
    processedOn?: number;
    finishedOn?: number;
  };
  failureHistory: Array<{
    attemptNumber: number;
    failedAt: Date;
    error: string;
    errorCategory: string;
    duration: number;
  }>;
  metadata: {
    userId: string;
    eventType: string;
    originalQueuedAt: Date;
    movedToDLQAt: Date;
    totalAttempts: number;
    lastErrorCategory: string;
  };
}

// DLQ Statistics
export interface DLQStats {
  totalJobs: number;
  jobsByErrorCategory: Record<string, number>;
  jobsByUser: Record<string, number>;
  oldestJob?: {
    id: string;
    age: number;
    errorCategory: string;
  };
  recentlyAdded: Array<{
    id: string;
    addedAt: Date;
    errorCategory: string;
    userId: string;
  }>;
}

export class DeadLetterQueueService {
  private dlqQueue: Queue;
  private dlqEvents: QueueEvents;
  private dlqWorker: Worker;
  private retryQueue: Queue;

  constructor() {
    // Initialize Dead Letter Queue
    this.dlqQueue = new Queue(QUEUE_NAMES.WEBHOOK_DEAD_LETTER, {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: DLQ_CONFIG.retention.maxJobs,
        removeOnFail: 50,
      },
    });

    // Initialize Retry Queue for manual retries
    this.retryQueue = new Queue(QUEUE_NAMES.WEBHOOK_RETRY, {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 1, // Manual retries get one attempt
      },
    });

    // Initialize DLQ Events
    this.dlqEvents = new QueueEvents(QUEUE_NAMES.WEBHOOK_DEAD_LETTER, {
      connection: redisConnection,
    });

    // Initialize DLQ Worker for processing
    this.dlqWorker = new Worker(
      QUEUE_NAMES.WEBHOOK_DEAD_LETTER,
      this.processDLQJob.bind(this),
      {
        connection: redisConnection,
        concurrency: 2, // Process DLQ jobs slowly
      }
    );

    this.setupEventListeners();
  }

  /**
   * Move a failed job to Dead Letter Queue
   */
  async moveToDLQ(
    originalJob: Job,
    failureHistory: DLQJobData["failureHistory"],
    errorCategory: string
  ): Promise<void> {
    console.log(
      `💀 Moving job ${originalJob.id} to Dead Letter Queue (${errorCategory})`
    );

    const dlqJobData: DLQJobData = {
      originalJob: {
        id: originalJob.id!,
        data: originalJob.data,
        attempts: originalJob.attemptsMade,
        failedReason: originalJob.failedReason || "Unknown failure",
        processedOn: originalJob.processedOn,
        finishedOn: originalJob.finishedOn,
      },
      failureHistory,
      metadata: {
        userId: originalJob.data.userId || "unknown",
        eventType: originalJob.data.eventType || "unknown",
        originalQueuedAt: new Date(originalJob.timestamp),
        movedToDLQAt: new Date(),
        totalAttempts: failureHistory.length,
        lastErrorCategory: errorCategory,
      },
    };

    await this.dlqQueue.add(JOB_TYPES.DEAD_LETTER_WEBHOOK, dlqJobData, {
      priority: PRIORITY_LEVELS.LOW, // DLQ jobs have low priority
      jobId: `dlq_${originalJob.id}_${Date.now()}`,
    });

    console.log(`✅ Job ${originalJob.id} moved to DLQ successfully`);
  }

  /**
   * Get DLQ statistics
   */
  async getDLQStats(): Promise<DLQStats> {
    const dlqJobs = await this.dlqQueue.getJobs(
      ["waiting", "completed", "failed"],
      0,
      -1
    );

    const stats: DLQStats = {
      totalJobs: dlqJobs.length,
      jobsByErrorCategory: {},
      jobsByUser: {},
      recentlyAdded: [],
    };

    let oldestJob: DLQStats["oldestJob"];
    let oldestTimestamp = Date.now();

    dlqJobs.forEach((job) => {
      const data = job.data as DLQJobData;

      // Count by error category
      const errorCategory = data.metadata.lastErrorCategory;
      stats.jobsByErrorCategory[errorCategory] =
        (stats.jobsByErrorCategory[errorCategory] || 0) + 1;

      // Count by user
      const userId = data.metadata.userId;
      stats.jobsByUser[userId] = (stats.jobsByUser[userId] || 0) + 1;

      // Track oldest job
      const movedToDLQ = data.metadata.movedToDLQAt;
      const jobTimestamp =
        movedToDLQ instanceof Date
          ? movedToDLQ.getTime()
          : new Date(movedToDLQ).getTime();
      if (jobTimestamp < oldestTimestamp) {
        oldestTimestamp = jobTimestamp;
        oldestJob = {
          id: job.id!,
          age: Date.now() - jobTimestamp,
          errorCategory,
        };
      }

      // Collect recent additions (last 10)
      if (stats.recentlyAdded.length < 10) {
        const addedAt =
          movedToDLQ instanceof Date ? movedToDLQ : new Date(movedToDLQ);
        stats.recentlyAdded.push({
          id: job.id!,
          addedAt,
          errorCategory,
          userId,
        });
      }
    });

    // Sort recent additions by date
    stats.recentlyAdded.sort(
      (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
    );
    stats.oldestJob = oldestJob;

    return stats;
  }

  /**
   * Get DLQ jobs with filtering
   */
  async getDLQJobs(
    options: {
      limit?: number;
      offset?: number;
      errorCategory?: string;
      userId?: string;
    } = {}
  ): Promise<Array<{ id: string; data: DLQJobData; addedAt: Date }>> {
    const { limit = 50, offset = 0, errorCategory, userId } = options;

    const dlqJobs = await this.dlqQueue.getJobs(
      ["waiting", "completed", "failed"],
      0,
      -1
    );

    let filteredJobs = dlqJobs.map((job) => {
      const data = job.data as DLQJobData;
      const addedAt =
        data.metadata.movedToDLQAt instanceof Date
          ? data.metadata.movedToDLQAt
          : new Date(data.metadata.movedToDLQAt);

      return {
        id: job.id!,
        data,
        addedAt,
      };
    });

    // Apply filters
    if (errorCategory) {
      filteredJobs = filteredJobs.filter(
        (job) => job.data.metadata.lastErrorCategory === errorCategory
      );
    }

    if (userId) {
      filteredJobs = filteredJobs.filter(
        (job) => job.data.metadata.userId === userId
      );
    }

    // Sort by newest first and apply pagination
    filteredJobs.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

    return filteredJobs.slice(offset, offset + limit);
  }

  /**
   * Manually retry a job from DLQ
   */
  async retryFromDLQ(
    dlqJobId: string
  ): Promise<{ success: boolean; newJobId?: string; error?: string }> {
    try {
      const dlqJob = await this.dlqQueue.getJob(dlqJobId);

      if (!dlqJob) {
        return { success: false, error: "DLQ job not found" };
      }

      const dlqData = dlqJob.data as DLQJobData;

      console.log(`🔄 Manually retrying job ${dlqJobId} from DLQ`);

      // Add original job data to retry queue
      const retryJob = await this.retryQueue.add(
        JOB_TYPES.RETRY_WEBHOOK,
        {
          ...dlqData.originalJob.data,
          retryFromDLQ: true,
          originalDLQJobId: dlqJobId,
          retryAttempt: dlqData.metadata.totalAttempts + 1,
        },
        {
          priority: PRIORITY_LEVELS.HIGH, // Manual retries get high priority
        }
      );

      // Remove from DLQ
      await dlqJob.remove();

      console.log(`✅ Job ${dlqJobId} queued for retry as ${retryJob.id}`);

      return { success: true, newJobId: retryJob.id };
    } catch (error: any) {
      console.error(`❌ Failed to retry job ${dlqJobId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk retry jobs from DLQ
   */
  async bulkRetryFromDLQ(dlqJobIds: string[]): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const jobId of dlqJobIds) {
      const result = await this.retryFromDLQ(jobId);
      if (result.success) {
        successful.push(jobId);
      } else {
        failed.push({ id: jobId, error: result.error || "Unknown error" });
      }
    }

    return { successful, failed };
  }

  /**
   * Clear old DLQ jobs
   */
  async clearOldDLQJobs(
    olderThanMs: number = DLQ_CONFIG.retention.maxAge
  ): Promise<number> {
    const cutoffTime = Date.now() - olderThanMs;
    const dlqJobs = await this.dlqQueue.getJobs(
      ["waiting", "completed", "failed"],
      0,
      -1
    );

    let clearedCount = 0;

    for (const job of dlqJobs) {
      const data = job.data as DLQJobData;
      if (data.metadata.movedToDLQAt.getTime() < cutoffTime) {
        await job.remove();
        clearedCount++;
      }
    }

    console.log(`🧹 Cleared ${clearedCount} old DLQ jobs`);
    return clearedCount;
  }

  /**
   * Process DLQ jobs (for monitoring and maintenance)
   */
  private async processDLQJob(job: Job<DLQJobData>): Promise<void> {
    const dlqData = job.data;

    console.log(`🔍 Processing DLQ job ${job.id}:`, {
      originalJobId: dlqData.originalJob.id,
      errorCategory: dlqData.metadata.lastErrorCategory,
      totalAttempts: dlqData.metadata.totalAttempts,
      userId: dlqData.metadata.userId,
    });

    // This is mainly for logging and monitoring
    // The job will be marked as completed but stays in DLQ for manual processing
  }

  /**
   * Categorize error for intelligent retry logic
   */
  static categorizeError(error: any, responseCode?: number): string {
    if (responseCode) {
      if (responseCode >= 400 && responseCode < 500) {
        if (responseCode === 401 || responseCode === 403) {
          return ERROR_CATEGORIES.AUTHENTICATION;
        }
        if (responseCode === 429) {
          return ERROR_CATEGORIES.RATE_LIMIT;
        }
        return ERROR_CATEGORIES.CLIENT_ERROR;
      }
      if (responseCode >= 500) {
        return ERROR_CATEGORIES.SERVER_ERROR;
      }
    }

    const errorMessage = error?.message?.toLowerCase() || "";

    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("timed out")
    ) {
      return ERROR_CATEGORIES.TIMEOUT;
    }

    if (
      errorMessage.includes("network") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("enotfound")
    ) {
      return ERROR_CATEGORIES.NETWORK;
    }

    return ERROR_CATEGORIES.UNKNOWN;
  }

  /**
   * Get retry strategy for error category
   */
  static getRetryStrategy(
    errorCategory: string
  ): (typeof RETRY_STRATEGIES)[keyof typeof RETRY_STRATEGIES] {
    return (
      RETRY_STRATEGIES[errorCategory as keyof typeof RETRY_STRATEGIES] ||
      RETRY_STRATEGIES[ERROR_CATEGORIES.UNKNOWN]
    );
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.dlqEvents.on("completed", ({ jobId }) => {
      console.log(`📊 DLQ job ${jobId} processed`);
    });

    this.dlqEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(`❌ DLQ job ${jobId} failed processing:`, failedReason);
    });

    this.dlqWorker.on("error", (err) => {
      console.error("🚨 DLQ Worker error:", err);
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log("🛑 Cleaning up Dead Letter Queue Service...");
    await this.dlqWorker.close();
    await this.dlqEvents.close();
    await this.dlqQueue.close();
    await this.retryQueue.close();
  }
}
