import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CLASS_API, type ClassCatalogue } from '@wattzup/api';
import { ClassCard, Icon, Shelf, StatusLine } from '@wattzup/components';
import {
  cardView,
  countLabel,
  type LibraryTab,
  nextTab,
  visibleShelves,
} from '../../core/class-library-view';
import { liveConnectionStatus } from '../../core/connection-status';
import { bikeOnly } from '../../core/machine-guards';
import { MotionPreference } from '../../core/motion-preference';

type Phase = 'loading' | 'ready' | 'error';

/** Route `/classes`: the catalogue as shelves of class cards (L2-079). */
@Component({
  selector: 'wz-class-library-page',
  imports: [ClassCard, Icon, RouterLink, Shelf, StatusLine],
  templateUrl: './class-library-page.html',
  styleUrl: './class-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassLibraryPage {
  private readonly classes = inject(CLASS_API);
  private readonly router = inject(Router);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  protected readonly status = liveConnectionStatus();
  protected readonly reducedMotion = inject(MotionPreference).reduced;
  protected readonly phase = signal<Phase>('loading');
  protected readonly catalogue = signal<ClassCatalogue>({ shelves: [] });
  /** Not kept across visits (L2-079 AC3). */
  protected readonly tab = signal<LibraryTab>('all');
  private readonly failedCovers = signal<ReadonlySet<string>>(new Set());

  protected readonly tabs = computed(() => [
    { id: 'all', title: 'All' },
    ...this.catalogue().shelves.map((s) => ({ id: s.id, title: s.title })),
  ]);
  protected readonly shelves = computed(() =>
    visibleShelves(this.catalogue(), this.tab()).map((shelf) => ({
      id: shelf.id,
      title: shelf.title,
      tagline: shelf.tagline,
      count: countLabel(shelf.classes.length),
      cards: shelf.classes.map((c) => {
        const view = cardView(c);
        return this.failedCovers().has(c.id) ? { ...view, cover: null } : view;
      }),
    })),
  );
  protected readonly empty = computed(
    () => this.phase() === 'ready' && this.catalogue().shelves.length === 0,
  );

  constructor() {
    bikeOnly();
    void this.load();
  }

  protected async load(): Promise<void> {
    this.phase.set('loading');
    try {
      this.catalogue.set(await this.classes.list());
      this.phase.set('ready');
    } catch {
      this.phase.set('error');
    }
  }

  protected select(id: LibraryTab): void {
    this.tab.set(id);
  }

  protected onTabKey(event: KeyboardEvent): void {
    const ids = this.tabs().map((t) => t.id);
    const next = nextTab(ids, this.tab(), event.key);
    if (next === null) return;
    event.preventDefault();
    this.tab.set(ids[next]!);
    this.tabButtons()[next]?.nativeElement.focus();
  }

  protected open(id: string): void {
    void this.router.navigate(['/classes', id]);
  }

  protected coverFailed(id: string): void {
    this.failedCovers.update((s) => new Set(s).add(id));
  }
}
