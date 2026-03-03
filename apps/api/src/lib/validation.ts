/**
 * Shared input validation helpers for API routes.
 * Used to sanitize query params and path inputs to prevent abuse and errors.
 */

const DEFAULT_LIMIT_MAX = 100;

/**
 * Parse and validate a "limit" query param. Returns a value in [1, max].
 * Invalid or missing value returns defaultVal. NaN/negative become defaultVal; values > max are clamped.
 */
export function parseLimit(
  value: string | undefined,
  defaultVal: number,
  max: number = DEFAULT_LIMIT_MAX
): number {
  if (value === undefined || value === "") return defaultVal;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return defaultVal;
  return Math.min(n, max);
}

/**
 * Parse and validate an "offset" or "skip" query param. Returns a non-negative integer.
 * Invalid or missing value returns defaultVal. NaN/negative become defaultVal.
 */
export function parseOffset(value: string | undefined, defaultVal: number): number {
  if (value === undefined || value === "") return defaultVal;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return defaultVal;
  return n;
}

/**
 * Parse and validate a 1-based "page" query param. Returns an integer >= 1.
 */
export function parsePage(value: string | undefined, defaultVal: number = 1): number {
  if (value === undefined || value === "") return defaultVal;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return defaultVal;
  return n;
}

/**
 * Sanitize a file path for git tree/file operations. Rejects paths containing ".." or "."
 * as segments to prevent path traversal. Returns the joined path or null if invalid.
 */
export function sanitizePathForGit(filepath: string): string | null {
  if (typeof filepath !== "string") return null;
  const trimmed = filepath.trim();
  if (trimmed === "") return "";
  const parts = trimmed.split("/").filter(Boolean);
  for (const p of parts) {
    if (p === ".." || p === ".") return null;
  }
  return parts.join("/");
}
