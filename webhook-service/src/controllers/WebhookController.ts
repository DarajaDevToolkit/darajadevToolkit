import type { Context } from 'hono';
import type { MpesaResponse, WebhookPayload } from '@daraja-toolkit/shared';
import { WebhookValidationService } from '../services/WebhookValidationService';
import { WebhookQueueService } from '../services/WebhookQueueService';
import { SettingsService } from '../services/SettingsService';
import type { WebhookEventType } from '@daraja-toolkit/shared';
import db from '../drizzle/db';

export class WebhookController {
  private validationService: WebhookValidationService;
  private queueService: WebhookQueueService;
  private settingsService: SettingsService;

  constructor() {
    this.validationService = new WebhookValidationService();
    this.queueService = new WebhookQueueService();
    this.settingsService = new SettingsService(db);
  }

  /**
   * Handle incoming M-Pesa webhook
   */
  async handleWebhook(c: Context) {
    const userId = c.req.param('userId');
    const environment = c.req.query('env') || 'development'; // Extract env query parameter
    const clientIP =
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

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
            ResultDesc: validationResult.error || 'Invalid payload format',
          } as MpesaResponse,
          400
        );
      }

      // Step 2: Get user's webhook configuration for the specified environment
      const userConfig = await this.settingsService.getUserWebhookConfig(
        userId,
        environment
      );

      // Step 3: Create internal webhook payload
      const webhookPayload: Partial<WebhookPayload> = {
        userId,
        eventType: validationResult.webhookType as WebhookEventType,
        payload,
        receivedAt: new Date(),
        environment: userConfig.environment as
          | 'development'
          | 'staging'
          | 'production',
      };

      // Step 4: Queue for delivery
      console.log(
        `[${userId}] Queuing webhook for delivery: ${validationResult.webhookType} to ${userConfig.environment}`
      );
      await this.queueService.queueWebhook(webhookPayload);

      // Step 4: Immediate response to M-Pesa
      const response: MpesaResponse = {
        ResultCode: 0,
        ResultDesc: 'Success',
      };

      return c.json(response);
    } catch (error) {
      console.error(`[${userId}] Error processing webhook:`, error);

      // Always return success to M-Pesa to avoid retries
      // We will only retry failed jobs later
      return c.json({
        ResultCode: 0,
        ResultDesc: 'Accepted',
      } as MpesaResponse);
    }
  }

  /**
   * Handle test webhook (for development)
   */
  async handleTestWebhook(c: Context) {
    const userId = c.req.param('userId');

    // Sample M-Pesa STK Push callback for testing
    const testPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'test-merchant-request-123',
          CheckoutRequestID: 'test-checkout-request-456',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 1000 },
              { Name: 'MpesaReceiptNumber', Value: 'TEST123456' },
              { Name: 'TransactionDate', Value: 20231219120000 },
              { Name: 'PhoneNumber', Value: 254712345678 },
            ],
          },
        },
      },
    };

    console.log(`[${userId}] Test webhook triggered`);

    return c.json({
      message: 'Test webhook would be processed',
      payload: testPayload,
      userId,
    });
  }

  /**
   * Test priority handling - queue webhooks with different priorities
   */
  async testPriorities(c: Context) {
    const userId = c.req.param('userId') || 'priority_test_user';

    // Create test webhook payload
    const createTestWebhook = (priority: string, id: number) => ({
      id: `test_${priority}_${id}_${Date.now()}`,
      userId,
      eventType: 'stk_push_result' as WebhookEventType,
      payload: {
        Body: {
          stkCallback: {
            MerchantRequestID: `${priority}-test-${id}`,
            CheckoutRequestID: `${priority}-checkout-${id}`,
            ResultCode: 0,
            ResultDesc: `Priority ${priority} test webhook ${id}`,
          },
        },
      },
      receivedAt: new Date(),
      environment: 'development' as const,
    });

    try {
      console.log(`🧪 [${userId}] Starting priority test...`);

      // Queue webhooks in different priorities
      // First add LOW priority jobs
      await this.queueService.queueWebhookWithPriority(
        createTestWebhook('LOW', 1),
        1 // LOW priority
      );
      await this.queueService.queueWebhookWithPriority(
        createTestWebhook('LOW', 2),
        1 // LOW priority
      );

      // Then add NORMAL priority jobs
      await this.queueService.queueWebhookWithPriority(
        createTestWebhook('NORMAL', 1),
        5 // NORMAL priority
      );
      await this.queueService.queueWebhookWithPriority(
        createTestWebhook('NORMAL', 2),
        5 // NORMAL priority
      );

      // Then add HIGH priority jobs
      await this.queueService.queueWebhookWithPriority(
        createTestWebhook('HIGH', 1),
        10 // HIGH priority
      );

      // Finally add URGENT priority job
      await this.queueService.queueWebhookWithPriority(
        createTestWebhook('URGENT', 1),
        20 // URGENT priority
      );

      console.log(`✅ [${userId}] Priority test completed - 6 jobs queued`);
      console.log(`📋 Expected processing order: URGENT → HIGH → NORMAL → LOW`);

      return c.json({
        message: 'Priority test completed',
        userId,
        jobsQueued: 6,
        expectedOrder: ['URGENT', 'HIGH', 'NORMAL', 'NORMAL', 'LOW', 'LOW'],
        note: 'Check worker logs to see actual processing order',
      });
    } catch (error: any) {
      console.error(`❌ [${userId}] Priority test failed:`, error);
      return c.json(
        {
          error: 'Priority test failed',
          message: error.message,
        },
        500
      );
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(c: Context) {
    return c.json({
      status: 'ok',
      service: 'webhook-service',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Queue health check endpoint
   */
  async queueHealthCheck(c: Context) {
    try {
      const queueHealth = await this.queueService.getQueueHealth();

      const httpStatus = queueHealth.status === 'healthy' ? 200 : 503;

      return c.json(
        {
          service: 'webhook-service',
          timestamp: new Date().toISOString(),
          ...queueHealth,
        },
        httpStatus
      );
    } catch (error: any) {
      return c.json(
        {
          service: 'webhook-service',
          timestamp: new Date().toISOString(),
          status: 'unhealthy',
          error: error.message,
          queue: {
            name: 'webhook-delivery',
            waiting: 0,
            active: 0,
            failed: 0,
            completed: 0,
          },
          redis: {
            connected: false,
            error: error.message,
          },
        },
        503
      );
    }
  }
}
