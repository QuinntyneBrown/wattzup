import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, ClassCard, ClassShelf, InlineMessage, TierTabs } from '@telo/components';
import { ClassLibraryStore, LENGTH_TABS } from './class-library-store';

/**
 * The Class Library at `/classes` (L2-081): the head with the Class length tabs, and the shelves the chosen tab shows,
 * each with its class cards; an open card leads to its Class Start. With no catalogue to read or kept, it says so and
 * offers Try again.
 */
@Component({
  selector: 'wz-class-library-page',
  imports: [RouterLink, Button, ClassCard, ClassShelf, InlineMessage, TierTabs],
  templateUrl: './class-library-page.html',
  styleUrl: './class-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ClassLibraryStore],
})
export default class ClassLibraryPage {
  protected readonly library = inject(ClassLibraryStore);
  protected readonly tabs = LENGTH_TABS;
}
