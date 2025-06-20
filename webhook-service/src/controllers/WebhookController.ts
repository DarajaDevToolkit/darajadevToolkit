import type { Context } from "hono";
import type { MpesaResponse, WebhookPayload } from "@daraja-toolkit/shared";
import { WebhookValidationService } from "../services/WebhookValidationService";
import { WebhookQueueService } from "../services/WebhookQueueService";

export class WebhookController {
  private validationService: WebhookValidationService;
  private queueService: WebhookQueueService;

  constructor() {
    this.validationService = new WebhookValidationService();
    this.queueService = new WebhookQueueService();
  }

  /**
   * Handle incoming M-Pesa webhook
   */
  async handleWebhook(c: Context) {
    const userId = c.req.param("userId");
    const clientIP =
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

    try {
      // Parse the payload
      const payload = await c.req.json();

      console.log(`[${userId}] Webhook received from IP: ${clientIP}`);
      console.log(`[${userId}] Payload:`, JSON.stringify(payload, null, 2));

      // Step 1: Validate the webhook
      const validationResult = await this.validationService.validateWebhook(
        payload,
        clientIP
      );

      if (!validationResult.isValid) {
        console.error(
          `[${userId}] Validation failed: ${validationResult.error}`
        );
        return c.json(
          {
            ResultCode: 1,
            ResultDesc: validationResult.error || "Invalid payload format",
          } as MpesaResponse,
          400
        );
      }

      // Step 2: Create internal webhook payload
      const webhookPayload: Partial<WebhookPayload> = {
        userId,
        eventType: validationResult.webhookType,
        payload,
        receivedAt: new Date(),
        environment: "dev", // TODO: Get from user settings
      };

      // Step 3: Queue for delivery
      console.log(
        `[${userId}] Queuing webhook for delivery: ${validationResult.webhookType}`
      );
      await this.queueService.queueWebhook(webhookPayload);

      // Step 4: Immediate response to M-Pesa
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
  }

  /**
   * Handle test webhook (for development)
   */
  async handleTestWebhook(c: Context) {
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
  }

  /**
   * Health check endpoint
   */
  async healthCheck(c: Context) {
    return c.json({
      status: "ok",
      service: "webhook-service",
      timestamp: new Date().toISOString(),
    });
  }
}
