/** Bound a non-abortable operation and ignore its eventual result after cancellation. */
export function withTimeout<T>(operation: Promise<T>, timeoutMs: number, signal?: AbortSignal): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    onAbort = () => reject(new DOMException('Request cancelled', 'AbortError'));
    if (signal?.aborted) onAbort();
    else signal?.addEventListener('abort', onAbort, { once: true });
  });

  // race attaches handlers to the operation even if it rejects after the deadline.
  return Promise.race([operation, deadline]).finally(() => {
    clearTimeout(timer);
    if (onAbort) signal?.removeEventListener('abort', onAbort);
  });
}
