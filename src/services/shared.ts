import type { PostgrestError } from "@supabase/supabase-js";

export class DataServiceError extends Error {
  readonly code: string;
  readonly details: string | null;

  constructor(operation: string, error: PostgrestError) {
    super(`${operation}: ${error.message}`, { cause: error });
    this.name = "DataServiceError";
    this.code = error.code;
    this.details = error.details;
  }
}

export function throwIfError(
  operation: string,
  error: PostgrestError | null,
): asserts error is null {
  if (error) {
    throw new DataServiceError(operation, error);
  }
}

export function getServiceErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (!(error instanceof DataServiceError)) return fallback;

  if (error.code === "23505") {
    return "That value is already in use. Choose a different one.";
  }

  if (error.code === "23503") {
    return "A referenced player, course, or match is no longer available. Refresh and try again.";
  }

  if (error.code === "42501") {
    return "This deployment does not allow that operation. Check the Supabase grants and try again.";
  }

  const message = error.message.replace(/^[^:]+:\s*/, "").trim();
  if (error.code === "22023" || error.code === "P0002") {
    return message || fallback;
  }

  return fallback;
}
