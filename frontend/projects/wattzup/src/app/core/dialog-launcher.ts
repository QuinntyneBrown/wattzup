// Opens the dialogs through the CDK, which owns the backdrop, focus trap, Escape and focus
// return (L2-023, L2-051, L2-052). Dialog components load on first use.
import { Dialog, type DialogRef } from '@angular/cdk/dialog';
import type { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { StartPlan } from '@wattzup/api';
import type { SetDraft, StretchDraft, StretchKind } from './intervals-form';

export interface EditSetData {
  /** `Edit set <i>` or `Add set` (L2-029 AC13). */
  title: string;
  set: SetDraft;
}

export interface EditStretchData {
  kind: StretchKind;
  stretch: StretchDraft;
}

export interface ReplaceRideData {
  plan: StartPlan;
  elapsed: string;
  currentSummary: string;
  newSummary: string;
}

@Injectable({ providedIn: 'root' })
export class DialogLauncher {
  private readonly dialog = inject(Dialog);

  async openDiagnostics(): Promise<void> {
    const { DiagnosticsDialog } =
      await import('../dashboard/diagnostics-dialog/diagnostics-dialog');
    this.open(DiagnosticsDialog, 'diagnostics', 'first-tabbable');
  }

  /** `next` is where the rider goes once the ride has ended. */
  async openEndRide(): Promise<void> {
    const { EndRideDialog } = await import('../dashboard/end-ride-dialog/end-ride-dialog');
    this.open(EndRideDialog, 'end-ride', '[data-autofocus]');
  }

  /** Resolves true when the new ride started (L2-052). */
  async openReplaceRide(data: ReplaceRideData): Promise<boolean> {
    const { ReplaceRideDialog } =
      await import('../dashboard/replace-ride-dialog/replace-ride-dialog');
    const ref = this.open(ReplaceRideDialog, 'replace-ride', '[data-autofocus]', data);
    return ref ? (await firstValueFrom(ref.closed)) === true : false;
  }

  /** Resolves the saved set, or undefined on Cancel or Escape (L2-029 AC13). */
  async openEditSet(data: EditSetData): Promise<SetDraft | undefined> {
    const { EditSetDialog } = await import('../dashboard/edit-set-dialog/edit-set-dialog');
    const ref = this.open(EditSetDialog, 'edit-set', '#set-rounds', data);
    return ref ? ((await firstValueFrom(ref.closed)) as SetDraft | undefined) : undefined;
  }

  /** Resolves the saved warm-up or cool-down, or undefined on Cancel or Escape (L2-029 AC14). */
  async openEditStretch(data: EditStretchData): Promise<StretchDraft | undefined> {
    const { EditStretchDialog } =
      await import('../dashboard/edit-stretch-dialog/edit-stretch-dialog');
    const ref = this.open(EditStretchDialog, 'edit-stretch', '#stretch-duration', data);
    return ref ? ((await firstValueFrom(ref.closed)) as StretchDraft | undefined) : undefined;
  }

  private open<T>(
    component: ComponentType<T>,
    id: string,
    autoFocus: string,
    data?: unknown,
  ): DialogRef<unknown, T> | null {
    if (this.dialog.getDialogById(id)) return null;
    return this.dialog.open(component, {
      panelClass: 'wz-dialog-pane',
      backdropClass: 'wz-backdrop',
      restoreFocus: true,
      id,
      data,
      autoFocus,
      ariaLabelledBy: `${id}-title`,
      ariaDescribedBy: `${id}-desc`,
    });
  }
}
