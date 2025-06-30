import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  apiKey: varchar("api_key", { length: 64 }).unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  lastLoginAt: timestamp("last_login_at"),
});

// User-specific retry and webhook configuration settings
export const userRetrySettings = pgTable("user_retry_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  environment: varchar("environment", { length: 20 }).notNull().default("dev"), // 'dev', 'staging', 'production'
  maxRetries: integer("max_retries").notNull().default(3),
  retryDelayMs: integer("retry_delay_ms").notNull().default(2000),
  timeoutMs: integer("timeout_ms").notNull().default(25000),
  enableCircuitBreaker: boolean("enable_circuit_breaker").default(false),
  circuitBreakerThreshold: integer("circuit_breaker_threshold").default(5),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // e.g., 'payment_received', 'payment_request'
  secret: varchar("secret", { length: 64 }),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Enhanced delivery attempts with comprehensive tracking
export const deliveryAttempts = pgTable("delivery_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  webhookId: uuid("webhook_id").references(() => webhooks.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  queueJobId: varchar("queue_job_id", { length: 255 }), // BullMQ job ID
  payload: jsonb("payload").notNull(),
  targetUrl: text("target_url").notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  responseHeaders: jsonb("response_headers"),
  success: boolean("success").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  errorMessage: text("error_message"),
  errorCategory: varchar("error_category", { length: 50 }), // 'network', 'timeout', 'client_error', etc.
  duration: integer("duration"), // Duration in milliseconds
  retryable: boolean("retryable").default(true),
  nextRetryAt: timestamp("next_retry_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Persistent retry history for analytics and audit
export const retryHistory = pgTable("retry_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  webhookId: uuid("webhook_id").references(() => webhooks.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  originalJobId: varchar("original_job_id", { length: 255 }).notNull(),
  totalAttempts: integer("total_attempts").notNull(),
  finalStatus: varchar("final_status", { length: 20 }).notNull(), // 'delivered', 'failed', 'moved_to_dlq'
  firstAttemptAt: timestamp("first_attempt_at").notNull(),
  lastAttemptAt: timestamp("last_attempt_at").notNull(),
  totalDuration: integer("total_duration"), // Total time from first to last attempt in ms
  failureCategories: jsonb("failure_categories"), // Array of error categories encountered
  retryPattern: jsonb("retry_pattern"), // Retry delays used
  dlqJobId: varchar("dlq_job_id", { length: 255 }), // If moved to DLQ
  metadata: jsonb("metadata"), // Additional tracking data
  createdAt: timestamp("created_at").defaultNow(),
});

export type DeliveryAttempt = typeof deliveryAttempts.$inferSelect;
export type NewDeliveryAttempt = typeof deliveryAttempts.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRetrySettings = typeof userRetrySettings.$inferSelect;
export type NewUserRetrySettings = typeof userRetrySettings.$inferInsert;
export type RetryHistory = typeof retryHistory.$inferSelect;
export type NewRetryHistory = typeof retryHistory.$inferInsert;
