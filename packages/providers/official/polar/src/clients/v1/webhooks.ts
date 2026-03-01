import {
  ProviderContext,
  InstallResult,
  RevstackEvent,
  AsyncActionResult,
} from "@revstackhq/providers-core";
import { WebhookEventType } from "@polar-sh/sdk/models/components/webhookeventtype.js";
import { validateEvent } from "@polar-sh/sdk/webhooks.js";
import { getOrCreatePolar } from "@/clients/v1/shared";
import { EVENT_MAP } from "@/maps/event-map";

export const validateCredentials = async (
  ctx: ProviderContext,
): Promise<AsyncActionResult<boolean>> => {
  if (!ctx.config.accessToken || !ctx.config.organizationId) {
    return { data: false, status: "success" };
  }

  try {
    const polar = getOrCreatePolar(ctx.config.accessToken as string);
    await polar.organizations.list({});
    return { data: true, status: "success" };
  } catch {
    return { data: false, status: "failed" };
  }
};

export const setupWebhooks = async (
  ctx: ProviderContext,
  webhookUrl: string,
): Promise<AsyncActionResult<InstallResult>> => {
  const polar = getOrCreatePolar(ctx.config.accessToken as string);

  try {
    const events: WebhookEventType[] = [
      "checkout.created",
      "checkout.updated",
      "checkout.expired",
      "customer.created",
      "customer.updated",
      "customer.deleted",
      "customer.state_changed",
      "order.created",
      "order.updated",
      "order.paid",
      "order.refunded",
      "subscription.created",
      "subscription.updated",
      "subscription.active",
      "subscription.canceled",
      "subscription.uncanceled",
      "subscription.revoked",
      "subscription.past_due",
      "refund.created",
      "refund.updated",
      "product.created",
      "product.updated",
    ];

    const webhooksList = await polar.webhooks.listWebhookEndpoints({
      organizationId: ctx.config.organizationId as string,
      limit: 100,
    });
    const existingWebhook = webhooksList.result.items.find(
      (wh) => wh.url === webhookUrl,
    );

    let webhookEndpointId: string;
    let secret: string | undefined;

    if (existingWebhook) {
      const updated = await polar.webhooks.updateWebhookEndpoint({
        id: existingWebhook.id,
        webhookEndpointUpdate: {
          url: webhookUrl,
          format: "raw",
          events,
        },
      });
      webhookEndpointId = updated.id;
      secret = undefined;
    } else {
      const created = await polar.webhooks.createWebhookEndpoint({
        url: webhookUrl,
        format: "raw",
        events,
        name: "Revstack",
      });
      webhookEndpointId = created.id;
      secret = created.secret;
    }

    const data: Record<string, any> = {
      webhookEndpointId,
      accessToken: ctx.config.accessToken,
      organizationId: ctx.config.organizationId,
    };

    if (secret) {
      data.webhookSecret = secret;
    }

    return {
      data: { success: true, data },
      status: "success",
    };
  } catch (error: any) {
    return {
      data: { success: false, data: {} },
      status: "failed",
      error: { code: "UNKNOWN_ERROR", message: error.message },
    };
  }
};

export const removeWebhooks = async (
  ctx: ProviderContext,
  webhookId: string,
): Promise<AsyncActionResult<boolean>> => {
  const polar = getOrCreatePolar(ctx.config.accessToken as string);
  try {
    await polar.webhooks.deleteWebhookEndpoint({ id: webhookId });
    return { data: true, status: "success" };
  } catch (error: unknown) {
    return { data: false, status: "failed" };
  }
};

export const verifyWebhookSignature = async (
  _ctx: ProviderContext,
  payload: string | Buffer,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
): Promise<AsyncActionResult<boolean>> => {
  try {
    const normalizedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (v)
        normalizedHeaders[k] = Array.isArray(v) ? v[0] || "" : (v as string);
    }

    validateEvent(payload, normalizedHeaders, secret);
    return { data: true, status: "success" };
  } catch (error) {
    return { data: false, status: "failed" };
  }
};

export function extractResourceId(payload: any): string | null {
  const data = payload.data;
  if (!data) return null;

  // For orders, payments or standard entities
  return data.id || null;
}

export const parseWebhookEvent = async (
  payload: any,
): Promise<AsyncActionResult<RevstackEvent | null>> => {
  if (!payload || !payload.type) return { data: null, status: "failed" };

  const mappedType = EVENT_MAP[payload.type as WebhookEventType];
  if (!mappedType) return { data: null, status: "failed" };

  const resourceId = extractResourceId(payload) || payload.id;

  return {
    data: {
      type: mappedType,
      providerEventId: payload.id,
      createdAt: new Date(),
      resourceId,
      originalPayload: payload,
      metadata: { polarType: payload.type },
    },
    status: "success",
  };
};
