export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  // Webhook URLs for different environments
  webhookUrls: {
    dev?: string;
    staging?: string;
    production?: string;
  };

  // Security settings
  security: {
    ipWhitelist: "strict" | "loose" | "disabled";
    enableBasicAuth: boolean;
    basicAuthCredentials?: {
      username: string;
      password: string;
    };
  };

  // Retry settings
  delivery: {
    maxRetries: number;
    retryDelayMs: number;
    timeoutMs: number;
  };

  // Notification preferences
  notifications: {
    emailOnFailure: boolean;
    webhookHealthCheck: boolean;
    dailyReport: boolean;
  };
}

export interface UserApiKey {
  id: string;
  userId: string;
  name: string;
  keyPreview: string; // First 8 chars + "..."
  hashedKey: string;
  createdAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
}
