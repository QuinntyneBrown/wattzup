// Acceptance test
// Traces to: L2-166 AC1, AC2, AC10, AC26
// Description: a race on a map whose world is built as a course draws the course's map, loaded from the app's own
// `courses/` folder, and moves along it as the rider rides: two pictures of the world a few seconds apart
// differ. Comparing two pictures of the same canvas reads no pixel's colour (ADR 0021). The course draws in software
// here, on WebGL2.
import type { Locator, Page } from '@playwright/test';
import {
  adelaideCourseMap,
  aguascalientesCourseMap,
  algarveCourseMap,
  alpeCourseMap,
  amsterdamCourseMap,
  angelsCourseMap,
  angkorCourseMap,
  angliruCourseMap,
  antwerpCourseMap,
  arenbergCourseMap,
  artMuseumCourseMap,
  atacamaCourseMap,
  atlanticRoadCourseMap,
  aubisqueCourseMap,
  austinCourseMap,
  bathshebaCourseMap,
  bayOfIslandsCourseMap,
  beachRoadCourseMap,
  bealachCourseMap,
  bigSurCourseMap,
  blackpoolCourseMap,
  blueMountainsCourseMap,
  blueRidgeCourseMap,
  bondiCourseMap,
  bonnevilleCourseMap,
  brickyardCourseMap,
  brightonCourseMap,
  brooklynCourseMap,
  bundCourseMap,
  calobraCourseMap,
  campolongoCourseMap,
  cabotCourseMap,
  centralParkCourseMap,
  cherryBlossomCourseMap,
  champsCourseMap,
  chicagoCourseMap,
  chichenCourseMap,
  comoCourseMap,
  comuna13CourseMap,
  coneyCourseMap,
  copacabanaCourseMap,
  copenhagenCourseMap,
  cornwallCourseMap,
  cypressCourseMap,
  dalesCourseMap,
  daytonaCourseMap,
  deathValleyCourseMap,
  diwaliCourseMap,
  dubaiCourseMap,
  edinburghCourseMap,
  engadinCourseMap,
  etnaCourseMap,
  fensCourseMap,
  fishhillCourseMap,
  fujiCourseMap,
  furkaCourseMap,
  galibierCourseMap,
  gardenaCourseMap,
  ghentCourseMap,
  gizaCourseMap,
  glasgowCourseMap,
  glastonburyCourseMap,
  goldengateCourseMap,
  grandcanyonCourseMap,
  graniteCourseMap,
  greatoceanCourseMap,
  hanRiverCourseMap,
  hardknottCourseMap,
  havanaCourseMap,
  hooverCourseMap,
  icelandCourseMap,
  independenceCourseMap,
  isleofmanCourseMap,
  itenCourseMap,
  jaipurCourseMap,
  jouvertCourseMap,
  joshuaTreeCourseMap,
  junkanooCourseMap,
  kilaueaCourseMap,
  knicksCourseMap,
  konaCourseMap,
  koppenbergCourseMap,
  kwaremontCourseMap,
  kyotoCourseMap,
  lakefrontCourseMap,
  lakeLouiseCourseMap,
  letrasCourseMap,
  lisbonCourseMap,
  loireCourseMap,
  machupicchuCourseMap,
  marinabayCourseMap,
  marrakechCourseMap,
  mardigrasCourseMap,
  maunakeaCourseMap,
  merceCourseMap,
  miamiCourseMap,
  moabCourseMap,
  monacoCourseMap,
  montmartreCourseMap,
  montrealCourseMap,
  cinqueTerreCourseMap,
  haleakalaCourseMap,
  ibizaCourseMap,
  sellaRondaCourseMap,
} from './fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import type { FakeBluetooth } from './fixtures/fake-bluetooth';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';

/** Rides `rpm` for a second of the ride's clock. */
async function ride(page: Page, bluetooth: FakeBluetooth, rpm: number): Promise<void> {
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(rpm));
  await page.clock.runFor(1000);
}

/** A picture of the world alone, as race-world-scene.spec.ts takes it. */
async function picture(page: Page, canvas: Locator): Promise<Buffer> {
  await page.addStyleTag({
    content: '.race > :not(.race-scene) { visibility: hidden !important; }',
  });
  let done = false;
  const taken = canvas.screenshot().finally(() => (done = true));
  while (!done) {
    await page.clock.runFor(16);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return taken;
}

test.describe('a course', () => {
  // The map is drawn in software here.
  test.slow();

  test("draws the course's map and its rider and moves along it as the rider rides (L2-166 AC1, AC2, AC26)", async ({
    page,
    bluetooth,
    api,
    webgl,
  }) => {
    await webgl.withoutWebGpu();
    const loaded: string[] = [];
    page.on('requestfinished', (request) => loaded.push(new URL(request.url()).pathname));
    const race = await startRace(page, bluetooth, api, ibizaCourseMap.id, 'mode=solo', {
      catalogue: [ibizaCourseMap],
      world: true,
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    expect(loaded).toContain('/courses/ibiza.glb');
    expect(loaded).toContain('/courses/ibiza.course.json');
    // The rider is the one built in Blender, loaded with the course (L2-166 AC26, ADR 0036).
    expect(loaded).toContain('/riders/rider.glb');
    await ride(page, bluetooth, 80);
    const first = await picture(page, race.world);

    await ride(page, bluetooth, 80);

    expect((await picture(page, race.world)).equals(first)).toBe(false);
  });

  test('draws Sella Ronda as its own four-pass Dolomite course built in Blender (L2-166 AC1, AC10)', async ({
    page,
    bluetooth,
    api,
    webgl,
  }) => {
    await webgl.withoutWebGpu();
    const loaded: string[] = [];
    page.on('requestfinished', (request) => loaded.push(new URL(request.url()).pathname));
    const race = await startRace(page, bluetooth, api, sellaRondaCourseMap.id, 'mode=solo', {
      catalogue: [sellaRondaCourseMap],
      world: true,
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
    expect(loaded).toContain('/courses/sellaronda.glb');
    expect(loaded).toContain('/courses/sellaronda.course.json');
    // Sella Ronda loads the shared Blender one-skin rigged rider (L2-166 AC26, ADR 0036).
    expect(loaded).toContain('/riders/rider.glb');
    await ride(page, bluetooth, 80);
    const first = await picture(page, race.world);

    await ride(page, bluetooth, 80);

    expect((await picture(page, race.world)).equals(first)).toBe(false);
  });

  // Every catalogue map is a course (ADR 0035); Vice City's world is drawn under South Beach's id.
  // Cinque Terre and Haleakalā, like Ibiza, are built from their classes and served from fixtures of their own
  // (L2-166 AC43, AC44).
  for (const [id, course, catalogue] of [
    [adelaideCourseMap.id, 'adelaide', [adelaideCourseMap]],
    [aguascalientesCourseMap.id, 'aguascalientes', [aguascalientesCourseMap]],
    [algarveCourseMap.id, 'algarve', [algarveCourseMap]],
    [alpeCourseMap.id, 'alpe', [alpeCourseMap]],
    [amsterdamCourseMap.id, 'amsterdam', [amsterdamCourseMap]],
    [angelsCourseMap.id, 'angels', [angelsCourseMap]],
    [angkorCourseMap.id, 'angkor', [angkorCourseMap]],
    [angliruCourseMap.id, 'angliru', [angliruCourseMap]],
    [antwerpCourseMap.id, 'antwerp', [antwerpCourseMap]],
    [arenbergCourseMap.id, 'arenberg', [arenbergCourseMap]],
    [artMuseumCourseMap.id, 'artmuseum', [artMuseumCourseMap]],
    [atacamaCourseMap.id, 'atacama', [atacamaCourseMap]],
    [atlanticRoadCourseMap.id, 'atlanticroad', [atlanticRoadCourseMap]],
    [aubisqueCourseMap.id, 'aubisque', [aubisqueCourseMap]],
    [austinCourseMap.id, 'austin', [austinCourseMap]],
    [bathshebaCourseMap.id, 'bathsheba', [bathshebaCourseMap]],
    [bayOfIslandsCourseMap.id, 'bayofislands', [bayOfIslandsCourseMap]],
    [beachRoadCourseMap.id, 'beachroad', [beachRoadCourseMap]],
    [bealachCourseMap.id, 'bealach', [bealachCourseMap]],
    [bigSurCourseMap.id, 'bigsur', [bigSurCourseMap]],
    [blackpoolCourseMap.id, 'blackpool', [blackpoolCourseMap]],
    [blueMountainsCourseMap.id, 'bluemountains', [blueMountainsCourseMap]],
    [blueRidgeCourseMap.id, 'blueridge', [blueRidgeCourseMap]],
    [bondiCourseMap.id, 'bondi', [bondiCourseMap]],
    [bonnevilleCourseMap.id, 'bonneville', [bonnevilleCourseMap]],
    [brickyardCourseMap.id, 'brickyard', [brickyardCourseMap]],
    [brightonCourseMap.id, 'brighton', [brightonCourseMap]],
    [brooklynCourseMap.id, 'brooklyn', [brooklynCourseMap]],
    [bundCourseMap.id, 'bund', [bundCourseMap]],
    [calobraCourseMap.id, 'calobra', [calobraCourseMap]],
    [campolongoCourseMap.id, 'campolongo', [campolongoCourseMap]],
    [cabotCourseMap.id, 'cabot', [cabotCourseMap]],
    [centralParkCourseMap.id, 'centralpark', [centralParkCourseMap]],
    [cherryBlossomCourseMap.id, 'cherryblossom', [cherryBlossomCourseMap]],
    [champsCourseMap.id, 'champs', [champsCourseMap]],
    [chicagoCourseMap.id, 'chicago', [chicagoCourseMap]],
    [chichenCourseMap.id, 'chichen', [chichenCourseMap]],
    [comoCourseMap.id, 'como', [comoCourseMap]],
    [comuna13CourseMap.id, 'comuna13', [comuna13CourseMap]],
    [coneyCourseMap.id, 'coney', [coneyCourseMap]],
    [copacabanaCourseMap.id, 'copacabana', [copacabanaCourseMap]],
    [copenhagenCourseMap.id, 'copenhagen', [copenhagenCourseMap]],
    [cornwallCourseMap.id, 'cornwall', [cornwallCourseMap]],
    [cypressCourseMap.id, 'cypress', [cypressCourseMap]],
    [dalesCourseMap.id, 'dales', [dalesCourseMap]],
    [daytonaCourseMap.id, 'daytona', [daytonaCourseMap]],
    [deathValleyCourseMap.id, 'deathvalley', [deathValleyCourseMap]],
    [diwaliCourseMap.id, 'diwali', [diwaliCourseMap]],
    [dubaiCourseMap.id, 'dubai', [dubaiCourseMap]],
    [edinburghCourseMap.id, 'edinburgh', [edinburghCourseMap]],
    [engadinCourseMap.id, 'engadin', [engadinCourseMap]],
    [etnaCourseMap.id, 'etna', [etnaCourseMap]],
    [fensCourseMap.id, 'fens', [fensCourseMap]],
    [fishhillCourseMap.id, 'fishhill', [fishhillCourseMap]],
    [fujiCourseMap.id, 'fuji', [fujiCourseMap]],
    [furkaCourseMap.id, 'furka', [furkaCourseMap]],
    [galibierCourseMap.id, 'galibier', [galibierCourseMap]],
    [gardenaCourseMap.id, 'gardena', [gardenaCourseMap]],
    [ghentCourseMap.id, 'ghent', [ghentCourseMap]],
    [gizaCourseMap.id, 'giza', [gizaCourseMap]],
    [glasgowCourseMap.id, 'glasgow', [glasgowCourseMap]],
    [glastonburyCourseMap.id, 'glastonbury', [glastonburyCourseMap]],
    [goldengateCourseMap.id, 'goldengate', [goldengateCourseMap]],
    [grandcanyonCourseMap.id, 'grandcanyon', [grandcanyonCourseMap]],
    [graniteCourseMap.id, 'granite', [graniteCourseMap]],
    [greatoceanCourseMap.id, 'greatocean', [greatoceanCourseMap]],
    [hanRiverCourseMap.id, 'hanriver', [hanRiverCourseMap]],
    [hardknottCourseMap.id, 'hardknott', [hardknottCourseMap]],
    [havanaCourseMap.id, 'havana', [havanaCourseMap]],
    [hooverCourseMap.id, 'hoover', [hooverCourseMap]],
    [icelandCourseMap.id, 'iceland', [icelandCourseMap]],
    [independenceCourseMap.id, 'independence', [independenceCourseMap]],
    [isleofmanCourseMap.id, 'isleofman', [isleofmanCourseMap]],
    [itenCourseMap.id, 'iten', [itenCourseMap]],
    [jaipurCourseMap.id, 'jaipur', [jaipurCourseMap]],
    [jouvertCourseMap.id, 'jouvert', [jouvertCourseMap]],
    [joshuaTreeCourseMap.id, 'joshuatree', [joshuaTreeCourseMap]],
    [junkanooCourseMap.id, 'junkanoo', [junkanooCourseMap]],
    [kilaueaCourseMap.id, 'kilauea', [kilaueaCourseMap]],
    [knicksCourseMap.id, 'knicks', [knicksCourseMap]],
    [konaCourseMap.id, 'kona', [konaCourseMap]],
    [koppenbergCourseMap.id, 'koppenberg', [koppenbergCourseMap]],
    [kwaremontCourseMap.id, 'kwaremont', [kwaremontCourseMap]],
    [kyotoCourseMap.id, 'kyoto', [kyotoCourseMap]],
    [lakefrontCourseMap.id, 'lakefront', [lakefrontCourseMap]],
    [lakeLouiseCourseMap.id, 'lakelouise', [lakeLouiseCourseMap]],
    [letrasCourseMap.id, 'letras', [letrasCourseMap]],
    [lisbonCourseMap.id, 'lisbon', [lisbonCourseMap]],
    [loireCourseMap.id, 'loire', [loireCourseMap]],
    [machupicchuCourseMap.id, 'machupicchu', [machupicchuCourseMap]],
    [marinabayCourseMap.id, 'marinabay', [marinabayCourseMap]],
    [marrakechCourseMap.id, 'marrakech', [marrakechCourseMap]],
    [mardigrasCourseMap.id, 'mardigras', [mardigrasCourseMap]],
    [maunakeaCourseMap.id, 'maunakea', [maunakeaCourseMap]],
    [merceCourseMap.id, 'merce', [merceCourseMap]],
    [miamiCourseMap.id, 'miami', [miamiCourseMap]],
    [moabCourseMap.id, 'moab', [moabCourseMap]],
    [monacoCourseMap.id, 'monaco', [monacoCourseMap]],
    [montmartreCourseMap.id, 'montmartre', [montmartreCourseMap]],
    [montrealCourseMap.id, 'montreal', [montrealCourseMap]],
    ['prairie-paceline', 'prairie', undefined],
    ['vice-city', 'vicecity', undefined],
    [cinqueTerreCourseMap.id, 'cinqueterre', [cinqueTerreCourseMap]],
    [haleakalaCourseMap.id, 'haleakala', [haleakalaCourseMap]],
  ] as const) {
    test(`draws ${id} as its own course built in Blender (L2-166 AC10)`, async ({
      page,
      bluetooth,
      api,
      webgl,
      worldRide,
    }) => {
      if (id === havanaCourseMap.id) await worldRide.pin('low', 'webgl2');
      await webgl.withoutWebGpu();
      const loaded: string[] = [];
      page.on('requestfinished', (request) => loaded.push(new URL(request.url()).pathname));
      const race = await startRace(page, bluetooth, api, id, 'mode=solo', {
        world: true,
        catalogue,
      });
      await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));

      expect(loaded).toContain(`/courses/${course}.glb`);
      expect(loaded).toContain(`/courses/${course}.course.json`);
      await ride(page, bluetooth, 80);
      const first = await picture(page, race.world);
      await ride(page, bluetooth, 80);
      expect((await picture(page, race.world)).equals(first)).toBe(false);
    });
  }
});

test('Adelaide shows its Willunga road panorama when neither graphics backend can start', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, adelaideCourseMap.id, 'mode=solo', {
    catalogue: [adelaideCourseMap],
  });
  await expect(race.panorama).toBeVisible();
  await expect
    .poll(() => race.panorama.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
});

test('the Adelaide race climbs Old Willunga Hill for three kilometres before the cooldown', async ({
  api,
  bluetooth,
  page,
  webgl,
  worldRide,
}) => {
  await webgl.withoutWebGpu();
  await worldRide.pin('low');
  const data = page.waitForResponse((response) =>
    response.url().endsWith('/courses/adelaide.course.json'),
  );
  const race = await startRace(page, bluetooth, api, adelaideCourseMap.id, 'mode=solo', {
    catalogue: [adelaideCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  const { stages, points, step, startIndex } = (await (await data).json()) as {
    stages: { kind: string; from: number; to: number }[];
    points: number[];
    step: number;
    startIndex: number;
  };
  const summit = stages.at(-1)!.from;
  const effort = stages.at(-3)!.from;
  expect(summit - effort).toBeCloseTo(3000, -1);
  const height = (metres: number) => points[(startIndex + Math.round(metres / step)) * 3 + 1]!;
  for (let d = effort; d + 100 <= summit; d += 100) {
    expect(height(d + 100)).toBeGreaterThan(height(d));
  }
});
