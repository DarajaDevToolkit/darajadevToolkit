import axios from "axios";
import type {
  WebhookPayload,
  DeliveryAttempt,
  DeliveryStatus,
} from "@daraja-toolkit/shared";

export class WebhookDeliveryService {
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1 second

  constructor(maxRetries?: number, baseRetryDelay?: number) {
    this.maxRetries = maxRetries || 3;
    this.baseRetryDelay = baseRetryDelay || 1000;
  }

  async deliverWebhook(
    webhookPayload: WebhookPayload,
    targetUrl: string
  ): Promise<DeliveryAttempt> {
    const deliveryAttempt: DeliveryAttempt = {
      id: this.generateId(),
      webhookId: webhookPayload.id,
      targetUrl,
      status: "pending",
      attemptedAt: new Date(),
    };

    try {
      console.log(`🚀 Delivering webhook ${webhookPayload.id} to ${targetUrl}`);

      const response = await axios.post(targetUrl, webhookPayload.payload, {
        timeout: 25000, // 25 seconds (leave 5 seconds buffer for M-Pesa's 30s limit)
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Daraja-Toolkit/1.0",
          "X-Webhook-Event": webhookPayload.eventType,
          "X-Webhook-ID": webhookPayload.id,
          "X-Webhook-Timestamp": this.formatTimestamp(
            webhookPayload.receivedAt
          ),
        },
      });

      deliveryAttempt.status = "delivered";
      deliveryAttempt.responseCode = response.status;
      deliveryAttempt.responseBody = JSON.stringify(response.data);

      console.log(
        `✅ Webhook ${webhookPayload.id} delivered successfully (${response.status})`
      );
    } catch (error: any) {
      deliveryAttempt.status = "failed";
      deliveryAttempt.errorMessage = error.message;

      if (error.response) {
        deliveryAttempt.responseCode = error.response.status;
        deliveryAttempt.responseBody = JSON.stringify(error.response.data);
      }

      console.error(
        `❌ Webhook ${webhookPayload.id} delivery failed:`,
        error.message
      );
    }

    return deliveryAttempt;
  }

  async deliverWithRetries(
    webhookPayload: WebhookPayload,
    targetUrl: string
  ): Promise<DeliveryAttempt[]> {
    const attempts: DeliveryAttempt[] = [];

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const deliveryAttempt = await this.deliverWebhook(
        webhookPayload,
        targetUrl
      );
      attempts.push(deliveryAttempt);

      if (deliveryAttempt.status === "delivered") {
        console.log(`✅ Webhook delivered on attempt ${attempt + 1}`);
        break;
      }

      // If not the last attempt, wait before retrying
      if (attempt < this.maxRetries - 1) {
        const delay = this.calculateRetryDelay(attempt);
        console.log(
          `⏳ Retrying in ${delay}ms (attempt ${attempt + 2}/${
            this.maxRetries
          })`
        );
        await this.sleep(delay);
      }
    }

    const lastAttempt = attempts[attempts.length - 1];
    if (lastAttempt.status === "failed") {
      console.error(
        `💀 Webhook ${webhookPayload.id} failed after ${this.maxRetries} attempts`
      );
      lastAttempt.status = "dead_letter";
    }

    return attempts;
  }

  private calculateRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return this.baseRetryDelay * Math.pow(2, attemptNumber);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Safely format timestamp - handles Date objects, strings, or undefined values
   */
  private formatTimestamp(timestamp: Date | string | undefined): string {
    if (!timestamp) {
      return new Date().toISOString();
    }

    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }

    if (typeof timestamp === "string") {
      try {
        return new Date(timestamp).toISOString();
      } catch (error) {
        console.warn("Invalid timestamp format:", timestamp);
        return new Date().toISOString();
      }
    }

    // Fallback to current time
    return new Date().toISOString();
  }
}
