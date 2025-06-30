import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { webhookRoutes } from "./routes/webhookRoutes";
import { metricsRoutes } from "./routes/metricsRoutes";
import { dlqRoutes } from "./routes/dlqRoutes";
import { errorHandler, requestLogger } from "./middleware";
import db from "./drizzle/db";
import { sql } from "drizzle-orm";

const app = new Hono();

// Global middleware
app.use("*", errorHandler);
app.use("*", requestLogger);
app.use("*", cors());
app.use("*", logger());

// Routes
app.route("/", webhookRoutes);
app.route("/api/metrics", metricsRoutes);
app.route("/api/dlq", dlqRoutes);

// Test database connection at startup
(async () => {
  try {
    const result = await db.execute(sql`SELECT NOW()`);
    console.log("✅ Database connection successful:", result);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
})();

// Start the server
const port = process.env.PORT || 3001;

export default {
  port,
  fetch: app.fetch,
};

console.log(`🚀 Webhook service running on port ${port}`);
console.log(`📍 Health check: http://localhost:${port}/health`);
console.log(`📨 Webhook endpoint: http://localhost:${port}/webhook/{userId}`);
console.log(`🧪 Test endpoint: http://localhost:${port}/test/{userId}`);
console.log(`📊 Metrics endpoint: http://localhost:${port}/api/metrics`);
console.log(`📈 Queue stats: http://localhost:${port}/api/metrics/queue/stats`);
console.log(`👥 Worker health: http://localhost:${port}/api/metrics/workers`);
console.log(`💀 DLQ stats: http://localhost:${port}/api/dlq/stats`);
console.log(`🔄 DLQ management: http://localhost:${port}/api/dlq/jobs`);
