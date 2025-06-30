import { WebhookQueueService } from "./src/services/WebhookQueueService";
import { PRIORITY_LEVELS } from "./src/config/queue";

async function testPriorityWithBacklog() {
  console.log("🧪 Testing Priority System with Job Backlog...");
  console.log("📋 Stop the worker first, then run this test!");

  const queueService = new WebhookQueueService();
  const timestamp = Date.now();

  console.log("\n📦 Adding 6 jobs with mixed priorities...");

  // Add jobs in mixed order to test priority sorting
  const jobs = [
    { priority: PRIORITY_LEVELS.LOW, name: "JOB_A_LOW", id: 1 },
    { priority: PRIORITY_LEVELS.URGENT, name: "JOB_B_URGENT", id: 2 },
    { priority: PRIORITY_LEVELS.NORMAL, name: "JOB_C_NORMAL", id: 3 },
    { priority: PRIORITY_LEVELS.HIGH, name: "JOB_D_HIGH", id: 4 },
    { priority: PRIORITY_LEVELS.LOW, name: "JOB_E_LOW", id: 5 },
    { priority: PRIORITY_LEVELS.URGENT, name: "JOB_F_URGENT", id: 6 },
  ];

  for (const job of jobs) {
    await queueService.queueWebhookWithPriority(
      {
        id: `${job.name}_${timestamp}`,
        userId: "priority_backlog_test",
        eventType: "stk_push_result",
        payload: {
          Body: {
            stkCallback: {
              MerchantRequestID: job.name,
              CheckoutRequestID: job.name,
              ResultCode: 0,
              ResultDesc: `${job.name} - Priority Test`,
            },
          },
        },
        receivedAt: new Date(),
        environment: "dev",
      },
      job.priority
    );

    await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay between jobs
  }

  console.log("\n🎯 Expected processing order when worker starts:");
  console.log("   1. JOB_B_URGENT (Priority: 20)");
  console.log("   2. JOB_F_URGENT (Priority: 20)");
  console.log("   3. JOB_D_HIGH (Priority: 10)");
  console.log("   4. JOB_C_NORMAL (Priority: 5)");
  console.log("   5. JOB_A_LOW (Priority: 1)");
  console.log("   6. JOB_E_LOW (Priority: 1)");

  console.log("\n📊 Now start the worker and watch the processing order!");

  process.exit(0);
}

testPriorityWithBacklog();
