import { Hono } from "hono";
import { QueueMetricsService } from "../services/QueueMetricsService";

const metricsRoutes = new Hono();
const metricsService = new QueueMetricsService();

/**
 * GET /api/metrics - Get comprehensive queue metrics
 */
metricsRoutes.get("/", async (c) => {
  try {
    const metrics = await metricsService.getQueueMetrics();
    return c.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error("❌ Failed to get metrics:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve metrics",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/metrics/queue/stats - Get detailed queue statistics
 */
metricsRoutes.get("/queue/stats", async (c) => {
  try {
    const stats = await metricsService.getDetailedStats();
    return c.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("❌ Failed to get queue stats:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve queue statistics",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/metrics/workers - Get worker health information
 */
metricsRoutes.get("/workers", async (c) => {
  try {
    const workers = await metricsService.getWorkerHealth();
    return c.json({
      success: true,
      data: {
        workers,
        summary: {
          total: workers.length,
          active: workers.filter((w) => w.status === "active").length,
          idle: workers.filter((w) => w.status === "idle").length,
          stalled: workers.filter((w) => w.status === "stalled").length,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to get worker health:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve worker health",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/metrics/history - Get metrics history
 */
metricsRoutes.get("/history", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const type = c.req.query("type") || "queue_metrics";

    const history = metricsService.getMetricsHistory(type, limit);

    return c.json({
      success: true,
      data: {
        type,
        history,
        count: history.length,
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to get metrics history:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve metrics history",
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/metrics/queue/pause - Pause the queue
 */
metricsRoutes.post("/queue/pause", async (c) => {
  try {
    await metricsService.pauseQueue();
    return c.json({
      success: true,
      message: "Queue paused successfully",
    });
  } catch (error: any) {
    console.error("❌ Failed to pause queue:", error);
    return c.json(
      {
        success: false,
        error: "Failed to pause queue",
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/metrics/queue/resume - Resume the queue
 */
metricsRoutes.post("/queue/resume", async (c) => {
  try {
    await metricsService.resumeQueue();
    return c.json({
      success: true,
      message: "Queue resumed successfully",
    });
  } catch (error: any) {
    console.error("❌ Failed to resume queue:", error);
    return c.json(
      {
        success: false,
        error: "Failed to resume queue",
        message: error.message,
      },
      500
    );
  }
});

/**
 * DELETE /api/metrics/queue/clear - Clear queue jobs
 */
metricsRoutes.delete("/queue/clear", async (c) => {
  try {
    const type =
      (c.req.query("type") as "waiting" | "completed" | "failed" | "all") ||
      "all";

    // Validate type parameter
    const validTypes = ["waiting", "completed", "failed", "all"];
    if (!validTypes.includes(type)) {
      return c.json(
        {
          success: false,
          error: "Invalid type parameter",
          message: `Type must be one of: ${validTypes.join(", ")}`,
        },
        400
      );
    }

    const clearedCount = await metricsService.clearQueue(type);

    return c.json({
      success: true,
      message: `Cleared ${clearedCount} jobs from queue`,
      data: {
        type,
        clearedCount,
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to clear queue:", error);
    return c.json(
      {
        success: false,
        error: "Failed to clear queue",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/metrics/realtime - Get real-time metrics (SSE endpoint)
 */
metricsRoutes.get("/realtime", async (c) => {
  try {
    // Set up Server-Sent Events headers
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Headers", "Cache-Control");

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        const sendMetrics = async () => {
          try {
            const metrics = await metricsService.getQueueMetrics();
            const data = `data: ${JSON.stringify(metrics)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          } catch (error) {
            console.error("Error sending metrics:", error);
          }
        };

        // Send initial metrics
        sendMetrics();

        // Send metrics every 5 seconds
        const interval = setInterval(sendMetrics, 5000);

        // Cleanup function
        return () => {
          clearInterval(interval);
        };
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to start real-time metrics:", error);
    return c.json(
      {
        success: false,
        error: "Failed to start real-time metrics",
        message: error.message,
      },
      500
    );
  }
});

export { metricsRoutes };
