// The phase banner's lines and the polite announcement (L2-027, L2-041).
import { formatDuration } from './format-duration';
import type { SegmentChange } from './segment-change-detector';
import { kindLabel } from './segment-labels';

export function bannerText(c: SegmentChange): { headline: string; detail: string } {
  const time = formatDuration(c.duration);
  const value = String(c.level);
  if (c.kind === 'work') {
    return {
      headline: `WORK · ${value} · GO!`,
      detail: `Round ${c.round} of ${c.rounds} · ${time}`,
    };
  }
  const headline = `${kindLabel(c.kind).toUpperCase()} · ${value}`;
  if (!c.next) return { headline, detail: `${time} · last stretch` };
  return { headline, detail: `${time} · next: ${kindLabel(c.next.kind)} at ${c.next.level}` };
}

function spoken(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (m > 0) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  if (s > 0 || m === 0) parts.push(`${s} ${s === 1 ? 'second' : 'seconds'}`);
  return parts.join(' ');
}

export function announcement(c: SegmentChange): string {
  return `${kindLabel(c.kind)}, resistance ${c.level}, ${spoken(c.duration)}`;
}
