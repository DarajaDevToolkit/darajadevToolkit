import { WebhookQueueService } from "./src/services/WebhookQueueService";
import { PRIORITY_LEVELS } from "./src/config/queue";

async function testPriorities() {
  console.log("🧪 Testing Priority System...");

  const queueService = new WebhookQueueService();

  // Test webhooks with different priorities
  const testWebhooks = [
    {
      priority: PRIORITY_LEVELS.LOW,
      name: "LOW",
      webhook: {
        id: "priority_test_low_" + Date.now(),
        userId: "priority_test_user",
        eventType: "stk_push_result" as const,
        payload: {
          Body: {
            stkCallback: {
              MerchantRequestID: "priority-low-123",
              CheckoutRequestID: "priority-low-456",
              ResultCode: 0,
              ResultDesc: "LOW Priority Test",
            },
          },
        },
        receivedAt: new Date(),
        environment: "dev" as const,
      },
    },
    {
      priority: PRIORITY_LEVELS.HIGH,
      name: "HIGH",
      webhook: {
        id: "priority_test_high_" + Date.now(),
        userId: "priority_test_user",
        eventType: "stk_push_result" as const,
        payload: {
          Body: {
            stkCallback: {
              MerchantRequestID: "priority-high-123",
              CheckoutRequestID: "priority-high-456",
              ResultCode: 0,
              ResultDesc: "HIGH Priority Test",
            },
          },
        },
        receivedAt: new Date(),
        environment: "dev" as const,
      },
    },
    {
      priority: PRIORITY_LEVELS.URGENT,
      name: "URGENT",
      webhook: {
        id: "priority_test_urgent_" + Date.now(),
        userId: "priority_test_user",
        eventType: "stk_push_result" as const,
        payload: {
          Body: {
            stkCallback: {
              MerchantRequestID: "priority-urgent-123",
              CheckoutRequestID: "priority-urgent-456",
              ResultCode: 0,
              ResultDesc: "URGENT Priority Test",
            },
          },
        },
        receivedAt: new Date(),
        environment: "dev" as const,
      },
    },
  ];

  console.log("📤 Adding jobs in order: LOW, HIGH, URGENT");
  console.log("🎯 Expected processing order: URGENT, HIGH, LOW");

  // Add jobs in LOW, HIGH, URGENT order
  for (const test of testWebhooks) {
    await queueService.queueWebhookWithPriority(test.webhook, test.priority);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
  }

  console.log("✅ All priority test jobs queued!");
  console.log("👀 Watch the worker logs to see processing order...");

  process.exit(0);
}

testPriorities();
