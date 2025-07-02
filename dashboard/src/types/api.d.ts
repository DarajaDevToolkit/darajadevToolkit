// Common API types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError<T = unknown> {
  message: string;
  errors?: string[];
  code?: string;
  data?: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Webhook types
export interface Webhook {
  id: string;
  url: string;
  environment: 'dev' | 'staging' | 'production';
  isActive: boolean;
  events: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookRequest {
  url: string;
  environment: 'dev' | 'staging' | 'production';
  events: string[];
  isActive?: boolean;
}

export interface UpdateWebhookRequest extends Partial<CreateWebhookRequest> {
  id: string;
}

// Metrics types
export interface MetricsOverview {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  uptime: number;
}

export interface DetailedMetrics extends MetricsOverview {
  deliveriesByHour: Array<{
    hour: string;
    successful: number;
    failed: number;
  }>;
  responseTimeByEndpoint: Array<{
    endpoint: string;
    averageResponseTime: number;
  }>;
}

// DLQ types
export interface DeadLetterQueueItem {
  id: string;
  webhookId: string;
  payload: Record<string, unknown>;
  failureReason: string;
  attempts: number;
  lastAttemptAt: string;
  createdAt: string;
}

export interface RetryDlqRequest {
  id: string;
}

// Query parameters
export type WebhookQueryParams = PaginationParams & {
  environment?: string;
  isActive?: boolean;
  search?: string;
};

export type MetricsQueryParams = {
  startDate?: string;
  endDate?: string;
  environment?: string;
};

export type DlqQueryParams = PaginationParams & {
  webhookId?: string;
  environment?: string;
};
