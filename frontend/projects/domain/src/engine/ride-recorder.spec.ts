// Unit test
// Traces to: L2-044 AC2; L2-125 AC2; L2-037 AC3
// Description: a ride's recorder keeps, for each second ridden, its speed, and adds its power to the output; the distance
// is what the speeds sent add up to, so the backend's check of one against the other holds. Seconds a hidden tab skipped
// count at the power and speed of the moment, an unknown power or speed counts as none, and nothing is kept past four
// hours. The share of seconds on target is kept to three decimals. The ride id is given when the ride starts.
import { RideRecorder } from './ride-recorder';

const FINISHED = new Date('2026-11-21T07:30:00Z');

describe('RideRecorder', () => {
  it('gives the ride a new id when it starts', () => {
    const first = new RideRecorder().facts(FINISHED).rideId;
    const second = new RideRecorder().facts(FINISHED).rideId;
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(second).not.toBe(first);
  });

  it('keeps each second’s speed and adds its power and metres', () => {
    const recorder = new RideRecorder();
    recorder.record(200, 30);
    recorder.record(250.4, 36);
    recorder.record(180, 27);

    const facts = recorder.facts(FINISHED);

    expect(facts.elapsedSeconds).toBe(3);
    expect(facts.speedSamplesKmh).toEqual([30, 36, 27]);
    expect(facts.distanceMeters).toBeCloseTo((30 + 36 + 27) / 3.6, 2);
    expect(facts.outputKj).toBeCloseTo(0.63, 3);
    expect(facts.maxPowerWatts).toBe(250);
    expect(facts.maxSpeedKmh).toBe(36);
  });

  it('counts the seconds a hidden tab skipped at the power and speed of the moment', () => {
    const recorder = new RideRecorder();
    recorder.record(300, 32.09, 4);

    const facts = recorder.facts(FINISHED);

    expect(facts.elapsedSeconds).toBe(4);
    expect(facts.speedSamplesKmh).toEqual([32.09, 32.09, 32.09, 32.09]);
    expect(facts.outputKj).toBe(1.2);
  });

  it('sends speeds to two decimals, and a distance those speeds add up to', () => {
    const recorder = new RideRecorder();
    recorder.record(661, 32.091534793520864, 57);

    const facts = recorder.facts(FINISHED);

    expect(facts.maxSpeedKmh).toBe(32.09);
    expect(facts.speedSamplesKmh.every((kmh) => kmh === 32.09)).toBe(true);
    expect(facts.distanceMeters).toBe(Math.round(((57 * 32.09) / 3.6) * 100) / 100);
  });

  it('counts an unknown power or speed as none', () => {
    const recorder = new RideRecorder();
    recorder.record(null, null, 2);

    const facts = recorder.facts(FINISHED);

    expect(facts.elapsedSeconds).toBe(2);
    expect(facts.speedSamplesKmh).toEqual([0, 0]);
    expect(facts.distanceMeters).toBe(0);
    expect(facts.outputKj).toBe(0);
  });

  it('keeps the share of seconds whose power was on target', () => {
    const recorder = new RideRecorder();
    recorder.record(143, 19.27, 40, true);
    recorder.record(661, 32.09, 33, false);

    expect(recorder.facts(FINISHED).onTargetShare).toBe(0.548);
  });

  it('has no share on target before a second is ridden', () => {
    expect(new RideRecorder().facts(FINISHED).onTargetShare).toBe(0);
  });

  it('keeps nothing past four hours', () => {
    const recorder = new RideRecorder();
    recorder.record(200, 30, RideRecorder.maxSeconds + 60);

    const facts = recorder.facts(FINISHED);

    expect(facts.elapsedSeconds).toBe(RideRecorder.maxSeconds);
    expect(facts.speedSamplesKmh).toHaveLength(RideRecorder.maxSeconds);
  });

  it('says when the ride finished, in UTC, and the device’s time zone', () => {
    const facts = new RideRecorder().facts(FINISHED);

    expect(facts.finishedAt).toBe('2026-11-21T07:30:00.000Z');
    expect(facts.timeZoneId).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
});
