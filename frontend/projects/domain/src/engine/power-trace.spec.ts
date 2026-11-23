import { PowerTrace } from './power-trace';

describe('PowerTrace', () => {
  it('fills every second up to the one reached with the power of the moment', () => {
    const trace = new PowerTrace(10);
    trace.record(2, 100);
    trace.record(5, 160);
    expect(trace.seconds).toBe(5);
    expect(trace.averages(1)).toEqual([100, 100, 160, 160, 160]);
  });

  it('counts an unknown power as none', () => {
    const trace = new PowerTrace(10);
    trace.record(2, null);
    expect(trace.averages(1)).toEqual([0, 0]);
  });

  it('averages each bucket, the last over the seconds it has', () => {
    const trace = new PowerTrace(10);
    trace.record(2, 100);
    trace.record(4, 200);
    trace.record(5, 50);
    expect(trace.averages(2)).toEqual([100, 200, 50]);
  });

  it('never records past the plan, nor a second already recorded', () => {
    const trace = new PowerTrace(3);
    trace.record(2, 100);
    trace.record(1, 300);
    trace.record(9, 200);
    expect(trace.averages(1)).toEqual([100, 100, 200]);
  });
});
