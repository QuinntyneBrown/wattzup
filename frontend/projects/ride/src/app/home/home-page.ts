import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Banner,
  Button,
  ClassTeaser,
  Door,
  MapTile,
  MoreLink,
  NextRideCard,
} from '@telo/components';
import { provideClasses } from '../classes/provide-classes';
import { provideMaps } from '../maps/provide-maps';
import { HomeStore } from './home-store';

/**
 * Home (`/`, L2-033 to L2-036): the greeting, the unlocked banner, the Next ride card and the two doors. The catalogue clients and Home's store are provided here, so
 * they load with the page and go when the rider leaves; a route of its own would add its loader to the initial bundle.
 */
@Component({
  selector: 'wz-home-page',
  imports: [RouterLink, Banner, Button, ClassTeaser, Door, MapTile, MoreLink, NextRideCard],
  providers: [provideMaps(), provideClasses(), HomeStore],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage {
  protected readonly home = inject(HomeStore);
}
