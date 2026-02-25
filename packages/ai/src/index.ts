import { streamText, generateText } from "ai";
export interface AIUsageData {
  ai: {
    modelId: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface RevstackMeteringOptions {
  /** Callback fired automatically with the exact token consumption */
  trackUsage: (usage: AIUsageData) => Promise<void> | void;
}

// Ensure the first argument types are dynamically extracted from the ai package
type StreamTextParameters = Parameters<typeof streamText>[0];
type GenerateTextParameters = Parameters<typeof generateText>[0];

/**
 * A seamless metering wrapper around Vercel's `streamText`.
 * Automatically tracks usage and bills AI tokens upon completion.
 */
export async function revstackStreamText(
  options: StreamTextParameters & { revstack: RevstackMeteringOptions }
) {
  const { revstack, onFinish, ...streamOptions } = options;

  return streamText({
    ...streamOptions,
    async onFinish(event) {
      const modelId =
        typeof options.model === "string"
          ? options.model
          : options.model.modelId;

      try {
        await revstack.trackUsage({
          ai: {
            modelId: modelId || "unknown",
            promptTokens: event.usage.promptTokens,
            completionTokens: event.usage.completionTokens,
            totalTokens: event.usage.totalTokens,
          },
        });
      } catch (error) {
        // Usage tracking failed (e.g., ran out of credits).
        // For streaming, the generation is already complete, but we log the error.
        console.error(
          "[@revstackhq/ai] Failed to track usage after stream finish:",
          error
        );
      }

      if (onFinish) {
        await onFinish(event);
      }
    },
  });
}

/**
 * A seamless metering wrapper around Vercel's `generateText`.
 * Automatically tracks usage and bills AI tokens upon completion.
 */
export async function revstackGenerateText(
  options: GenerateTextParameters & { revstack: RevstackMeteringOptions }
) {
  const { revstack, ...generateOptions } = options;

  const result = await generateText(generateOptions);

  const modelId =
    typeof options.model === "string" ? options.model : options.model.modelId;

  try {
    await revstack.trackUsage({
      ai: {
        modelId: modelId || "unknown",
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      },
    });
  } catch (error) {
    console.error(
      "[@revstackhq/ai] Failed to track usage after generation finish:",
      error
    );
  }

  return result;
}

/**
 * Factory to create pre-configured AI generation functions bound to your Revstack project.
 *
 * @example
 * ```ts
 * // lib/revstack.ts
 * import { trackUsage } from "@revstackhq/next/server";
 * import { createRevstackAI } from "@revstackhq/ai";
 *
 * export const revstack = createRevstackAI(
 *   { secretKey: process.env.REVSTACK_SECRET_KEY! },
 *   trackUsage
 * );
 * ```
 */
export function createRevstackAI<TConfig>(
  config: TConfig,
  trackFn: (
    key: string,
    usage: AIUsageData,
    config: TConfig
  ) => Promise<void> | void
) {
  return {
    /**
     * Wraps streamText with automatic usage tracking.
     * Inherits all options from Vercel AI SDK and requires an `entitlementKey`.
     */
    streamText: (
      options: StreamTextParameters & { entitlementKey: string }
    ) => {
      const { entitlementKey, ...streamOptions } = options;
      // We safely cast options because streamText parameter destructuring drops the rest logic
      return revstackStreamText({
        ...(streamOptions as unknown as StreamTextParameters),
        revstack: {
          trackUsage: (usage) => trackFn(entitlementKey, usage, config),
        },
      });
    },

    /**
     * Wraps generateText with automatic usage tracking.
     * Inherits all options from Vercel AI SDK and requires an `entitlementKey`.
     */
    generateText: (
      options: GenerateTextParameters & { entitlementKey: string }
    ) => {
      const { entitlementKey, ...generateOptions } = options;
      // We safely cast options because generateText parameter destructuring drops the rest logic
      return revstackGenerateText({
        ...(generateOptions as unknown as GenerateTextParameters),
        revstack: {
          trackUsage: (usage) => trackFn(entitlementKey, usage, config),
        },
      });
    },
  };
}
