// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Auth Configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_EXPIRES_KEY: 'token_expires',
} as const;

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    REGISTER: '/api/auth/register',
  },
  WEBHOOKS: {
    LIST: '/api/webhooks',
    CREATE: '/api/webhooks',
    UPDATE: '/api/webhooks',
    DELETE: '/api/webhooks',
  },
  METRICS: {
    OVERVIEW: '/api/metrics',
    DETAILED: '/api/metrics/detailed',
  },
  DLQ: {
    LIST: '/api/dlq',
    RETRY: '/api/dlq/retry',
    DELETE: '/api/dlq',
  },
} as const;

// Environment
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';