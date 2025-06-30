import { Hono } from "hono";
import { UserRetrySettingsService } from "../services/UserRetrySettingsService";
import { DatabaseWebhookQueueService } from "../services/DatabaseWebhookQueueService";

const userRetryRoutes = new Hono();
const userSettingsService = new UserRetrySettingsService();
const databaseQueueService = new DatabaseWebhookQueueService();

/**
 * GET /api/user/:userId/retry-settings/:environment - Get user retry settings
 */
userRetryRoutes.get("/user/:userId/retry-settings/:environment", async (c) => {
  try {
    const userId = c.req.param("userId");
    const environment = c.req.param("environment");

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "User ID is required",
        },
        400
      );
    }

    const settings = await userSettingsService.getUserRetrySettings(
      userId,
      environment
    );

    return c.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("❌ Failed to get user retry settings:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve user retry settings",
        message: error.message,
      },
      500
    );
  }
});

/**
 * PUT /api/user/:userId/retry-settings/:environment - Update user retry settings
 */
userRetryRoutes.put("/user/:userId/retry-settings/:environment", async (c) => {
  try {
    const userId = c.req.param("userId");
    const environment = c.req.param("environment");
    const body = await c.req.json();

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "User ID is required",
        },
        400
      );
    }

    const {
      maxRetries,
      retryDelayMs,
      timeoutMs,
      enableCircuitBreaker,
      circuitBreakerThreshold,
    } = body;

    // Validate input
    if (maxRetries !== undefined && (maxRetries < 0 || maxRetries > 10)) {
      return c.json(
        {
          success: false,
          error: "maxRetries must be between 0 and 10",
        },
        400
      );
    }

    if (
      retryDelayMs !== undefined &&
      (retryDelayMs < 100 || retryDelayMs > 60000)
    ) {
      return c.json(
        {
          success: false,
          error: "retryDelayMs must be between 100 and 60000",
        },
        400
      );
    }

    if (timeoutMs !== undefined && (timeoutMs < 1000 || timeoutMs > 120000)) {
      return c.json(
        {
          success: false,
          error: "timeoutMs must be between 1000 and 120000",
        },
        400
      );
    }

    const updates = {
      ...(maxRetries !== undefined && { maxRetries }),
      ...(retryDelayMs !== undefined && { retryDelayMs }),
      ...(timeoutMs !== undefined && { timeoutMs }),
      ...(enableCircuitBreaker !== undefined && { enableCircuitBreaker }),
      ...(circuitBreakerThreshold !== undefined && { circuitBreakerThreshold }),
    };

    const updatedSettings = await userSettingsService.updateUserRetrySettings(
      userId,
      environment,
      updates
    );

    return c.json({
      success: true,
      message: "Retry settings updated successfully",
      data: updatedSettings,
    });
  } catch (error: any) {
    console.error("❌ Failed to update user retry settings:", error);
    return c.json(
      {
        success: false,
        error: "Failed to update user retry settings",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/user/:userId/delivery-stats - Get user delivery statistics
 */
userRetryRoutes.get("/user/:userId/delivery-stats", async (c) => {
  try {
    const userId = c.req.param("userId");
    const days = parseInt(c.req.query("days") || "30");

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "User ID is required",
        },
        400
      );
    }

    if (days < 1 || days > 365) {
      return c.json(
        {
          success: false,
          error: "Days must be between 1 and 365",
        },
        400
      );
    }

    const stats = await userSettingsService.getUserRetryStats(userId, days);

    return c.json({
      success: true,
      data: {
        ...stats,
        period: `${days} days`,
        userId,
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to get user delivery stats:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve user delivery statistics",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/user/:userId/webhook-url/:environment - Get user webhook URL
 */
userRetryRoutes.get("/user/:userId/webhook-url/:environment", async (c) => {
  try {
    const userId = c.req.param("userId");
    const environment = c.req.param("environment");
    const eventType = c.req.query("eventType") || "stk_push_result";

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "User ID is required",
        },
        400
      );
    }

    const webhookUrl = await userSettingsService.getUserWebhookUrl(
      userId,
      environment,
      eventType
    );

    return c.json({
      success: true,
      data: {
        userId,
        environment,
        eventType,
        webhookUrl,
        configured: !!webhookUrl,
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to get user webhook URL:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve user webhook URL",
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/user/test/create - Create test user for development
 */
userRetryRoutes.post("/user/test/create", async (c) => {
  try {
    const testUser = await userSettingsService.createTestUser();

    return c.json({
      success: true,
      message: "Test user created successfully",
      data: testUser,
    });
  } catch (error: any) {
    console.error("❌ Failed to create test user:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create test user",
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/user/:userId/webhook/queue - Queue webhook with user-specific settings
 */
userRetryRoutes.post("/user/:userId/webhook/queue", async (c) => {
  try {
    const userId = c.req.param("userId");
    const body = await c.req.json();

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "User ID is required",
        },
        400
      );
    }

    const { webhookPayload, environment = "dev", priority = 5 } = body;

    if (!webhookPayload) {
      return c.json(
        {
          success: false,
          error: "Webhook payload is required",
        },
        400
      );
    }

    const result = await databaseQueueService.queueWebhookWithUserSettings(
      webhookPayload,
      userId,
      environment,
      priority
    );

    return c.json({
      success: true,
      message: "Webhook queued with user-specific settings",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Failed to queue webhook with user settings:", error);
    return c.json(
      {
        success: false,
        error: "Failed to queue webhook",
        message: error.message,
      },
      500
    );
  }
});

export default userRetryRoutes;
