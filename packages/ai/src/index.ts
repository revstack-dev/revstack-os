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
