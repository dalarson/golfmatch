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
