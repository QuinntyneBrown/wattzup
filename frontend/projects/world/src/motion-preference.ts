// prefers-reduced-motion as a signal (L2-041).
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MotionPreference {
  private readonly query =
    typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  private readonly _reduced = signal(this.query?.matches ?? false);
  readonly reduced = this._reduced.asReadonly();

  constructor() {
    this.query?.addEventListener('change', (e) => this._reduced.set(e.matches));
  }
}
