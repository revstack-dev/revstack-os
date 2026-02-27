import { Address } from "@/types/models/shared";
import { PaymentMethodDetails } from "@/types/models/payment";

// =============================================================================
// CUSTOMER MODELS
// =============================================================================

export type Customer = {
  /** revstack customer id. */
  id: string;
  /** provider slug (e.g. "stripe") */
  providerId: string;
  /** external customer id. */
  externalId: string;
  /** customer email */
  email: string;
  /** customer full name */
  name?: string;
  /** customer phone */
  phone?: string;
  /** custom metadata */
  metadata?: Record<string, any>;
  /** created at iso */
  createdAt: string;
  /** deleted flag */
  deleted?: boolean;
};

export type PaymentMethod = {
  /** revstack payment method id */
  id: string;
  /** revstack customer id. */
  customerId: string;
  /** external payment method id. */
  externalId: string;
  /** payment method type */
  type: "card" | "bank_transfer" | "wallet";
  /** Detailed payment method metadata. */
  details: PaymentMethodDetails;
  /** is default flag */
  isDefault: boolean;
  /** custom metadata */
  metadata?: Record<string, any>;
};

// =============================================================================
// CUSTOMER INPUTS
// =============================================================================

export type CreateCustomerInput = {
  /** customer email */
  email: string;
  /** customer full name */
  name?: string;
  /** customer phone */
  phone?: string;
  /** optional description */
  description?: string;
  /** billing address */
  address?: Address;
  /** custom metadata */
  metadata?: Record<string, any>;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type SetupPaymentMethodInput = {
  /** revstack customer id. */
  customerId: string;
  /** redirect return url */
  returnUrl: string;
  /** custom metadata */
  metadata?: Record<string, any>;
};
