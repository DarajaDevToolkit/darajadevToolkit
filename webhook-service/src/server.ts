import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import {
  validateMpesaSTKPayload,
  validateMpesaC2BPayload,
  detectWebhookType,
  isValidMpesaIP,
} from "@daraja-toolkit/shared";
import type { MpesaResponse, WebhookPayload } from "@daraja-toolkit/shared";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "webhook-service",
    timestamp: new Date().toISOString(),
  });
});

// Main webhook endpoint - receives M-Pesa callbacks
app.post("/webhook/:userId", async (c) => {
  const userId = c.req.param("userId");
  const clientIP =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

  try {
    // Parse the payload
    const payload = await c.req.json();

    console.log(`[${userId}] Webhook received from IP: ${clientIP}`);
    console.log(`[${userId}] Payload:`, JSON.stringify(payload, null, 2));

    // Step 1: Basic IP validation (non-blocking for now)
    if (!isValidMpesaIP(clientIP)) {
      console.warn(`[${userId}] Suspicious IP detected: ${clientIP}`);
      // Log but don't block - we'll improve this later
    }

    // Step 2: Validate payload structure
    const webhookType = detectWebhookType(payload);
    if (!webhookType) {
      console.error(`[${userId}] Invalid webhook payload structure`);
      return c.json(
        {
          ResultCode: 1,
          ResultDesc: "Invalid payload format",
        } as MpesaResponse,
        400
      );
    }

    // Step 3: Create internal webhook payload
    const webhookPayload: Partial<WebhookPayload> = {
      userId,
      eventType: webhookType,
      payload,
      receivedAt: new Date(),
      environment: "dev", // TODO: Determine environment based on user settings
    };

    // Step 4: Queue the webhook for delivery (TODO: Implement proper queue)
    console.log(`[${userId}] Queuing webhook for delivery:`, webhookType);
    await queueWebhookForDelivery(webhookPayload);

    // Step 5: Immediate response to M-Pesa (must be within 30 seconds)
    const response: MpesaResponse = {
      ResultCode: 0,
      ResultDesc: "Success",
    };

    return c.json(response);
  } catch (error) {
    console.error(`[${userId}] Error processing webhook:`, error);

    // Always return success to M-Pesa to avoid retries
    return c.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    } as MpesaResponse);
  }
});

// Test endpoint for development
app.post("/test/:userId", async (c) => {
  const userId = c.req.param("userId");

  // Sample M-Pesa STK Push callback for testing
  const testPayload = {
    Body: {
      stkCallback: {
        MerchantRequestID: "test-merchant-request-123",
        CheckoutRequestID: "test-checkout-request-456",
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: 1000 },
            { Name: "MpesaReceiptNumber", Value: "TEST123456" },
            { Name: "TransactionDate", Value: 20231219120000 },
            { Name: "PhoneNumber", Value: 254712345678 },
          ],
        },
      },
    },
  };

  console.log(`[${userId}] Test webhook triggered`);

  return c.json({
    message: "Test webhook would be processed",
    payload: testPayload,
    userId,
  });
});

// TODO: Implement proper queue system (Redis/Bull/etc)
async function queueWebhookForDelivery(
  webhookPayload: Partial<WebhookPayload>
) {
  // For now, just log that it would be queued
  console.log(
    "📦 Would queue webhook:",
    webhookPayload.eventType,
    "for user:",
    webhookPayload.userId
  );

  // TODO: Add to Redis queue or database
  // TODO: Trigger delivery worker
}

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
