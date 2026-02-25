import { streamText, generateText, type LanguageModelUsage } from "ai";
import { trackUsage, type RevstackServerConfig } from "@revstackhq/next/server";

export interface RevstackMeteringOptions {
  /** The entitlement/metering key, e.g., 'ai_tokens' */
  key: string;
  /** Server configuration to authenticate the backend call */
  config: RevstackServerConfig;
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
        await trackUsage(
          revstack.key,
          {
            ai: {
              modelId: modelId || "unknown",
              promptTokens: event.usage.promptTokens,
              completionTokens: event.usage.completionTokens,
              totalTokens: event.usage.totalTokens,
            },
          },
          revstack.config
        );
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
    await trackUsage(
      revstack.key,
      {
        ai: {
          modelId: modelId || "unknown",
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
      },
      revstack.config
    );
  } catch (error) {
    console.error(
      "[@revstackhq/ai] Failed to track usage after generation finish:",
      error
    );
  }

  return result;
}
