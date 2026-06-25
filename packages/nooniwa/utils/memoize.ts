export function memoizeForBuild<T>(
  compute: () => T,
  enabled: boolean,
): () => T {
  let cache: T;
  let cached = false;
  return () => {
    if (enabled && cached) return cache;
    const result = compute();
    if (enabled) {
      cache = result;
      cached = true;
    }
    return result;
  };
}
