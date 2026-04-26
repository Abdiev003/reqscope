import { API_BASE_URL } from "./api";
import type { ReqScopeTrace } from "./types";

const SKIPPED_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "accept-encoding",
]);

export function createCurlCommand(trace: ReqScopeTrace) {
  const url = `${API_BASE_URL}${trace.path}`;
  const headers = normalizeHeaders(trace.request?.headers);
  const body = trace.request?.body;

  const parts: string[] = [`curl -X ${trace.method} '${url}'`];

  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();

    if (SKIPPED_HEADERS.has(normalizedKey)) {
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    parts.push(
      `  -H '${escapeSingleQuotes(key)}: ${escapeSingleQuotes(String(value))}'`,
    );
  }

  if (hasBody(body)) {
    parts.push(`  -d '${escapeSingleQuotes(JSON.stringify(body))}'`);
  }

  return parts.join(" \\\n");
}

function normalizeHeaders(headers: unknown): Record<string, unknown> {
  if (!headers || typeof headers !== "object") {
    return {};
  }

  return headers as Record<string, unknown>;
}

function hasBody(body: unknown) {
  return (
    body &&
    typeof body === "object" &&
    Object.keys(body as Record<string, unknown>).length > 0
  );
}

function escapeSingleQuotes(value: string) {
  return value.replace(/'/g, "'\\''");
}
