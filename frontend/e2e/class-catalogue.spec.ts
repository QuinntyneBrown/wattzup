// Acceptance test
// Traces to: L2-080 AC3; L2-135 AC3
// Description: the class ride reads its class from the catalogue the backend serves, and the app keeps that catalogue,
// so once it has been read a solo class still starts when the backend cannot be reached, its world (here its panorama)
// saved on the device too.
import { catalogue, hiitCardio } from './fixtures/classes';
import { echelonBike, targetResistanceWrite } from './fixtures/echelon';
import { connectBike } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';

test.describe('Class catalogue', () => {
  test('a solo class starts from the kept catalogue when the backend cannot be reached (L2-080 AC3, L2-135 AC3)', async ({
    page,
    bluetooth,
    api,
    webgl,
  }) => {
    await webgl.disable();
    await bluetooth.remember(echelonBike);
    api.answer('GET', '/api/classes', catalogue);
    const ride = new ClassRidePage(page);
    const loading = new WorldLoadingPage(page);
    await ride.open(hiitCardio.id);
    await connectBike(bluetooth);
    await loading.startRiding();
    await expect(ride.name).toContainText('30 Minute HIIT Cardio');

    api.answer('GET', '/api/classes', () => ({ status: 503 }));
    await page.reload();
    await connectBike(bluetooth);
    const writes = bluetooth.writes().length;
    await loading.startRiding();

    await expect(ride.name).toContainText('30 Minute HIIT Cardio');
    await expect(ride.clock).toContainText('/ 30:00');
    await expect
      .poll(() =>
        bluetooth
          .writes()
          .slice(writes)
          .map((write) => write.hex),
      )
      .toContain(targetResistanceWrite(8));
  });
});
