import { format, parseISO } from "date-fns";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatMatchDate(date: string, pattern = "MMM d, yyyy") {
  return format(parseISO(date), pattern);
}

export function messageFromError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
