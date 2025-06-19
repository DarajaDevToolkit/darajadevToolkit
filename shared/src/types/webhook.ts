// M-Pesa STK Push Callback Types
export interface MpesaSTKCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

// M-Pesa C2B Callback Types
export interface MpesaC2BCallback {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  InvoiceNumber: string;
  OrgAccountBalance: string;
  ThirdPartyTransID: string;
  MSISDN: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
}

// Generic M-Pesa Response
export interface MpesaResponse {
  ResultCode: number;
  ResultDesc: string;
}

// Webhook Event Types
export type WebhookEventType =
  | "stk_push_result"
  | "c2b_confirmation"
  | "c2b_validation"
  | "timeout";

// Internal Webhook Processing
export interface WebhookPayload {
  id: string;
  userId: string;
  eventType: WebhookEventType;
  payload: MpesaSTKCallback | MpesaC2BCallback;
  receivedAt: Date;
  environment: "dev" | "staging" | "production";
}

// Delivery Status
export type DeliveryStatus =
  | "pending"
  | "delivered"
  | "failed"
  | "retrying"
  | "dead_letter";

export interface DeliveryAttempt {
  id: string;
  webhookId: string;
  targetUrl: string;
  status: DeliveryStatus;
  responseCode?: number;
  responseBody?: string;
  attemptedAt: Date;
  errorMessage?: string;
}
