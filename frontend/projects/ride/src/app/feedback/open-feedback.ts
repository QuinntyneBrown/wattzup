import type { Dialog } from '@angular/cdk/dialog';
import type { Overlay } from '@angular/cdk/overlay';
import type { Injector } from '@angular/core';
import type { FeedbackContext } from '@telo/api';
import type { Observable } from 'rxjs';

/** The open dialog, as the page holds it: closed with the page, and telling it when it closes. */
export interface FeedbackDialogHandle {
  readonly closed: Observable<unknown>;
  close(): void;
}

/** From sm (40 rem) Send feedback is a popover; below, a bottom sheet (L2-116 AC4). */
const SM = '(min-width: 40rem)';

/**
 * Opens Send feedback (L2-116 AC1, AC4), loading the dialog's code only now: a bottom sheet over a scrim on a phone,
 * and from sm a 400 px popover under `anchor`, its right edge on the button's. `injector` is the ride page's.
 */
export async function openFeedback(
  dialog: Dialog,
  overlay: Overlay,
  injector: Injector,
  anchor: HTMLElement,
  context: FeedbackContext,
): Promise<FeedbackDialogHandle> {
  const { default: FeedbackDialog } = await import('./feedback-dialog');
  const popover = anchor.ownerDocument.defaultView?.matchMedia(SM).matches ?? true;
  return dialog.open(FeedbackDialog, {
    data: { context },
    injector,
    ariaLabelledBy: 'feedback-title',
    ariaModal: true,
    autoFocus: '#feedback-message',
    width: popover ? '25rem' : '100%',
    maxWidth: '100vw',
    // A press outside closes it; on a phone the dialog draws its own scrim.
    backdropClass: 'cdk-overlay-transparent-backdrop',
    positionStrategy: popover
      ? overlay
          .position()
          .flexibleConnectedTo(anchor)
          .withPositions([
            { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
          ])
          .withViewportMargin(16)
          .withPush(true)
      : overlay.position().global().bottom('0').left('0'),
  });
}
