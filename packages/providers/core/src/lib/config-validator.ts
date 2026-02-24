import { RevstackError, RevstackErrorCode } from "@/types/errors";
import { ConfigFieldDefinition } from "@/manifest";

/**
 * normalize raw input against schema config
 */
export function validateAndCastConfig(
  rawConfig: Record<string, any>,
  schema: Record<string, ConfigFieldDefinition>
): Record<string, any> {
  const processedConfig: Record<string, any> = {};

  for (const [key, definition] of Object.entries(schema)) {
    let value = rawConfig[key];

    // check required
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

    // coerce
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

      case "switch":
        // cast to bool
        processedConfig[key] =
          value === "true" || value === true || value === 1 || value === "1";
        break;

      case "json":
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
