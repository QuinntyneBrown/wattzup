import type { SupportedBike } from '@telo/api';

/** The bikes Telo Ride works with, in the order Connect Bike lists them (L2-007 AC1). */
export const SUPPORTED_BIKES: readonly SupportedBike[] = [
  { label: 'Echelon EX-5s', level: 'full-control' },
  { label: 'Echelon EX-3', level: 'full-control' },
  { label: 'Echelon EX-8s', level: 'full-control' },
  { label: 'Echelon Connect Sport', level: 'full-control' },
  { label: 'Other FTMS smart bikes', level: 'beta' },
];
