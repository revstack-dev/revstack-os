import { BaseClient } from "@/modules/base";
import {
  BalanceResponse,
  GrantBalanceParams,
  RevokeBalanceParams,
} from "@/types";

/**
 * Client for managing customer wallet balances.
 * Supports granting credits (bonuses, top-ups) and revoking them (refunds, penalties).
 *
 * @example
 * ```typescript
 * // Grant a welcome bonus
 * await revstack.wallets.grantBalance({
 *   customerId: "usr_abc",
 *   currency: "USD",
 *   amount: 10.00,
 *   description: "Welcome bonus",
 * });
 *
 * // Check remaining balance
 * const { amount } = await revstack.wallets.getBalance("usr_abc", "USD");
 * ```
 */
export class WalletsClient extends BaseClient {
  /**
   * Retrieve a customer's balance for a specific currency.
   *
   * @param customerId - The customer whose balance to query.
   * @param currency - ISO 4217 currency code (e.g. `USD`).
   * @returns The balance response with currency and amount.
   */
  async getBalance(
    customerId: string,
    currency: string
  ): Promise<BalanceResponse> {
    return this.request<BalanceResponse>(`/wallets/${customerId}/${currency}`, {
      method: "GET",
    });
  }

  /**
   * List all balances across all currencies for a customer.
   *
   * @param customerId - The customer whose balances to list.
   * @returns Array of balance responses (one per currency).
   */
  async listBalances(customerId: string): Promise<BalanceResponse[]> {
    return this.request<BalanceResponse[]>(`/wallets/${customerId}`, {
      method: "GET",
    });
  }

  /**
   * Grant (add) credit to a customer's wallet.
   *
   * @param params - Grant parameters including amount, currency, and description.
   * @returns The updated balance after the grant.
   */
  async grantBalance(params: GrantBalanceParams): Promise<BalanceResponse> {
    return this.request<BalanceResponse>("/wallets/grant", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Revoke (deduct) credit from a customer's wallet.
   * Used for manual deductions, penalties, or credit refunds.
   *
   * @param params - Revoke parameters including amount, currency, and audit reason.
   * @returns The updated balance after the deduction.
   */
  async revokeBalance(params: RevokeBalanceParams): Promise<BalanceResponse> {
    return this.request<BalanceResponse>("/wallets/revoke", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
}
