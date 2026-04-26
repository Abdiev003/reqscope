const REDACTED_VALUE = "[REDACTED]";

export function sanitizeValue(
  value: unknown,
  sensitiveFields: string[],
): unknown {
  const normalizedSensitiveFields = sensitiveFields.map((field) =>
    field.toLowerCase(),
  );

  return sanitizeRecursive(value, normalizedSensitiveFields);
}

function sanitizeRecursive(
  value: unknown,
  normalizedSensitiveFields: string[],
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeRecursive(item, normalizedSensitiveFields),
    );
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const normalizedKey = key.toLowerCase();

      const isSensitive = normalizedSensitiveFields.some((field) =>
        normalizedKey.includes(field),
      );

      output[key] = isSensitive
        ? REDACTED_VALUE
        : sanitizeRecursive(nestedValue, normalizedSensitiveFields);
    }

    return output;
  }

  return value;
}
