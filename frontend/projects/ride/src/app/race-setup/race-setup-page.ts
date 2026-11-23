import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BackLink,
  Button,
  ModeOptions,
  PackStrength,
  SetupGoal,
  SetupHeader,
  SetupMap,
} from '@telo/components';
import { RaceSetupStore } from './race-setup-store';
import { FullscreenButton } from '../fullscreen/fullscreen-button';

/**
 * Race Setup at `/race/:mapId` (L2-047 to L2-050): the map between Map Select and the race, with "← Maps" back to Map
 * Select, whom to race, and the button that starts it.
 */
@Component({
  selector: 'wz-race-setup-page',
  imports: [
    FullscreenButton,
    RouterLink,
    BackLink,
    Button,
    ModeOptions,
    PackStrength,
    SetupGoal,
    SetupHeader,
    SetupMap,
  ],
  templateUrl: './race-setup-page.html',
  styleUrl: './race-setup-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RaceSetupStore],
})
export default class RaceSetupPage {
  protected readonly store = inject(RaceSetupStore);
}
