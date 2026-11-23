const MAX_LABEL_LENGTH = 24;

/**
 * Sanitizes untrusted strings (multiplayer display names, stage titles) before speech synthesis or
 * caption display: strips HTML/script tags, SSML/phoneme markup, and control characters, collapses
 * whitespace, and clamps to 24 characters (L2-174 AC2).
 */
export function sanitizeCalloutLabel(raw: string | null | undefined, fallback = 'Rider'): string {
  if (!raw) return fallback;
  const withoutTags = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!withoutTags) return fallback;
  return withoutTags.length > MAX_LABEL_LENGTH
    ? withoutTags.slice(0, MAX_LABEL_LENGTH).trimEnd()
    : withoutTags;
}
