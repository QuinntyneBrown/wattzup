import { InjectionToken } from '@angular/core';

/** The app's version and the commit it was built from, as App version shows them: "2.0.0 · client 7f3c2a1". */
export interface BuildInfo {
  readonly version: string;
  readonly commit: string;
}

export const BUILD_INFO = new InjectionToken<BuildInfo>('BUILD_INFO');
