// Acceptance Test
// Traces to: L2-102 to L2-110, L2-101 AC4, L2-128
// Description: World Ride runs a class inside its world on the fake bike: Ride in <world name>
// opens it from the class page; its app bar, live metrics, current segment, route profile,
// simulated pacers and resistance follow the ride; pausing, losing the bike and the end show their
// overlays; and the scene is drawn, or a notice says this screen can't draw 3D worlds. The page's
// clock is fast-forwarded, so no spec waits out a ride.
import { EndRideDialog } from './pages/end-ride.dialog';
import { expect, test } from './fixtures/wz-test';
import { ClassesPage } from './pages/classes.page';
import { ReplaceRideDialog } from './pages/replace-ride.dialog';
import { RidePage } from './pages/ride.page';
import { SetupPage } from './pages/setup.page';
import { RideSoundDialog } from './pages/ride-sound.dialog';
import { WorldRidePage } from './pages/world-ride.page';

/** 95 rpm at 35.6 km/h, then resistance 18, as main's live spec sends them. */
const CADENCE_95 = 'F0 D1 09 00 05 00 00 00 00 00 5F 00 1F';
/** A frame reporting resistance `level`: F0 D2 01 <level> <checksum>. */
const resistance = (level: number): string => {
  const sum = (0xf0 + 0xd2 + 0x01 + level) & 0xff;
  return `F0 D2 01 ${level.toString(16).padStart(2, '0')} ${sum.toString(16).padStart(2, '0')}`.toUpperCase();
};
/** The command setting the bike to `level`: F0 B1 01 <level> <checksum>. */
const setLevel = (level: number): string =>
  `F0B101${level.toString(16).padStart(2, '0')}${((0xa2 + level) & 0xff).toString(16).padStart(2, '0')}`.toUpperCase();

/** A catalogue whose one class names no world, as a catalogue file may (L2-100 AC1). */
const WORLDLESS_CATALOGUE = JSON.stringify({
  shelves: [{ id: 'short', title: '20 min', tagline: 'Short and sharp.' }],
  classes: [
    {
      id: 'no-world',
      title: 'No world',
      channel: 'Wattzup Studio',
      focus: 'Zone 2',
      description: 'One level, held.',
      shelf: 'short',
      plan: { kind: 'flat', level: 12, minutes: 20, cadence: 85 },
    },
  ],
});

/** The classes given their world last, each with its world's name (L2-100 AC4). */
const CLASS_WORLDS: readonly (readonly [string, string])[] = [
  ['quick-but-brutal-hiit', "Trinidad J'Ouvert"],
  ['15-minute-smash-fest', 'Rio Sambadrome'],
  ['15-minute-strength-workout', 'Lisbon Tram Hills'],
  ['nasty-pasty-sprint-session', 'Cornish Harbour'],
  ['quick-sprint-session', 'Copacabana Promenade'],
  ['15-min-hiit-cardio-belly-fat-loss', 'Bondi to Bronte'],
  ['instant-inferno', 'Kīlauea Lava Road'],
  ['super-high-cadence-sprints', 'Shibuya Crossing'],
  ['spicy-maximum-minute-efforts', 'Día de Muertos Parade'],
  ['sprint-sprint-sprint', 'San Fermín, Pamplona'],
  ['hold-your-intensity', 'Great Ocean Road'],
  ['max-effort-up-and-overs', 'San Francisco Hills'],
  ['ride-to-the-beat', 'Miami Neon Nights'],
  ['high-cadence-sprints', 'Victoria Harbour'],
  ['short-20-minute-sprint-blitz', 'Holi in Jaipur'],
  ['time-to-spin-out', 'Overseas Highway'],
  ['full-gas-sprints', 'Isle of Man Mountain Course'],
  ['hiit-leg-buster', 'Philadelphia Art Museum Steps'],
  ['20-min-cardio-spin-bike-workout', 'Lake Louise'],
  ['22-minute-strength-intervals', 'Bealach na Bà'],
  ['progressive-efforts-on-the-passo-gardena', 'Passo Gardena'],
  ['20-minute-high-intensity-workout', 'Han River Parks, Seoul'],
  ['calorie-crush', 'Oktoberfest, Munich'],
  ['get-to-work-on-your-cycling-fitness', 'Brooklyn Bridge Commute'],
  ['festive-spin-with-surprise-sprints', 'Strasbourg Christmas Market'],
  ['cadence-training-to-improve-pedalling', 'Kyoto Hanami'],
  ['take-it-easy', 'Bathsheba, Barbados'],
  ['step-it-up', 'Machu Picchu Road'],
  ['running-on-empty', 'Outback Highway'],
  ['30-second-sprint-intervals', 'Tel Aviv Promenade'],
  ['flat-out-efforts', 'Silverstone Track Day'],
  ['sprints-for-climbing', 'Mur de Huy'],
  ['dont-get-dropped', 'Arenberg Forest'],
  ['25-minute-sprint-intervals', 'Chicago Lakefront Trail'],
  ['25-minute-high-intensity-intervals', 'Diwali, Marine Drive'],
  ['fat-burning-climb-passo-sella', 'Passo Sella'],
  ['high-intensity-race-day-effort', 'Kona Ironman'],
  ['sevens-build-your-vo2-max', 'Seven Sisters Cliffs'],
  ['emilys-short-mix', 'Brighton Pride'],
  ['intense-vo2-cycling-efforts', 'Iceland Ring Road'],
  ['new-year-spin-get-back-to-cycling', 'Sydney Harbour Fireworks'],
  ['strength-builder-and-quad-burner', 'Monte Zoncolan'],
  ['ollies-zone-2-tour-des-stations-training', 'Valais Ski Stations'],
  ['sweet-spot-endurance-training', 'Loire Châteaux'],
  ['1-minute-vo2-max-surges', 'Copenhagen Cycle Superhighway'],
  ['sprint-surges', 'Surfers Paradise'],
  ['the-hurt-locker', 'Moab Slickrock'],
  ['vo2-max-race-simulation', 'Glasgow World Championships'],
  ['the-climb', 'Mount Washington Auto Road'],
  ['vo2-max-booster', 'Grand Canyon South Rim'],
  ['start-hard-finish-hard', 'Calgary Stampede'],
  ['90-on-30-off-intervals', 'La Mercè, Barcelona'],
  ['30-second-sprints', "St. Patrick's Day, Dublin"],
  ['under-over-power-blocks', 'Big Sur'],
  ['30-second-sprints-hiit-sandwich', 'Songkran, Bangkok'],
  ['hiit-for-time-crunched-parents', 'Playground Park Loop'],
  ['30-minutes-of-threshold-power', 'Hoover Dam'],
  ['olympic-pursuit-efforts', 'Aguascalientes Velodrome'],
  ['ftp-hiit-booster-for-longer-efforts', 'Atlantic Ocean Road'],
  ['leg-burner', 'Fish Hill, Cotswolds'],
  ['the-smash-fest', 'Junkanoo, Nassau'],
  ['30-minute-short-sharp-efforts', 'Old Québec'],
  ['30-minute-hiit-ramp-session', 'Mount Fuji Road'],
  ['30-minute-high-cadence-hiit', 'The Bund, Shanghai'],
  ['sufferfest-ramp-session-the-escalator', 'Comuna 13, Medellín'],
  ['hiit-fat-burn-with-mitchelton-scott', 'Adelaide Hills'],
  ['over-under-intervals-on-the-passo-sella', 'Sella Ronda'],
  ['fast-fitness-high-cadence-30', 'Marrakech Medina'],
  ['30-minute-hill-climb-training', 'Mount Tamalpais'],
  ['over-under-threshold-efforts', 'Independence Pass'],
  ['tough-time-trial-efforts', 'Fenland Time Trial'],
  ['35-minute-threshold-hiit', 'Vienna Ringstrasse'],
  ['climb-and-sprint-to-the-beat', 'Blue Mountains, Jamaica'],
  ['35-minute-torque-power-intervals', "Col d'Aubisque"],
  ['fast-fitness-high-intensity-35', 'Rome Colosseum Loop'],
  ['climb-time-boost-your-climbing-power', 'Great St Bernard Pass'],
  ['high-power-anaerobic-sprints', 'Avenida 9 de Julio'],
  ['spin-those-legs', 'Okinawa Coast Road'],
  ['get-fit-in-40', 'Algarve Cliffs'],
  ['repeat-your-max', 'Mulholland Drive'],
  ['get-fit-fast-40-minute-sweet-spot', 'Provence Lavender'],
  ['a-little-bit-of-everything', 'Cherry Blossom Festival, D.C.'],
  ['cobbled-mayhem', 'Oude Kwaremont'],
  ['ftp-builder', 'Oregon Coast'],
  ['ramp-workout-from-threshold-to-sprints', 'Cypress Mountain'],
  ['40-minute-hiit', 'Iten, Kenya'],
  ['rolling-with-the-hills', 'The Palouse'],
  ['ramp-it-up-50-minute-hiit', 'Prague Old Town'],
  ['steepest-climb-in-the-world', 'Ffordd Pen Llech'],
  ['aerobic-efforts-drop-ollie-like-a-boss', 'Andalusian White Villages'],
  ['un-paced-efforts', 'Mongolian Steppe'],
  ['threshold-pyramid', 'Teotihuacán'],
  ['45-minute-vo2-max-intervals', 'Furka Pass'],
  ['45-minute-sprint-training', 'Beach Road, Melbourne'],
  ['ftp-booster-extended-efforts', 'Blue Ridge Parkway'],
  ['reverse-hiit-race-winning-intervals', 'Verona Arena Finale'],
  ['reverse-steps', 'Valparaíso Stairways'],
  ['60-minutes-of-brutal-power', 'Mauna Kea'],
  ['progressive-intervals-steps-to-glory', 'Mont Royal'],
  ['cadence-drills-for-strength-and-speed', 'Utrecht Bike City'],
  ['increase-your-threshold-power', 'Col du Galibier'],
  ['ramp-session-dialling-in-your-training-zones', 'Joshua Tree'],
  ['60-minute-endurance-intervals', 'Cabot Trail'],
  ['55-minute-ftp-threshold-intervals', 'Pico Veleta'],
  ['zwift-group-workout-hiit-intervals', 'Bay of Islands Group Ride'],
  ['race-winning-intervals', 'Yorkshire Dales'],
  ['60-minute-turbo-trainer-class', 'Engadin Lakes'],
];

// The HUD is proven without the GPU: drawn in software, the scene's passes slow every step. The
// scene's own tests (World Ride scene) draw it.
test.beforeEach(async ({ webgl }, testInfo) => {
  if (!testInfo.titlePath.some((title) => title.startsWith('World Ride scene'))) {
    await webgl.disable();
  }
});

test.describe('World Ride (L2-102)', () => {
  test('shows Ride in Old Town Criterium on a class with a world, and not on one without', async ({
    page,
  }) => {
    const classes = new ClassesPage(page);
    await page.goto('/classes/30-minute-hiit-cardio');
    await expect(classes.rideIn('Old Town Criterium')).toBeVisible();
    await classes.serveCatalogue(WORLDLESS_CATALOGUE);
    await page.goto('/classes/no-world');
    await expect(classes.heading).toHaveText('No world');
    await expect(page.getByRole('button', { name: /^Ride in / })).toHaveCount(0);
  });

  test('rides Intense Interval Blast in Caribana Parade on Lake Shore Boulevard', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Intense Interval Blast',
      'Caribana Parade',
      'intense-interval-blast',
    );
    await expect(world.heading).toHaveText('Caribana Parade');
    await expect(world.boardTitle).toHaveText('Riders nearby · Caribana Parade');
  });

  test('rides Time Is of the Essence in Westminster Rush Hour on Westminster Bridge', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Time Is of the Essence',
      'Westminster Rush Hour',
      'time-is-of-the-essence',
    );
    await expect(world.heading).toHaveText('Westminster Rush Hour');
    await expect(world.boardTitle).toHaveText('Riders nearby · Westminster Rush Hour');
  });

  test('rides 15 Minute Cardio HIIT in Central Park Loop on Park Drive', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '15 Minute Cardio HIIT',
      'Central Park Loop',
      '15-minute-cardio-hiit',
    );
    await expect(world.heading).toHaveText('Central Park Loop');
    await expect(world.boardTitle).toHaveText('Riders nearby · Central Park Loop');
  });

  test('rides Calorie Burning Workout in South Beach Sunrise on Ocean Drive', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Calorie Burning Workout',
      'South Beach Sunrise',
      'calorie-burning-workout',
    );
    await expect(world.heading).toHaveText('South Beach Sunrise');
    await expect(world.boardTitle).toHaveText('Riders nearby · South Beach Sunrise');
  });

  test('rides Sprintavals in Knicks Championship Parade up the Canyon of Heroes', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Sprintavals', 'Knicks Championship Parade', 'sprintavals');
    await expect(world.heading).toHaveText('Knicks Championship Parade');
    await expect(world.boardTitle).toHaveText('Riders nearby · Knicks Championship Parade');
  });

  test('rides 10 On 20 Off Max Sprints in Venice Beach Boardwalk on Ocean Front Walk', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '10 On 20 Off Max Sprints',
      'Venice Beach Boardwalk',
      '10-on-20-off-max-sprints',
    );
    await expect(world.heading).toHaveText('Venice Beach Boardwalk');
    await expect(world.boardTitle).toHaveText('Riders nearby · Venice Beach Boardwalk');
  });

  test('rides Low Cadence Strength Builder in Koppenberg Cobbles up the Koppenberg', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Low Cadence Strength Builder',
      'Koppenberg Cobbles',
      'low-cadence-strength-builder',
    );
    await expect(world.heading).toHaveText('Koppenberg Cobbles');
    await expect(world.boardTitle).toHaveText('Riders nearby · Koppenberg Cobbles');
  });

  test('rides 15 Minutes HIIT Sprinting Efforts in Golden Gate Park along JFK Drive', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '15 Minutes HIIT Sprinting Efforts',
      'Golden Gate Park',
      '15-minutes-hiit-sprinting-efforts',
    );
    await expect(world.heading).toHaveText('Golden Gate Park');
    await expect(world.boardTitle).toHaveText('Riders nearby · Golden Gate Park');
  });

  test('rides 15 Minute Beginner Session in Stanley Park Seawall along the seawall', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '15 Minute Beginner Session',
      'Stanley Park Seawall',
      '15-minute-beginner-session',
    );
    await expect(world.heading).toHaveText('Stanley Park Seawall');
    await expect(world.boardTitle).toHaveText('Riders nearby · Stanley Park Seawall');
  });

  test('rides 15 Minute HIIT Cardio round the Serpentine in Hyde Park', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '15 Minute HIIT Cardio',
      'Serpentine, Hyde Park',
      '15-minute-hiit-cardio',
    );
    await expect(world.heading).toHaveText('Serpentine, Hyde Park');
    await expect(world.boardTitle).toHaveText('Riders nearby · Serpentine, Hyde Park');
  });

  test('rides Easy Riding through the Napa vineyards', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Easy Riding', 'Napa Vineyards', 'easy-riding');
    await expect(world.heading).toHaveText('Napa Vineyards');
    await expect(world.boardTitle).toHaveText('Riders nearby · Napa Vineyards');
  });

  test('rides Elevate Your Climbing Power up the twenty-one hairpins of the Alpe', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Elevate Your Climbing Power',
      "Alpe d'Huez",
      'elevate-your-climbing-power',
    );
    await expect(world.heading).toHaveText("Alpe d'Huez");
    await expect(world.boardTitle).toHaveText("Riders nearby · Alpe d'Huez");
  });

  test('rides Short, Sharp & Hard Efforts up the cobbles of Montmartre', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Short, Sharp & Hard Efforts',
      'Montmartre',
      'short-sharp-and-hard-efforts',
    );
    await expect(world.heading).toHaveText('Montmartre');
    await expect(world.boardTitle).toHaveText('Riders nearby · Montmartre');
  });

  test('rides Team Time Trial across the Bonneville salt', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Team Time Trial', 'Bonneville Salt Flats', 'team-time-trial');
    await expect(world.heading).toHaveText('Bonneville Salt Flats');
    await expect(world.boardTitle).toHaveText('Riders nearby · Bonneville Salt Flats');
  });

  test('rides Give Me One Minute through Times Square', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Give Me One Minute',
      "Times Square New Year's Eve",
      'give-me-one-minute',
    );
    await expect(world.heading).toHaveText("Times Square New Year's Eve");
    await expect(world.boardTitle).toHaveText("Riders nearby · Times Square New Year's Eve");
  });

  test('rides Non-Stop Sprinting round the Monaco harbour', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Non-Stop Sprinting', 'Monaco Street Circuit', 'non-stop-sprinting');
    await expect(world.heading).toHaveText('Monaco Street Circuit');
    await expect(world.boardTitle).toHaveText('Riders nearby · Monaco Street Circuit');
  });

  test('rides Intervals to the Beat along the Ibiza sunset strip', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Intervals to the Beat',
      'Ibiza Sunset Strip',
      'intervals-to-the-beat',
    );
    await expect(world.heading).toHaveText('Ibiza Sunset Strip');
    await expect(world.boardTitle).toHaveText('Riders nearby · Ibiza Sunset Strip');
  });

  test('rides 20 Minutes to Work on Your Cadence along the white roads of Strade Bianche', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '20 Minutes to Work on Your Cadence',
      'Strade Bianche',
      '20-minutes-to-work-on-your-cadence',
    );
    await expect(world.heading).toHaveText('Strade Bianche');
    await expect(world.boardTitle).toHaveText('Riders nearby · Strade Bianche');
  });

  test('rides Sprint Into the Effort along the marina walk of Dubai Marina', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Sprint Into the Effort', 'Dubai Marina', 'sprint-into-the-effort');
    await expect(world.heading).toHaveText('Dubai Marina');
    await expect(world.boardTitle).toHaveText('Riders nearby · Dubai Marina');
  });

  test('rides Spin to Win Cadence Session round the boards of Lee Valley Velodrome', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Spin to Win Cadence Session',
      'Lee Valley Velodrome',
      'spin-to-win-cadence-session',
    );
    await expect(world.heading).toHaveText('Lee Valley Velodrome');
    await expect(world.boardTitle).toHaveText('Riders nearby · Lee Valley Velodrome');
  });

  test('rides Spin to Win along the boardwalk of Coney Island', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Spin to Win', 'Coney Island Boardwalk', 'spin-to-win');
    await expect(world.heading).toHaveText('Coney Island Boardwalk');
    await expect(world.boardTitle).toHaveText('Riders nearby · Coney Island Boardwalk');
  });

  test('rides 20 Minute Cardio: Lose Weight Fast along the beach path to Santa Monica Pier', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '20 Minute Cardio: Lose Weight Fast',
      'Santa Monica Pier',
      '20-minute-cardio-lose-weight-fast',
    );
    await expect(world.heading).toHaveText('Santa Monica Pier');
    await expect(world.boardTitle).toHaveText('Riders nearby · Santa Monica Pier');
  });

  test('rides Sufferfest 20 Minute Session along Badwater Road through Death Valley', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Sufferfest 20 Minute Session',
      'Death Valley',
      'sufferfest-20-minute-session',
    );
    await expect(world.heading).toHaveText('Death Valley');
    await expect(world.boardTitle).toHaveText('Riders nearby · Death Valley');
  });

  test('rides Progressive Efforts on the Passo Gardena along Badwater Road through Death Valley', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Progressive Efforts on the Passo Gardena',
      'Passo Gardena',
      'progressive-efforts-on-the-passo-gardena',
    );
    await expect(world.heading).toHaveText('Passo Gardena');
    await expect(world.boardTitle).toHaveText('Riders nearby · Passo Gardena');
  });

  test('rides Level Up Your Cadence in Ghent Six-Day round the Kuipke', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Level Up Your Cadence', 'Ghent Six-Day', 'level-up-your-cadence');
    await expect(world.heading).toHaveText('Ghent Six-Day');
    await expect(world.boardTitle).toHaveText('Riders nearby · Ghent Six-Day');
  });

  test('rides In and Out, Shake It All About in Blackpool Illuminations on the Promenade', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'In and Out, Shake It All About',
      'Blackpool Illuminations',
      'in-and-out-shake-it-all-about',
    );
    await expect(world.heading).toHaveText('Blackpool Illuminations');
    await expect(world.boardTitle).toHaveText('Riders nearby · Blackpool Illuminations');
  });

  test('rides 15 Minute Cardio Workout at Home in Suburban Sunrise on Maple Avenue', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '15 Minute Cardio Workout at Home',
      'Suburban Sunrise',
      '15-minute-cardio-workout-at-home',
    );
    await expect(world.heading).toHaveText('Suburban Sunrise');
    await expect(world.boardTitle).toHaveText('Riders nearby · Suburban Sunrise');
  });

  test('rides Quick HIIT Workout in Notting Hill Carnival on Ladbroke Grove', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Quick HIIT Workout', 'Notting Hill Carnival', 'quick-hiit-workout');
    await expect(world.heading).toHaveText('Notting Hill Carnival');
    await expect(world.boardTitle).toHaveText('Riders nearby · Notting Hill Carnival');
  });

  test('rides Quick HIIT Sprint Workout in Las Vegas Strip on the Boulevard', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Quick HIIT Sprint Workout',
      'Las Vegas Strip',
      'quick-hiit-sprint-workout',
    );
    await expect(world.heading).toHaveText('Las Vegas Strip');
    await expect(world.boardTitle).toHaveText('Riders nearby · Las Vegas Strip');
  });

  test('rides High Power Tempo With Short Sprints in Route 66 Desert on Route 66', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'High Power Tempo With Short Sprints',
      'Route 66 Desert',
      'high-power-tempo-with-short-sprints',
    );
    await expect(world.heading).toHaveText('Route 66 Desert');
    await expect(world.boardTitle).toHaveText('Riders nearby · Route 66 Desert');
  });

  test('rides Beginner Training Session in Amsterdam Canals along the Herengracht', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Beginner Training Session',
      'Amsterdam Canals',
      'beginner-training-session',
    );
    await expect(world.heading).toHaveText('Amsterdam Canals');
    await expect(world.boardTitle).toHaveText('Riders nearby · Amsterdam Canals');
  });

  test('rides The Pyramid in Giza Plateau on the Plateau Road', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('The Pyramid', 'Giza Plateau', 'the-pyramid');
    await expect(world.heading).toHaveText('Giza Plateau');
    await expect(world.boardTitle).toHaveText('Riders nearby · Giza Plateau');
  });

  test('rides Drag Race in Daytona Beach Sand along the tide line', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Drag Race', 'Daytona Beach Sand', 'drag-race');
    await expect(world.heading).toHaveText('Daytona Beach Sand');
    await expect(world.boardTitle).toHaveText('Riders nearby · Daytona Beach Sand');
  });

  test('rides In & Out of the Saddle Hill Climb Reps in Mont Ventoux up from Chalet Reynard', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'In & Out of the Saddle Hill Climb Reps',
      'Mont Ventoux',
      'in-and-out-of-the-saddle-hill-climb-reps',
    );
    await expect(world.heading).toHaveText('Mont Ventoux');
    await expect(world.boardTitle).toHaveText('Riders nearby · Mont Ventoux');
  });

  test('rides 20 Minute Crit Sprints in Chicago Loop Crit along Wabash Avenue', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '20 Minute Crit Sprints',
      'Chicago Loop Crit',
      '20-minute-crit-sprints',
    );
    await expect(world.heading).toHaveText('Chicago Loop Crit');
    await expect(world.boardTitle).toHaveText('Riders nearby · Chicago Loop Crit');
  });

  test('rides 30 Sec On, 2 Min Off in Havana Malecón along the seawall', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('30 Sec On, 2 Min Off', 'Havana Malecón', '30-sec-on-2-min-off');
    await expect(world.heading).toHaveText('Havana Malecón');
    await expect(world.boardTitle).toHaveText('Riders nearby · Havana Malecón');
  });

  test('rides 20/40 Interval Session in Sea Point, Cape Town along the promenade', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '20/40 Interval Session',
      'Sea Point, Cape Town',
      '20-40-interval-session',
    );
    await expect(world.heading).toHaveText('Sea Point, Cape Town');
    await expect(world.boardTitle).toHaveText('Riders nearby · Sea Point, Cape Town');
  });

  test('rides High Intensity, Short Rest in Montreal Jazz Fest along Rue Sainte-Catherine', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'High Intensity, Short Rest',
      'Montreal Jazz Fest',
      'high-intensity-short-rest',
    );
    await expect(world.heading).toHaveText('Montreal Jazz Fest');
    await expect(world.boardTitle).toHaveText('Riders nearby · Montreal Jazz Fest');
  });

  test('rides Conquer the Climb in Stelvio Pass up the hairpins', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Conquer the Climb', 'Stelvio Pass', 'conquer-the-climb');
    await expect(world.heading).toHaveText('Stelvio Pass');
    await expect(world.boardTitle).toHaveText('Riders nearby · Stelvio Pass');
  });

  test('rides 20 Minute HIIT in Edinburgh Fringe up the Royal Mile', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('20 Minute HIIT', 'Edinburgh Fringe', '20-minute-hiit');
    await expect(world.heading).toHaveText('Edinburgh Fringe');
    await expect(world.boardTitle).toHaveText('Riders nearby · Edinburgh Fringe');
  });

  test('rides 20 Minute Fat Burning Workout in North Shore, Oahu along Kamehameha Highway', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '20 Minute Fat Burning Workout',
      'North Shore, Oahu',
      '20-minute-fat-burning-workout',
    );
    await expect(world.heading).toHaveText('North Shore, Oahu');
    await expect(world.boardTitle).toHaveText('Riders nearby · North Shore, Oahu');
  });

  test('rides Intense Climb: Passo Campolongo in Passo Campolongo up from Corvara', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Intense Climb: Passo Campolongo',
      'Passo Campolongo',
      'intense-climb-passo-campolongo',
    );
    await expect(world.heading).toHaveText('Passo Campolongo');
    await expect(world.boardTitle).toHaveText('Riders nearby · Passo Campolongo');
  });

  test('rides Fast Paced Cadence Variations in Marina Bay Night round the bay', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Fast Paced Cadence Variations',
      'Marina Bay Night',
      'fast-paced-cadence-variations',
    );
    await expect(world.heading).toHaveText('Marina Bay Night');
    await expect(world.boardTitle).toHaveText('Riders nearby · Marina Bay Night');
  });

  test('rides Quick & Sharp Sprinting Efforts in Champs-Élysées Finale up to the Arc', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Quick & Sharp Sprinting Efforts',
      'Champs-Élysées Finale',
      'quick-and-sharp-sprinting-efforts',
    );
    await expect(world.heading).toHaveText('Champs-Élysées Finale');
    await expect(world.boardTitle).toHaveText('Riders nearby · Champs-Élysées Finale');
  });

  test('rides Easy Cadence Workout in Dutch Tulip Fields through the bulb fields', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Easy Cadence Workout',
      'Dutch Tulip Fields',
      'easy-cadence-workout',
    );
    await expect(world.heading).toHaveText('Dutch Tulip Fields');
    await expect(world.boardTitle).toHaveText('Riders nearby · Dutch Tulip Fields');
  });

  test('rides Four Minute Devils in Col du Tourmalet with the devil', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Four Minute Devils', 'Col du Tourmalet', 'four-minute-devils');
    await expect(world.heading).toHaveText('Col du Tourmalet');
    await expect(world.boardTitle).toHaveText('Riders nearby · Col du Tourmalet');
  });

  test('rides Sprint to the Music in Glastonbury Fields to the Pyramid Stage', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Sprint to the Music', 'Glastonbury Fields', 'sprint-to-the-music');
    await expect(world.heading).toHaveText('Glastonbury Fields');
    await expect(world.boardTitle).toHaveText('Riders nearby · Glastonbury Fields');
  });

  test('rides Wake Up and Smell the Lactic past Pike Place at Dawn', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Wake Up and Smell the Lactic',
      'Pike Place at Dawn',
      'wake-up-and-smell-the-lactic',
    );
    await expect(world.heading).toHaveText('Pike Place at Dawn');
    await expect(world.boardTitle).toHaveText('Riders nearby · Pike Place at Dawn');
  });

  test('rides 25 Minute Hill Training up Hardknott Pass through the fells', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '25 Minute Hill Training',
      'Hardknott Pass',
      '25-minute-hill-training',
    );
    await expect(world.heading).toHaveText('Hardknott Pass');
    await expect(world.boardTitle).toHaveText('Riders nearby · Hardknott Pass');
  });

  test('rides Burn Fat Fast through the Saguaro Desert at sunrise', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Burn Fat Fast', 'Saguaro Desert', 'burn-fat-fast');
    await expect(world.heading).toHaveText('Saguaro Desert');
    await expect(world.boardTitle).toHaveText('Riders nearby · Saguaro Desert');
  });

  test('rides Gradual Threshold Effort Builds up Trollstigen beside the waterfalls', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Gradual Threshold Effort Builds',
      'Trollstigen',
      'gradual-threshold-effort-builds',
    );
    await expect(world.heading).toHaveText('Trollstigen');
    await expect(world.boardTitle).toHaveText('Riders nearby · Trollstigen');
  });

  test('rides Tempo Efforts With Sprint Finishes over the Poggio to San Remo', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Tempo Efforts With Sprint Finishes',
      'The Poggio',
      'tempo-efforts-with-sprint-finishes',
    );
    await expect(world.heading).toHaveText('The Poggio');
    await expect(world.boardTitle).toHaveText('Riders nearby · The Poggio');
  });

  test('rides 90-Second Extended Accelerations down the Indianapolis Brickyard straight', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '90-Second Extended Accelerations',
      'Indianapolis Brickyard',
      '90-second-extended-accelerations',
    );
    await expect(world.heading).toHaveText('Indianapolis Brickyard');
    await expect(world.boardTitle).toHaveText('Riders nearby · Indianapolis Brickyard');
  });

  test('rides The Full Pyramid through the jungle to Chichén Itzá', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('The Full Pyramid', 'Chichén Itzá', 'the-full-pyramid');
    await expect(world.heading).toHaveText('Chichén Itzá');
    await expect(world.boardTitle).toHaveText('Riders nearby · Chichén Itzá');
  });

  test('rides Seated Surges along the shore of Lake Como', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Seated Surges', 'Lake Como', 'seated-surges');
    await expect(world.heading).toHaveText('Lake Como');
    await expect(world.boardTitle).toHaveText('Riders nearby · Lake Como');
  });

  test('rides Full Effort VO2 Max Intervals beneath El Capitan in Yosemite Valley', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Full Effort VO2 Max Intervals',
      'Yosemite Valley',
      'full-effort-vo2-max-intervals',
    );
    await expect(world.heading).toHaveText('Yosemite Valley');
    await expect(world.boardTitle).toHaveText('Riders nearby · Yosemite Valley');
  });

  test('rides Go Until You Blow up the black slopes of Mount Etna', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Go Until You Blow', 'Mount Etna', 'go-until-you-blow');
    await expect(world.heading).toHaveText('Mount Etna');
    await expect(world.boardTitle).toHaveText('Riders nearby · Mount Etna');
  });

  test('rides Low Cadence Workout up the cobbled Tremola', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Low Cadence Workout',
      'Tremola, Gotthard Pass',
      'low-cadence-workout',
    );
    await expect(world.heading).toHaveText('Tremola, Gotthard Pass');
    await expect(world.boardTitle).toHaveText('Riders nearby · Tremola, Gotthard Pass');
  });

  test('rides Build Your FTP & Increase Muscle Mass above the clouds on Mount Teide', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Build Your FTP & Increase Muscle Mass',
      'Mount Teide',
      'build-your-ftp-and-increase-muscle-mass',
    );
    await expect(world.heading).toHaveText('Mount Teide');
    await expect(world.boardTitle).toHaveText('Riders nearby · Mount Teide');
  });

  test('rides Intense High Tempo Bike Workout down the runway on Tempelhof Field', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Intense High Tempo Bike Workout',
      'Tempelhof Field',
      'intense-high-tempo-bike-workout',
    );
    await expect(world.heading).toHaveText('Tempelhof Field');
    await expect(world.boardTitle).toHaveText('Riders nearby · Tempelhof Field');
  });

  test('rides 30 Minute VO2 Max Session beneath the granite towers of Torres del Paine', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '30 Minute VO2 Max Session',
      'Torres del Paine',
      '30-minute-vo2-max-session',
    );
    await expect(world.heading).toHaveText('Torres del Paine');
    await expect(world.boardTitle).toHaveText('Riders nearby · Torres del Paine');
  });

  test('rides Into the Unknown through the mist on the Isle of Skye', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Into the Unknown', 'Isle of Skye Fog', 'into-the-unknown');
    await expect(world.heading).toHaveText('Isle of Skye Fog');
    await expect(world.boardTitle).toHaveText('Riders nearby · Isle of Skye Fog');
  });

  test('rides 30 Minute Sprint and Threshold HIIT along the Toronto Waterfront Trail', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '30 Minute Sprint and Threshold HIIT',
      'Toronto Waterfront Trail',
      '30-minute-sprint-and-threshold-hiit',
    );
    await expect(world.heading).toHaveText('Toronto Waterfront Trail');
    await expect(world.boardTitle).toHaveText('Riders nearby · Toronto Waterfront Trail');
  });

  test('rides 30 Minute Intervals: Fitness Training round the loop of Prospect Park', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '30 Minute Intervals: Fitness Training',
      'Prospect Park',
      '30-minute-intervals-fitness-training',
    );
    await expect(world.heading).toHaveText('Prospect Park');
    await expect(world.boardTitle).toHaveText('Riders nearby · Prospect Park');
  });

  test('rides Aerobic Cadence Workout With Team Sky up the hairpins of Sa Calobra', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Aerobic Cadence Workout With Team Sky',
      'Sa Calobra, Mallorca',
      'aerobic-cadence-workout-with-team-sky',
    );
    await expect(world.heading).toHaveText('Sa Calobra, Mallorca');
    await expect(world.boardTitle).toHaveText('Riders nearby · Sa Calobra, Mallorca');
  });

  test("rides Conor's Racing Bonanza over the Wicklow Gap", async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass("Conor's Racing Bonanza", 'Wicklow Gap', 'conors-racing-bonanza');
    await expect(world.heading).toHaveText('Wicklow Gap');
    await expect(world.boardTitle).toHaveText('Riders nearby · Wicklow Gap');
  });

  test('rides Maximum Intensity Hill Climb Efforts up Haleakalā above the clouds', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Maximum Intensity Hill Climb Efforts',
      'Haleakalā',
      'maximum-intensity-hill-climb-efforts',
    );
    await expect(world.heading).toHaveText('Haleakalā');
    await expect(world.boardTitle).toHaveText('Riders nearby · Haleakalā');
  });

  test('rides Get Pumped With Grace down Sixth Street in Austin', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Get Pumped With Grace',
      'Sixth Street, Austin',
      'get-pumped-with-grace',
    );
    await expect(world.heading).toHaveText('Sixth Street, Austin');
    await expect(world.boardTitle).toHaveText('Riders nearby · Sixth Street, Austin');
  });

  test('rides 35 Minute Hill Training up the gorge of Winnats Pass', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '35 Minute Hill Training',
      'Winnats Pass',
      '35-minute-hill-training',
    );
    await expect(world.heading).toHaveText('Winnats Pass');
    await expect(world.boardTitle).toHaveText('Riders nearby · Winnats Pass');
  });

  test('rides Ramp It Up: Punchy Intervals up the painted wall of La Redoute', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Ramp It Up: Punchy Intervals',
      'La Redoute',
      'ramp-it-up-punchy-intervals',
    );
    await expect(world.heading).toHaveText('La Redoute');
    await expect(world.boardTitle).toHaveText('Riders nearby · La Redoute');
  });

  test('rides 5 Gruelling Minutes up the ramps of the Angliru', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('5 Gruelling Minutes', 'Angliru', '5-gruelling-minutes');
    await expect(world.heading).toHaveText('Angliru');
    await expect(world.boardTitle).toHaveText('Riders nearby · Angliru');
  });

  test('rides 3 Mins On, 2 Mins Off along the cliffs of the Cinque Terre', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('3 Mins On, 2 Mins Off', 'Cinque Terre', '3-mins-on-2-mins-off');
    await expect(world.heading).toHaveText('Cinque Terre');
    await expect(world.boardTitle).toHaveText('Riders nearby · Cinque Terre');
  });

  test('rides Drop Ollie at All Costs up Els Àngels above Girona', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Drop Ollie at All Costs',
      'Els Àngels, Girona',
      'drop-ollie-at-all-costs',
    );
    await expect(world.heading).toHaveText('Els Àngels, Girona');
    await expect(world.boardTitle).toHaveText('Riders nearby · Els Àngels, Girona');
  });

  test('rides Aerobic Efforts With Max Sprints along the frozen canal at Winterlude', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Aerobic Efforts With Max Sprints',
      'Winterlude, Ottawa',
      'aerobic-efforts-with-max-sprints',
    );
    await expect(world.heading).toHaveText('Winterlude, Ottawa');
    await expect(world.boardTitle).toHaveText('Riders nearby · Winterlude, Ottawa');
  });

  test("rides Hank's Hardest Training Session up the Alto de Letras", async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      "Hank's Hardest Training Session",
      'Alto de Letras',
      'hanks-hardest-training-session',
    );
    await expect(world.heading).toHaveText('Alto de Letras');
    await expect(world.boardTitle).toHaveText('Riders nearby · Alto de Letras');
  });

  test('rides Lead Out Efforts Into Full Sprints along the docks of the Antwerp Port Sprint', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Lead Out Efforts Into Full Sprints',
      'Antwerp Port Sprint',
      'lead-out-efforts-into-full-sprints',
    );
    await expect(world.heading).toHaveText('Antwerp Port Sprint');
    await expect(world.boardTitle).toHaveText('Riders nearby · Antwerp Port Sprint');
  });

  test('rides Sandwich Max Efforts along the shore of Lake Tahoe', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Sandwich Max Efforts', 'Lake Tahoe', 'sandwich-max-efforts');
    await expect(world.heading).toHaveText('Lake Tahoe');
    await expect(world.boardTitle).toHaveText('Riders nearby · Lake Tahoe');
  });

  test('rides Extreme Fat Burning Class across the salt flats of the Atacama Desert', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Extreme Fat Burning Class',
      'Atacama Desert',
      'extreme-fat-burning-class',
    );
    await expect(world.heading).toHaveText('Atacama Desert');
    await expect(world.boardTitle).toHaveText('Riders nearby · Atacama Desert');
  });

  test('rides 60 Minute Reverse Pyramid between the temples of Angkor', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '60 Minute Reverse Pyramid',
      'Angkor Temples',
      '60-minute-reverse-pyramid',
    );
    await expect(world.heading).toHaveText('Angkor Temples');
    await expect(world.boardTitle).toHaveText('Riders nearby · Angkor Temples');
  });

  test('rides 60 Minutes of Brutal Power up Mauna Kea past the observatories', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      '60 Minutes of Brutal Power',
      'Mauna Kea',
      '60-minutes-of-brutal-power',
    );
    await expect(world.heading).toHaveText('Mauna Kea');
    await expect(world.boardTitle).toHaveText('Riders nearby · Mauna Kea');
  });

  test('rides Increase Your Threshold Power up the Col du Galibier between the snow banks', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass(
      'Increase Your Threshold Power',
      'Col du Galibier',
      'increase-your-threshold-power',
    );
    await expect(world.heading).toHaveText('Col du Galibier');
    await expect(world.boardTitle).toHaveText('Riders nearby · Col du Galibier');
  });

  test('rides Ride to the Beat along the neon-lit beachfront of Miami Neon Nights', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass('Ride to the Beat', 'Miami Neon Nights', 'ride-to-the-beat');
    await expect(world.heading).toHaveText('Miami Neon Nights');
    await expect(world.boardTitle).toHaveText('Riders nearby · Miami Neon Nights');
  });

  test('starts the class ride on the bike and opens World Ride', async ({ page, bluetooth }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect(world.heading).toHaveText('Old Town Criterium');
    await expect(page).toHaveTitle('Old Town Criterium');
    await expect(page.getByRole('main', { name: 'Old Town Criterium' })).toBeVisible();
    // The class's warm-up level goes to the bike.
    await expect
      .poll(async () => (await bluetooth.writes()).map((w) => w.args))
      .toContain(setLevel(18));
  });

  test('asks to replace a ride in progress before opening World Ride', async ({ page }) => {
    const ride = new RidePage(page);
    await ride.open();
    await ride.connect();
    await expect(ride.statusState).toHaveText('Connected');
    await new SetupPage(page).open();
    await new SetupPage(page).startButton.click();
    await page.waitForURL(/\/$/);

    const classes = new ClassesPage(page);
    await page.getByRole('banner').getByRole('link', { name: 'Library' }).click();
    await classes.card('30 Minute HIIT Cardio').click();
    await classes.rideIn('Old Town Criterium').click();
    const replace = new ReplaceRideDialog(page);
    await expect(replace.dialog).toBeVisible();
    await replace.replaceButton.click();
    await page.waitForURL(/\/classes\/30-minute-hiit-cardio\/world$/);
  });
});

test.describe('World Ride access and app bar (L2-102, L2-103)', () => {
  test('sends the rider to the class page when no ride of that class is in progress', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.open();
    await expect(page).toHaveURL(/\/classes\/30-minute-hiit-cardio$/);
  });

  test('sends the rider to the class page for a class without a world', async ({ page }) => {
    await new WorldRidePage(page).open('calorie-burning-workout');
    await expect(page).toHaveURL(/\/classes\/calorie-burning-workout$/);
  });

  test('shows the class not-found page for an unknown class', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.open('no-such-class');
    await expect(world.notFoundTitle).toBeVisible();
  });

  test('leads Class back to the class page and the lockup to the dashboard, the ride running on', async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect(world.classLink).toHaveAttribute('href', '/classes/30-minute-hiit-cardio');
    await expect(world.lockup).toHaveAttribute('href', '/');
    await world.classLink.click();
    await expect(page).toHaveURL(/\/classes\/30-minute-hiit-cardio$/);
    await page.goBack();
    await world.lockup.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(new RidePage(page).pauseButton).toBeVisible();
  });

  test('opens the end-ride dialog from End', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await world.endButton.click();
    await expect(new EndRideDialog(page).dialog).toBeVisible();
  });

  test('shows the world, route, class, bike and clock in the app bar', async ({ page }) => {
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await page.clock.runFor(300_000);
    await expect(world.heading).toHaveText('Old Town Criterium');
    await expect(world.classLine).toHaveText('Cathedral Circuit · 30 Minute HIIT Cardio');
    await expect(world.bike).toHaveText('ECHEX-3-141844');
    await expect(world.clock).toHaveText('5:00 / 30:00');
    expect(await world.barOrder()).toEqual([
      'Wattzup dashboard',
      'Class',
      'Ride sound off',
      'Music',
      'Pause',
      'End',
    ]);
  });

  test('pauses and resumes the ride', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await world.pauseButton.click();
    await expect(world.resumeButton).toBeVisible();
    await world.resumeButton.click();
    await expect(world.pauseButton).toBeVisible();
  });
});

test.describe('World Ride live metrics (L2-104)', () => {
  test('shows -- until the bike reports, then power against target, cadence and speed', async ({
    page,
    bluetooth,
  }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect(world.power).toHaveText('--');
    await expect(world.stat('Cadence')).toHaveText('-- rpm');
    await expect(world.stat('Speed')).toHaveText('-- km/h');

    await bluetooth.notify(CADENCE_95);
    await bluetooth.notify(resistance(18));
    await expect(world.power).toHaveText('317');
    await expect(world.powerUnit).toHaveText('W est.');
    await expect(world.powerUnit).toHaveAttribute('title', 'Estimated from cadence and resistance');
    await expect(world.target).toContainText(/Target \d+ W/);
    await expect(world.stat('Cadence')).toHaveText('95 rpm');
    await expect(world.stat('Heart')).toHaveText('-- bpm');
    await expect(world.stat('Speed')).toHaveText('35.6 km/h');
  });
});

test.describe('World Ride current segment (L2-105)', () => {
  test('counts down the warm-up and names the first effort by its world name', async ({ page }) => {
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect(world.segmentLabel).toHaveText('Warm-up');
    await expect(world.next).toHaveText('Next: Cobbled sprint · 0:30 at level 24');
    await page.clock.runFor(60_000);
    await expect(world.segmentLeft).toHaveText('4:00');
    await expect(world.segmentProgress).toHaveAttribute('aria-valuemax', '300');
  });

  test('steps to the first work segment and then recovers', async ({ page }) => {
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await page.clock.runFor(315_000);
    await expect(world.segmentLabel).toHaveText('Work · 1 of 8');
    await expect(world.next).toHaveText('Next: Recover · 3:00 at level 10');
    await page.clock.runFor(30_000);
    await expect(world.segmentLabel).toHaveText('Recover · 1 of 8');
  });

  test('reads Last stretch to the finish arch on the last segment', async ({ page }) => {
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await page.clock.fastForward(1_750_000);
    await expect(world.segmentLabel).toHaveText('Cool-down');
    await expect(world.next).toHaveText('Last stretch to the finish arch');
  });
});

test.describe('World Ride resistance (L2-108)', () => {
  test('shows the bike level and steps it with - and +, in manual', async ({ page, bluetooth }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await bluetooth.notify(resistance(8));
    await expect(world.level).toHaveText('8');
    await expect(world.levelCaption).toHaveText('Resistance / 32');

    await world.raise.click();
    await expect
      .poll(async () => (await bluetooth.writes()).map((w) => w.args))
      .toContain(setLevel(9));
    await expect(world.levelCaption).toHaveText('Manual');
  });

  test('disables - at 1 and + at 32', async ({ page, bluetooth }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await bluetooth.notify(resistance(1));
    await expect(world.lower).toBeDisabled();
    await expect(world.raise).toBeEnabled();
    await bluetooth.notify(resistance(32));
    await expect(world.lower).toBeEnabled();
    await expect(world.raise).toBeDisabled();
  });
});

test.describe('World Ride pause, lost bike and the end (L2-109)', () => {
  test('holds the world still with Paused on <route>', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect(world.pausedOverlay).toHaveCount(0);
    await world.pauseButton.click();
    await expect(world.pausedOverlay).toContainText('Paused on Cathedral Circuit');
    await expect(world.pausedOverlay).toContainText('The world holds still until you pedal again.');
  });

  test('shows Lost the bike when the bike drops, with Reconnect, and the HUD inert', async ({
    page,
    bluetooth,
  }) => {
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await page.clock.runFor(5_000);
    await bluetooth.drop();
    // The engine marks the ride lost on its next tick; the link retries only after 3 s.
    await page.clock.runFor(1_000);
    await expect(world.lostOverlay).toContainText('Lost the bike');
    await expect(world.lostOverlay).toContainText('on Cathedral Circuit');
    await expect(world.reconnectButton).toBeFocused();
    await expect(world.hud).toHaveAttribute('inert', '');
  });

  test('shows Ride complete over the held world when the plan ends', async ({ page }) => {
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await page.clock.fastForward(1_805_000);
    await expect(world.endedOverlay).toContainText('Ride complete');
    await expect(world.seeYourRide).toBeFocused();
    await world.seeYourRide.click();
    await expect(page).toHaveURL(/\/sessions\/[a-f0-9]{12}$/);
  });
});

test.describe('World Ride route profile (L2-106)', () => {
  test('shows the grade, climbed and distance, and names the profile by its elevation', async ({
    page,
  }) => {
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await page.clock.runFor(290_000);
    await expect(world.profileGrade).toHaveText(/^[+−]\d+\.\d%$/);
    await expect(world.profileClimbed).toHaveText(/^\d+ m climbed$/);
    await expect(world.profileDistance).toHaveText(/^\d+\.\d\d km$/);
    await expect(world.routeImage).toHaveAttribute(
      'aria-label',
      /^Route profile, \d+ m of elevation$/,
    );
  });

  test('shows a rising and falling road on the Bonneville salt', async ({ page }) => {
    // L2-101 AC7: every scene's roll is above 0, so a once-flat class climbs too.
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass('Team Time Trial', 'Bonneville Salt Flats', 'team-time-trial');
    const grades = new Set<string>();
    for (let minute = 0; minute < 10; minute++) {
      await page.clock.runFor(60_000);
      grades.add((await world.profileGrade.textContent()) ?? '');
    }
    expect([...grades].filter((g) => !/^[+−-]0\.0%$/.test(g))).not.toEqual([]);
    await expect(world.profileClimbed).not.toHaveText('0 m climbed');
    await expect(world.routeImage).not.toHaveAttribute(
      'aria-label',
      'Route profile, 0 m of elevation',
    );
  });

  test('holds the grade and distance still while paused', async ({ page }) => {
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await page.clock.runFor(120_000);
    await world.pauseButton.click();
    const grade = await world.profileGrade.textContent();
    const distance = await world.profileDistance.textContent();
    await page.clock.runFor(60_000);
    await expect(world.profileGrade).toHaveText(grade ?? '');
    await expect(world.profileDistance).toHaveText(distance ?? '');
  });
});

test.describe('World Ride simulated pacers (L2-107)', () => {
  test('labels the board and lists six pacers and You, You current', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect(world.boardTitle).toHaveText('Riders nearby · Old Town Criterium');
    await expect(world.boardNote).toHaveText('Simulated pacers');
    await expect(world.riders).toHaveCount(7);
    await expect(world.you).toContainText('You');
  });

  test('keeps the gaps still while paused', async ({ page }) => {
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await page.clock.runFor(120_000);
    await world.pauseButton.click();
    const board = await world.riders.allTextContents();
    await page.clock.runFor(60_000);
    expect(await world.riders.allTextContents()).toEqual(board);
  });

  test('keeps the pacers on the device and out of the saved ride', async ({ page }) => {
    const sent: string[] = [];
    page.on('request', (r) => sent.push(`${r.url()} ${r.postData() ?? ''}`));
    await page.clock.install();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await page.clock.fastForward(1_805_000);
    await world.seeYourRide.click();
    await expect(page).toHaveURL(/\/sessions\/[a-f0-9]{12}$/);
    await expect(page.locator('main')).not.toContainText('Maya Okafor');
    expect(sent.filter((s) => /Maya Okafor|Kenji Watanabe/.test(s))).toEqual([]);
  });
});

/** The scene can take a while to load and report in software rendering. */
const STARTED = { timeout: 60_000 };

test.describe('World Ride scene (L2-110, L2-101 AC4)', () => {
  test("draws the scene of the class's world with its text alternative", async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect(world.scene).toBeVisible();
    await expect(world.scene).toHaveAttribute('role', 'img');
    await expect(world.scene).toHaveAttribute(
      'aria-label',
      'A cyclist on Cathedral Circuit in Old Town Criterium',
    );
    await expect(world.sceneNotice).toHaveCount(0);
  });

  test('shades every lit surface in bands at low, still bending the road (L2-111 AC11)', async ({
    page,
    worldRide,
  }) => {
    test.slow();
    await worldRide.pin('low');
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect
      .poll(async () => Object.keys((await worldRide.report())?.materials ?? {}).length, STARTED)
      .toBeGreaterThan(0);
    const report = await worldRide.report();
    const types = Object.keys(report?.materials ?? {}).map((v) => v.split('+')[0]);
    expect(types).toContain('MeshToonNodeMaterial');
    expect(types.filter((t) => /Standard|Physical/.test(t))).toEqual([]);
    expect(report?.unbent).toBe(0);
    // Silhouettes and creases are inked by one pass; the HUD is HTML over the canvas, never inked.
    expect(report?.outlines).toBe(true);
    // A flat graded sky, and cut-outs such as leaves and flags edged by an ordered dither.
    expect(report?.skyGradient).toBe(true);
    expect(report?.dithered).toBeGreaterThan(0);
    await expect(world.boardTitle).toBeVisible();
  });

  test('draws nothing that moves on its own at low with reduced motion (L2-111 AC11)', async ({
    page,
    worldRide,
  }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await worldRide.pin('low');
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect
      .poll(async () => (await worldRide.report())?.frames.length ?? 0, STARTED)
      .toBeGreaterThan(3);
    await world.pauseButton.click();
    await expect(world.resumeButton).toBeVisible();
    // Paused, the rider holds still; nothing else in the scene may move by itself.
    await page.waitForTimeout(1500);
    const first = await world.scene.screenshot();
    await page.waitForTimeout(1500);
    expect((await world.scene.screenshot()).equals(first)).toBe(true);
  });

  test('keeps physically based shading above low (L2-111 AC11)', async ({ page, worldRide }) => {
    test.slow();
    await worldRide.pin('medium');
    await new WorldRidePage(page).startFromClass();
    await expect
      .poll(async () => Object.keys((await worldRide.report())?.materials ?? {}).length, STARTED)
      .toBeGreaterThan(0);
    const types = Object.keys((await worldRide.report())?.materials ?? {}).map(
      (v) => v.split('+')[0],
    );
    expect(types.filter((t) => /Standard|Physical/.test(t)).length).toBeGreaterThan(0);
    expect(types).not.toContain('MeshToonNodeMaterial');
    const report = await worldRide.report();
    expect(report?.outlines).toBe(false);
    expect(report?.skyGradient).toBe(false);
    expect(report?.dithered).toBe(0);
  });

  test("shows This screen can't draw 3D worlds when WebGL is off, and the HUD still works", async ({
    page,
    webgl,
  }) => {
    await webgl.disable();
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect(world.sceneNotice).toContainText("This screen can't draw 3D worlds");
    await expect(world.sceneNotice).toContainText('The ride still runs on the numbers.');
    await world.pauseButton.click();
    await expect(world.resumeButton).toBeVisible();
  });
});

test.describe('World Ride for every class (L2-100 AC4)', () => {
  for (const [id, worldName] of CLASS_WORLDS) {
    test(`offers Ride in ${worldName} on ${id}`, async ({ page }) => {
      const classes = new ClassesPage(page);
      await page.goto(`/classes/${id}`);
      await expect(classes.rideIn(worldName)).toBeVisible();
    });
  }
});

test.describe('World Ride music (L2-128)', () => {
  test("plays the world's own track while the ride runs, looping at half volume", async ({
    page,
  }) => {
    const world = new WorldRidePage(page);
    await world.probeMusic();
    await world.startFromClass();
    await expect(world.musicButton).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await world.music())?.paused).toBe(false);
    const music = await world.music();
    expect(music?.src).toBe('music/oldtown.ogg');
    expect(music?.loop).toBe(true);
    expect(music?.volume).toBe(0.5);
  });

  test('gives every world a track of its own', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.probeMusic();
    await world.startFromClass(
      'Quick But Brutal HIIT',
      "Trinidad J'Ouvert",
      'quick-but-brutal-hiit',
    );
    await expect.poll(async () => (await world.music())?.src).toBe('music/jouvert.ogg');
    const response = await page.request.get('/music/jouvert.ogg');
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('audio/ogg');
  });

  test('pauses the track while paused and carries on when running', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.probeMusic();
    await world.startFromClass();
    await expect.poll(async () => (await world.music())?.paused).toBe(false);
    await world.pauseButton.click();
    await expect.poll(async () => (await world.music())?.paused).toBe(true);
    const at = (await world.music())?.time ?? 0;
    await world.resumeButton.click();
    await expect.poll(async () => (await world.music())?.paused).toBe(false);
    expect((await world.music())?.time ?? 0).toBeGreaterThanOrEqual(at);
  });

  test('opens the Ride sound dialog from the bar (L2-129 AC2)', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.startFromClass();
    await expect(world.rideSoundButton).toHaveAccessibleName('Ride sound off');
    await world.rideSoundButton.click();
    const dialog = new RideSoundDialog(page);
    await dialog.soundSwitch.check();
    await dialog.doneButton.click();
    await expect(world.rideSoundButton).toHaveAccessibleName('Ride sound on');
    await expect(world.rideSoundButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('plays the coast ambience in South Beach Sunrise, and none in Old Town (L2-129 AC12)', async ({
    page,
    audio,
  }) => {
    const world = new WorldRidePage(page);
    const dialog = new RideSoundDialog(page);
    await world.startFromClass();
    await world.rideSoundButton.click();
    await dialog.soundSwitch.check();
    await dialog.doneButton.click();
    // Wind and tyre loop; Old Town declares no ambience, so nothing more does.
    await expect.poll(() => audio.loops()).toBe(2);
    await page.waitForTimeout(500);
    expect(await audio.loops()).toBe(2);

    await world.startFromClass(
      'Calorie Burning Workout',
      'South Beach Sunrise',
      'calorie-burning-workout',
    );
    await world.rideSoundButton.click();
    await dialog.soundSwitch.check();
    await dialog.doneButton.click();
    // A fresh page load: wind, tyre and the coast's surf.
    await expect.poll(() => audio.loops()).toBe(3);
  });

  test('mutes and unmutes with the Music toggle', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.probeMusic();
    await world.startFromClass();
    await expect.poll(async () => (await world.music())?.paused).toBe(false);
    await world.musicButton.click();
    await expect(world.musicButton).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(async () => (await world.music())?.paused).toBe(true);
    await world.musicButton.press('Enter');
    await expect(world.musicButton).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await world.music())?.paused).toBe(false);
  });

  test('keeps music off for the next ride once turned off', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.probeMusic();
    await world.startFromClass();
    await world.musicButton.click();
    await expect(world.musicButton).toHaveAttribute('aria-pressed', 'false');
    await world.classLink.click();
    await page.goBack();
    await expect(world.musicButton).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(async () => (await world.music())?.paused).toBe(true);
  });

  test('stops the track on leaving World Ride', async ({ page }) => {
    const world = new WorldRidePage(page);
    await world.probeMusic();
    await world.startFromClass();
    await expect.poll(async () => (await world.music())?.paused).toBe(false);
    await world.lockup.click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(async () => (await world.music())?.paused).toBe(true);
  });
});
