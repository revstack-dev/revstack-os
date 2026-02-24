# @revstackhq/auth

The official authentication bridge for Revstack. Verifies incoming JWTs from supported identity providers using a unified contract.

## Features

- **Supported Providers:** Auth0, Clerk, Supabase, Amazon Cognito, Firebase, and Custom JWTs.
- **Provider-Agnostic Verification:** Use a single `RevstackAuth` instance to verify tokens regardless of the provider strategy (RS256 via JWKS or HS256 via shared secret).
- **Strongly Typed Sessions:** Generics support for typed JWT claims.
- **Detailed Error Handling:** Specific error codes (`AuthErrorCode`) for token expiration, signature mismatches, network issues, etc.
- **JWKS Cache Control:** Full control over `jose` remote JWKS caching and timeouts.

## Installation

```bash
npm install @revstackhq/auth
```

## Usage

### 1. Build a Contract

Define your provider configuration once. This creates a `RevstackAuthContract`.

```typescript
import { buildAuthContract } from "@revstackhq/auth";

// Example: Clerk (RS256)
const clerkContract = buildAuthContract("clerk", {
  issuerUrl: "https://clerk.your-domain.com",
  userIdClaim: "sub", // Optional override
});

// Example: Custom JWT (HS256)
const customContract = buildAuthContract("custom", {
  signingSecret: process.env.JWT_SECRET!,
  issuer: "https://api.myapp.com",
});
```

### 2. Verify Tokens

Use the contract to initialize the verifier. It handles JWKS fetching and signature validation transparently.

```typescript
import { RevstackAuth, AuthErrorCode } from "@revstackhq/auth";

const auth = new RevstackAuth(clerkContract, {
  jwksCache: { cacheMaxAge: 600000 }, // Optional: pass jose JWKS options
});

// In your API handler or middleware
const session = await auth.validate(req.headers.authorization);

if (!session.isValid) {
  if (session.errorCode === AuthErrorCode.TOKEN_EXPIRED) {
    return res
      .status(401)
      .json({ error: "Token expired. Please log in again." });
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// Strongly typed claims
console.log(session.userId);
```

## License

MIT
