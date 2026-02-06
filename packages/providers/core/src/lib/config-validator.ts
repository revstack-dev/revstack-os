import { RevstackError, RevstackErrorCode } from "@/types/errors";
import { ConfigFieldDefinition } from "@/manifest";

/**
 * Validates and casts raw input (e.g. from a POST request) against the Provider's schema.
 * Ensures that numbers are numbers, booleans are booleans, etc.
 */
export function validateAndCastConfig(
  rawConfig: Record<string, any>,
  schema: Record<string, ConfigFieldDefinition>,
): Record<string, any> {
  const processedConfig: Record<string, any> = {};

  for (const [key, definition] of Object.entries(schema)) {
    let value = rawConfig[key];

    // 1. Handle Missing Required Fields
    if (
      definition.required &&
      (value === undefined || value === null || value === "")
    ) {
      throw new RevstackError({
        code: RevstackErrorCode.MissingRequiredField,
        message: `Field '${definition.label}' (${key}) is required.`,
      });
    }

    // Skip optional fields if empty
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // 2. Type Casting / Coercion
    switch (definition.type) {
      case "text":
      case "password":
      case "select":
        processedConfig[key] = String(value).trim();
        break;

      case "number":
        const num = Number(value);
        if (isNaN(num)) {
          throw new RevstackError({
            code: RevstackErrorCode.InvalidInput,
            message: `Field '${definition.label}' must be a valid number.`,
          });
        }
        processedConfig[key] = num;
        break;

      case "switch": // Boolean
        // Handles "true", "1", true, 1 as true
        processedConfig[key] =
          value === "true" || value === true || value === 1 || value === "1";
        break;

      case "json": // Special case for complex metadata
        try {
          processedConfig[key] =
            typeof value === "object" ? value : JSON.parse(value);
        } catch (e) {
          throw new RevstackError({
            code: RevstackErrorCode.InvalidInput,
            message: `Invalid JSON for ${key}`,
          });
        }
        break;
    }
  }

  return processedConfig;
}
