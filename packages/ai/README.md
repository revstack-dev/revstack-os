<div align="center">
  <h1>@revstackhq/ai</h1>
  <p>A seamless metering wrapper for the Vercel AI SDK.</p>
</div>

If you are building an AI native application, this package is the fastest way to monetize it. It wraps the official `@ai-sdk` functions, intercepts token consumption, and reports exactly what model and how many tokens were used—without breaking your streams.

## Key Features

- **Zero Friction:** Drop-in replacements for `streamText` and `generateText`.
- **Smart Backend:** We transmit the raw usage (`promptTokens`, `completionTokens`, `modelId`), and Revstack Cloud calculates the exact credit deduction based on your configured margins and model pricing.
- **Non-Blocking:** Usage tracking occurs transparently and never delays the user's stream.

## Installation

```bash
npm install @revstackhq/ai ai
```

## Quick Start

### 1. Configure Revstack Once (IoC)

Create a pre-configured instance of the AI wrapper in your app. Pass a `trackUsage` callback so `@revstackhq/ai` can report usage without knowing about your framework.

```typescript
// lib/revstack.ts
import { trackUsage } from "@revstackhq/next/server";
import { createRevstackAI } from "@revstackhq/ai";

export const revstack = createRevstackAI(
  { secretKey: process.env.REVSTACK_SECRET_KEY! },
  async (key, usage, config) => {
    // This fires every time a stream or generation completes
    await trackUsage(key, usage, config);
  }
);
```

### 2. Replace `streamText` and `generateText`

Import your pre-configured instance instead of the base Vercel functions. You now only need to provide an `entitlementKey`.

```typescript
// app/api/chat/route.ts
import { revstack } from "@/lib/revstack";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await revstack.streamText({
    model: openai("gpt-4o"),
    messages,
    entitlementKey: "ai_tokens", // Triggers metering automatically
    // Your original onFinish still fires!
    async onFinish(event) {
      console.log("Stream completed locally, and usage was already tracked.");
    },
  });

  return result.toDataStreamResponse();
}
```

## How It Works

When a user streams a generation:

1. The stream begins sending chunks to the client instantly.
2. Vercel's internal `onFinish` event fires when the stream ends.
3. Your pre-configured `revstack.streamText` wrapper intercepts this event, extracting the `model.id` and exact token split.
4. It calls your injected `trackUsage` callback, transmitting the raw payload (e.g. `promptTokens: 10, completionTokens: 50`) to your backend.
5. If you provided an `onFinish` handler, it runs sequentially afterward.

_This offloads the complex math of "how many credits should GPT-4o cost vs Claude 3.5 Sonnet" entirely to your Revstack product configuration._
