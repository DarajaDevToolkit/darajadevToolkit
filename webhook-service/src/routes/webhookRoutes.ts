import { Hono } from "hono";
import { WebhookController } from "../controllers/WebhookController";

const webhookRoutes = new Hono();
const webhookController = new WebhookController();

// Health check endpoint
webhookRoutes.get("/health", (c) => webhookController.healthCheck(c));

// Main webhook endpoint - receives M-Pesa callbacks
webhookRoutes.post("/webhook/:userId", (c) =>
  webhookController.handleWebhook(c)
);

// Test endpoint for development
webhookRoutes.post("/test/:userId", (c) =>
  webhookController.handleTestWebhook(c)
);

export { webhookRoutes };
