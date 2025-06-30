import { EnhancedWebhookDeliveryService } from "./src/services/EnhancedWebhookDeliveryService";
import type { WebhookPayload } from "@daraja-toolkit/shared";

async function testDLQFunctionality() {
  console.log("🧪 Starting DLQ test...");

  const deliveryService = new EnhancedWebhookDeliveryService();

  // Test webhook payload
  const testWebhook: WebhookPayload = {
    id: "test_dlq_webhook_" + Date.now(),
    userId: "test_user_dlq",
    eventType: "stk_push_result",
    payload: {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant-dlq",
          CheckoutRequestID: "test-checkout-dlq",
          ResultCode: 0,
          ResultDesc: "Success",
        },
      },
    },
    receivedAt: new Date(),
    environment: "dev",
  };

  // Test different failure scenarios
  const testCases = [
    {
      name: "Network Error (Invalid URL)",
      url: "http://invalid-domain-that-does-not-exist.com/webhook",
      expectedCategory: "network",
    },
    {
      name: "Timeout Error",
      url: "http://httpstat.us/200?sleep=30000", // Will timeout
      expectedCategory: "timeout",
    },
    {
      name: "4xx Client Error",
      url: "http://httpstat.us/400",
      expectedCategory: "client_error",
    },
    {
      name: "5xx Server Error",
      url: "http://httpstat.us/500",
      expectedCategory: "server_error",
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`📍 URL: ${testCase.url}`);

    try {
      const result = await deliveryService.deliverWebhookWithRetries(
        {
          ...testWebhook,
          id: testWebhook.id + "_" + testCase.expectedCategory,
        },
        testCase.url,
        {
          maxRetries: 2, // Reduced for faster testing
          retryDelayMs: 500,
          timeoutMs: 3000, // Shorter timeout for testing
        }
      );

      console.log(`📊 Final status: ${result.finalStatus}`);
      console.log(`🔢 Total attempts: ${result.attempts.length}`);

      if (result.attempts.length > 0) {
        const lastAttempt = result.attempts[result.attempts.length - 1];
        console.log(`🏷️  Error category: ${lastAttempt.errorCategory}`);
        console.log(`❌ Last error: ${lastAttempt.errorMessage}`);
      }

      if (result.dlqJobId) {
        console.log(`💀 Moved to DLQ: ${result.dlqJobId}`);
      }
    } catch (error) {
      console.error(`❌ Test failed:`, error);
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n✅ DLQ tests completed!");
  process.exit(0);
}

testDLQFunctionality();
