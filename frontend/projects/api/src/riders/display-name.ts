/** The fewest characters a display name has, after trimming (L2-005 AC2). */
export const DISPLAY_NAME_MIN_LENGTH = 2;
/** The most characters a display name has, after trimming (L2-005 AC2). */
export const DISPLAY_NAME_MAX_LENGTH = 24;

const ALLOWED = /^[\p{L}\p{N} ._-]+$/u;

/**
 * Whether `raw`, trimmed, is a display name: 2 to 24 letters, digits, spaces, `.`, `_` and `-` (L2-005 AC2). The
 * screens use it to answer at once; the backend's rule is the one that decides.
 */
export function isDisplayName(raw: string): boolean {
  const name = raw.trim();
  return (
    name.length >= DISPLAY_NAME_MIN_LENGTH &&
    name.length <= DISPLAY_NAME_MAX_LENGTH &&
    ALLOWED.test(name)
  );
}
