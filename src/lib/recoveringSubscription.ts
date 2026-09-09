/** One listener, including startup deadlines and terminal-error recovery. */
export function recoveringSubscription<T>(
  subscribe: (next: (value: T) => void, fail: (error: Error) => void) => (() => void),
  next: (value: T) => void,
  onError: (error: Error) => void,
) {
  let disposed = false;
  let generation = 0;
  let stop: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let delay = 5_000;

  function connect() {
    if (disposed) return;
    clearTimeout(timer);
    stop?.();
    stop = undefined;
    const version = ++generation;
    const current = () => !disposed && version === generation;
    const fail = (error: Error) => {
      if (!current()) return;
      ++generation;
      clearTimeout(timer);
      stop?.();
      stop = undefined;
      onError(error);
      timer = setTimeout(connect, delay);
      delay = Math.min(delay * 2, 60_000);
    };
    timer = setTimeout(() => fail(new Error('Subscription startup timed out')), 20_000);
    try {
      const unsubscribe = subscribe(value => {
        if (!current()) return;
        clearTimeout(timer);
        delay = 5_000;
        next(value);
      }, fail);
      // Also handles subscriptions that invoke callbacks synchronously.
      if (current()) stop = unsubscribe;
      else unsubscribe();
    } catch (error) {
      fail(error instanceof Error ? error : new Error('Subscription failed'));
    }
  }
  connect();
  return () => {
    disposed = true;
    ++generation;
    clearTimeout(timer);
    stop?.();
  };
}
