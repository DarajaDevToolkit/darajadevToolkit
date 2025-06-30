// Queue configuration for BullMQ
import type { ConnectionOptions } from "bullmq";

// Redis connection configuration
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
};

// Queue names
export const QUEUE_NAMES = {
  WEBHOOK_DELIVERY: "webhook-delivery",
} as const;

// Job types
export const JOB_TYPES = {
  DELIVER_WEBHOOK: "deliver_webhook",
} as const;

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 20,
} as const;

// Default job options
export const DEFAULT_JOB_OPTIONS = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
  attempts: 3, // Retry up to 3 times
  backoff: {
    type: "exponential" as const,
    delay: 2000, // Start with 2 second delay
  },
  // Advanced job options
  delay: 0, // No initial delay
  priority: PRIORITY_LEVELS.NORMAL,

  // Job TTL and lifecycle options
  jobId: undefined, // Auto-generate job IDs
  repeat: undefined, // No repeat by default

  // Timeout settings
  timeout: 30000, // 30 seconds timeout per job
};

// Advanced queue configuration
export const QUEUE_CONFIG = {
  // Job deduplication settings
  deduplication: {
    enabled: true,
    ttl: 60000, // 1 minute deduplication window
  },

  // Queue event settings
  events: {
    maxListeners: 100,
  },

  // Queue capacity limits
  capacity: {
    maxJobs: 10000, // Maximum jobs in queue
    maxConcurrency: 10, // Maximum concurrent job processing
  },

  // Queue maintenance
  maintenance: {
    cleanInterval: 300000, // Clean old jobs every 5 minutes
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 1, // Max times a job can be stalled
  },
};
