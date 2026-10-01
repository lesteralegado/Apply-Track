export function publicError(error: unknown, fallback: string): Error {
  if (import.meta.env.DEV) console.error("[ApplyTrack]", error);
  return new Error(fallback);
}
