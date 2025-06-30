// Queue-related types for BullMQ jobs

import type { WebhookPayload, WebhookEventType } from "./webhook";

// Job data structure for webhook delivery
export interface WebhookDeliveryJobData {
  webhookPayload: Partial<WebhookPayload>;
  targetUrl: string;
  userId?: string;
  eventType?: WebhookEventType;
}

// Job priority levels
export type JobPriority = 1 | 5 | 10 | 20; // LOW | NORMAL | HIGH | URGENT

// Queue status information
export interface QueueStatus {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}

// Queue health check
export interface QueueHealth {
  status: "healthy" | "unhealthy";
  waiting: number;
  active: number;
  failed: number;
  redis: {
    connected: boolean;
    error?: string;
  };
}

// Job result after processing
export interface JobResult {
  jobId: string | number;
  attempts: number;
  status: "delivered" | "failed" | "dead_letter";
}
