#!/usr/bin/env bun

/**
 * Test script to verify that the delivery worker can properly:
 * 1. Fetch user webhook URLs from the webhook service API
 * 2. Fetch user retry settings from the webhook service API
 * 3. Use custom retry settings for webhook delivery
 */

import { WebhookDeliveryService } from "./src/worker";
import type { WebhookPayload } from "@daraja-toolkit/shared";

// Webhook service API client (copied from QueueConsumer for testing)
class WebhookServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3001") {
    this.baseUrl = baseUrl;
  }

  async getUserWebhookUrl(
    userId: string,
    environment: string = "dev"
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/user/${userId}/webhook-url/${environment}`
      );
      if (!response.ok) {
        console.warn(
          `Failed to get webhook URL for user ${userId}: ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      return data.success ? data.data.webhookUrl : null;
    } catch (error) {
      console.error(`Error fetching webhook URL for user ${userId}:`, error);
      return null;
    }
  }

  async getUserRetrySettings(userId: string, environment: string = "dev") {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/user/${userId}/retry-settings/${environment}`
      );
      if (!response.ok) {
        console.warn(
          `Failed to get retry settings for user ${userId}: ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error(`Error fetching retry settings for user ${userId}:`, error);
      return null;
    }
  }
}

async function testApiIntegration() {
  console.log("🧪 Testing API integration for delivery worker...");

  const client = new WebhookServiceClient();
  const deliveryService = new WebhookDeliveryService();

  // Test user ID
  const testUserId = "test_user_123";
  const environment = "dev";

  console.log("\n1️⃣ Testing webhook URL retrieval...");
  const webhookUrl = await client.getUserWebhookUrl(testUserId, environment);
  console.log(`Webhook URL for ${testUserId}:`, webhookUrl);

  console.log("\n2️⃣ Testing retry settings retrieval...");
  const retrySettings = await client.getUserRetrySettings(
    testUserId,
    environment
  );
  console.log(`Retry settings for ${testUserId}:`, retrySettings);

  console.log("\n3️⃣ Testing webhook delivery with custom settings...");

  // Create a test webhook payload
  const testPayload: WebhookPayload = {
    id: `test_${Date.now()}`,
    userId: testUserId,
    eventType: "stk_push_result",
    payload: {
      Body: {
        stkCallback: {
          MerchantRequestID: "test-merchant-123",
          CheckoutRequestID: "test-checkout-456",
          ResultCode: 0,
          ResultDesc: "Success. Request accepted for processing",
        },
      },
    },
    receivedAt: new Date(),
    environment: environment,
  };

  // Use a test URL that will respond quickly
  const testUrl = webhookUrl || "https://httpbin.org/post";

  if (retrySettings) {
    console.log(`Using custom retry settings:`, {
      maxRetries: retrySettings.maxRetries,
      initialDelay: retrySettings.initialDelayMs,
      maxDelay: retrySettings.maxDelayMs,
      strategy: retrySettings.backoffStrategy,
    });

    const attempts = await deliveryService.deliverWithRetries(
      testPayload,
      testUrl,
      retrySettings
    );

    console.log(
      `✅ Delivery completed with custom settings. Attempts: ${attempts.length}`
    );
    console.log(
      `Last attempt status: ${attempts[attempts.length - 1]?.status}`
    );
  } else {
    console.log("Using default retry settings...");

    const attempts = await deliveryService.deliverWithRetries(
      testPayload,
      testUrl
    );

    console.log(
      `✅ Delivery completed with default settings. Attempts: ${attempts.length}`
    );
    console.log(
      `Last attempt status: ${attempts[attempts.length - 1]?.status}`
    );
  }

  console.log("\n🎯 API integration test completed!");
}

// Check if webhook service is running
async function checkWebhookService() {
  try {
    const response = await fetch("http://localhost:3001/health");
    if (response.ok) {
      console.log("✅ Webhook service is running");
      return true;
    } else {
      console.log("❌ Webhook service is not responding properly");
      return false;
    }
  } catch (error) {
    console.log("❌ Webhook service is not running. Please start it first:");
    console.log("   cd ../webhook-service && bun run dev");
    return false;
  }
}

if (import.meta.main) {
  console.log("🚀 Starting API integration test...");

  const serviceRunning = await checkWebhookService();
  if (serviceRunning) {
    await testApiIntegration();
  } else {
    console.log("\n💡 To run this test:");
    console.log(
      "1. Start the webhook service: cd ../webhook-service && bun run dev"
    );
    console.log("2. Run this test: bun run test-api-integration.ts");
  }
}
