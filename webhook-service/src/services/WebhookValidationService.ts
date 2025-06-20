import {
  validateMpesaSTKPayload,
  validateMpesaC2BPayload,
  detectWebhookType,
  isValidMpesaIP,
} from "@daraja-toolkit/shared";

export interface ValidationResult {
  isValid: boolean;
  webhookType?: string;
  error?: string;
}

export class WebhookValidationService {
  /**
   * Validate incoming webhook payload and IP
   */
  async validateWebhook(
    payload: any,
    clientIP: string
  ): Promise<ValidationResult> {
    // Step 1: IP validation (non-blocking warning for now)
    if (!isValidMpesaIP(clientIP)) {
      console.warn(`Suspicious IP detected: ${clientIP}`);
      // Log but don't block - we'll improve this later
    }

    // Step 2: Validate payload structure
    const webhookType = detectWebhookType(payload);
    if (!webhookType) {
      return {
        isValid: false,
        error: "Invalid webhook payload structure",
      };
    }

    // Step 3: Validate specific webhook type
    let isValidPayload = false;

    switch (webhookType) {
      case "stk_push_result":
        isValidPayload = validateMpesaSTKPayload(payload);
        break;
      case "c2b_confirmation":
      case "c2b_validation":
        isValidPayload = validateMpesaC2BPayload(payload);
        break;
      default:
        return {
          isValid: false,
          error: `Unsupported webhook type: ${webhookType}`,
        };
    }

    if (!isValidPayload) {
      return {
        isValid: false,
        error: `Invalid payload format for ${webhookType}`,
      };
    }

    return {
      isValid: true,
      webhookType,
    };
  }

  /**
   * Validate webhook signature (future enhancement)
   */
  async validateSignature(
    payload: string,
    signature: string
  ): Promise<boolean> {
    // TODO: Implement signature validation
    return true;
  }
}
