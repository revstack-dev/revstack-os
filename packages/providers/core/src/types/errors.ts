/**
 * Catálogo completo de errores estandarizados para Revstack.
 * Agrupados por dominio para facilitar su manejo en el Frontend/API.
 */
export enum RevstackErrorCode {
  // --- 1. GENERIC & SYSTEM ---
  UnknownError = "unknown_error",
  InternalError = "internal_error",
  NotImplemented = "not_implemented", // Para features opcionales no soportadas por un provider
  Timeout = "timeout",
  RateLimitExceeded = "rate_limit_exceeded",

  // --- 2. AUTHENTICATION & CONFIG ---
  InvalidCredentials = "invalid_credentials", // API Key incorrecta
  Unauthorized = "unauthorized", // No tiene permisos
  MisconfiguredProvider = "misconfigured_provider", // Faltan campos en el dashboard
  AccountSuspended = "account_suspended", // La cuenta del merchant en Stripe/etc está bloqueada

  // --- 3. INPUT VALIDATION ---
  InvalidInput = "invalid_input",
  MissingRequiredField = "missing_required_field",
  InvalidEmail = "invalid_email",
  InvalidAmount = "invalid_amount", // Monto negativo o cero
  InvalidCurrency = "invalid_currency", // Provider no soporta esa moneda

  // --- 4. RESOURCES (CRUD) ---
  ResourceNotFound = "resource_not_found",
  ResourceAlreadyExists = "resource_already_exists",
  IdempotencyKeyConflict = "idempotency_key_conflict",

  // --- 5. TRANSACTIONS (PAYMENTS) ---
  PaymentFailed = "payment_failed", // Fallo genérico
  CardDeclined = "card_declined", // El banco rechazó la tarjeta
  InsufficientFunds = "insufficient_funds", // No hay saldo
  ExpiredCard = "expired_card",
  IncorrectCvc = "incorrect_cvc",
  AuthenticationRequired = "authentication_required", // Requiere 3D Secure / SCA
  LimitExceeded = "limit_exceeded", // Límite de la tarjeta excedido
  DuplicateTransaction = "duplicate_transaction",

  // --- 6. SUBSCRIPTIONS ---
  SubscriptionNotFound = "subscription_not_found",
  SubscriptionAlreadyActive = "subscription_already_active",
  SubscriptionCancelled = "subscription_cancelled", // Intentar operar sobre una cancelada
  PlanNotFound = "plan_not_found",

  // --- 7. DISPUTES & REFUNDS ---
  RefundFailed = "refund_failed",
  DisputeLost = "dispute_lost",

  // --- 8. PROVIDER SPECIFIC ---
  ProviderUnavailable = "provider_unavailable", // Stripe está caído
  ProviderRejected = "provider_rejected", // El provider rechazó la conexión (ej: riesgo alto)
  WebhookSignatureVerificationFailed = "webhook_signature_verification_failed",
}

/**
 * Estructura del Error.
 * Extendemos la clase nativa 'Error' para mantener el stack trace
 * y permitir 'instanceof RevstackError'.
 */
export class RevstackError extends Error {
  public readonly code: RevstackErrorCode;
  public readonly provider?: string; // Slug del provider (ej: 'stripe')
  public readonly cause?: any; // El error original del SDK (raw)
  public readonly statusCode: number; // Sugerencia de HTTP Status Code
  public readonly documentationUrl?: string;

  constructor(opts: {
    code: RevstackErrorCode;
    message: string;
    provider?: string;
    cause?: any;
    documentationUrl?: string;
  }) {
    super(opts.message);

    // Necesario para que 'instanceof' funcione en TS al transpilar a ES5
    Object.setPrototypeOf(this, RevstackError.prototype);
    this.name = "RevstackError";

    this.code = opts.code;
    this.provider = opts.provider;
    this.cause = opts.cause;
    this.documentationUrl = opts.documentationUrl;
    this.statusCode = this.mapToStatusCode(opts.code);
  }

  /**
   * Mapea el código de error interno a un HTTP Status Code estándar.
   * Útil para que la API responda correctamente sin lógica extra en el controller.
   */
  private mapToStatusCode(code: RevstackErrorCode): number {
    switch (code) {
      // 400 Bad Request
      case RevstackErrorCode.InvalidInput:
      case RevstackErrorCode.MissingRequiredField:
      case RevstackErrorCode.InvalidEmail:
      case RevstackErrorCode.InvalidAmount:
      case RevstackErrorCode.InvalidCurrency:
      case RevstackErrorCode.PaymentFailed: // Fallo de negocio, no del server
      case RevstackErrorCode.CardDeclined:
      case RevstackErrorCode.InsufficientFunds:
      case RevstackErrorCode.ExpiredCard:
      case RevstackErrorCode.IncorrectCvc:
        return 400;

      // 401 Unauthorized
      case RevstackErrorCode.InvalidCredentials:
      case RevstackErrorCode.Unauthorized:
      case RevstackErrorCode.WebhookSignatureVerificationFailed:
        return 401;

      // 402 Payment Required (Especialmente útil para SCA/3DS)
      case RevstackErrorCode.AuthenticationRequired:
        return 402;

      // 403 Forbidden
      case RevstackErrorCode.AccountSuspended:
      case RevstackErrorCode.ProviderRejected:
        return 403;

      // 404 Not Found
      case RevstackErrorCode.ResourceNotFound:
      case RevstackErrorCode.SubscriptionNotFound:
      case RevstackErrorCode.PlanNotFound:
        return 404;

      // 409 Conflict
      case RevstackErrorCode.ResourceAlreadyExists:
      case RevstackErrorCode.IdempotencyKeyConflict:
      case RevstackErrorCode.SubscriptionAlreadyActive:
        return 409;

      // 429 Too Many Requests
      case RevstackErrorCode.RateLimitExceeded:
        return 429;

      // 501 Not Implemented
      case RevstackErrorCode.NotImplemented:
        return 501;

      // 502 Bad Gateway (Culpa del provider)
      case RevstackErrorCode.ProviderUnavailable:
      case RevstackErrorCode.Timeout:
        return 502;

      // 500 Internal Server Error (Default)
      default:
        return 500;
    }
  }
}

/**
 * Helper factory para compatibilidad con código funcional o uso rápido.
 */
export function createError(
  code: RevstackErrorCode,
  message: string,
  provider?: string,
  cause?: any,
): RevstackError {
  return new RevstackError({ code, message, provider, cause });
}

/**
 * Type Guard para verificar si un error es de Revstack.
 */
export function isRevstackError(error: unknown): error is RevstackError {
  return error instanceof RevstackError;
}
