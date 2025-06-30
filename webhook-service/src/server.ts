import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { webhookRoutes } from "./routes/webhookRoutes";
import { metricsRoutes } from "./routes/metricsRoutes";
import { dlqRoutes } from "./routes/dlqRoutes";
import userRetryRoutes from "./routes/userRetryRoutes";
import { errorHandler, requestLogger } from "./middleware";
import db from "./drizzle/db";
import { sql } from "drizzle-orm";
import authRouter from "./routes/auth.routes";
import settingsRoutes from "./routes/settings.routes";

const app = new Hono();

app.use(cors({
  origin: '*', //later set to specific origins in production or ip ranges
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Global middleware
app.use("*", errorHandler);
app.use("*", requestLogger);
// app.use("*", cors());
app.use("*", logger());

// Routes
app.route("/", webhookRoutes);
app.route("/api/metrics", metricsRoutes);
app.route("/api/dlq", dlqRoutes);
app.route("/api", userRetryRoutes);
app.route("/", authRouter);
app.route("/", settingsRoutes);

// Test database connection at startup
(async () => {
  try {
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('✅ Database connection successful:',result);
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
console.log(
  `👤 User retry settings: http://localhost:${port}/api/user/{userId}/retry-settings/{env}`
);
console.log(
  `📊 User delivery stats: http://localhost:${port}/api/user/{userId}/delivery-stats`
);
console.log(
  `🧪 Create test user: http://localhost:${port}/api/user/test/create`
);
console.log(
  `📦 Queue with user settings: http://localhost:${port}/api/user/{userId}/webhook/queue`
);
console.log(`🔁 User retry: http://localhost:${port}/api/retry/{userId}`);
