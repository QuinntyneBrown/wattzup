/** GCN Training's 30 Minute HIIT Cardio, in the link field until the rider pastes another (L2-098). */
export const DEFAULT_VIDEO_LINK = 'https://www.youtube.com/watch?v=QUoToFsMNig';

/** The message of a link that is not YouTube's (L2-098 AC2). */
export const VIDEO_LINK_ERROR =
  "That doesn't look like a YouTube link. Paste a youtube.com or youtu.be link.";

/** How far "Half a second earlier" and "later" move the offset (L2-098 AC3), and its ceiling, 12 hours. */
export const OFFSET_STEP = 0.5;
const MAX_OFFSET = 43_200;
const MAX_LINK = 2048;

const LINK =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?<query>[^#]*)|shorts\/(?<short>[\w-]{11}))|youtu\.be\/(?<short2>[\w-]{11}))(?:[?#].*)?$/i;
const ID = /^[\w-]{11}$/;

/**
 * The 11-character video id of a `youtube.com/watch?v=`, `youtu.be/` or `youtube.com/shorts/` link, or `null` for any
 * other text (L2-098 AC2). Only the id is used: nothing else of the link reaches the player.
 */
export function videoIdOf(link: string): string | null {
  const text = link.trim();
  if (!text || text.length > MAX_LINK) return null;
  const groups = LINK.exec(text)?.groups;
  if (!groups) return null;
  const id =
    groups['short'] ??
    groups['short2'] ??
    groups['query']
      ?.split('&')
      .find((part) => part.startsWith('v='))
      ?.slice(2);
  return id && ID.test(id) ? id : null;
}

/** An offset as the field reads it, to a tenth: 12 → "0:12.0", 3723.5 → "1:02:03.5". */
export function formatOffset(seconds: number): string {
  const tenths = Math.round(seconds * 10);
  const minutes = Math.floor(tenths / 600);
  const rest = ((tenths % 600) / 10).toFixed(1).padStart(4, '0');
  if (minutes < 60) return `${minutes}:${rest}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${rest}`;
}

/** A typed offset ("0:12.0", "12.5", "1:02:03.5") in seconds, or `null` for anything else or over 12 hours. */
export function parseOffset(text: string): number | null {
  const match = /^\s*(?:(?:(\d{1,2}):)?(\d{1,3}):)?(\d{1,5}(?:\.\d)?)\s*$/.exec(text);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3]);
  if ((match[2] !== undefined && seconds >= 60) || (match[1] !== undefined && minutes >= 60))
    return null;
  const total = Math.round((hours * 3600 + minutes * 60 + seconds) * 10) / 10;
  return total <= MAX_OFFSET ? total : null;
}

/** An offset held within 0 and 12 hours, to a tenth (L2-098 AC3, AC4). */
export function clampOffset(seconds: number): number {
  return Math.min(MAX_OFFSET, Math.max(0, Math.round(seconds * 10) / 10));
}
