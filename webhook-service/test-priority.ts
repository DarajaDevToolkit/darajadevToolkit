// Priority test script
import { WebhookQueueService } from "./src/services/WebhookQueueService";
import { PRIORITY_LEVELS } from "./src/config/queue";

async function testPriorities() {
  console.log("🧪 Testing Priority System...");

  const queueService = new WebhookQueueService();
  const timestamp = Date.now();

  // Add jobs in LOW → HIGH → URGENT order
  // But they should be processed in URGENT → HIGH → LOW order

  console.log("\n📋 Adding jobs in this order: LOW → HIGH → URGENT");

  // LOW priority (should be processed LAST)
  await queueService.queueWebhookWithPriority(
    {
      id: `low_priority_${timestamp}`,
      userId: "priority_test_user",
      eventType: "stk_push_result",
      payload: {
        Body: {
          stkCallback: {
            MerchantRequestID: "low",
            CheckoutRequestID: "low",
            ResultCode: 0,
            ResultDesc: "LOW Priority Test",
          },
        },
      },
      receivedAt: new Date(),
      environment: "dev",
    },
    PRIORITY_LEVELS.LOW
  );

  await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay

  // HIGH priority (should be processed SECOND)
  await queueService.queueWebhookWithPriority(
    {
      id: `high_priority_${timestamp}`,
      userId: "priority_test_user",
      eventType: "stk_push_result",
      payload: {
        Body: {
          stkCallback: {
            MerchantRequestID: "high",
            CheckoutRequestID: "high",
            ResultCode: 0,
            ResultDesc: "HIGH Priority Test",
          },
        },
      },
      receivedAt: new Date(),
      environment: "dev",
    },
    PRIORITY_LEVELS.HIGH
  );

  await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay

  // URGENT priority (should be processed FIRST)
  await queueService.queueWebhookWithPriority(
    {
      id: `urgent_priority_${timestamp}`,
      userId: "priority_test_user",
      eventType: "stk_push_result",
      payload: {
        Body: {
          stkCallback: {
            MerchantRequestID: "urgent",
            CheckoutRequestID: "urgent",
            ResultCode: 0,
            ResultDesc: "URGENT Priority Test",
          },
        },
      },
      receivedAt: new Date(),
      environment: "dev",
    },
    PRIORITY_LEVELS.URGENT
  );

  console.log("\n🎯 Expected processing order: URGENT → HIGH → LOW");
  console.log("⏳ Watch the worker logs to see the actual processing order...");

  process.exit(0);
}

testPriorities();
