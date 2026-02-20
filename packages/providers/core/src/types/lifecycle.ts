import { RevstackError } from "@/types/errors";

export interface InstallInput {
  config: Record<string, unknown>;
  /**
   * The absolute URL where Revstack expects to receive events for this merchant.
   */
  webhookUrl: string;
}

export interface InstallResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: RevstackError;
}

export interface UninstallInput {
  config: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface UninstallResult {
  success: boolean;
  error?: RevstackError;
}
