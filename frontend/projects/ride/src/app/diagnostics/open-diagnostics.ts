import type { Dialog } from '@angular/cdk/dialog';
import type { Injector } from '@angular/core';

/**
 * Opens Diagnostics (L2-113 AC1), loading the dialog's code only now so it adds nothing to the screen that offers it.
 * `injector` is the opener's: a ride's `ResistanceController` in it gives the last command sent.
 */
export async function openDiagnostics(dialog: Dialog, injector: Injector): Promise<void> {
  const { default: DiagnosticsDialog } = await import('./diagnostics-dialog');
  dialog.open(DiagnosticsDialog, {
    injector,
    ariaLabelledBy: 'diagnostics-title',
    hasBackdrop: false,
  });
}
