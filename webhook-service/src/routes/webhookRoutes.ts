import { Hono } from 'hono';
import { WebhookController } from '../controllers/WebhookController';
import { authenticateAPIKey } from '../middleware/auth.middleware';

const webhookRoutes = new Hono();
const webhookController = new WebhookController();

// Health check endpoint (public)
webhookRoutes.get('/health', c => webhookController.healthCheck(c));

// Queue health check endpoint (public)
webhookRoutes.get('/health/queue', c => webhookController.queueHealthCheck(c));

// Main webhook endpoint - receives M-Pesa callbacks (public for M-PESA)
webhookRoutes.post('/webhook/:userId', c => webhookController.handleWebhook(c));

// Test endpoint for development (requires API key)
webhookRoutes.post('/test/:userId', authenticateAPIKey, c =>
  webhookController.handleTestWebhook(c)
);

// Priority testing endpoint (requires API key)
webhookRoutes.post('/test-priorities/:userId?', authenticateAPIKey, c =>
  webhookController.testPriorities(c)
);

export { webhookRoutes };
