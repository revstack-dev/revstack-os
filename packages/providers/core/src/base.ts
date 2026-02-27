import { ProviderManifest } from "@/manifest";
import { ProviderContext } from "@/context";
import { InstallInput, InstallResult, UninstallInput } from "@/types/lifecycle";
import { RevstackEvent, WebhookResponse } from "@/types/events";
import { IProvider } from "@/interfaces/features";
import {
  CreatePaymentInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  CheckoutSessionInput,
  CheckoutSessionResult,
  BillingPortalInput,
  BillingPortalResult,
  SetupPaymentMethodInput,
  CreateCustomerInput,
  Customer,
  PaginatedResult,
  PaginationOptions,
  Payment,
  PaymentMethod,
  RefundPaymentInput,
  Subscription,
  UpdateCustomerInput,
  AsyncActionResult,
  PriceInput,
  Price,
  Addon,
  CreateAddonInput,
  UpdateAddonInput,
  DeleteAddonInput,
  ProductInput,
  Product,
} from "@/types/models";
import { RevstackErrorCode } from "@/types/errors";

export abstract class BaseProvider implements IProvider {
  private notImplemented(methodName: string): AsyncActionResult<any> {
    return {
      data: null,
      status: "failed",
      error: {
        code: RevstackErrorCode.NotImplemented,
        message: `Provider '${this.manifest.slug}' does not support ${methodName}.`,
      },
    };
  }

  // --- FEATURES ---

  async getPayment(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Payment>> {
    return this.notImplemented("getPayment");
  }

  async refundPayment(
    ctx: ProviderContext,
    input: RefundPaymentInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("refundPayment");
  }

  async listPayments(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Payment>>> {
    return this.notImplemented("listPayments");
  }

  async capturePayment(
    ctx: ProviderContext,
    id: string,
    amount?: number,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("capturePayment");
  }

  async getSubscription(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Subscription>> {
    return this.notImplemented("getSubscription");
  }

  async createCustomer(
    ctx: ProviderContext,
    input: CreateCustomerInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("createCustomer");
  }

  async updateCustomer(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("updateCustomer");
  }

  async deleteCustomer(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<boolean>> {
    return this.notImplemented("deleteCustomer");
  }

  async getCustomer(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Customer>> {
    return this.notImplemented("getCustomer");
  }

  async listPaymentMethods(
    ctx: ProviderContext,
    customerId: string,
  ): Promise<AsyncActionResult<PaymentMethod[]>> {
    return this.notImplemented("listPaymentMethods");
  }

  async deletePaymentMethod(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<boolean>> {
    return this.notImplemented("deletePaymentMethod");
  }

  abstract readonly manifest: ProviderManifest;

  // --- LIFECYCLE ---

  abstract onInstall(
    ctx: ProviderContext,
    input: InstallInput,
  ): Promise<AsyncActionResult<InstallResult>>;

  abstract onUninstall(
    ctx: ProviderContext,
    input: UninstallInput,
  ): Promise<AsyncActionResult<boolean>>;

  // --- WEBHOOKS ---

  abstract verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<AsyncActionResult<boolean>>;

  abstract parseWebhookEvent(
    ctx: ProviderContext,
    payload: any,
  ): Promise<AsyncActionResult<RevstackEvent | null>>;

  async getWebhookResponse(
    ctx: ProviderContext,
  ): Promise<AsyncActionResult<WebhookResponse>> {
    return {
      data: {
        statusCode: 200,
        body: { received: true },
      },
      status: "success",
    };
  }

  // --- PAYMENT / SUBSCRIPTION / CHECKOUT (Optional Overrides) ---

  async createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("createPayment");
  }

  async createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("createSubscription");
  }

  async cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("cancelSubscription");
  }

  async pauseSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("pauseSubscription");
  }

  async resumeSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("resumeSubscription");
  }

  async createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<AsyncActionResult<CheckoutSessionResult>> {
    return this.notImplemented("createCheckoutSession");
  }

  async setupPaymentMethod(
    ctx: ProviderContext,
    input: SetupPaymentMethodInput,
  ): Promise<AsyncActionResult<CheckoutSessionResult>> {
    return this.notImplemented("setupPaymentMethod");
  }

  async createBillingPortalSession(
    ctx: ProviderContext,
    input: BillingPortalInput,
  ): Promise<AsyncActionResult<BillingPortalResult>> {
    return this.notImplemented("createBillingPortalSession");
  }

  async listSubscriptions(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Subscription>>> {
    return this.notImplemented("listSubscriptions");
  }

  async updateSubscription(
    ctx: ProviderContext,
    id: string,
    input: UpdateSubscriptionInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("updateSubscription");
  }

  async listCustomers(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Customer>>> {
    return this.notImplemented("listCustomers");
  }

  // --- CATALOG (Optional Overrides) ---

  async createProduct(
    ctx: ProviderContext,
    input: ProductInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("createProduct");
  }

  async getProduct(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Product>> {
    return this.notImplemented("getProduct");
  }

  async listProducts(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Product>>> {
    return this.notImplemented("listProducts");
  }

  async updateProduct(
    ctx: ProviderContext,
    id: string,
    input: Partial<ProductInput>,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("updateProduct");
  }

  async deleteProduct(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<boolean>> {
    return this.notImplemented("deleteProduct");
  }

  async createPrice(
    ctx: ProviderContext,
    input: PriceInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("createPrice");
  }

  async getPrice(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Price>> {
    return this.notImplemented("getPrice");
  }

  async listPrices(
    ctx: ProviderContext,
    productId: string,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Price>>> {
    return this.notImplemented("listPrices");
  }

  // --- ADDONS (Optional Overrides) ---

  async createAddon(
    ctx: ProviderContext,
    input: CreateAddonInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("createAddon");
  }

  async getAddon(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Addon>> {
    return this.notImplemented("getAddon");
  }

  async updateAddon(
    ctx: ProviderContext,
    id: string,
    input: UpdateAddonInput,
  ): Promise<AsyncActionResult<string>> {
    return this.notImplemented("updateAddon");
  }

  async deleteAddon(
    ctx: ProviderContext,
    input: DeleteAddonInput,
  ): Promise<AsyncActionResult<boolean>> {
    return this.notImplemented("deleteAddon");
  }

  async listAddons(
    ctx: ProviderContext,
    subscriptionId: string,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Addon>>> {
    return this.notImplemented("listAddons");
  }
}
