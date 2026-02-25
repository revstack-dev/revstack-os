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

Replace your Vercel `streamText` call with `revstackStreamText` inside your Next.js Route Handler.

```typescript
// app/api/chat/route.ts
import { revstackStreamText } from "@revstackhq/ai";
import { openai } from "@ai-sdk/openai";

// 1. You could use @revstackhq/next, or just use `fetch` directly!
import { trackUsage } from "@revstackhq/next/server";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await revstackStreamText({
    model: openai("gpt-4o"),
    messages,
    // 1. Add the revstack callback to define the side effect
    revstack: {
      trackUsage: async (usage) => {
        await trackUsage("ai_tokens", usage, {
          secretKey: process.env.REVSTACK_SECRET_KEY!,
        });
      },
    },
    // 2. Your original onFinish still fires!
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
3. `@revstackhq/ai` intercepts this event, extracts the `model.id` and token counts.
4. It calls your injected `trackUsage` callback, which can route the ledger deduction anywhere.
5. If you provided an `onFinish` handler, it runs sequentially afterward.

_This offloads the complex math of "how many credits should GPT-4o cost vs Claude 3.5 Sonnet" entirely to your Revstack product configuration._
