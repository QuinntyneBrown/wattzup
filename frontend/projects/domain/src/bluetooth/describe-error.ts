/** A Web Bluetooth error as `name: message`, for the console and the screens to show as text (L2-017 AC5). */
export function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
