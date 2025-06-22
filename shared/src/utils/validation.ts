// Validation utilities for M-Pesa webhooks
import {
  MpesaSTKCallback,
  MpesaC2BCallback,
  WebhookEventType,
} from "../types/webhook";

export function validateMpesaSTKPayload(
  payload: any
): payload is MpesaSTKCallback {
  return (
    payload &&
    payload.Body &&
    payload.Body.stkCallback &&
    typeof payload.Body.stkCallback.MerchantRequestID === "string" &&
    typeof payload.Body.stkCallback.CheckoutRequestID === "string" &&
    typeof payload.Body.stkCallback.ResultCode === "number" &&
    typeof payload.Body.stkCallback.ResultDesc === "string"
  );
}

export function validateMpesaC2BPayload(
  payload: any
): payload is MpesaC2BCallback {
  return (
    payload &&
    typeof payload.TransactionType === "string" &&
    typeof payload.TransID === "string" &&
    typeof payload.TransTime === "string" &&
    typeof payload.TransAmount === "string" &&
    typeof payload.BusinessShortCode === "string"
  );
}

export function detectWebhookType(payload: any): WebhookEventType | null {
  if (validateMpesaSTKPayload(payload)) {
    return "stk_push_result";
  }

  if (validateMpesaC2BPayload(payload)) {
    // Check if it's validation or confirmation based on endpoint or headers
    return "c2b_confirmation"; // Default to confirmation
  }

  return null;
}

// Known M-Pesa IP ranges (update as needed)
export const MPESA_IP_RANGES = [
  "196.201.214.0/24",
  "196.201.215.0/24",
  "196.201.216.0/24",
  "196.201.217.0/24",
];

// npm ip range check - its a package to check if an IP is in a range, but you can implement your own logic

export function isValidMpesaIP(
  ip: string,
  strictMode: boolean = false
): boolean {
  // For development, allow bypass
  if (process.env.NODE_ENV === "development" && !strictMode) {
    return true;
  }

  // TODO: Implement proper IP range checking
  // For now, just check if it's not localhost
  return !ip.includes("127.0.0.1") && !ip.includes("::1");
}

// Here is an Idea of how to implement the above
// function validateMpesaIP(req) {
//   const clientIP = req.ip

//   // In production, validate IP
//   if (process.env.MPESA_ENV === 'production') {
//     return MPESA_PRODUCTION_IPS.some(range =>
//       ipInRange(clientIP, range)
//     )
//   }

//   // In sandbox, allow any IP
//   return true
// }
