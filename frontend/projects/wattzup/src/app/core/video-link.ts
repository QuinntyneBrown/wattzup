// The ride-along video's rules on the setup screen (L2-029 criteria 17 to 20, ADR 0012). The link rule mirrors
// YouTubeLink in Wattzup.Core: the same forms are accepted, every other link is refused, and only the id is used.
import type { RideVideoLink } from '@wattzup/api';

/** The video draft, one for every mode, kept with the plan drafts. */
export interface VideoDraft {
  on: boolean;
  url: string;
  /** The start point in seconds, to 0.1. */
  start: number;
}

/** The GCN 30 Minute HIIT Cardio video, prefilled so the rider never types a link (L2-029 AC17). */
export const DEFAULT_VIDEO_URL = 'https://www.youtube.com/watch?v=QUoToFsMNig';
export const DEFAULT_VIDEO_DRAFT: VideoDraft = { on: false, url: DEFAULT_VIDEO_URL, start: 0 };
export const MAX_LINK_LENGTH = 2048;
export const MAX_START_SECONDS = 43200;
export const START_STEP = 0.5;
export const LINK_ERROR =
  "That doesn't look like a YouTube link. Paste a youtube.com or youtu.be link.";

const LINK =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?<query>[^#]*)|(?:shorts|embed)\/(?<id>[A-Za-z0-9_-]{11}))|youtu\.be\/(?<bid>[A-Za-z0-9_-]{11}))(?:[?#].*)?$/i;
const ID = /^[A-Za-z0-9_-]{11}$/;

/** The 11-character video id of a YouTube link, or null for any other link. */
export function videoIdOf(url: string): string | null {
  const text = url.trim();
  if (!text || url.length > MAX_LINK_LENGTH) return null;
  const m = LINK.exec(text);
  if (!m?.groups) return null;
  const id =
    m.groups['id'] ??
    m.groups['bid'] ??
    m.groups['query']
      ?.split('&')
      .find((p) => p.startsWith('v='))
      ?.slice(2);
  return id && ID.test(id) ? id : null;
}

/** `m:ss.s`, or `h:mm:ss.s` from an hour: 12 → `0:12.0`. */
export function formatStart(seconds: number): string {
  const tenths = Math.round(seconds * 10);
  const s = (tenths % 600) / 10;
  const minutes = Math.floor(tenths / 600);
  const ss = s.toFixed(1).padStart(4, '0');
  if (minutes < 60) return `${minutes}:${ss}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${ss}`;
}

/** Reads `m:ss.s`, `h:mm:ss.s`, `ss.s` or `ss`; anything else, or out of 0 to 12:00:00, is null. */
export function parseStart(text: string): number | null {
  const m = /^\s*(?:(?:(\d{1,2}):)?(\d{1,3}):)?(\d{1,5}(?:\.\d)?)\s*$/.exec(text);
  if (!m) return null;
  const [h, min, sec] = [Number(m[1] ?? 0), Number(m[2] ?? 0), Number(m[3])];
  if ((m[2] !== undefined && sec >= 60) || (m[1] !== undefined && min >= 60)) return null;
  const total = Math.round((h * 3600 + min * 60 + sec) * 10) / 10;
  return total <= MAX_START_SECONDS ? total : null;
}

/** − (-1) or + (+1) moves the start point by 0.5 s, never below 0:00.0 (L2-029 criterion 18). */
export function stepStart(seconds: number, dir: 1 | -1): number {
  const next = Math.round((seconds + dir * START_STEP) * 10) / 10;
  return Math.min(MAX_START_SECONDS, Math.max(0, next));
}

/** The field error for a non-empty link that is not YouTube, else null (L2-029 criterion 19). */
export function linkError(draft: VideoDraft): string | null {
  return draft.on && draft.url.trim() && !videoIdOf(draft.url) ? LINK_ERROR : null;
}

/** The plan's `video`: the link and start point with the switch on and a YouTube link, else null. */
export function planVideo(draft: VideoDraft): RideVideoLink | null {
  if (!draft.on || !videoIdOf(draft.url)) return null;
  return { url: draft.url.trim(), start_seconds: draft.start };
}

/**
 * Accepts stored data only when every field has the right shape; otherwise the switch is off. An
 * empty stored link gets the default link back.
 */
export function readVideoDraft(raw: string | null): VideoDraft {
  if (!raw) return DEFAULT_VIDEO_DRAFT;
  try {
    const d = JSON.parse(raw) as Partial<VideoDraft>;
    const ok =
      typeof d.on === 'boolean' &&
      typeof d.url === 'string' &&
      d.url.length <= MAX_LINK_LENGTH &&
      typeof d.start === 'number' &&
      d.start >= 0 &&
      d.start <= MAX_START_SECONDS;
    if (!ok) return DEFAULT_VIDEO_DRAFT;
    return { on: d.on!, url: d.url!.trim() ? d.url! : DEFAULT_VIDEO_URL, start: d.start! };
  } catch {
    return DEFAULT_VIDEO_DRAFT;
  }
}
