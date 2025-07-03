// Validation utilities for M-Pesa webhooks
import {
  MpesaSTKCallback,
  MpesaC2BCallback,
  WebhookEventType,
} from "../types/webhook";
import CIDR from "ip-cidr";

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


// load from ENV or use defaults
export const MPESA_IP_RANGES = process.env.MPESA_IP_RANGES
  ? process.env.MPESA_IP_RANGES.split(",").map((r) => r.trim()).filter(Boolean)
  : [];

// npm ip range check - its a package to check if an IP is in a range, but you can implement your own logic

/**
 * Returns true if `ip` belongs to any configured M-Pesa CIDR.
 * In development, if strictMode=false, always allow.
 */
export function isValidMpesaIP(
  ip: string,
  strictMode: boolean = false
): boolean {
  // In sandbox or non-production (MPESA_ENV), allow bypass when not strict
  const env = process.env.MPESA_ENV || process.env.NODE_ENV;
  if (env !== "production" && !strictMode) {
    return true;
  }

  for (const range of MPESA_IP_RANGES) {
    try {
      if (new CIDR(range).contains(ip)) {
        return true;
      }
    } catch (err) {
      console.error(`Invalid CIDR in MPESA_IP_RANGES: ${range}`, err);
    }
  }
  return false;
}

