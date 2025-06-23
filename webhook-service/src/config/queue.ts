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

// Default job options
export const DEFAULT_JOB_OPTIONS = {
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
  attempts: 3, // Retry up to 3 times
  backoff: {
    type: "exponential" as const,
    delay: 2000, // Start with 2 second delay
  },
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 20,
} as const;
