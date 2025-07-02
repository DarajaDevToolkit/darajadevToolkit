export interface Webhook {
  id: string;
  userId: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending' | 'retry';
  environment: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  phoneNumber?: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  deliveryAttempts: number;
  lastAttemptAt: string;
  targetUrl: string;
  responseCode?: number;
  responseBody?: string;
  deliveryTime?: number;
}

export interface WebhookStats {
  totalWebhooks: number;
  successRate: number;
  avgDeliveryTime: number;
  todayWebhooks: number;
  failureRate: number;
  retryRate: number;
  environmentBreakdown: {
    development: number;
    staging: number;
    production: number;
  };
}