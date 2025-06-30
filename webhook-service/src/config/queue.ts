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
  WEBHOOK_DEAD_LETTER: "webhook-dead-letter",
  WEBHOOK_RETRY: "webhook-retry",
} as const;

// Job types
export const JOB_TYPES = {
  DELIVER_WEBHOOK: "deliver_webhook",
  DEAD_LETTER_WEBHOOK: "dead_letter_webhook",
  RETRY_WEBHOOK: "retry_webhook",
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

// Error categories for intelligent retry logic
export const ERROR_CATEGORIES = {
  NETWORK: "network",
  TIMEOUT: "timeout",
  CLIENT_ERROR: "client_error", // 4xx
  SERVER_ERROR: "server_error", // 5xx
  AUTHENTICATION: "authentication",
  RATE_LIMIT: "rate_limit",
  UNKNOWN: "unknown",
} as const;

// Retry strategies per error type
export const RETRY_STRATEGIES = {
  [ERROR_CATEGORIES.NETWORK]: {
    shouldRetry: true,
    maxRetries: 5,
    backoffMultiplier: 2,
    initialDelay: 1000,
  },
  [ERROR_CATEGORIES.TIMEOUT]: {
    shouldRetry: true,
    maxRetries: 3,
    backoffMultiplier: 1.5,
    initialDelay: 2000,
  },
  [ERROR_CATEGORIES.CLIENT_ERROR]: {
    shouldRetry: false,
    maxRetries: 0,
    backoffMultiplier: 1,
    initialDelay: 0,
  },
  [ERROR_CATEGORIES.SERVER_ERROR]: {
    shouldRetry: true,
    maxRetries: 4,
    backoffMultiplier: 2,
    initialDelay: 1500,
  },
  [ERROR_CATEGORIES.AUTHENTICATION]: {
    shouldRetry: false,
    maxRetries: 0,
    backoffMultiplier: 1,
    initialDelay: 0,
  },
  [ERROR_CATEGORIES.RATE_LIMIT]: {
    shouldRetry: true,
    maxRetries: 3,
    backoffMultiplier: 3,
    initialDelay: 5000,
  },
  [ERROR_CATEGORIES.UNKNOWN]: {
    shouldRetry: true,
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 2000,
  },
} as const;

// DLQ Configuration
export const DLQ_CONFIG = {
  // After this many total failures across all retry attempts, move to DLQ
  maxTotalFailures: 5,

  // DLQ retention settings
  retention: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxJobs: 1000, // Keep last 1000 failed jobs
  },

  // DLQ processing settings
  processing: {
    batchSize: 10, // Process 10 DLQ items at a time
    processingInterval: 60000, // Check DLQ every minute
  },
};
