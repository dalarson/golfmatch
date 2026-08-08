import { useCallback, useEffect, useState } from "react";

type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: unknown };

export function useAsyncData<T>(load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<AsyncState<T>>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let stale = false;
    queueMicrotask(() => {
      if (!stale) {
        setState({ status: "loading", data: null, error: null });
      }
    });

    void load().then(
      (data) => {
        if (!stale) setState({ status: "success", data, error: null });
      },
      (error: unknown) => {
        if (!stale) {
          console.error(error);
          setState({ status: "error", data: null, error });
        }
      },
    );

    return () => {
      stale = true;
    };
  }, [attempt, load]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return { ...state, retry };
}
