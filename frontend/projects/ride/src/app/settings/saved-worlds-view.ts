import { type SavedWorld } from '@telo/api';

/** Saved worlds' hint with none saved, and the toast's after clearing (L2-165 AC2). */
export const NONE_SAVED = 'Each world downloads again the next time you ride it.';

/** This device's Saved worlds row (L2-165 AC1, AC2): its value, its hint and whether Clear saved worlds shows. */
export interface SavedWorldsView {
  readonly value: string;
  readonly hint: string;
  readonly clear: boolean;
}

/** Bytes in megabytes: whole from 10 MB ("61 MB"), to one decimal place below ("0.2 MB"). */
export function worldSize(bytes: number): string {
  const tenths = Math.round(bytes / 100_000);
  return tenths >= 100 ? `${Math.round(bytes / 1_000_000)} MB` : `${(tenths / 10).toFixed(1)} MB`;
}

/** "A", "A and B", "A, B and C". */
function names(worlds: readonly SavedWorld[]): string {
  const all = worlds.map((world) => world.name);
  return all.length === 1 ? all[0]! : `${all.slice(0, -1).join(', ')} and ${all.at(-1)}`;
}

/** "3 worlds · 61 MB" and the worlds named, or "None saved" (L2-165 AC1, AC2). */
export function savedWorldsView(worlds: readonly SavedWorld[]): SavedWorldsView {
  if (worlds.length === 0) return { value: 'None saved', hint: NONE_SAVED, clear: false };
  const bytes = worlds.reduce((total, world) => total + world.bytes, 0);
  const count = worlds.length === 1 ? '1 world' : `${worlds.length} worlds`;
  const open = worlds.length === 1 ? 'opens' : 'open';
  return {
    value: `${count} · ${worldSize(bytes)}`,
    hint: `${names(worlds)} ${open} in seconds, even offline.`,
    clear: true,
  };
}
