import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { webhookRoutes } from "./routes/webhookRoutes";
import { errorHandler, requestLogger } from "./middleware";

const app = new Hono();

// Global middleware
app.use("*", errorHandler);
app.use("*", requestLogger);
app.use("*", cors());
app.use("*", logger());

// Routes
app.route("/", webhookRoutes);

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
