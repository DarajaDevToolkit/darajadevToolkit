import type { Context, Next } from 'hono';
import type { ZodSchema } from 'zod';

// Attach validated JSON body to context
export function validateBody(schema: ZodSchema<any>) {
  return async (c: Context, next: Next) => {
    try {
      const json = await c.req.json();
      const data = schema.parse(json);
      c.set('validatedBody', data);
      return next();
    } catch (err: any) {
      return c.json({ error: 'Invalid request body', details: err.errors }, 400);
    }
  };
}

// Attach validated params to context
export function validateParams(schema: ZodSchema<any>) {
  return async (c: Context, next: Next) => {
    try {
      const rawParams: Record<string, string> = {};
      Object.keys((schema as any).shape).forEach((key: string) => {
        rawParams[key] = c.req.param(key);
      });
      const params = schema.parse(rawParams);
      c.set('validatedParams', params);
      return next();
    } catch (err: any) {
      return c.json({ error: 'Invalid URL parameters', details: err.errors }, 400);
    }
  };
}
