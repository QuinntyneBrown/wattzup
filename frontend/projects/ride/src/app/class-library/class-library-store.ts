import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CLASSES_API,
  type ClassCatalogueDto,
  type ClassDto,
  ClassesApiError,
  type NextGroupSessionDto,
  PROGRESS_API,
  type Segment,
} from '@telo/api';
import { catchError, of, switchMap, timer } from 'rxjs';
import { classCover } from '../classes/class-cover';
import { groupChip } from './group-chip';

/** How often the library reads every class's next group session again (L2-083 AC2). */
const SESSIONS_EVERY = 30_000;

/** One card of the library, as the presentation component takes it. */
export interface ClassCardView {
  readonly id: string;
  readonly title: string;
  readonly channel: string;
  readonly focus: string;
  readonly cover: string;
  readonly lengthSeconds: number;
  readonly segments: readonly Segment[];
  /** The rider level the class opens at while the rider is below it; null when it is open (L2-082). */
  readonly opensAtLevel: number | null;
  /** The next group session's chip, "Group in 6 min · 5/10"; null while it cannot be read (L2-081 AC6). */
  readonly group: string | null;
}

/** One shelf of the library with its cards, in catalogue order. */
export interface ShelfView {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
  readonly cards: readonly ClassCardView[];
}

/** The "Class length" tabs (L2-081 AC2): each shows the shelf with its id, and All shows every shelf. */
export const LENGTH_TABS = [
  { id: 'all', label: 'All' },
  { id: '20-min', label: '20 min' },
  { id: '30-min', label: '30 min' },
  { id: '60-min', label: '60 min' },
] as const;

/**
 * The Class Library's state, provided on its page (docs/detailed-designs/classes/browse-the-class-library): the
 * catalogue from `CLASSES_API`, which answers from the device's copy when the backend cannot be reached, shaped into
 * shelves of cards, each open or locked for the rider level from `PROGRESS_API`, and the length tab chosen. With no
 * catalogue to read and none kept it is `unavailable`, and `retry()` asks again (L2-081 AC7). Every 30 seconds it reads
 * each class's next group session for the cards' chips (L2-083 AC2). It goes, with its requests and the polling, when
 * the rider leaves the library.
 */
@Injectable()
export class ClassLibraryStore {
  private readonly classes = inject(CLASSES_API);
  private readonly destroyRef = inject(DestroyRef);
  private readonly catalogue = signal<ClassCatalogueDto | null>(null);
  private readonly level = signal<number | null>(null);
  /** Every class's next group session by class id, and when it was read; empty while they cannot be read. */
  private readonly sessions = signal<{
    readonly next: ReadonlyMap<string, NextGroupSessionDto>;
    readonly at: number;
  }>({ next: new Map(), at: 0 });

  /** No catalogue could be read and none is kept on the device. */
  readonly unavailable = signal(false);

  /** The chosen length tab's id. */
  readonly tab = signal<string>('all');

  readonly shelves = computed<readonly ShelfView[]>(() => {
    const catalogue = this.catalogue();
    const level = this.level();
    const sessions = this.sessions();
    if (!catalogue || level === null) return [];
    return catalogue.shelves.map((shelf) => ({
      id: shelf.id,
      title: shelf.title,
      tagline: shelf.tagline,
      cards: catalogue.classes
        .filter((dto) => dto.shelfId === shelf.id)
        .map((dto) => {
          const next = sessions.next.get(dto.id);
          return card(dto, level, next ? groupChip(next, sessions.at) : null);
        }),
    }));
  });

  /** The shelves the chosen tab shows. */
  readonly shown = computed(() =>
    this.tab() === 'all'
      ? this.shelves()
      : this.shelves().filter((shelf) => shelf.id === this.tab()),
  );

  constructor() {
    inject(PROGRESS_API)
      .level()
      .pipe(takeUntilDestroyed())
      .subscribe((level) => this.level.set(level));
    this.load();
    timer(0, SESSIONS_EVERY)
      .pipe(
        switchMap(() => this.classes.nextSessions().pipe(catchError(() => of([])))),
        takeUntilDestroyed(),
      )
      .subscribe((list) =>
        this.sessions.set({ next: new Map(list.map((s) => [s.classId, s])), at: Date.now() }),
      );
  }

  retry(): void {
    this.load();
  }

  private load(): void {
    this.unavailable.set(false);
    this.classes
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalogue) => this.catalogue.set(catalogue),
        error: (error: unknown) =>
          this.unavailable.set(
            error instanceof ClassesApiError && error.code === 'catalogue_unavailable',
          ),
      });
  }
}

function card(dto: ClassDto, level: number, group: string | null): ClassCardView {
  return {
    id: dto.id,
    title: dto.title,
    channel: dto.channel,
    focus: dto.focus,
    // Built from the validated video id only, never from a submitted link (ADR 0014).
    cover: classCover(dto.video.videoId),
    lengthSeconds: dto.lengthSeconds,
    segments: dto.plan.segments,
    opensAtLevel: dto.opensAtLevel > level ? dto.opensAtLevel : null,
    group,
  };
}
