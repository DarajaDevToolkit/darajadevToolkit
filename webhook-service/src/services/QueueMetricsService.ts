import { Queue, QueueEvents } from "bullmq";
import { redisConnection, QUEUE_NAMES, PRIORITY_LEVELS } from "../config/queue";

export interface QueueMetrics {
  queue: {
    name: string;
    isPaused: boolean;
    counts: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      prioritized: number;
    };
  };
  performance: {
    throughput: {
      completedPerMinute: number;
      failedPerMinute: number;
      processedPerMinute: number;
    };
    averageProcessingTime: number;
    averageWaitTime: number;
  };
  workers: {
    active: number;
    idle: number;
    total: number;
  };
  redis: {
    connected: boolean;
    error?: string;
  };
  timestamp: Date;
}

export interface DetailedQueueStats {
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    prioritized?: number;
  };
  isPaused: boolean;
  memoryUsage: number;
  processingRate: number;
  failureRate: number;
  averageJobDuration: number;
  oldestJob?: {
    id: string;
    timestamp: Date;
    data: any;
  };
  recentFailures: Array<{
    jobId: string;
    error: string;
    timestamp: Date;
    attempts: number;
  }>;
}

export interface WorkerHealth {
  workerId: string;
  status: "active" | "idle" | "stalled" | "unknown";
  currentJob?: {
    id: string;
    name: string;
    startedAt: Date;
    progress: number;
  };
  processedJobs: number;
  failedJobs: number;
  lastActivity: Date;
}

export class QueueMetricsService {
  private webhookQueue: Queue;
  private queueEvents: QueueEvents;
  private metricsHistory: Map<string, any[]> = new Map();
  private readonly HISTORY_LIMIT = 100; // Keep last 100 metric points

  constructor() {
    this.webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK_DELIVERY, {
      connection: redisConnection,
    });

    this.queueEvents = new QueueEvents(QUEUE_NAMES.WEBHOOK_DELIVERY, {
      connection: redisConnection,
    });

    this.setupEventListeners();
  }

  /**
   * Get comprehensive queue metrics
   */
  async getQueueMetrics(): Promise<QueueMetrics> {
    try {
      const [counts, isPaused, workers] = await Promise.all([
        this.webhookQueue.getJobCounts(),
        this.webhookQueue.isPaused(),
        this.getWorkerStats(),
      ]);

      const performance = await this.getPerformanceMetrics();

      const metrics: QueueMetrics = {
        queue: {
          name: QUEUE_NAMES.WEBHOOK_DELIVERY,
          isPaused,
          counts: {
            waiting: counts.waiting || 0,
            active: counts.active || 0,
            completed: counts.completed || 0,
            failed: counts.failed || 0,
            delayed: counts.delayed || 0,
            prioritized: counts.prioritized || 0,
          },
        },
        performance,
        workers,
        redis: {
          connected: true,
        },
        timestamp: new Date(),
      };

      // Store metrics in history
      this.storeMetricsHistory("queue_metrics", metrics);

      return metrics;
    } catch (error: any) {
      console.error("❌ Failed to get queue metrics:", error);
      return {
        queue: {
          name: QUEUE_NAMES.WEBHOOK_DELIVERY,
          isPaused: false,
          counts: {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            prioritized: 0,
          },
        },
        performance: {
          throughput: {
            completedPerMinute: 0,
            failedPerMinute: 0,
            processedPerMinute: 0,
          },
          averageProcessingTime: 0,
          averageWaitTime: 0,
        },
        workers: {
          active: 0,
          idle: 0,
          total: 0,
        },
        redis: {
          connected: false,
          error: error.message,
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get detailed queue statistics
   */
  async getDetailedStats(): Promise<DetailedQueueStats> {
    const rawCounts = await this.webhookQueue.getJobCounts();
    const isPaused = await this.webhookQueue.isPaused();

    // Convert raw counts to expected format
    const counts = {
      waiting: rawCounts.waiting || 0,
      active: rawCounts.active || 0,
      completed: rawCounts.completed || 0,
      failed: rawCounts.failed || 0,
      delayed: rawCounts.delayed || 0,
      prioritized: rawCounts.prioritized || 0,
    };

    // Get recent jobs for analysis
    const [waiting, failed] = await Promise.all([
      this.webhookQueue.getWaiting(0, 0), // Get oldest waiting job
      this.webhookQueue.getFailed(0, 5), // Get 5 most recent failures
    ]);

    const recentFailures = failed.map((job) => ({
      jobId: job.id!,
      error: job.failedReason || "Unknown error",
      timestamp: new Date(job.processedOn || job.timestamp),
      attempts: job.attemptsMade,
    }));

    const oldestJob =
      waiting.length > 0
        ? {
            id: waiting[0].id!,
            timestamp: new Date(waiting[0].timestamp),
            data: waiting[0].data,
          }
        : undefined;

    // Calculate rates and averages
    const performance = await this.getPerformanceMetrics();

    return {
      counts,
      isPaused,
      memoryUsage: await this.getMemoryUsage(),
      processingRate: performance.throughput.processedPerMinute,
      failureRate: performance.throughput.failedPerMinute,
      averageJobDuration: performance.averageProcessingTime,
      oldestJob,
      recentFailures,
    };
  }

  /**
   * Get worker health information
   */
  async getWorkerHealth(): Promise<WorkerHealth[]> {
    // Note: BullMQ doesn't provide direct worker monitoring
    // This is a simplified implementation
    const activeJobs = await this.webhookQueue.getActive();

    // Group jobs by worker (simplified)
    const workerMap = new Map<string, any>();

    activeJobs.forEach((job) => {
      const workerId = job.opts?.jobId || "worker-1"; // Simplified worker ID
      if (!workerMap.has(workerId)) {
        workerMap.set(workerId, {
          workerId,
          status: "active" as const,
          currentJob: {
            id: job.id!,
            name: job.name,
            startedAt: new Date(job.processedOn || Date.now()),
            progress: job.progress || 0,
          },
          processedJobs: 0,
          failedJobs: 0,
          lastActivity: new Date(),
        });
      }
    });

    return Array.from(workerMap.values());
  }

  /**
   * Get performance metrics with historical data
   */
  private async getPerformanceMetrics(): Promise<QueueMetrics["performance"]> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    try {
      // Get completed and failed jobs from the last minute
      const [completed, failed] = await Promise.all([
        this.webhookQueue.getCompleted(0, -1),
        this.webhookQueue.getFailed(0, -1),
      ]);

      // Filter jobs from the last minute
      const recentCompleted = completed.filter(
        (job) => (job.finishedOn || job.timestamp) > oneMinuteAgo
      );
      const recentFailed = failed.filter(
        (job) => (job.finishedOn || job.timestamp) > oneMinuteAgo
      );

      // Calculate processing times
      const processingTimes = recentCompleted
        .map((job) => {
          const started = job.processedOn || job.timestamp;
          const finished = job.finishedOn || job.timestamp;
          return finished - started;
        })
        .filter((time) => time > 0);

      const averageProcessingTime =
        processingTimes.length > 0
          ? processingTimes.reduce((sum, time) => sum + time, 0) /
            processingTimes.length
          : 0;

      // Calculate wait times (simplified)
      const averageWaitTime = 0; // Would need more complex tracking

      return {
        throughput: {
          completedPerMinute: recentCompleted.length,
          failedPerMinute: recentFailed.length,
          processedPerMinute: recentCompleted.length + recentFailed.length,
        },
        averageProcessingTime,
        averageWaitTime,
      };
    } catch (error) {
      console.error("Failed to calculate performance metrics:", error);
      return {
        throughput: {
          completedPerMinute: 0,
          failedPerMinute: 0,
          processedPerMinute: 0,
        },
        averageProcessingTime: 0,
        averageWaitTime: 0,
      };
    }
  }

  /**
   * Get worker statistics
   */
  private async getWorkerStats(): Promise<QueueMetrics["workers"]> {
    try {
      const activeJobs = await this.webhookQueue.getActive();
      // Simplified worker counting - in real implementation,
      // you'd track actual worker instances
      return {
        active: activeJobs.length > 0 ? 1 : 0,
        idle: activeJobs.length === 0 ? 1 : 0,
        total: 1, // Simplified - you'd track actual worker count
      };
    } catch (error) {
      return {
        active: 0,
        idle: 0,
        total: 0,
      };
    }
  }

  /**
   * Get memory usage (simplified)
   */
  private async getMemoryUsage(): Promise<number> {
    // This is a simplified implementation
    // In production, you'd use Redis memory commands
    return process.memoryUsage().heapUsed;
  }

  /**
   * Store metrics in history for trend analysis
   */
  private storeMetricsHistory(key: string, data: any): void {
    if (!this.metricsHistory.has(key)) {
      this.metricsHistory.set(key, []);
    }

    const history = this.metricsHistory.get(key)!;
    history.push({
      timestamp: new Date(),
      data,
    });

    // Keep only recent history
    if (history.length > this.HISTORY_LIMIT) {
      history.shift();
    }
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(key: string, limit?: number): any[] {
    const history = this.metricsHistory.get(key) || [];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Queue management operations
   */
  async pauseQueue(): Promise<void> {
    await this.webhookQueue.pause();
    console.log("📄 Queue paused");
  }

  async resumeQueue(): Promise<void> {
    await this.webhookQueue.resume();
    console.log("▶️ Queue resumed");
  }

  async clearQueue(
    type: "waiting" | "completed" | "failed" | "all" = "all"
  ): Promise<number> {
    let count = 0;

    try {
      switch (type) {
        case "waiting":
          // Use 'wait' instead of 'waiting' and get length of returned array
          const waitingJobs = await this.webhookQueue.clean(0, 0, "wait");
          count = waitingJobs.length;
          break;
        case "completed":
          const completedJobs = await this.webhookQueue.clean(
            0,
            0,
            "completed"
          );
          count = completedJobs.length;
          break;
        case "failed":
          const failedJobs = await this.webhookQueue.clean(0, 0, "failed");
          count = failedJobs.length;
          break;
        case "all":
          const [waiting, completed, failed] = await Promise.all([
            this.webhookQueue.clean(0, 0, "wait"),
            this.webhookQueue.clean(0, 0, "completed"),
            this.webhookQueue.clean(0, 0, "failed"),
          ]);
          count = waiting.length + completed.length + failed.length;
          break;
      }

      console.log(`🧹 Cleared ${count} jobs from queue (${type})`);
      return count;
    } catch (error) {
      console.error(`Failed to clear queue (${type}):`, error);
      return 0;
    }
  }

  /**
   * Setup event listeners for real-time metrics
   */
  private setupEventListeners(): void {
    this.queueEvents.on("completed", (jobId) => {
      console.log(`📊 Job ${jobId} completed`);
    });

    this.queueEvents.on("failed", (jobId, err) => {
      console.log(`📊 Job ${jobId} failed:`, err);
    });

    this.queueEvents.on("stalled", (jobId) => {
      console.log(`📊 Job ${jobId} stalled`);
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.queueEvents.close();
    await this.webhookQueue.close();
  }
}
