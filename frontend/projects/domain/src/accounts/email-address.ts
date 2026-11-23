/** One `@`, no space, and a dot in the domain: the shape the backend's EmailAddress accepts (L2-001 AC3). */
const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether `typed`, trimmed, is shaped like an email address, so the sign-in screen sends nothing for one that is not. */
export function isEmailAddress(typed: string): boolean {
  return SHAPE.test(typed.trim());
}
