import { BaseClient } from "@/modules/base";
import {
  Subscription,
  CreateSubscriptionParams,
  ChangePlanParams,
  ListSubscriptionsParams,
  PaginatedResponse,
} from "@/types";

/**
 * Client for managing customer subscriptions.
 * Handles creating, retrieving, canceling, and upgrading/downgrading subscriptions.
 *
 * @example
 * ```typescript
 * const sub = await revstack.subscriptions.create({
 *   customerId: "usr_abc",
 *   planId: "plan_pro",
 * });
 * ```
 */
export class SubscriptionsClient extends BaseClient {
  constructor(config: { secretKey: string; baseUrl: string; timeout: number }) {
    super(config);
  }

  /**
   * List subscriptions with optional filters.
   *
   * @param params - Filter and pagination parameters.
   * @returns A paginated list of subscriptions.
   */
  async list(
    params?: ListSubscriptionsParams,
  ): Promise<PaginatedResponse<Subscription>> {
    return this.request<PaginatedResponse<Subscription>>(
      `/subscriptions${this.buildQuery(params)}`,
      { method: "GET" },
    );
  }

  /**
   * Retrieve a subscription by ID.
   *
   * @param subscriptionId - The subscription's unique identifier.
   * @returns The subscription record.
   */
  async get(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}`, {
      method: "GET",
    });
  }

  /**
   * Create a new subscription for a customer.
   *
   * @param params - Subscription creation parameters (customerId, planId).
   * @returns The newly created subscription.
   */
  async create(params: CreateSubscriptionParams): Promise<Subscription> {
    return this.request<Subscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Cancel an active subscription. The subscription will remain active until
   * the end of the current billing period.
   *
   * @param subscriptionId - The subscription to cancel.
   * @returns The updated subscription with `canceled` status.
   */
  async cancel(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(
      `/subscriptions/${subscriptionId}/cancel`,
      { method: "POST" },
    );
  }

  /**
   * Change the plan of an existing subscription (upgrade or downgrade).
   * Proration is handled automatically by the billing engine.
   *
   * @param subscriptionId - The subscription to modify.
   * @param params - The new plan and optional price to switch to.
   * @returns The updated subscription.
   */
  async changePlan(
    subscriptionId: string,
    params: ChangePlanParams,
  ): Promise<Subscription> {
    return this.request<Subscription>(
      `/subscriptions/${subscriptionId}/change-plan`,
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
  }
}
