import type { Locator, Page } from '@playwright/test';
import { startClassRide } from './class-ride';
import { startCustomRide } from './custom-ride';
import { echelonBike } from './echelon';
import type { FakeBluetooth } from './fake-bluetooth';
import type { ApiFixture } from './api';
import { startRace } from './race';
import { openResults, soloRace } from './results';
import { ClassLibraryPage } from '../pages/class-library.page';
import { ClassStartPage } from '../pages/class-start.page';
import { ConnectBikePage } from '../pages/connect-bike.page';
import { CustomWorkoutPage } from '../pages/custom-workout.page';
import { HomePage } from '../pages/home.page';
import { MapSelectPage } from '../pages/map-select.page';
import { NotFoundPage } from '../pages/not-found.page';
import { ProfilePage } from '../pages/profile.page';
import { RaceSetupPage } from '../pages/race-setup.page';
import { ResultsPage } from '../pages/results.page';
import { SettingsPage } from '../pages/settings.page';
import { SignInPage } from '../pages/sign-in.page';

/** What opening a screen needs from the shared fixture. */
export interface ScreenFixtures {
  readonly page: Page;
  readonly bluetooth: FakeBluetooth;
  readonly api: ApiFixture;
}

/** Opens a screen with a remembered bike and answers what it reads; resolves to what shows once it has rendered. */
export type Opener = (fixtures: ScreenFixtures) => Promise<Locator>;

const remembered =
  (open: (page: Page) => Promise<Locator>): Opener =>
  async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    return open(page);
  };

/**
 * Every screen of the app, by the name the specs use, and how to open it (L2-139 AC1): the fit-every-width spec opens
 * each at 320 and 2560 px, and the responsive sweep (e2e/sweeps/) at every breakpoint between.
 */
export const screens: Record<string, Opener> = {
  Home: remembered(async (page) => {
    const home = new HomePage(page);
    await home.open();
    return home.greeting;
  }),
  'Map Select': remembered(async (page) => {
    const maps = new MapSelectPage(page);
    await maps.open();
    return maps.heading;
  }),
  'Race Setup': remembered(async (page) => {
    const setup = new RaceSetupPage(page);
    await setup.open('old-town-criterium');
    return setup.title;
  }),
  'the Class Library': remembered(async (page) => {
    const library = new ClassLibraryPage(page);
    await library.open();
    return library.heading;
  }),
  'Class Start': remembered(async (page) => {
    const start = new ClassStartPage(page);
    await start.open('hiit-cardio-30');
    return start.title;
  }),
  Profile: remembered(async (page) => {
    const profile = new ProfilePage(page);
    await profile.open();
    return profile.heading;
  }),
  Settings: remembered(async (page) => {
    const settings = new SettingsPage(page);
    await settings.open();
    return settings.heading;
  }),
  'the custom workout': remembered(async (page) => {
    const custom = new CustomWorkoutPage(page);
    await custom.open();
    return custom.heading;
  }),
  'Connect Bike': async ({ page }) => {
    const connect = new ConnectBikePage(page);
    await connect.open();
    return connect.title;
  },
  'sign-in': remembered(async (page) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    return signIn.heading;
  }),
  'Page not found': remembered(async (page) => {
    const notFound = new NotFoundPage(page);
    await notFound.open('/nowhere');
    return notFound.heading;
  }),
  Results: async ({ page }) => {
    await openResults(page, soloRace(1598));
    return new ResultsPage(page).heading;
  },
  'a race': async ({ page, bluetooth, api }) =>
    (await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo')).heading,
  'a class ride': async ({ page, bluetooth, api }) =>
    (await startClassRide(page, bluetooth, api)).clock,
  'a custom ride': async ({ page, bluetooth }) => (await startCustomRide(page, bluetooth)).clock,
};
