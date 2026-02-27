import { ProrationBehavior } from "@/types/models/shared";

// =============================================================================
// ADDON MODELS
// =============================================================================

export type Addon = {
  /** revstack addon id */
  id: string;
  /** provider slug (e.g. "stripe") */
  providerId: string;
  /** external addon id or subscription item id */
  externalId: string;

  /** subscription this addon belongs to */
  subscriptionId: string;
  /** customer this addon belongs to */
  customerId: string;

  /** product or external price id */
  priceId: string;

  /** quantity */
  quantity: number;

  /** created iso date */
  createdAt: string;

  /** custom metadata */
  metadata?: Record<string, any>;
  /** raw provider payload */
  raw: any;
};

// =============================================================================
// ADDON INPUTS
// =============================================================================

export type CreateAddonInput = {
  /** subscription to add this to */
  subscriptionId: string;
  /** customer id */
  customerId: string;

  /** external price id for the addon */
  priceId: string;

  /** quantity (default: 1) */
  quantity?: number;

  /** custom metadata */
  metadata?: Record<string, any>;
  /** proration behavior */
  prorationBehavior?: ProrationBehavior;
};

export type UpdateAddonInput = {
  /** new quantity */
  quantity?: number;
  /** new price id */
  priceId?: string;
  /** custom metadata */
  metadata?: Record<string, any>;
  /** proration behavior */
  prorationBehavior?: ProrationBehavior;
};

export type DeleteAddonInput = {
  /** addon id */
  id: string;
  /** proration behavior */
  prorationBehavior?: ProrationBehavior;
};
