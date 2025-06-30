import { z } from 'zod';

// Environments must match Drizzle enum values
export const settingInputSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  webhookUrl: z.string().url(),
});

export type SettingInput = z.infer<typeof settingInputSchema>;

// For operations requiring an existing setting ID
export const settingParamSchema = z.object({
  id: z.string().uuid(),
});

export type SettingParam = z.infer<typeof settingParamSchema>;
