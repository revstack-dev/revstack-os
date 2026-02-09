import { RevstackError } from "@/types/errors";

export interface InstallInput {
  config: Record<string, any>;
  /**
   * The absolute URL where Revstack expects to receive events for this merchant.
   */
  webhookUrl: string;
}

export interface InstallResult {
  success: boolean;
  data?: Record<string, any>;
  error?: RevstackError;
}

export interface UninstallInput {
  config: Record<string, any>;
  data: Record<string, any>;
}

export interface UninstallResult {
  success: boolean;
  error?: RevstackError;
}
