import { Hono } from "hono";
import { DeadLetterQueueService } from "../services/DeadLetterQueueService";

const dlqRoutes = new Hono();
const dlqService = new DeadLetterQueueService();

/**
 * GET /api/dlq/stats - Get DLQ statistics
 */
dlqRoutes.get("/stats", async (c) => {
  try {
    const stats = await dlqService.getDLQStats();
    return c.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("❌ Failed to get DLQ stats:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve DLQ statistics",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/dlq/jobs - Get DLQ jobs with filtering
 */
dlqRoutes.get("/jobs", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const errorCategory = c.req.query("errorCategory");
    const userId = c.req.query("userId");

    const jobs = await dlqService.getDLQJobs({
      limit,
      offset,
      errorCategory: errorCategory || undefined,
      userId: userId || undefined,
    });

    return c.json({
      success: true,
      data: {
        jobs,
        pagination: {
          limit,
          offset,
          hasMore: jobs.length === limit,
        },
        filters: {
          errorCategory: errorCategory || null,
          userId: userId || null,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to get DLQ jobs:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retrieve DLQ jobs",
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/dlq/retry/:jobId - Manually retry a specific job from DLQ
 */
dlqRoutes.post("/retry/:jobId", async (c) => {
  try {
    const jobId = c.req.param("jobId");

    if (!jobId) {
      return c.json(
        {
          success: false,
          error: "Job ID is required",
        },
        400
      );
    }

    const result = await dlqService.retryFromDLQ(jobId);

    if (result.success) {
      return c.json({
        success: true,
        message: `Job ${jobId} queued for retry`,
        data: {
          originalJobId: jobId,
          newJobId: result.newJobId,
        },
      });
    } else {
      return c.json(
        {
          success: false,
          error: result.error || "Failed to retry job",
        },
        400
      );
    }
  } catch (error: any) {
    console.error("❌ Failed to retry DLQ job:", error);
    return c.json(
      {
        success: false,
        error: "Failed to retry job",
        message: error.message,
      },
      500
    );
  }
});

/**
 * POST /api/dlq/retry/bulk - Bulk retry multiple jobs from DLQ
 */
dlqRoutes.post("/retry/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const { jobIds } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return c.json(
        {
          success: false,
          error: "jobIds array is required and must not be empty",
        },
        400
      );
    }

    if (jobIds.length > 100) {
      return c.json(
        {
          success: false,
          error: "Cannot retry more than 100 jobs at once",
        },
        400
      );
    }

    const result = await dlqService.bulkRetryFromDLQ(jobIds);

    return c.json({
      success: true,
      message: `Processed ${jobIds.length} retry requests`,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: {
          total: jobIds.length,
          successful: result.successful.length,
          failed: result.failed.length,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to bulk retry DLQ jobs:", error);
    return c.json(
      {
        success: false,
        error: "Failed to bulk retry jobs",
        message: error.message,
      },
      500
    );
  }
});

/**
 * DELETE /api/dlq/jobs/old - Clear old DLQ jobs
 */
dlqRoutes.delete("/jobs/old", async (c) => {
  try {
    const daysOld = parseInt(c.req.query("days") || "7");
    const olderThanMs = daysOld * 24 * 60 * 60 * 1000;

    if (daysOld < 1) {
      return c.json(
        {
          success: false,
          error: "Days must be at least 1",
        },
        400
      );
    }

    const clearedCount = await dlqService.clearOldDLQJobs(olderThanMs);

    return c.json({
      success: true,
      message: `Cleared ${clearedCount} old DLQ jobs`,
      data: {
        clearedCount,
        olderThanDays: daysOld,
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to clear old DLQ jobs:", error);
    return c.json(
      {
        success: false,
        error: "Failed to clear old DLQ jobs",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/dlq/health - Get DLQ health status
 */
dlqRoutes.get("/health", async (c) => {
  try {
    const stats = await dlqService.getDLQStats();

    // Determine health based on DLQ size and oldest job age
    const maxHealthyJobs = 100;
    const maxHealthyAgeMs = 24 * 60 * 60 * 1000; // 24 hours

    let status = "healthy";
    const warnings: string[] = [];

    if (stats.totalJobs > maxHealthyJobs) {
      status = "warning";
      warnings.push(`High number of DLQ jobs: ${stats.totalJobs}`);
    }

    if (stats.oldestJob && stats.oldestJob.age > maxHealthyAgeMs) {
      status = "warning";
      warnings.push(
        `Old job in DLQ: ${Math.round(stats.oldestJob.age / (60 * 60 * 1000))} hours old`
      );
    }

    if (stats.totalJobs > maxHealthyJobs * 2) {
      status = "unhealthy";
    }

    return c.json({
      success: true,
      data: {
        status,
        warnings,
        metrics: {
          totalJobs: stats.totalJobs,
          oldestJobAge: stats.oldestJob?.age || 0,
          errorCategories: Object.keys(stats.jobsByErrorCategory).length,
          affectedUsers: Object.keys(stats.jobsByUser).length,
        },
        thresholds: {
          maxHealthyJobs,
          maxHealthyAgeMs,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to get DLQ health:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get DLQ health status",
        message: error.message,
      },
      500
    );
  }
});

/**
 * GET /api/dlq/jobs/:jobId - Get specific DLQ job details
 */
dlqRoutes.get("/jobs/:jobId", async (c) => {
  try {
    const jobId = c.req.param("jobId");

    const jobs = await dlqService.getDLQJobs({ limit: 1000 }); // Get all to find specific job
    const job = jobs.find((j) => j.id === jobId);

    if (!job) {
      return c.json(
        {
          success: false,
          error: "DLQ job not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    console.error("❌ Failed to get DLQ job details:", error);
    return c.json(
      {
        success: false,
        error: "Failed to get DLQ job details",
        message: error.message,
      },
      500
    );
  }
});

export { dlqRoutes };
