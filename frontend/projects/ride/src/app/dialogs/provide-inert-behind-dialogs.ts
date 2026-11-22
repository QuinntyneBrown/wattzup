import { DOCUMENT } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import {
  DestroyRef,
  type EnvironmentProviders,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * The app behind a dialog is inert while one is open (L2-141 AC3): no pointer, key or screen reader reaches it. The
 * CDK dialog moves the focus in and traps it there; this marks `<wz-root>` inert as the first dialog opens and clears
 * it as the last closes. The CDK gives the focus back while the app is still inert, which the browser refuses, so the
 * focus goes back here to what opened the dialog, once the app is live again. The subscriptions end with the injector.
 * Each route whose pages open a dialog provides it, so the dialog's code stays out of every other screen's chunks.
 */
export function provideInertBehindDialogs(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const dialog = inject(Dialog);
    const document = inject(DOCUMENT);
    const app = document.querySelector('wz-root');
    const destroyRef = inject(DestroyRef);
    dialog.afterOpened.pipe(takeUntilDestroyed(destroyRef)).subscribe((ref) => {
      // The focus is still on what opened the dialog: the CDK moves it in after the dialog renders.
      const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      app?.setAttribute('inert', '');
      ref.closed.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
        if (dialog.openDialogs.some((open) => open !== ref)) return;
        app?.removeAttribute('inert');
        const lost = document.activeElement === null || document.activeElement === document.body;
        if (lost && ref.config.restoreFocus !== false) opener?.focus();
      });
    });
    destroyRef.onDestroy(() => app?.removeAttribute('inert'));
  });
}
