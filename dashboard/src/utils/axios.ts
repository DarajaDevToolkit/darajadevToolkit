import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, AUTH_CONFIG, IS_DEVELOPMENT } from './constants';
import type {
  LoginResponse,
  RegisterRequest,
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  MetricsOverview,
  DetailedMetrics,
  DeadLetterQueueItem,
  WebhookQueryParams,
  MetricsQueryParams,
  DlqQueryParams,
} from '../types/api';

// Custom error types
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Secure token management with httpOnly cookies for production
class TokenManager {
  // Check if we're in production and should use httpOnly cookies
  private static get useHttpOnlyCookies(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  // Cookie utility functions
  private static setCookie(name: string, value: string, options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
  } = {}): void {
    if (typeof document === 'undefined') return;

    const {
      httpOnly = false,
      secure = this.useHttpOnlyCookies,
      sameSite = 'strict',
      maxAge = 60 * 60 * 24 * 7, // 7 days
      path = '/'
    } = options;

    let cookieString = `${name}=${value}; Path=${path}; SameSite=${sameSite}`;
    
    if (secure) cookieString += '; Secure';
    if (httpOnly) cookieString += '; HttpOnly';
    if (maxAge) cookieString += `; Max-Age=${maxAge}`;

    document.cookie = cookieString;
  }

  private static getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private static deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }

  // Main token management methods
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;

    if (this.useHttpOnlyCookies) {
      // In production, access token should be in httpOnly cookie
      // We can't access it from JS, so we'll rely on automatic cookie sending
      // Return a placeholder to indicate token existence
      return this.getCookie('has_token') === 'true' ? 'cookie-token' : null;
    } else {
      // Development: use localStorage
      return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    }
  }

  static setToken(token: string, expiresIn?: number): void {
    if (typeof window === 'undefined') return;

    if (this.useHttpOnlyCookies) {
      // In production, this should be handled by the server setting httpOnly cookies
      // We only set a flag cookie to indicate token presence
      this.setCookie('has_token', 'true', {
        httpOnly: false, // This flag can be read by JS
        secure: true,
        maxAge: expiresIn || 60 * 60 * 24 * 7 // 7 days default
      });
    } else {
      // Development: use localStorage
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
      if (expiresIn) {
        const expiryTime = Date.now() + (expiresIn * 1000);
        localStorage.setItem(AUTH_CONFIG.TOKEN_EXPIRES_KEY, expiryTime.toString());
      }
    }
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return;

    if (this.useHttpOnlyCookies) {
      // Delete the flag cookie
      this.deleteCookie('has_token');
      // Note: httpOnly cookies should be cleared by server on logout
    } else {
      // Development: clear localStorage
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRES_KEY);
    }
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;

    if (this.useHttpOnlyCookies) {
      // Refresh token should also be in httpOnly cookie
      // Return placeholder if refresh token cookie exists
      return this.getCookie('has_refresh_token') === 'true' ? 'cookie-refresh-token' : null;
    } else {
      // Development: use localStorage
      return localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    }
  }

  static setRefreshToken(token: string, expiresIn?: number): void {
    if (typeof window === 'undefined') return;

    if (this.useHttpOnlyCookies) {
      // Set flag for refresh token existence
      this.setCookie('has_refresh_token', 'true', {
        httpOnly: false,
        secure: true,
        maxAge: expiresIn || 60 * 60 * 24 * 30 // 30 days default for refresh token
      });
    } else {
      // Development: use localStorage
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, token);
    }
  }

  // Check if token is expired (only works in development with localStorage)
  static isTokenExpired(): boolean {
    if (this.useHttpOnlyCookies) {
      // In production, server will handle token expiration
      return false;
    }

    const expiryTime = localStorage.getItem(AUTH_CONFIG.TOKEN_EXPIRES_KEY);
    if (!expiryTime) return false;
    
    return Date.now() > parseInt(expiryTime);
  }

  // Get token for manual API calls (development only)
  static getTokenForRequest(): string | null {
    if (this.useHttpOnlyCookies) {
      // In production, cookies are sent automatically
      return null;
    }
    return this.getToken();
  }
}

// Create axios instance
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
    // In production, include credentials to send httpOnly cookies
    withCredentials: process.env.NODE_ENV === 'production',
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Only add Authorization header in development (localStorage)
      // In production, httpOnly cookies are sent automatically
      if (process.env.NODE_ENV !== 'production') {
        const token = TokenManager.getTokenForRequest();
        if (token && token !== 'cookie-token') {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // Log requests in development
      if (IS_DEVELOPMENT) {
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
          withCredentials: config.withCredentials,
        });
      }

      return config;
    },
    (error) => {
      if (IS_DEVELOPMENT) {
        console.error('❌ Request Error:', error);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful responses in development
      if (IS_DEVELOPMENT) {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Log errors in development
      if (IS_DEVELOPMENT) {
        console.error('❌ API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });
      }

      // Handle 401 unauthorized errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          if (process.env.NODE_ENV === 'production') {
            // In production, call refresh endpoint which should handle httpOnly cookies
            await axios.post(
              `${API_CONFIG.BASE_URL}/api/auth/refresh`,
              {}, // Empty body, cookies sent automatically
              { withCredentials: true }
            );

            // Server should set new httpOnly cookies automatically
            // Just retry the original request
            return instance(originalRequest);
          } else {
            // Development: handle localStorage refresh token
            const refreshToken = TokenManager.getRefreshToken();
            if (refreshToken && refreshToken !== 'cookie-refresh-token') {
              const refreshResponse = await axios.post(
                `${API_CONFIG.BASE_URL}/api/auth/refresh`,
                { refreshToken }
              );

              const { accessToken, expiresIn } = refreshResponse.data;
              TokenManager.setToken(accessToken, expiresIn);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return instance(originalRequest);
            }
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          TokenManager.removeToken();
          if (typeof window !== 'undefined') {
            // In production, also call logout endpoint to clear httpOnly cookies
            if (process.env.NODE_ENV === 'production') {
              try {
                await axios.post(
                  `${API_CONFIG.BASE_URL}/api/auth/logout`,
                  {},
                  { withCredentials: true }
                );
              } catch (logoutError) {
                console.error('Logout error:', logoutError);
              }
            }
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      // Transform axios error to custom error
      const apiError = new ApiError(
        error.response?.status || 500,
        error.response?.data?.message || error.message || 'An unexpected error occurred',
        error.response?.data
      );

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// Create the main axios instance
const apiClient = createAxiosInstance();

// Retry mechanism for failed requests
const retryRequest = async <T = unknown>(
  requestFn: () => Promise<AxiosResponse<T>>,
  maxAttempts: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<T> => {
  let lastError: Error | ApiError = new Error('Maximum retry attempts exceeded');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      lastError = error as Error | ApiError;
      
      // Don't retry on client errors (4xx) except 401
      if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 401) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
      
      if (IS_DEVELOPMENT) {
        console.log(`🔄 Retrying request (attempt ${attempt + 1}/${maxAttempts})`);
      }
    }
  }

  throw lastError;
};

// Enhanced API methods with retry logic
export const api = {
  // GET request with retry
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    retryRequest(() => apiClient.get<T>(url, config)),

  // POST request with retry
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    retryRequest(() => apiClient.post<T>(url, data, config)),

  // PUT request with retry
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    retryRequest(() => apiClient.put<T>(url, data, config)),

  // PATCH request with retry
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    retryRequest(() => apiClient.patch<T>(url, data, config)),

  // DELETE request with retry
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    retryRequest(() => apiClient.delete<T>(url, config)),

  // Direct access to axios instance for advanced usage
  instance: apiClient,
};

// Helper functions for common API operations
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', { email, password });
    
    // Handle token storage based on environment
    if (process.env.NODE_ENV === 'production') {
      // In production, server should set httpOnly cookies
      // We just set the flag cookies
      TokenManager.setToken('cookie-token', response.expiresIn);
      if (response.refreshToken) {
        TokenManager.setRefreshToken('cookie-refresh-token');
      }
    } else {
      // Development: store in localStorage
      TokenManager.setToken(response.accessToken, response.expiresIn);
      if (response.refreshToken) {
        TokenManager.setRefreshToken(response.refreshToken);
      }
    }
    
    return response;
  },
  
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/api/auth/logout');
    TokenManager.removeToken();
    return response;
  },
  
  register: async (userData: RegisterRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/register', userData);
    
    // Handle token storage based on environment (same as login)
    if (process.env.NODE_ENV === 'production') {
      TokenManager.setToken('cookie-token', response.expiresIn);
      if (response.refreshToken) {
        TokenManager.setRefreshToken('cookie-refresh-token');
      }
    } else {
      TokenManager.setToken(response.accessToken, response.expiresIn);
      if (response.refreshToken) {
        TokenManager.setRefreshToken(response.refreshToken);
      }
    }
    
    return response;
  },
  
  refreshToken: (refreshToken: string): Promise<{ accessToken: string; expiresIn?: number }> =>
    api.post<{ accessToken: string; expiresIn?: number }>('/api/auth/refresh', { refreshToken }),
};

export const webhookApi = {
  list: (params?: WebhookQueryParams): Promise<Webhook[]> =>
    api.get<Webhook[]>('/api/webhooks', { params }),
  
  create: (webhook: CreateWebhookRequest): Promise<Webhook> =>
    api.post<Webhook>('/api/webhooks', webhook),
  
  update: (id: string, webhook: UpdateWebhookRequest): Promise<Webhook> =>
    api.put<Webhook>(`/api/webhooks/${id}`, webhook),
  
  delete: (id: string): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/api/webhooks/${id}`),
  
  get: (id: string): Promise<Webhook> =>
    api.get<Webhook>(`/api/webhooks/${id}`),
};

export const metricsApi = {
  overview: (): Promise<MetricsOverview> =>
    api.get<MetricsOverview>('/api/metrics'),
  
  detailed: (params?: MetricsQueryParams): Promise<DetailedMetrics> =>
    api.get<DetailedMetrics>('/api/metrics/detailed', { params }),
};

export const dlqApi = {
  list: (params?: DlqQueryParams): Promise<DeadLetterQueueItem[]> =>
    api.get<DeadLetterQueueItem[]>('/api/dlq', { params }),
  
  retry: (id: string): Promise<{ message: string }> =>
    api.post<{ message: string }>(`/api/dlq/retry/${id}`),
  
  delete: (id: string): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/api/dlq/${id}`),
};

// Export token manager for external use
export { TokenManager };

// Default export for backward compatibility
export default api;