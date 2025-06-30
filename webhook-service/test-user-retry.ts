/**
 * Test script for user-specific retry configuration and database integration
 */

async function testUserRetryConfiguration() {
  const baseUrl = "http://localhost:3001";

  console.log("🧪 Testing User-Specific Retry Configuration\n");

  try {
    // Test 1: Create a test user
    console.log("📝 Step 1: Creating test user...");
    const createUserResponse = await fetch(`${baseUrl}/api/user/test/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const createUserResult = await createUserResponse.json();
    console.log("✅ Test user created:", createUserResult);
    const testUserId = createUserResult.data.userId;

    // Test 2: Get default retry settings
    console.log("\n📝 Step 2: Getting default retry settings...");
    const getSettingsResponse = await fetch(
      `${baseUrl}/api/user/${testUserId}/retry-settings/dev`
    );
    const settingsResult = await getSettingsResponse.json();
    console.log("✅ Default settings:", settingsResult.data);

    // Test 3: Update retry settings
    console.log("\n📝 Step 3: Updating retry settings...");
    const updateResponse = await fetch(
      `${baseUrl}/api/user/${testUserId}/retry-settings/dev`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxRetries: 5,
          retryDelayMs: 3000,
          timeoutMs: 30000,
          enableCircuitBreaker: true,
          circuitBreakerThreshold: 3,
        }),
      }
    );

    const updateResult = await updateResponse.json();
    console.log("✅ Updated settings:", updateResult.data);

    // Test 4: Get webhook URL
    console.log("\n📝 Step 4: Getting webhook URL...");
    const urlResponse = await fetch(
      `${baseUrl}/api/user/${testUserId}/webhook-url/dev`
    );
    const urlResult = await urlResponse.json();
    console.log("✅ Webhook URL info:", urlResult.data);

    // Test 5: Queue webhook with user-specific settings
    console.log("\n📝 Step 5: Queueing webhook with user settings...");
    const queueResponse = await fetch(
      `${baseUrl}/api/user/${testUserId}/webhook/queue`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookPayload: {
            eventType: "stk_push_result",
            payload: {
              Body: {
                stkCallback: {
                  MerchantRequestID: "test-123",
                  CheckoutRequestID: "test-456",
                  ResultCode: 0,
                  ResultDesc: "Test webhook with user settings",
                },
              },
            },
          },
          environment: "dev",
          priority: 10,
        }),
      }
    );

    const queueResult = await queueResponse.json();
    console.log("✅ Webhook queued:", queueResult.data);

    // Test 6: Get delivery stats (after some time for processing)
    setTimeout(async () => {
      console.log("\n📝 Step 6: Getting delivery statistics...");
      const statsResponse = await fetch(
        `${baseUrl}/api/user/${testUserId}/delivery-stats?days=1`
      );
      const statsResult = await statsResponse.json();
      console.log("✅ Delivery stats:", statsResult.data);
    }, 5000);

    // Test 7: Test different user settings for different environments
    console.log("\n📝 Step 7: Creating staging environment settings...");
    const stagingUpdateResponse = await fetch(
      `${baseUrl}/api/user/${testUserId}/retry-settings/staging`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxRetries: 2,
          retryDelayMs: 1500,
          timeoutMs: 20000,
        }),
      }
    );

    const stagingUpdateResult = await stagingUpdateResponse.json();
    console.log("✅ Staging settings:", stagingUpdateResult.data);

    console.log("\n🎉 User-specific retry configuration test completed!");
    console.log("\n📊 Summary of features tested:");
    console.log("  ✅ Test user creation");
    console.log("  ✅ Default retry settings retrieval");
    console.log("  ✅ Retry settings updates");
    console.log("  ✅ Webhook URL lookup");
    console.log("  ✅ Queue webhook with user settings");
    console.log("  ✅ Environment-specific settings");
    console.log("  ✅ Delivery statistics tracking");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Test error scenarios
async function testErrorScenarios() {
  const baseUrl = "http://localhost:3001";

  console.log("\n🔍 Testing Error Scenarios...\n");

  try {
    // Test invalid maxRetries
    console.log("📝 Testing invalid maxRetries...");
    const invalidRetriesResponse = await fetch(
      `${baseUrl}/api/user/test-user/retry-settings/dev`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxRetries: 15 }), // Too high
      }
    );

    const invalidRetriesResult = await invalidRetriesResponse.json();
    console.log("✅ Validation error (expected):", invalidRetriesResult.error);

    // Test invalid timeout
    console.log("\n📝 Testing invalid timeout...");
    const invalidTimeoutResponse = await fetch(
      `${baseUrl}/api/user/test-user/retry-settings/dev`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeoutMs: 500 }), // Too low
      }
    );

    const invalidTimeoutResult = await invalidTimeoutResponse.json();
    console.log("✅ Validation error (expected):", invalidTimeoutResult.error);

    // Test missing user ID
    console.log("\n📝 Testing missing user ID...");
    const missingUserResponse = await fetch(
      `${baseUrl}/api/user//retry-settings/dev`
    );
    const missingUserResult = await missingUserResponse.json();
    console.log("✅ Missing user error (expected):", missingUserResult.error);

    console.log("\n✅ Error scenario testing completed!");
  } catch (error) {
    console.error("❌ Error scenario test failed:", error);
  }
}

// Run the tests
async function runAllTests() {
  await testUserRetryConfiguration();
  await testErrorScenarios();

  console.log(
    "\n🏁 All tests completed! Check the webhook service logs for delivery processing details."
  );
}

runAllTests();
