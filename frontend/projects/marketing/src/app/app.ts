import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  Band,
  Button,
  Features,
  Film,
  Hero,
  SiteFooter,
  SiteLink,
  SiteNav,
} from '@telo/components';
import { APP_URL } from './app.config';
import { FEATURES, FILM, FOOTER, HERO } from './content';

/**
 * The marketing site's one page (ADR 0027): the hero, the pitch film, Race and Classes, and how
 * pairing works. Every word is fixed copy; the page reads nothing.
 */
@Component({
  selector: 'wz-root',
  imports: [Band, Button, Features, Film, Hero, SiteFooter, SiteLink, SiteNav],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly appUrl = inject(APP_URL);

  protected readonly hero = HERO;
  protected readonly film = FILM;
  protected readonly features = FEATURES;
  protected readonly footer = FOOTER;

  /** An address in the Telo Ride app, built from the one configured `APP_URL`. */
  protected app(path: string): string {
    return `${this.appUrl}${path}`;
  }

  /**
   * An in-page link: the section's heading comes into view and takes focus, so a link chosen a
   * second time moves it again. The address still names the section, as the link's own fragment
   * would.
   */
  protected jumpTo(event: Event, section: string): void {
    const heading = this.document.getElementById(`${section}-h`);
    if (!heading) return;
    event.preventDefault();
    const view = this.document.defaultView;
    view?.history.pushState(null, '', `#${section}`);
    const still = view?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    heading.focus({ preventScroll: true });
  }
}
