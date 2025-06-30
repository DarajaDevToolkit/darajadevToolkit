CREATE TABLE "retry_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid,
	"user_id" uuid,
	"original_job_id" varchar(255) NOT NULL,
	"total_attempts" integer NOT NULL,
	"final_status" varchar(20) NOT NULL,
	"first_attempt_at" timestamp NOT NULL,
	"last_attempt_at" timestamp NOT NULL,
	"total_duration" integer,
	"failure_categories" jsonb,
	"retry_pattern" jsonb,
	"dlq_job_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_retry_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"environment" varchar(20) DEFAULT 'dev' NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_delay_ms" integer DEFAULT 2000 NOT NULL,
	"timeout_ms" integer DEFAULT 25000 NOT NULL,
	"enable_circuit_breaker" boolean DEFAULT false,
	"circuit_breaker_threshold" integer DEFAULT 5,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD COLUMN "queue_job_id" varchar(255);--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD COLUMN "target_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD COLUMN "response_headers" jsonb;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD COLUMN "error_category" varchar(50);--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD COLUMN "retryable" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "retry_history" ADD CONSTRAINT "retry_history_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retry_history" ADD CONSTRAINT "retry_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_retry_settings" ADD CONSTRAINT "user_retry_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;