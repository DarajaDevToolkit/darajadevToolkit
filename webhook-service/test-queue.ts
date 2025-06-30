import { WebhookQueueService } from "./src/services/WebhookQueueService";
import type { WebhookPayload } from "@daraja-toolkit/shared";

async function testQueue() {
  console.log("🧪 Starting queue test...");

  const queueService = new WebhookQueueService();

  // Test webhook payload
  const testWebhook: Partial<WebhookPayload> = {
    id: "test_webhook_" + Date.now(),
    userId: "test_user_123",
    eventType: "stk_push_result",
    payload: {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant-123",
          CheckoutRequestID: "test-checkout-456",
          ResultCode: 0,
          ResultDesc: "Success",
        },
      },
    },
    receivedAt: new Date(),
    environment: "dev",
  };

  try {
    // Queue the webhook
    await queueService.queueWebhook(testWebhook);
    console.log("✅ Test webhook queued successfully!");

    // Wait a bit for processing
    console.log("⏳ Waiting for processing...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  } catch (error) {
    console.error("❌ Test failed:", error);
  }

  process.exit(0);
}

testQueue();
