// The class library's views: a card per class, the shelves a tab shows and the counts (L2-079).
import type { ClassCatalogue, ClassEntry, ClassShelf } from '@wattzup/api';
import type { ClassCardView } from '@wattzup/components';
import { previewOf } from './ride-preview';

/** `All`, or a shelf id. */
export type LibraryTab = 'all' | string;

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** The YouTube thumbnail, built from a valid video id only, else null (ADR 0014). */
export function thumbnailUrl(videoId: string | null | undefined): string | null {
  return videoId && VIDEO_ID.test(videoId)
    ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    : null;
}

/** A class's card: its link, length, meta, cover and plan strip (L2-079 AC5 to AC7). */
export function cardView(entry: ClassEntry): ClassCardView {
  const preview = previewOf(entry.plan);
  const video = entry.plan.video;
  return {
    id: entry.id,
    href: `/classes/${encodeURIComponent(entry.id)}`,
    title: entry.title,
    length: preview.total,
    meta: `${entry.channel} · ${entry.focus} · Peak L${preview.peakLevel}`,
    channel: entry.channel,
    cover: thumbnailUrl(video?.video_id),
    noVideo: !video,
    profile: preview.profile,
    profileTotal: preview.totalSeconds,
    profileLabel: preview.profileLabel,
  };
}

/** Every shelf under `All`, else the one shelf (L2-079 AC3). */
export function visibleShelves(catalogue: ClassCatalogue, tab: LibraryTab): ClassShelf[] {
  return tab === 'all' ? catalogue.shelves : catalogue.shelves.filter((s) => s.id === tab);
}

/** `1 class` or `<n> classes` (L2-079 AC4). */
export function countLabel(n: number): string {
  return n === 1 ? '1 class' : `${n} classes`;
}

/** The tab the arrow keys, Home and End move to with a roving tabindex, or null (L2-079 AC2). */
export function nextTab(
  tabs: readonly LibraryTab[],
  current: LibraryTab,
  key: string,
): number | null {
  const i = Math.max(0, tabs.indexOf(current));
  if (key === 'ArrowRight') return (i + 1) % tabs.length;
  if (key === 'ArrowLeft') return (i + tabs.length - 1) % tabs.length;
  if (key === 'Home') return 0;
  if (key === 'End') return tabs.length - 1;
  return null;
}
