import type { Context, Next } from "hono";

/**
 * Request logging middleware
 */
export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;

  console.log(`→ ${method} ${url}`);

  await next();

  const time = Date.now() - start;
  const status = c.res.status;

  console.log(`← ${method} ${url} ${status} (${time}ms)`);
}

/**
 * Error handling middleware
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error("Unhandled error:", error);

    return c.json(
      {
        ResultCode: 0, // Always return success to M-Pesa
        ResultDesc: "Internal error, but accepted",
      },
      500
    );
  }
}

/**
 * CORS middleware for development
 */
export async function corsMiddleware(c: Context, next: Next) {
  c.res.headers.set("Access-Control-Allow-Origin", "*");
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (c.req.method === "OPTIONS") {
    return new Response("", { status: 204 });
  }

  await next();
}

/**
 * Rate limiting middleware (basic implementation)
 */
export async function rateLimiter(c: Context, next: Next) {
  // TODO: Implement proper rate limiting
  // For now, just pass through
  //Use redis
  await next();
}
