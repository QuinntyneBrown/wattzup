// Unit test
// Traces to: L2-033 AC1, AC3
// Description: Home's heading greets the rider by the time of day: "Morning" before 12:00, "Afternoon" from 12:00 to
// 16:59, "Evening" from 17:00; a rider with no rides yet is welcomed instead. A rider with no name yet is greeted
// without one.
import { homeGreeting } from './home-greeting';

describe('homeGreeting', () => {
  it.each([
    [0, 'Morning, Sam.'],
    [11, 'Morning, Sam.'],
    [12, 'Afternoon, Sam.'],
    [16, 'Afternoon, Sam.'],
    [17, 'Evening, Sam.'],
    [19, 'Evening, Sam.'],
    [23, 'Evening, Sam.'],
  ])('at %d:00 reads %s', (hour, reads) => {
    expect(homeGreeting('Sam', hour, false)).toBe(reads);
  });

  it('welcomes a rider with no rides yet, whatever the hour', () => {
    expect(homeGreeting('Sam', 19, true)).toBe('Welcome, Sam. Your first race opens a new map.');
  });

  it('greets a rider with no name yet without one', () => {
    expect(homeGreeting(null, 8, false)).toBe('Morning.');
    expect(homeGreeting(null, 8, true)).toBe('Welcome. Your first race opens a new map.');
  });
});
